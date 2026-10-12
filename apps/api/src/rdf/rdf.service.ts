import fs from 'node:fs/promises';
import { BadRequestException, Injectable, ServiceUnavailableException } from '@nestjs/common';
import { Store } from 'n3';
import type { Quad } from 'n3';
import { config } from '../config.js';
import { FiguresService } from '../figures/figures.service.js';
import { VocabService } from '../vocab/vocab.service.js';
import { datasetQuads, toTurtle, vocabularyQuads } from './mapper.js';
import { PREFIXES, RDFS_LABEL, RDF_TYPE } from './namespaces.js';
import { parseTurtle, validateShacl } from './shacl.js';
import type { ShaclReport } from './shacl.js';
import { SparqlClient, TriplestoreError } from './sparql.client.js';

@Injectable()
export class RdfService {
  constructor(
    private readonly figures: FiguresService,
    private readonly vocab: VocabService,
    private readonly sparql: SparqlClient,
  ) {}

  /** Converts the whole relational database to CIDOC-CRM triples. */
  async buildDataset(): Promise<Quad[]> {
    const [figures, vocab] = await Promise.all([this.figures.listForExport(), this.vocab.all()]);
    return datasetQuads(figures, vocab);
  }

  async exportTurtle(): Promise<string> {
    return toTurtle(await this.buildDataset());
  }

  /** Replaces the content of the triplestore with a fresh export. Returns the triple count. */
  async loadIntoTriplestore(): Promise<number> {
    const quads = await this.buildDataset();
    await this.sparql.replaceDefaultGraph(await toTurtle(quads));
    return quads.length;
  }

  /**
   * Turtle for one figure, read back from the triplestore (not rebuilt from SQL),
   * so the detail page shows what the knowledge graph really holds.
   * The figure's triples plus everything up to three links away are returned:
   * figure -> production -> period -> its label and dates.
   */
  async figureTurtle(inventoryNumber: string): Promise<string> {
    // The value goes into a query string, so only accept plain inventory numbers.
    if (!/^[A-Za-z0-9-]+$/.test(inventoryNumber)) {
      throw new BadRequestException('Inventory numbers contain only letters, digits and hyphens');
    }
    await this.figures.get(inventoryNumber); // 404 for unknown figures
    const figure = `<${PREFIXES.fig}${inventoryNumber}>`;
    const query = `CONSTRUCT { ?s ?p ?o }
WHERE {
  { BIND(${figure} AS ?s) ?s ?p ?o }
  UNION { ${figure} ?p1 ?s . ?s ?p ?o }
  UNION { ${figure} ?p1 ?n1 . ?n1 ?p2 ?s . ?s ?p ?o }
}`;
    try {
      const quads = parseTurtle(await this.sparql.construct(query));
      return toTurtle(sortForDisplay(quads, PREFIXES.fig + inventoryNumber));
    } catch (error) {
      throw asHttpError(error);
    }
  }

  shapesTurtle(): Promise<string> {
    return fs.readFile(config.shapesPath, 'utf8');
  }

  /** Shapes plus the vocabulary triples: what a SHACL-driven form needs to offer choices. */
  async shapesWithVocabulary(): Promise<string> {
    const [shapes, vocabulary] = await Promise.all([this.shapesTurtle(), this.vocabularyTurtle()]);
    return `${shapes}\n# ---- Vocabulary instances (generated from the relational database) ----\n${vocabulary}`;
  }

  /**
   * SHACL-validates a Turtle document against shapes/figure.shacl.ttl.
   * The vocabulary triples are added to the data graph first, because
   * constraints such as `sh:class crm:E57_Material` need the type of the
   * referenced material, which a single submitted record does not contain.
   */
  async validate(turtle: string): Promise<ShaclReport> {
    let data: Quad[];
    try {
      data = parseTurtle(turtle);
    } catch (error) {
      throw new BadRequestException(`Not valid Turtle: ${(error as Error).message}`);
    }
    const vocabulary = vocabularyQuads(await this.vocab.all());
    return validateShacl([...data, ...vocabulary], parseTurtle(await this.shapesTurtle()));
  }

  /** Validates the full export. Used by `npm run rdf:validate`. */
  async validateDataset(): Promise<ShaclReport> {
    return validateShacl(await this.buildDataset(), parseTurtle(await this.shapesTurtle()));
  }

  private async vocabularyTurtle(): Promise<string> {
    return toTurtle(vocabularyQuads(await this.vocab.all()));
  }
}

/**
 * A triplestore returns triples in no particular order. For reading, start at
 * `root` and walk outwards (breadth first), so each node appears after the node
 * that links to it. Within a node: rdf:type, then rdfs:label, then the rest.
 */
export function sortForDisplay(quads: Quad[], root: string): Quad[] {
  const store = new Store(quads);
  const rank = (predicate: string): string =>
    predicate === RDF_TYPE.value ? '0' : predicate === RDFS_LABEL.value ? '1' : `2${predicate}`;

  const sorted: Quad[] = [];
  const seen = new Set<string>([root]);
  const queue = [root];
  for (let subject = queue.shift(); subject !== undefined; subject = queue.shift()) {
    const triples = store
      .getQuads(subject, null, null, null)
      .sort((a, b) => rank(a.predicate.value).localeCompare(rank(b.predicate.value)));
    for (const triple of triples) {
      sorted.push(triple);
      const { termType, value } = triple.object;
      if (termType === 'NamedNode' && !seen.has(value)) {
        seen.add(value);
        queue.push(value);
      }
    }
  }
  return sorted;
}

export function asHttpError(error: unknown): unknown {
  return error instanceof TriplestoreError
    ? new ServiceUnavailableException(`${error.message}. Is Oxigraph running (docker compose up)?`)
    : error;
}

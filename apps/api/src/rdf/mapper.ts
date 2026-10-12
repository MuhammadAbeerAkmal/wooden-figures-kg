import { DataFactory, Store, Writer } from 'n3';
import type { Literal, NamedNode, Quad } from 'n3';
import { CONDITIONS } from '../database/entities/index.js';
import type { Figure } from '../database/entities/index.js';
import { MUSEUM_NAME } from '../database/seed-data.js';
import type { Vocabularies } from '../vocab/vocab.service.js';
import { PREFIXES, RDFS_LABEL, RDF_TYPE, SKOS_ALT_LABEL, crm, uri } from './namespaces.js';
import type { CrmTerm } from './namespaces.js';

/**
 * Relational rows -> CIDOC-CRM triples.
 *
 * Pure functions with no database or network access, so the mapping can be
 * unit tested and read top to bottom next to docs/mapping.md.
 */

const { literal, quad } = DataFactory;

const xsd = (datatype: string): NamedNode => uri('xsd', datatype);
const text = (value: string): Literal => literal(value);

/** xsd:gYear needs at least four digits; negative years are BCE. See docs/decisions.md. */
export function gYear(year: number): Literal {
  const digits = String(Math.abs(year)).padStart(4, '0');
  return literal(`${year < 0 ? '-' : ''}${digits}`, xsd('gYear'));
}

const capitalise = (value: string): string => value.charAt(0).toUpperCase() + value.slice(1);

/** Small helper so each mapping rule reads as one line: subject, property, object. */
class Graph {
  readonly quads: Quad[] = [];

  add(subject: NamedNode, property: CrmTerm | NamedNode, object: NamedNode | Literal): this {
    const predicate = typeof property === 'string' ? crm(property) : property;
    this.quads.push(quad(subject, predicate, object));
    return this;
  }

  /** Declares an instance of a CRM class with a human-readable label. */
  entity(subject: NamedNode, crmClass: CrmTerm, label: string): this {
    return this.add(subject, RDF_TYPE, crm(crmClass)).add(subject, RDFS_LABEL, text(label));
  }
}

/** E52 Time-Span for a single calendar year or a single ISO date. */
function pointInTime(graph: Graph, value: number | string): NamedNode {
  const isYear = typeof value === 'number';
  const node = uri('ts', String(value));
  const bound = isYear ? gYear(value) : literal(value, xsd('date'));
  graph
    .entity(node, 'E52_Time-Span', String(value))
    .add(node, 'P82a_begin_of_the_begin', bound)
    .add(node, 'P82b_end_of_the_end', bound);
  return node;
}

export const DIMENSIONS = ['height', 'width', 'depth'] as const;

/** Triples for the controlled vocabularies and the fixed helper terms (types, unit, museum). */
export function vocabularyQuads(vocab: Vocabularies): Quad[] {
  const graph = new Graph();

  // E55 Type: small thesaurus with one broader term per group of types.
  const typeGroup = (slug: string, label: string): NamedNode => {
    const node = uri('type', slug);
    graph.entity(node, 'E55_Type', label);
    return node;
  };
  const objectTypeGroup = typeGroup('object-type', 'Object type');
  const conditionGroup = typeGroup('condition', 'Condition');
  const dimensionGroup = typeGroup('dimension', 'Dimension type');
  typeGroup('inventory-number', 'Inventory number');

  for (const objectType of vocab.objectTypes) {
    const node = uri('type', objectType.slug);
    graph.entity(node, 'E55_Type', objectType.name).add(node, 'P127_has_broader_term', objectTypeGroup);
  }
  for (const condition of CONDITIONS) {
    const node = uri('type', `condition-${condition}`);
    graph.entity(node, 'E55_Type', capitalise(condition)).add(node, 'P127_has_broader_term', conditionGroup);
  }
  for (const dimension of DIMENSIONS) {
    const node = uri('type', dimension);
    graph.entity(node, 'E55_Type', capitalise(dimension)).add(node, 'P127_has_broader_term', dimensionGroup);
  }
  graph.entity(uri('unit', 'cm'), 'E58_Measurement_Unit', 'centimetre');

  // material -> E57 Material
  for (const material of vocab.materials) {
    const node = uri('mat', material.slug);
    graph.entity(node, 'E57_Material', material.name);
    if (material.scientificName) graph.add(node, SKOS_ALT_LABEL, text(material.scientificName));
  }

  // period -> E52 Time-Span with outer bounds
  for (const period of vocab.periods) {
    const node = uri('period', period.slug);
    graph
      .entity(node, 'E52_Time-Span', period.name)
      .add(node, 'P82a_begin_of_the_begin', gYear(period.startYear))
      .add(node, 'P82b_end_of_the_end', gYear(period.endYear));
  }

  // site -> E53 Place, parent_id -> P89 falls within
  for (const site of vocab.sites) {
    const node = uri('place', site.slug);
    graph.entity(node, 'E53_Place', site.name);
    if (site.parent) graph.add(node, 'P89_falls_within', uri('place', site.parent.slug));
  }

  // collection -> E39 Actor, plus the (fictional) museum as the receiving actor
  for (const collection of vocab.collections) {
    graph.entity(uri('actor', collection.slug), 'E39_Actor', collection.name);
  }
  graph.entity(uri('actor', 'museum'), 'E39_Actor', MUSEUM_NAME);

  return graph.quads;
}

/** Triples for one figure. Expects the relations loaded by FiguresService.listForExport(). */
export function figureQuads(figure: Figure): Quad[] {
  const graph = new Graph();
  const inv = figure.inventoryNumber;
  const object = uri('fig', inv);

  // figure row -> E22 Human-Made Object
  graph
    .entity(object, 'E22_Human-Made_Object', figure.title)
    .add(object, 'P3_has_note', text(figure.description))
    .add(object, 'P2_has_type', uri('type', figure.objectType.slug))
    .add(object, 'P45_consists_of', uri('mat', figure.material.slug));

  // inventory_number -> E42 Identifier
  const identifier = uri('id', inv);
  graph
    .add(object, 'P48_has_preferred_identifier', identifier)
    .entity(identifier, 'E42_Identifier', inv)
    .add(identifier, 'P190_has_symbolic_content', text(inv))
    .add(identifier, 'P2_has_type', uri('type', 'inventory-number'));

  // site_id -> current or former location (absent when the find site is unknown)
  if (figure.site) {
    graph.add(object, 'P53_has_former_or_current_location', uri('place', figure.site.slug));
  }

  // period_id -> E12 Production event with the period as its time-span
  const production = uri('prod', inv);
  graph
    .add(object, 'P108i_was_produced_by', production)
    .entity(production, 'E12_Production', `Production of ${inv}`)
    .add(production, 'P4_has_time-span', uri('period', figure.period.slug));

  // collection_id + acquisition_year -> E8 Acquisition event
  if (figure.collection || figure.acquisitionYear !== null) {
    const acquisition = uri('acq', inv);
    graph
      .add(object, 'P24i_changed_ownership_through', acquisition)
      .entity(acquisition, 'E8_Acquisition', `Acquisition of ${inv}`)
      .add(acquisition, 'P22_transferred_title_to', uri('actor', 'museum'));
    if (figure.collection) {
      graph.add(acquisition, 'P23_transferred_title_from', uri('actor', figure.collection.slug));
    }
    if (figure.acquisitionYear !== null) {
      graph.add(acquisition, 'P4_has_time-span', pointInTime(graph, figure.acquisitionYear));
    }
  }

  // height_cm, width_cm, depth_cm -> one E54 Dimension each
  const sizes = { height: figure.heightCm, width: figure.widthCm, depth: figure.depthCm };
  for (const dimension of DIMENSIONS) {
    const value = sizes[dimension];
    if (value === null) continue;
    const node = uri('dim', `${inv}-${dimension}`);
    graph
      .add(object, 'P43_has_dimension', node)
      .entity(node, 'E54_Dimension', `${capitalise(dimension)} of ${inv}`)
      .add(node, 'P2_has_type', uri('type', dimension))
      .add(node, 'P90_has_value', literal(String(value), xsd('decimal')))
      .add(node, 'P91_has_unit', uri('unit', 'cm'));
  }

  // condition_report rows -> one E3 Condition State each
  for (const report of figure.conditionReports ?? []) {
    const node = uri('cond', `${inv}-${report.assessedOn}`);
    graph
      .add(object, 'P44_has_condition', node)
      .entity(node, 'E3_Condition_State', `Condition of ${inv} on ${report.assessedOn}`)
      .add(node, 'P2_has_type', uri('type', `condition-${report.condition}`))
      .add(node, 'P3_has_note', text(report.note))
      .add(node, 'P4_has_time-span', pointInTime(graph, report.assessedOn));
  }

  return graph.quads;
}

/** The whole data set as a de-duplicated list of triples. */
export function datasetQuads(figures: Figure[], vocab: Vocabularies): Quad[] {
  const store = new Store(vocabularyQuads(vocab));
  for (const figure of figures) store.addQuads(figureQuads(figure));
  return store.getQuads(null, null, null, null);
}

/** Serialises triples as Turtle with the project prefixes. */
export function toTurtle(quads: Quad[]): Promise<string> {
  return new Promise((resolve, reject) => {
    const writer = new Writer({ prefixes: PREFIXES });
    writer.addQuads(quads);
    writer.end((error, result) => (error ? reject(error) : resolve(result)));
  });
}

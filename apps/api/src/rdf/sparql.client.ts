/** One cell of a SPARQL JSON result. */
export interface SparqlTerm {
  type: 'uri' | 'literal' | 'bnode';
  value: string;
  datatype?: string;
  'xml:lang'?: string;
}

export interface SparqlSelectResult {
  head: { vars: string[] };
  results: { bindings: Record<string, SparqlTerm>[] };
}

export class TriplestoreError extends Error {}

/**
 * Minimal client for the SPARQL 1.1 Protocol and the Graph Store Protocol,
 * as served by Oxigraph. Plain `fetch`, no SPARQL library.
 */
export class SparqlClient {
  constructor(private readonly endpoint: string) {}

  /** Runs a SELECT query. */
  async select(query: string): Promise<SparqlSelectResult> {
    const response = await this.request('/query', 'POST', query, {
      'Content-Type': 'application/sparql-query',
      Accept: 'application/sparql-results+json',
    });
    return (await response.json()) as SparqlSelectResult;
  }

  /** Runs a CONSTRUCT or DESCRIBE query and returns N-Triples. */
  async construct(query: string): Promise<string> {
    const response = await this.request('/query', 'POST', query, {
      'Content-Type': 'application/sparql-query',
      Accept: 'application/n-triples',
    });
    return response.text();
  }

  /** Replaces the whole default graph with the given Turtle document. */
  async replaceDefaultGraph(turtle: string): Promise<void> {
    await this.request('/store?default', 'PUT', turtle, { 'Content-Type': 'text/turtle' });
  }

  private async request(
    path: string,
    method: string,
    body: string,
    headers: Record<string, string>,
  ): Promise<Response> {
    let response: Response;
    try {
      response = await fetch(this.endpoint + path, { method, body, headers });
    } catch (cause) {
      throw new TriplestoreError(`Triplestore at ${this.endpoint} is not reachable`, { cause });
    }
    if (!response.ok) {
      throw new TriplestoreError(`Triplestore answered ${response.status}: ${await response.text()}`);
    }
    return response;
  }
}

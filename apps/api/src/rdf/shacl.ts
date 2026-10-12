import { Parser, Store } from 'n3';
import type { Quad } from 'n3';
import SHACLValidator from 'rdf-validate-shacl';

export interface ShaclResult {
  focusNode: string | null;
  path: string | null;
  value: string | null;
  severity: string;
  constraint: string;
  message: string;
}

export interface ShaclReport {
  conforms: boolean;
  results: ShaclResult[];
}

export const parseTurtle = (turtle: string): Quad[] => new Parser().parse(turtle);

const localName = (iri: string | undefined): string => iri?.split(/[#/]/).pop() ?? '';

/** Validates a data graph against a shapes graph and returns a plain JSON report. */
export async function validateShacl(data: Quad[], shapes: Quad[]): Promise<ShaclReport> {
  const validator = new SHACLValidator(new Store(shapes));
  const report = await validator.validate(new Store(data));
  return {
    conforms: report.conforms,
    results: report.results.map((result) => ({
      focusNode: result.focusNode?.value ?? null,
      // A sequence path is a blank node (an RDF list); only a simple path has a readable IRI.
      path: result.path?.termType === 'NamedNode' ? result.path.value : null,
      value: result.value?.value ?? null,
      severity: localName(result.severity?.value),
      constraint: localName(result.sourceConstraintComponent?.value),
      message: result.message.map((m) => m.value).join(' ') || 'Constraint violated',
    })),
  };
}

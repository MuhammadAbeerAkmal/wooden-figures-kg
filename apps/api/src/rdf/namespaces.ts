import { DataFactory } from 'n3';
import type { NamedNode } from 'n3';

/** Base of every URI minted by this project. example.org is reserved for examples. */
export const BASE = 'https://example.org/wfkg/';

export const PREFIXES = {
  crm: 'http://www.cidoc-crm.org/cidoc-crm/',
  rdf: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
  rdfs: 'http://www.w3.org/2000/01/rdf-schema#',
  skos: 'http://www.w3.org/2004/02/skos/core#',
  xsd: 'http://www.w3.org/2001/XMLSchema#',
  // One prefix per kind of resource keeps the Turtle short and readable.
  fig: `${BASE}figure/`,
  id: `${BASE}identifier/`,
  prod: `${BASE}production/`,
  acq: `${BASE}acquisition/`,
  cond: `${BASE}condition/`,
  dim: `${BASE}dimension/`,
  period: `${BASE}period/`,
  ts: `${BASE}time-span/`,
  place: `${BASE}place/`,
  mat: `${BASE}material/`,
  type: `${BASE}type/`,
  actor: `${BASE}actor/`,
  unit: `${BASE}unit/`,
} as const;

export type Prefix = keyof typeof PREFIXES;

/**
 * Every CIDOC-CRM term this project uses, spelled exactly as in the official
 * RDFS of version 7.1.3. `crm-terms.spec.ts` checks each one against that file,
 * and the union types below turn a typo into a compile error.
 */
export const CRM_CLASSES = [
  'E3_Condition_State',
  'E8_Acquisition',
  'E12_Production',
  'E22_Human-Made_Object',
  'E39_Actor',
  'E42_Identifier',
  'E52_Time-Span',
  'E53_Place',
  'E54_Dimension',
  'E55_Type',
  'E57_Material',
  'E58_Measurement_Unit',
] as const;

export const CRM_PROPERTIES = [
  'P2_has_type',
  'P3_has_note',
  'P4_has_time-span',
  'P22_transferred_title_to',
  'P23_transferred_title_from',
  'P24i_changed_ownership_through',
  'P43_has_dimension',
  'P44_has_condition',
  'P45_consists_of',
  'P48_has_preferred_identifier',
  'P53_has_former_or_current_location',
  'P82a_begin_of_the_begin',
  'P82b_end_of_the_end',
  'P89_falls_within',
  'P90_has_value',
  'P91_has_unit',
  'P108i_was_produced_by',
  'P127_has_broader_term',
  'P190_has_symbolic_content',
] as const;

export type CrmTerm = (typeof CRM_CLASSES)[number] | (typeof CRM_PROPERTIES)[number];

/** A URI in one of the project namespaces, e.g. `uri('fig', 'WF-0001')`. */
export const uri = (prefix: Prefix, localName: string): NamedNode =>
  DataFactory.namedNode(PREFIXES[prefix] + localName);

export const crm = (term: CrmTerm): NamedNode => uri('crm', term);

export const RDF_TYPE = uri('rdf', 'type');
export const RDFS_LABEL = uri('rdfs', 'label');
export const SKOS_ALT_LABEL = uri('skos', 'altLabel');

/** SPARQL PREFIX declarations for the given prefixes. */
export const sparqlPrefixes = (...prefixes: Prefix[]): string =>
  prefixes.map((prefix) => `PREFIX ${prefix}: <${PREFIXES[prefix]}>`).join('\n');

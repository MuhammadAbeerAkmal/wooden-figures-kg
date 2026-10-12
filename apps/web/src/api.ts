/** Types and calls for the NestJS API. All paths are relative, so the dev proxy and nginx both work. */

export interface Term {
  id: number;
  slug: string;
  name: string;
}
export interface Material extends Term {
  scientificName: string | null;
}
export interface Period extends Term {
  startYear: number;
  endYear: number;
}
export interface Site extends Term {
  parent?: Site | null;
}

export interface ConditionReport {
  id: number;
  assessedOn: string;
  condition: 'good' | 'fair' | 'poor' | 'fragmentary';
  note: string;
}

export interface Figure {
  id: number;
  inventoryNumber: string;
  title: string;
  description: string;
  heightCm: number;
  widthCm: number | null;
  depthCm: number | null;
  acquisitionYear: number | null;
  objectType: Term;
  material: Material;
  period: Period;
  site: Site | null;
  collection: Term | null;
  conditionReports?: ConditionReport[];
}

export interface Vocabularies {
  materials: Material[];
  objectTypes: Term[];
  periods: Period[];
  sites: Site[];
  collections: Term[];
}

export type Verdict = 'relational' | 'graph' | 'similar';
export type Cell = string | number | null;

export interface QuestionSummary {
  id: string;
  title: string;
  question: string;
  verdict: Verdict;
}

export interface SideResult {
  query: string;
  rows: Record<string, Cell>[];
  timeMs: number;
}

export interface Comparison extends QuestionSummary {
  note: string;
  columns: string[];
  sql: SideResult;
  sparql: SideResult;
  resultsMatch: boolean;
  timingNote: string;
}

export interface ShaclReport {
  conforms: boolean;
  results: {
    focusNode: string | null;
    path: string | null;
    value: string | null;
    severity: string;
    constraint: string;
    message: string;
  }[];
}

async function request(path: string, init?: RequestInit): Promise<Response> {
  const response = await fetch(`/api${path}`, init);
  if (!response.ok) {
    // NestJS errors are JSON with a "message"; fall back to the status text.
    const body = await response.json().catch(() => null);
    const message = Array.isArray(body?.message) ? body.message.join(', ') : body?.message;
    throw new Error(message ?? `Request failed (${response.status} ${response.statusText})`);
  }
  return response;
}

const json = async <T>(path: string, init?: RequestInit): Promise<T> => (await request(path, init)).json();
const text = async (path: string): Promise<string> => (await request(path)).text();

export const api = {
  vocabularies: () => json<Vocabularies>('/vocab'),
  figures: (filters: URLSearchParams) => json<Figure[]>(`/figures?${filters}`),
  figure: (inventoryNumber: string) => json<Figure>(`/figures/${encodeURIComponent(inventoryNumber)}`),
  figureTurtle: (inventoryNumber: string) => text(`/figures/${encodeURIComponent(inventoryNumber)}/rdf`),
  questions: () => json<QuestionSummary[]>('/compare'),
  compare: (id: string) => json<Comparison>(`/compare/${encodeURIComponent(id)}`),
  shapesWithVocabulary: () => text('/rdf/shapes?vocabulary=true'),
  validate: (turtle: string) =>
    json<ShaclReport>('/rdf/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ turtle }),
    }),
};

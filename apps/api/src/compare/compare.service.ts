import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { asHttpError } from '../rdf/rdf.service.js';
import { SparqlClient } from '../rdf/sparql.client.js';
import type { SparqlTerm } from '../rdf/sparql.client.js';
import { formatSql } from './format-sql.js';
import { QUESTIONS } from './questions.js';
import type { Question, Verdict } from './questions.js';

export type Cell = string | number | null;
export type Row = Record<string, Cell>;

export interface QuestionSummary {
  id: string;
  title: string;
  question: string;
  verdict: Verdict;
}

export interface SideResult {
  /** The query as shown to the reader. */
  query: string;
  rows: Row[];
  /** Median wall-clock time of TIMING_RUNS executions, in milliseconds. */
  timeMs: number;
}

export interface Comparison extends QuestionSummary {
  note: string;
  columns: string[];
  sql: SideResult;
  sparql: SideResult;
  /** True when both models returned exactly the same rows. */
  resultsMatch: boolean;
  timingNote: string;
}

const TIMING_RUNS = 5;
const TIMING_NOTE =
  `Median of ${TIMING_RUNS} runs. SQLite runs inside the API process; each SPARQL query is an HTTP request ` +
  'to Oxigraph. With 25 figures the numbers show this overhead, not how the two engines scale.';

const NUMERIC_DATATYPES = new Set(
  ['integer', 'decimal', 'double', 'float', 'int', 'long'].map((t) => `http://www.w3.org/2001/XMLSchema#${t}`),
);

/** A SPARQL JSON term as a plain value, so it can be compared with a SQL value. */
function toCell(term: SparqlTerm | undefined): Cell {
  if (!term) return null;
  return term.datatype && NUMERIC_DATATYPES.has(term.datatype) ? Number(term.value) : term.value;
}

/** Runs a query several times and returns the last result with the median duration. */
async function timed<T>(run: () => Promise<T>): Promise<{ result: T; timeMs: number }> {
  const durations: number[] = [];
  let result!: T;
  for (let i = 0; i < TIMING_RUNS; i++) {
    const start = performance.now();
    result = await run();
    durations.push(performance.now() - start);
  }
  durations.sort((a, b) => a - b);
  return { result, timeMs: Number(durations[Math.floor(TIMING_RUNS / 2)].toFixed(2)) };
}

/** Same rows, ignoring order: ORDER BY rules for text differ slightly between engines. */
export function sameRows(a: Row[], b: Row[], columns: string[]): boolean {
  const key = (rows: Row[]): string[] =>
    rows.map((row) => JSON.stringify(columns.map((column) => row[column] ?? null))).sort();
  return JSON.stringify(key(a)) === JSON.stringify(key(b));
}

@Injectable()
export class CompareService {
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly sparql: SparqlClient,
  ) {}

  list(): QuestionSummary[] {
    return QUESTIONS.map(({ id, title, question, verdict }) => ({ id, title, question, verdict }));
  }

  find(id: string): Question {
    const question = QUESTIONS.find((q) => q.id === id);
    if (!question) {
      throw new NotFoundException(`Unknown question "${id}". Use one of: ${QUESTIONS.map((q) => q.id).join(', ')}`);
    }
    return question;
  }

  async runSql(question: Question): Promise<SideResult> {
    const { sql, parameters } = question.sql(this.dataSource);
    const { result, timeMs } = await timed(() => this.dataSource.query<Row[]>(sql, parameters));
    return { query: formatSql(sql, parameters), rows: result, timeMs };
  }

  async runSparql(question: Question): Promise<SideResult> {
    const { result, timeMs } = await timed(() => this.sparql.select(question.sparql));
    const rows = result.results.bindings.map((binding) =>
      Object.fromEntries(question.columns.map((column) => [column, toCell(binding[column])])),
    );
    return { query: question.sparql, rows, timeMs };
  }

  async compare(id: string): Promise<Comparison> {
    const question = this.find(id);
    try {
      const sql = await this.runSql(question);
      const sparql = await this.runSparql(question);
      const { title, verdict, note, columns } = question;
      return {
        id,
        title,
        question: question.question,
        verdict,
        note,
        columns,
        sql,
        sparql,
        resultsMatch: sameRows(sql.rows, sparql.rows, columns),
        timingNote: TIMING_NOTE,
      };
    } catch (error) {
      throw asHttpError(error);
    }
  }
}

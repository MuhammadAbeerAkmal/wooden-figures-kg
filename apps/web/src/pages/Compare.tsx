import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../api';
import type { Cell, SideResult, Verdict } from '../api';
import { Code } from '../components/Code';
import type { Language } from '../components/Code';
import { Status } from '../components/Status';
import { useAsync } from '../useAsync';

const VERDICTS: Record<Verdict, string> = {
  relational: 'Easier in SQL',
  graph: 'Easier in SPARQL',
  similar: 'About the same',
};

/** camelCase column name to a readable header: "inventoryNumber" becomes "Inventory number". */
const header = (column: string): string => {
  const words = column.replace(/([A-Z])/g, ' $1').toLowerCase();
  return words.charAt(0).toUpperCase() + words.slice(1);
};

const cell = (value: Cell) => (value === null ? <span className="null">NULL</span> : String(value));

interface SideProps {
  title: string;
  engine: string;
  language: Language;
  columns: string[];
  result: SideResult;
  cy: string;
}

function Side({ title, engine, language, columns, result, cy }: SideProps) {
  const headingId = `${cy}-heading`;
  return (
    <section aria-labelledby={headingId} data-cy={cy}>
      <h2 id={headingId}>{title}</h2>
      <p className="muted">
        {engine} · {result.rows.length} {result.rows.length === 1 ? 'row' : 'rows'} ·{' '}
        <span data-cy={`${cy}-time`}>{result.timeMs} ms</span>
      </p>
      <Code code={result.query} language={language} label={`${title} query`} />
      <div className="table-scroll results" tabIndex={0} role="region" aria-label={`${title} result`}>
        <table>
          <caption className="visually-hidden">{title} result</caption>
          <thead>
            <tr>
              {columns.map((column) => (
                <th key={column} scope="col">
                  {header(column)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {result.rows.map((row, index) => (
              <tr key={index}>
                {columns.map((column) => (
                  <td key={column}>{cell(row[column] ?? null)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function Compare() {
  const { questionId = 'cq1' } = useParams();
  const navigate = useNavigate();
  const questions = useAsync(api.questions, []);
  const comparison = useAsync(() => api.compare(questionId), [questionId]);
  const result = comparison.data;

  return (
    <>
      <h1>Compare the two models</h1>
      <p className="lead">
        Six competency questions, each answered twice: with SQL on the relational model and with SPARQL on the
        CIDOC-CRM graph. Both must return the same rows.
      </p>

      <fieldset className="questions">
        <legend>Choose a question</legend>
        {questions.data?.map((question, index) => (
          <label key={question.id} className={question.id === questionId ? 'question selected' : 'question'}>
            <input
              type="radio"
              name="question"
              value={question.id}
              checked={question.id === questionId}
              onChange={() => navigate(`/compare/${question.id}`)}
            />
            <span>
              <strong>
                {index + 1}. {question.title}
              </strong>
              <span className={`badge badge-${question.verdict}`}>{VERDICTS[question.verdict]}</span>
              <br />
              {question.question}
            </span>
          </label>
        ))}
      </fieldset>

      <Status loading={comparison.loading} error={comparison.error ?? questions.error} />

      {result && (
        <div aria-busy={comparison.loading}>
          <section className="note" aria-labelledby="verdict-heading">
            <h2 id="verdict-heading">
              {result.question}{' '}
              <span className={`badge badge-${result.verdict}`} data-cy="verdict">
                {VERDICTS[result.verdict]}
              </span>
            </h2>
            <p>{result.note}</p>
            <p data-cy="results-match" className={result.resultsMatch ? 'match' : 'mismatch'}>
              {result.resultsMatch
                ? `✓ Both models returned the same ${result.sql.rows.length} rows.`
                : '✗ The two models returned different rows.'}
            </p>
          </section>

          <div className="side-by-side">
            <Side title="SQL" engine="SQLite, built with the TypeORM query builder" language="sql" columns={result.columns} result={result.sql} cy="sql" />
            <Side title="SPARQL" engine="Oxigraph, over HTTP" language="sparql" columns={result.columns} result={result.sparql} cy="sparql" />
          </div>

          <p className="muted">
            <strong>About the timings.</strong> {result.timingNote} The SQL is shown as TypeORM generated it, with
            the bound parameters written in and identifier quotes removed for reading.
          </p>
        </div>
      )}
    </>
  );
}

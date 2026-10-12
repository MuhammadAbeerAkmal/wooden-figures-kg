import type { ReactNode } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api';
import type { Figure, Term } from '../api';
import { Code } from '../components/Code';
import { Status } from '../components/Status';
import { formatCm, formatPeriod } from '../format';
import { useAsync } from '../useAsync';

const NULL = <span className="null">NULL</span>;

/** A foreign key cell: the stored id, and the row it points to. */
function foreignKey(table: string, row: Term | null): ReactNode {
  if (!row) return NULL;
  return (
    <>
      {row.id} <span className="fk">→ {table}: {row.name}</span>
    </>
  );
}

/** The figure exactly as the `figure` table stores it: one row, with foreign keys as ids. */
function RelationalRecord({ figure }: { figure: Figure }) {
  const columns: [string, ReactNode][] = [
    ['id', figure.id],
    ['inventory_number', figure.inventoryNumber],
    ['title', figure.title],
    ['description', figure.description],
    ['height_cm', figure.heightCm],
    ['width_cm', figure.widthCm ?? NULL],
    ['depth_cm', figure.depthCm ?? NULL],
    ['acquisition_year', figure.acquisitionYear ?? NULL],
    ['object_type_id', foreignKey('object_type', figure.objectType)],
    ['material_id', foreignKey('material', figure.material)],
    ['period_id', foreignKey('period', figure.period)],
    ['site_id', foreignKey('site', figure.site)],
    ['collection_id', foreignKey('collection', figure.collection)],
  ];
  const reports = figure.conditionReports ?? [];

  return (
    <>
      <div className="table-scroll" tabIndex={0} role="region" aria-label="Row in table figure">
        <table className="record" data-cy="relational-record">
          <caption>
            Table <code>figure</code>, 1 row
          </caption>
          <thead>
            <tr>
              <th scope="col">Column</th>
              <th scope="col">Value</th>
            </tr>
          </thead>
          <tbody>
            {columns.map(([name, value]) => (
              <tr key={name}>
                <th scope="row">
                  <code>{name}</code>
                </th>
                <td>{value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="table-scroll" tabIndex={0} role="region" aria-label="Rows in table condition_report">
        <table className="record">
          <caption>
            Table <code>condition_report</code>, {reports.length} {reports.length === 1 ? 'row' : 'rows'} with{' '}
            <code>figure_id = {figure.id}</code>
          </caption>
          <thead>
            <tr>
              <th scope="col">
                <code>id</code>
              </th>
              <th scope="col">
                <code>assessed_on</code>
              </th>
              <th scope="col">
                <code>condition</code>
              </th>
              <th scope="col">
                <code>note</code>
              </th>
            </tr>
          </thead>
          <tbody>
            {reports.map((report) => (
              <tr key={report.id}>
                <td>{report.id}</td>
                <td className="nowrap">{report.assessedOn}</td>
                <td>{report.condition}</td>
                <td>{report.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

export function FigureDetail() {
  const { inventoryNumber = '' } = useParams();
  const figure = useAsync(() => api.figure(inventoryNumber), [inventoryNumber]);
  const turtle = useAsync(() => api.figureTurtle(inventoryNumber), [inventoryNumber]);
  const data = figure.data;

  return (
    <>
      <p>
        <Link to="/">← All figures</Link>
      </p>
      <Status loading={figure.loading} error={figure.error} />

      {data && (
        <>
          <h1>
            {data.title} <span className="inventory">{data.inventoryNumber}</span>
          </h1>
          <p className="lead">{data.description}</p>
          <dl className="summary">
            <div>
              <dt>Object type</dt>
              <dd>{data.objectType.name}</dd>
            </div>
            <div>
              <dt>Wood species</dt>
              <dd>
                {data.material.name}
                {data.material.scientificName && (
                  <>
                    {' '}
                    (<i lang="la">{data.material.scientificName}</i>)
                  </>
                )}
              </dd>
            </div>
            <div>
              <dt>Dating</dt>
              <dd>{formatPeriod(data.period)}</dd>
            </div>
            <div>
              <dt>Find site</dt>
              <dd>
                {data.site ? [data.site.name, data.site.parent?.name].filter(Boolean).join(', ') : 'not recorded'}
              </dd>
            </div>
            <div>
              <dt>Height × width × depth</dt>
              <dd>{[data.heightCm, data.widthCm, data.depthCm].map(formatCm).join(' × ')}</dd>
            </div>
            <div>
              <dt>Previous owner</dt>
              <dd>
                {data.collection ? `${data.collection.name}, acquired ${data.acquisitionYear}` : 'not recorded'}
              </dd>
            </div>
          </dl>

          <div className="side-by-side">
            <section aria-labelledby="relational-heading">
              <h2 id="relational-heading">Relational record</h2>
              <p className="muted">
                One row with foreign keys. Unknown values are <code>NULL</code>.
              </p>
              <RelationalRecord figure={data} />
            </section>

            <section aria-labelledby="rdf-heading">
              <h2 id="rdf-heading">CIDOC-CRM graph (Turtle)</h2>
              <p className="muted">
                The same object, read from the triplestore. Unknown values have no triple at all.
              </p>
              <Status loading={turtle.loading} error={turtle.error} />
              {turtle.data && <Code code={turtle.data} language="turtle" label="Turtle for this figure" />}
            </section>
          </div>

          <section aria-labelledby="notice-heading" className="note">
            <h2 id="notice-heading">What to notice</h2>
            <ul>
              <li>
                <code>period_id</code> is a column of the figure. In the graph the dating belongs to a{' '}
                <strong>production event</strong> (<code>E12 Production</code>), because CIDOC-CRM dates events, not
                objects.
              </li>
              <li>
                <code>height_cm</code> is one number. In the graph it is a <strong>dimension node</strong> with a
                type, a value and a unit.
              </li>
              <li>
                <code>collection_id</code> and <code>acquisition_year</code> become one{' '}
                <strong>acquisition event</strong> that says who transferred the figure to whom, and when.
              </li>
              <li>
                A <code>NULL</code> column is an explicit "nothing here". In RDF the triple is simply absent.
              </li>
            </ul>
          </section>
        </>
      )}
    </>
  );
}

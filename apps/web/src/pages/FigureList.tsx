import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../api';
import type { Term } from '../api';
import { Status } from '../components/Status';
import { useAsync } from '../useAsync';

interface FilterSelectProps {
  name: string;
  label: string;
  options: Term[] | undefined;
  value: string;
  onChange: (name: string, value: string) => void;
}

function FilterSelect({ name, label, options, value, onChange }: FilterSelectProps) {
  const id = `filter-${name}`;
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <select id={id} value={value} onChange={(event) => onChange(name, event.target.value)}>
        <option value="">Any</option>
        {options?.map((option) => (
          <option key={option.slug} value={option.slug}>
            {option.name}
          </option>
        ))}
      </select>
    </div>
  );
}

export function FigureList() {
  // The filters live in the URL, so a filtered list can be bookmarked and shared.
  const [filters, setFilters] = useSearchParams();
  const vocab = useAsync(api.vocabularies, []);
  const figures = useAsync(() => api.figures(filters), [filters.toString()]);

  const setFilter = (name: string, value: string) => {
    const next = new URLSearchParams(filters);
    if (value) next.set(name, value);
    else next.delete(name);
    setFilters(next, { replace: true });
  };
  const value = (name: string) => filters.get(name) ?? '';


  return (
    <>
      <h1>Figures</h1>
      <p className="lead">
        25 fictional wooden figures, read from the relational database. Open a figure to see the same object
        as a table row and as CIDOC-CRM triples.
      </p>

      <form className="filters" role="search" aria-label="Filter figures" onSubmit={(event) => event.preventDefault()}>
        <div className="field field-wide">
          <label htmlFor="filter-q">Search</label>
          <input
            id="filter-q"
            type="search"
            placeholder="Title, description or inventory number"
            value={value('q')}
            onChange={(event) => setFilter('q', event.target.value)}
          />
        </div>
        <FilterSelect onChange={setFilter} name="objectType" label="Object type" options={vocab.data?.objectTypes} value={value('objectType')} />
        <FilterSelect onChange={setFilter} name="material" label="Wood species" options={vocab.data?.materials} value={value('material')} />
        <FilterSelect onChange={setFilter} name="period" label="Period" options={vocab.data?.periods} value={value('period')} />
        <FilterSelect onChange={setFilter} name="site" label="Find site" options={vocab.data?.sites} value={value('site')} />
        <FilterSelect onChange={setFilter} name="collection" label="Previous owner" options={vocab.data?.collections} value={value('collection')} />
        <button type="button" className="button-secondary" onClick={() => setFilters({}, { replace: true })}>
          Clear filters
        </button>
      </form>

      <Status loading={figures.loading} error={figures.error ?? vocab.error} />

      {figures.data && (
        <>
          <p role="status" aria-live="polite" data-cy="result-count">
            {figures.data.length} {figures.data.length === 1 ? 'figure' : 'figures'}
          </p>
          <div className="table-scroll" tabIndex={0} role="region" aria-label="List of figures">
            <table data-cy="figure-table">
              <thead>
                <tr>
                  <th scope="col">Inventory no.</th>
                  <th scope="col">Title</th>
                  <th scope="col">Object type</th>
                  <th scope="col">Wood species</th>
                  <th scope="col">Find site</th>
                  <th scope="col">Period</th>
                </tr>
              </thead>
              <tbody>
                {figures.data.map((figure) => (
                  <tr key={figure.id}>
                    <td className="nowrap">{figure.inventoryNumber}</td>
                    <th scope="row">
                      <Link to={`/figures/${figure.inventoryNumber}`}>{figure.title}</Link>
                    </th>
                    <td>{figure.objectType.name}</td>
                    <td>{figure.material.name}</td>
                    <td>{figure.site?.name ?? <span className="muted">not recorded</span>}</td>
                    <td>{figure.period.name}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {figures.data.length === 0 && <p>No figure matches these filters.</p>}
        </>
      )}
    </>
  );
}

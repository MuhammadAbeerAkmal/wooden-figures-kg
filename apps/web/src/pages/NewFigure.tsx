import '@ulb-darmstadt/shacl-form';
import { useEffect, useRef, useState } from 'react';
import { api } from '../api';
import type { ShaclReport } from '../api';
import { Code } from '../components/Code';
import { Status } from '../components/Status';
import { useAsync } from '../useAsync';

/** The parts of the <shacl-form> element this page uses. */
interface ShaclFormElement extends HTMLElement {
  serialize(format?: string): string;
}

const FIGURE_SHAPE = 'https://example.org/wfkg/shapes/FigureShape';
const NEW_NODES = 'https://example.org/wfkg/draft/';

const shortIri = (iri: string | null): string => iri?.split(/[#/]/).pop() ?? '';

/**
 * A data entry form that is not written by hand: the <shacl-form> web component
 * builds it from the same SHACL shapes that validate the exported data.
 * Nothing is saved. The page shows the Turtle the form produces and validates
 * it a second time on the server.
 */
export default function NewFigure() {
  const shapes = useAsync(api.shapesWithVocabulary, []);
  const formRef = useRef<ShaclFormElement>(null);
  const [turtle, setTurtle] = useState('');
  const [report, setReport] = useState<ShaclReport>();
  const [error, setError] = useState<string>();
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    const form = formRef.current;
    if (!form) return;
    const onChange = () => {
      setTurtle(form.serialize());
      setReport(undefined);
    };
    form.addEventListener('change', onChange);
    return () => form.removeEventListener('change', onChange);
  }, [shapes.data]);

  const validate = async () => {
    const form = formRef.current;
    if (!form) return;
    setChecking(true);
    setError(undefined);
    try {
      const current = form.serialize();
      setTurtle(current);
      setReport(await api.validate(current));
    } catch (cause) {
      setError((cause as Error).message);
    } finally {
      setChecking(false);
    }
  };

  return (
    <>
      <h1>Data entry form generated from SHACL</h1>
      <p className="lead">
        This form is built from <code>shapes/figure.shacl.ttl</code> by the{' '}
        <code>@ulb-darmstadt/shacl-form</code> web component. The shapes that validate the knowledge graph also
        define the form, so the two cannot drift apart.
      </p>
      <p className="note">
        <strong>Demo only.</strong> Nothing is saved. The form produces Turtle, and the server validates it
        against the same shapes.
      </p>

      <Status loading={shapes.loading} error={shapes.error} />

      {shapes.data && (
        <div className="side-by-side">
          <section aria-labelledby="form-heading">
            <h2 id="form-heading">New figure</h2>
            <shacl-form
              ref={formRef}
              data-shapes={shapes.data}
              data-shape-subject={FIGURE_SHAPE}
              data-values-namespace={NEW_NODES}
              data-generate-node-shape-reference=""
              data-collapse="open"
              data-cy="shacl-form"
            />
            <button type="button" onClick={validate} disabled={checking} data-cy="validate">
              {checking ? 'Validating…' : 'Validate on the server'}
            </button>
          </section>

          <section aria-labelledby="output-heading">
            <h2 id="output-heading">Result</h2>
            {error && <Status loading={false} error={error} />}
            <div role="status" aria-live="polite" data-cy="validation-report">
              {report?.conforms && <p className="match">✓ Conforms to the SHACL shapes.</p>}
              {report && !report.conforms && (
                <>
                  <p className="mismatch">
                    ✗ {report.results.length} {report.results.length === 1 ? 'problem' : 'problems'} found.
                  </p>
                  <ul className="violations">
                    {report.results.map((result, index) => (
                      <li key={index}>
                        {result.message}{' '}
                        <span className="muted">
                          ({shortIri(result.path) || shortIri(result.focusNode)}, {result.constraint})
                        </span>
                      </li>
                    ))}
                  </ul>
                </>
              )}
              {!report && !error && <p className="muted">Fill in the form, then validate.</p>}
            </div>
            <h3>Turtle produced by the form</h3>
            {turtle ? (
              <Code code={turtle} language="turtle" label="Turtle produced by the form" />
            ) : (
              <p className="muted">Appears after the first change.</p>
            )}
          </section>
        </div>
      )}
    </>
  );
}

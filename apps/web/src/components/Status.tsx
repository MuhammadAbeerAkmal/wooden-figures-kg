/** Loading and error messages, announced to screen readers. */
export function Status({ loading, error }: { loading: boolean; error?: string }) {
  if (error) {
    return (
      <p className="status status-error" role="alert">
        <strong>Something went wrong.</strong> {error}
      </p>
    );
  }
  return (
    <p className="status" role="status" aria-live="polite">
      {loading ? 'Loading…' : ''}
    </p>
  );
}

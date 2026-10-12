import { useEffect, useState } from 'react';

export interface AsyncState<T> {
  data: T | undefined;
  error: string | undefined;
  loading: boolean;
}

/**
 * Runs an async function when `deps` change and tracks its state.
 * A late answer from an earlier call is ignored, so fast filter changes
 * cannot show stale results.
 */
export function useAsync<T>(load: () => Promise<T>, deps: unknown[]): AsyncState<T> {
  const [state, setState] = useState<AsyncState<T>>({ data: undefined, error: undefined, loading: true });

  useEffect(() => {
    let current = true;
    setState((previous) => ({ ...previous, error: undefined, loading: true }));
    load()
      .then((data) => current && setState({ data, error: undefined, loading: false }))
      .catch((error: Error) => current && setState({ data: undefined, error: error.message, loading: false }));
    return () => {
      current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return state;
}

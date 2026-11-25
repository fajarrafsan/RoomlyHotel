import { useCallback, useEffect, useRef, useState } from 'react';
import { ApiError } from '../lib/http';

export function useOperationsQuery<Data>(read: () => Promise<Data>, enabled: boolean, fallback: string) {
  const sequence = useRef(0);
  const activeRead = useRef<(() => Promise<Data>) | null>(null);
  activeRead.current = enabled ? read : null;
  const [state, setState] = useState<{ read: typeof read; data: Data | null; loading: boolean; error: string | null } | null>(null);

  const refresh = useCallback(async () => {
    if (!enabled || activeRead.current !== read) return;
    const request = ++sequence.current;
    setState(previous => ({ read, data: previous?.read === read ? previous.data : null, loading: true, error: null }));
    try {
      const data = await read();
      if (request === sequence.current && activeRead.current === read) setState({ read, data, loading: false, error: null });
    } catch (error) {
      if (request === sequence.current && activeRead.current === read) {
        setState({ read, data: null, loading: false, error: error instanceof ApiError ? error.message : fallback });
      }
    }
  }, [read, enabled, fallback]);

  useEffect(() => {
    void refresh();
    return () => { sequence.current += 1; };
  }, [refresh]);

  return {
    data: enabled && state?.read === read ? state.data : null,
    loading: enabled && (state?.read !== read || state.loading),
    error: enabled && state?.read === read ? state.error : null,
    refresh,
  };
}

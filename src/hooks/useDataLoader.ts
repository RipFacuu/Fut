import { useState, useEffect, useCallback } from 'react';

export function useDataLoader<T>(fetchFn: () => Promise<T[]>, deps: any[] = []) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await fetchFn();
      setData(result);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  }, deps);

  useEffect(() => { loadData(); }, [loadData]);

  return { data, loading, error, refresh: loadData };
} 
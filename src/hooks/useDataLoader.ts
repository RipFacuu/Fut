import { useState, useEffect, useCallback, useRef } from 'react';

// Caché global para almacenar datos y evitar consultas repetidas
const globalCache = new Map<string, { data: any[], timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos en milisegundos

// Función para limpiar toda la caché
export const clearAllCache = () => {
  globalCache.clear();
  console.log('🗑️ Caché limpiada completamente');
};

export function useDataLoader<T>(fetchFn: () => Promise<T[]>, deps: any[] = [], cacheKey?: string) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const isMountedRef = useRef(true);

  const loadData = useCallback(async (forceRefresh = false) => {
    console.log(`🔄 useDataLoader: Cargando datos para cacheKey: ${cacheKey}`, { forceRefresh });
    
    // Verificar caché antes de consultar
    if (cacheKey && !forceRefresh) {
      const cached = globalCache.get(cacheKey);
      const now = Date.now();
      if (cached && (now - cached.timestamp < CACHE_TTL)) {
        console.log(`✅ useDataLoader: Usando caché para ${cacheKey}`, cached.data);
        setData(cached.data as T[]);
        setLoading(false);
        return;
      }
    }

    setLoading(true);
    try {
      console.log(`📡 useDataLoader: Ejecutando fetchFn para ${cacheKey}`);
      const result = await fetchFn();
      console.log(`✅ useDataLoader: Datos recibidos para ${cacheKey}`, result);
      setData(result);
      setError(null);
      
      // Guardar en caché
      if (cacheKey) {
        globalCache.set(cacheKey, { data: result, timestamp: Date.now() });
      }
    } catch (err) {
      console.error(`❌ useDataLoader: Error cargando datos para ${cacheKey}`, err);
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [...deps, cacheKey]);

  // Limpiar caché al desmontar
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const refresh = useCallback(() => loadData(true), [loadData]);

  return { data, loading, error, refresh };
} 
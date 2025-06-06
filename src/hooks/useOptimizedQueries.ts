
import { useState, useCallback, useRef } from 'react';
import { useErrorHandler } from '@/hooks/useErrorHandler';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiry: number;
}

interface UseOptimizedQueriesOptions {
  cacheTime?: number; // Cache time in milliseconds
  staleTime?: number; // Stale time in milliseconds
}

export const useOptimizedQueries = <T>(
  queryFn: () => Promise<T>,
  queryKey: string,
  options: UseOptimizedQueriesOptions = {}
) => {
  const { cacheTime = 5 * 60 * 1000, staleTime = 1 * 60 * 1000 } = options; // 5min cache, 1min stale
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const cache = useRef(new Map<string, CacheEntry<T>>());
  const { handleError } = useErrorHandler();

  const executeQuery = useCallback(async (forceRefresh = false): Promise<T | null> => {
    const now = Date.now();
    const cached = cache.current.get(queryKey);

    // Return cached data if valid and not forcing refresh
    if (!forceRefresh && cached && now < cached.expiry) {
      if (!data) {
        setData(cached.data);
      }
      return cached.data;
    }

    // Check if data is stale but usable
    if (!forceRefresh && cached && now < cached.timestamp + staleTime) {
      if (!data) {
        setData(cached.data);
      }
      // Return stale data immediately, but fetch fresh data in background
      executeQuery(true).catch(console.error);
      return cached.data;
    }

    try {
      setLoading(true);
      setError(null);
      
      const result = await queryFn();
      
      // Cache the result
      cache.current.set(queryKey, {
        data: result,
        timestamp: now,
        expiry: now + cacheTime
      });
      
      setData(result);
      return result;
    } catch (err) {
      const error = err as Error;
      setError(error);
      handleError(error, `Erro na consulta: ${queryKey}`);
      return null;
    } finally {
      setLoading(false);
    }
  }, [queryKey, queryFn, cacheTime, staleTime, data, handleError]);

  const invalidateQuery = useCallback(() => {
    cache.current.delete(queryKey);
    setData(null);
  }, [queryKey]);

  const refetch = useCallback(() => {
    return executeQuery(true);
  }, [executeQuery]);

  return {
    data,
    loading,
    error,
    executeQuery,
    refetch,
    invalidateQuery
  };
};

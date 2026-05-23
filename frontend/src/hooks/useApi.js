import { useState, useCallback } from 'react';

export function useApi() {
  const [response, setResponse] = useState({
    loading: false,
  });

  const callApi = useCallback(async (url, options) => {
    setResponse({ loading: true });
    
    try {
      const res = await fetch(url, {
        headers: { 'Content-Type': 'application/json' },
        ...options,
      });
      
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      
      const data = await res.json();
      setResponse({ data, loading: false });
      
      return data;
    } catch (error) {
      setResponse({
        error: error instanceof Error ? error.message : 'Unknown error',
        loading: false,
      });
      throw error;
    }
  }, []);

  return { ...response, callApi };
}

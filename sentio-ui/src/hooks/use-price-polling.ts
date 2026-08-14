'use client';
import { useState, useEffect, useRef } from 'react';
import { fetchPrice } from '@/lib/api';
import type { PriceTick } from '@/types';

export function usePricePolling(ticker: string | null, intervalMs = 30000) {
  const [price, setPrice] = useState<PriceTick | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    let isMounted = true;

    const pollPrice = async () => {
      if (!ticker) return;
      
      try {
        setIsLoading(true);
        const data = await fetchPrice(ticker);
        if (isMounted) {
          setPrice(data);
          setError(null);
        }
      } catch (e) {
        if (isMounted) {
          setError(e instanceof Error ? e : new Error('Failed to fetch price'));
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    if (ticker) {
      // Initial fetch
      pollPrice();
      // Setup interval
      intervalRef.current = setInterval(pollPrice, intervalMs);
    } else {
      setPrice(null);
    }

    return () => {
      isMounted = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [ticker, intervalMs]);

  return { price, isLoading, error };
}

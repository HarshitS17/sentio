'use client';
import { useState, useEffect, useRef } from 'react';
import type { SentimentSnapshot } from '@/types';

export function useSentimentStream(ticker: string | null) {
  const [data, setData] = useState<SentimentSnapshot | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptRef = useRef(0);

  useEffect(() => {
    let active = true;

    const t = setTimeout(() => {
      if (active) {
        setData(null);
        setError(null);
      }
    }, 0);

    reconnectAttemptRef.current = 0;
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    const connect = () => {
      if (!ticker || !active) return;

      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }

      try {
        const url = `http://localhost:8080/api/sentiment/stream/${ticker}`;
        const eventSource = new EventSource(url);
        eventSourceRef.current = eventSource;

        eventSource.onopen = () => {
          if (!active) return;
          setIsConnected(true);
          setError(null);
          reconnectAttemptRef.current = 0;
        };

        eventSource.addEventListener('sentiment-update', (event) => {
          if (!active) return;
          try {
            const parsedData = JSON.parse(event.data) as SentimentSnapshot;
            setData(parsedData);
          } catch (err) {
            console.error('Error parsing SSE data', err);
          }
        });

        eventSource.onerror = () => {
          if (!active) return;
          eventSource.close();
          setIsConnected(false);
          setError(new Error('SSE Connection lost'));
          
          // Exponential backoff reconnect
          const timeout = Math.min(1000 * Math.pow(2, reconnectAttemptRef.current), 30000);
          reconnectAttemptRef.current += 1;
          
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, timeout);
        };
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err : new Error('Unknown error connecting to SSE'));
        setIsConnected(false);
      }
    };

    if (ticker) {
      connect();
    }

    return () => {
      active = false;
      clearTimeout(t);
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
      setIsConnected(false);
    };
  }, [ticker]);

  return { data, isConnected, error };
}

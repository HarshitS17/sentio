'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import type { SentimentSnapshot } from '@/types';

export function useSentimentStream(ticker: string | null) {
  const [data, setData] = useState<SentimentSnapshot | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptRef = useRef(0);

  const connect = useCallback(() => {
    if (!ticker) return;

    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    try {
      const url = `http://localhost:8080/api/sentiment/stream/${ticker}`;
      const eventSource = new EventSource(url);
      eventSourceRef.current = eventSource;

      eventSource.onopen = () => {
        setIsConnected(true);
        setError(null);
        reconnectAttemptRef.current = 0;
      };

      eventSource.addEventListener('sentiment-update', (event) => {
        try {
          const parsedData = JSON.parse(event.data) as SentimentSnapshot;
          setData(parsedData);
        } catch (e) {
          console.error('Error parsing SSE data', e);
        }
      });

      eventSource.onerror = (e) => {
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
    } catch (e) {
      setError(e instanceof Error ? e : new Error('Unknown error connecting to SSE'));
      setIsConnected(false);
    }
  }, [ticker]);

  useEffect(() => {
    setData(null);
    setError(null);
    reconnectAttemptRef.current = 0;
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    if (ticker) {
      connect();
    }

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
      setIsConnected(false);
    };
  }, [ticker, connect]);

  return { data, isConnected, error };
}

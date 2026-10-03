import { PriceTick, TickerFullSnapshot, SentimentSnapshot } from '@/types';
import { API_BASE_URL } from '@/lib/constants';

export async function fetchPrice(ticker: string): Promise<PriceTick | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/price/${ticker}`);
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    console.error(`Failed to fetch price for ${ticker}:`, error);
    return null;
  }
}

export async function fetchFullSnapshot(ticker: string): Promise<TickerFullSnapshot | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/price/full/${ticker}`);
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    console.error(`Failed to fetch full snapshot for ${ticker}:`, error);
    return null;
  }
}

export async function fetchSentimentSnapshot(ticker: string): Promise<SentimentSnapshot | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/sentiment/snapshot/${ticker}`);
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    console.error(`Failed to fetch sentiment snapshot for ${ticker}:`, error);
    return null;
  }
}

export async function fetchSentimentSummary(): Promise<SentimentSnapshot[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/sentiment/summary`);
    if (!response.ok) return [];
    return await response.json();
  } catch (error) {
    console.error(`Failed to fetch sentiment summary:`, error);
    return [];
  }
}

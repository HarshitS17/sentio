export interface PriceTick {
  ticker: string;
  regularMarketPrice: number;
  regularMarketChange: number;
  regularMarketChangePercent: number;
  regularMarketVolume: number;
  fetchedAt: string;
}

export type SentimentLabel = 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';

export interface SentimentResult {
  ticker: string;
  headline: string;
  compound: number;
  label: SentimentLabel;
  timestamp: string;
}

export interface SentimentSnapshot {
  ticker: string;
  rollingAverage: number;
  trend: string;
  sampleCount: number;
  recentHeadlines: SentimentResult[];
  generatedAt: string;
}

export interface TickerFullSnapshot {
  ticker: string;
  price: PriceTick | null;
  sentiment: SentimentSnapshot | null;
}

export interface NavItem {
  icon: string;
  label: string;
  href: string;
  badge?: string;
}

export interface SystemStatus {
  name: string;
  status: 'operational' | 'degraded' | 'outage';
  latency?: number;
}

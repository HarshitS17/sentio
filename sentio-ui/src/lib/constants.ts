import {
  LayoutDashboard,
  TrendingUp,
  BarChart3,
  Newspaper,
  Star,
  FileText,
  Bell,
  Settings,
} from 'lucide-react';

export const TICKERS = [
  'AAPL', 'TSLA', 'NVDA', 'MSFT', 'GOOGL', 'AMZN', 'META', 'NFLX',
  'AMD', 'INTC', 'CRM', 'ORCL', 'ADBE', 'PYPL', 'SQ', 'SHOP',
  'COIN', 'PLTR', 'SNOW', 'UBER', 'ABNB', 'RBLX', 'ROKU', 'SNAP',
  'BA', 'DIS', 'NKE', 'SBUX', 'WMT', 'JPM', 'GS', 'V',
] as const;

export type Ticker = (typeof TICKERS)[number];

export const TICKER_INFO: Record<string, { name: string; color: string; sector: string; marketCap: string }> = {
  AAPL: { name: 'Apple Inc.', color: '#A2AAAD', sector: 'Technology', marketCap: '$3.4T' },
  TSLA: { name: 'Tesla, Inc.', color: '#E31937', sector: 'Automotive', marketCap: '$780B' },
  NVDA: { name: 'NVIDIA Corporation', color: '#76B900', sector: 'Semiconductors', marketCap: '$3.1T' },
  MSFT: { name: 'Microsoft Corporation', color: '#00A4EF', sector: 'Technology', marketCap: '$3.2T' },
  GOOGL: { name: 'Alphabet Inc.', color: '#4285F4', sector: 'Technology', marketCap: '$2.1T' },
  AMZN: { name: 'Amazon.com, Inc.', color: '#FF9900', sector: 'E-Commerce', marketCap: '$1.9T' },
  META: { name: 'Meta Platforms, Inc.', color: '#0668E1', sector: 'Social Media', marketCap: '$1.3T' },
  NFLX: { name: 'Netflix, Inc.', color: '#E50914', sector: 'Entertainment', marketCap: '$290B' },
  AMD: { name: 'Advanced Micro Devices', color: '#ED1C24', sector: 'Semiconductors', marketCap: '$230B' },
  INTC: { name: 'Intel Corporation', color: '#0071C5', sector: 'Semiconductors', marketCap: '$120B' },
  CRM: { name: 'Salesforce, Inc.', color: '#00A1E0', sector: 'Cloud Software', marketCap: '$250B' },
  ORCL: { name: 'Oracle Corporation', color: '#F80000', sector: 'Cloud Software', marketCap: '$320B' },
  ADBE: { name: 'Adobe Inc.', color: '#FF0000', sector: 'Software', marketCap: '$220B' },
  PYPL: { name: 'PayPal Holdings', color: '#003087', sector: 'Fintech', marketCap: '$70B' },
  SQ: { name: 'Block, Inc.', color: '#3E4348', sector: 'Fintech', marketCap: '$45B' },
  SHOP: { name: 'Shopify Inc.', color: '#96BF48', sector: 'E-Commerce', marketCap: '$85B' },
  COIN: { name: 'Coinbase Global', color: '#0052FF', sector: 'Crypto', marketCap: '$42B' },
  PLTR: { name: 'Palantir Technologies', color: '#101828', sector: 'Data Analytics', marketCap: '$55B' },
  SNOW: { name: 'Snowflake Inc.', color: '#29B5E8', sector: 'Cloud Data', marketCap: '$50B' },
  UBER: { name: 'Uber Technologies', color: '#000000', sector: 'Transportation', marketCap: '$130B' },
  ABNB: { name: 'Airbnb, Inc.', color: '#FF5A5F', sector: 'Travel', marketCap: '$80B' },
  RBLX: { name: 'Roblox Corporation', color: '#E2231A', sector: 'Gaming', marketCap: '$25B' },
  ROKU: { name: 'Roku, Inc.', color: '#6C3FC5', sector: 'Streaming', marketCap: '$12B' },
  SNAP: { name: 'Snap Inc.', color: '#FFFC00', sector: 'Social Media', marketCap: '$18B' },
  BA: { name: 'Boeing Company', color: '#0039A6', sector: 'Aerospace', marketCap: '$130B' },
  DIS: { name: 'Walt Disney Company', color: '#113CCF', sector: 'Entertainment', marketCap: '$180B' },
  NKE: { name: 'Nike, Inc.', color: '#111111', sector: 'Consumer Goods', marketCap: '$140B' },
  SBUX: { name: 'Starbucks Corporation', color: '#006241', sector: 'Consumer Goods', marketCap: '$105B' },
  WMT: { name: 'Walmart Inc.', color: '#0071DC', sector: 'Retail', marketCap: '$420B' },
  JPM: { name: 'JPMorgan Chase & Co.', color: '#003A70', sector: 'Banking', marketCap: '$540B' },
  GS: { name: 'Goldman Sachs Group', color: '#6CACE4', sector: 'Banking', marketCap: '$150B' },
  V: { name: 'Visa Inc.', color: '#1A1F71', sector: 'Payments', marketCap: '$530B' },
};

export const API_BASE_URL = 'http://localhost:8080';

export const API_ENDPOINTS = {
  price: (ticker: string) => `${API_BASE_URL}/api/price/${ticker}`,
  fullSnapshot: (ticker: string) => `${API_BASE_URL}/api/price/full/${ticker}`,
  sentimentSnapshot: (ticker: string) => `${API_BASE_URL}/api/sentiment/snapshot/${ticker}`,
  sentimentSummary: `${API_BASE_URL}/api/sentiment/summary`,
  sentimentStream: (ticker: string) => `${API_BASE_URL}/api/sentiment/stream/${ticker}`,
};

export const SENTIMENT_COLORS = {
  POSITIVE: '#22C55E',
  NEGATIVE: '#EF4444',
  NEUTRAL: '#F59E0B',
};

export const CHART_COLORS = [
  '#3B82F6', '#22C55E', '#8B5CF6', '#EC4899',
  '#F59E0B', '#06B6D4', '#EF4444', '#10B981',
];

export const NAV_ITEMS = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Stocks', href: '/dashboard/stocks', icon: TrendingUp },
  { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
  { name: 'Live News', href: '/dashboard/news', icon: Newspaper },
  { name: 'Watchlist', href: '/dashboard/watchlist', icon: Star },
  { name: 'Reports', href: '/dashboard/reports', icon: FileText },
  { name: 'Alerts', href: '/dashboard/alerts', icon: Bell },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
];

export const SECTORS = [
  'Technology', 'Semiconductors', 'E-Commerce', 'Social Media',
  'Entertainment', 'Fintech', 'Cloud Software', 'Automotive',
  'Banking', 'Consumer Goods', 'Retail', 'Payments',
  'Crypto', 'Data Analytics', 'Travel', 'Gaming',
  'Streaming', 'Aerospace', 'Transportation', 'Cloud Data', 'Software',
];

import { TICKERS, TICKER_INFO } from './constants';

export const MOCK_NEWS_SOURCES = [
  'Bloomberg', 'Reuters', 'Wall Street Journal', 'Financial Times',
  'CNBC', 'Yahoo Finance', 'MarketWatch', 'Seeking Alpha', 'Motley Fool',
  'Barron\'s', 'Investor\'s Business Daily', 'TechCrunch', 'The Verge',
];

const MOCK_HEADLINES: Record<string, string[]> = {
  AAPL: ['Apple Vision Pro 2 Sales Exceed Expectations', 'Apple AI Integration Boosts Services Revenue', 'iPhone 17 Pre-Orders Break Record'],
  TSLA: ['Tesla Full Self-Driving Achieves Level 4 Certification', 'Tesla Cybertruck Demand Surges in Q3', 'Elon Musk Announces New Gigafactory Location'],
  NVDA: ['NVIDIA Blackwell GPUs Dominate AI Training Market', 'NVIDIA Partners with Major Cloud Providers', 'Jensen Huang Keynote Reveals Next-Gen Architecture'],
  MSFT: ['Microsoft Azure AI Revenue Grows 40% YoY', 'Copilot Enterprise Adoption Accelerates', 'Microsoft Cloud Gaming Hits 100M Users'],
  GOOGL: ['Google Gemini 3.0 Sets New AI Benchmarks', 'Alphabet Cloud Division Turns Profitable', 'YouTube Premium Subscribers Hit 150M'],
  AMZN: ['AWS Launches New AI-Powered Services', 'Amazon Drone Delivery Expands to 30 Cities', 'Prime Membership Reaches 300M Globally'],
  META: ['Meta Quest 4 Drives AR Adoption', 'Instagram Reels Revenue Surpasses TikTok', 'Threads Monthly Active Users Hit 500M'],
  NFLX: ['Netflix Ad Tier Drives Revenue Growth', 'Netflix Expands Live Sports Programming', 'Password Sharing Crackdown Adds 15M Subscribers'],
  AMD: ['AMD MI400 Challenges NVIDIA in AI Chips', 'AMD Data Center Revenue Up 55%', 'AMD Secures Major Cloud Provider Contracts'],
  JPM: ['JPMorgan Reports Record Trading Revenue', 'JPMorgan AI Trading Platform Outperforms', 'Jamie Dimon Bullish on US Economy'],
};

function seededRandom(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function generateMockPrice(ticker: string): { price: number; change: number; changePercent: number; volume: number } {
  const basePrices: Record<string, number> = {
    AAPL: 198.5, TSLA: 248.3, NVDA: 875.2, MSFT: 420.8, GOOGL: 175.4,
    AMZN: 185.7, META: 505.3, NFLX: 625.1, AMD: 165.8, INTC: 32.5,
    CRM: 265.4, ORCL: 128.9, ADBE: 542.6, PYPL: 68.2, SQ: 72.4,
    SHOP: 78.3, COIN: 225.6, PLTR: 24.8, SNOW: 165.2, UBER: 72.5,
    ABNB: 152.3, RBLX: 42.6, ROKU: 68.9, SNAP: 12.4, BA: 185.7,
    DIS: 98.4, NKE: 102.5, SBUX: 95.8, WMT: 165.3, JPM: 198.2,
    GS: 425.6, V: 275.8,
  };
  const base = basePrices[ticker] || 100;
  const seed = ticker.charCodeAt(0) + ticker.charCodeAt(ticker.length - 1);
  const change = (seededRandom(seed + Date.now() / 86400000) - 0.5) * base * 0.04;
  return {
    price: parseFloat((base + change).toFixed(2)),
    change: parseFloat(change.toFixed(2)),
    changePercent: parseFloat(((change / base) * 100).toFixed(2)),
    volume: Math.floor(15000000 + seededRandom(seed) * 50000000),
  };
}

export function generateMockStockData() {
  return TICKERS.map((ticker) => {
    const info = TICKER_INFO[ticker] || { name: ticker, color: '#3B82F6', sector: 'Other', marketCap: 'N/A' };
    const priceData = generateMockPrice(ticker);
    const sentimentBase = seededRandom(ticker.charCodeAt(0) * 7) * 2 - 1;
    const sentiment = parseFloat(Math.max(-1, Math.min(1, sentimentBase)).toFixed(3));
    return {
      ticker,
      name: info.name,
      color: info.color,
      sector: info.sector,
      marketCap: info.marketCap,
      ...priceData,
      sentiment,
      trend: sentiment > 0.15 ? 'POSITIVE' as const : sentiment < -0.15 ? 'NEGATIVE' as const : 'NEUTRAL' as const,
      sampleCount: Math.floor(5 + seededRandom(ticker.charCodeAt(1)) * 45),
    };
  });
}

export function generateMockSentimentHistory(ticker: string, days: number) {
  const data = [];
  const now = new Date();
  const seed = ticker.charCodeAt(0);
  for (let i = days; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const baseScore = seededRandom(seed + i * 3) * 0.6 - 0.1;
    const noise = (seededRandom(seed + i * 7 + 100) - 0.5) * 0.4;
    const score = parseFloat(Math.max(-1, Math.min(1, baseScore + noise)).toFixed(3));
    data.push({
      date: date.toISOString().split('T')[0],
      score,
      label: score > 0.15 ? 'POSITIVE' : score < -0.15 ? 'NEGATIVE' : 'NEUTRAL',
    });
  }
  return data;
}

export function generateMockSectorData() {
  return [
    { sector: 'Technology', sentiment: 0.45, volume: 15420, change: 1.2 },
    { sector: 'Semiconductors', sentiment: 0.62, volume: 12300, change: 2.1 },
    { sector: 'Financials', sentiment: 0.12, volume: 8340, change: 0.4 },
    { sector: 'Healthcare', sentiment: 0.28, volume: 6210, change: 0.8 },
    { sector: 'E-Commerce', sentiment: 0.35, volume: 9100, change: 1.0 },
    { sector: 'Social Media', sentiment: -0.08, volume: 7800, change: -0.3 },
    { sector: 'Automotive', sentiment: -0.15, volume: 9450, change: -0.6 },
    { sector: 'Energy', sentiment: -0.32, volume: 11200, change: -1.5 },
    { sector: 'Cloud Software', sentiment: 0.38, volume: 7680, change: 0.9 },
    { sector: 'Entertainment', sentiment: 0.22, volume: 5400, change: 0.5 },
    { sector: 'Banking', sentiment: 0.18, volume: 6500, change: 0.6 },
    { sector: 'Consumer Goods', sentiment: 0.05, volume: 4200, change: 0.1 },
  ];
}

export function generateMockCorrelationMatrix() {
  const sectors = ['Tech', 'Semi', 'Finance', 'E-Com', 'Media'];
  const matrix = Array(5).fill(0).map(() => Array(5).fill(0));
  for (let i = 0; i < 5; i++) {
    for (let j = 0; j < 5; j++) {
      if (i === j) { matrix[i][j] = 1.0; }
      else if (i < j) {
        const val = parseFloat((seededRandom(i * 10 + j) * 1.8 - 0.9).toFixed(2));
        matrix[i][j] = val;
        matrix[j][i] = val;
      }
    }
  }
  return { sectors, matrix };
}

export function generateMockAlerts() {
  return [
    { id: '1', ticker: 'TSLA', type: 'SENTIMENT_REVERSAL', message: 'Tesla sentiment shifted from Bearish to Neutral in the last hour.', time: new Date(Date.now() - 1000 * 60 * 15).toISOString(), severity: 'HIGH' as const, read: false },
    { id: '2', ticker: 'AAPL', type: 'PRICE_THRESHOLD', message: 'Apple crossed your $200 price target.', time: new Date(Date.now() - 1000 * 60 * 45).toISOString(), severity: 'MEDIUM' as const, read: false },
    { id: '3', ticker: 'NVDA', type: 'VOLUME_SPIKE', message: 'NVIDIA news volume 3x above average.', time: new Date(Date.now() - 1000 * 60 * 120).toISOString(), severity: 'HIGH' as const, read: true },
    { id: '4', ticker: 'MSFT', type: 'NEWS_BREAKING', message: 'Microsoft announces new AI partnership with OpenAI.', time: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(), severity: 'LOW' as const, read: true },
    { id: '5', ticker: 'AMZN', type: 'SENTIMENT_REVERSAL', message: 'Amazon sentiment turned strongly positive.', time: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(), severity: 'MEDIUM' as const, read: true },
    { id: '6', ticker: 'META', type: 'PRICE_THRESHOLD', message: 'Meta broke through $500 resistance level.', time: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(), severity: 'LOW' as const, read: true },
  ];
}

export function generateMockReports() {
  return [
    { id: '1', title: 'Q3 2026 Technology Sector Sentiment Analysis', date: new Date(Date.now() - 86400000 * 2).toISOString(), author: 'Quantitative Research', type: 'SECTOR', pages: 24, status: 'completed' as const },
    { id: '2', title: 'Weekly Market Mood Report', date: new Date(Date.now() - 86400000 * 5).toISOString(), author: 'Sentio AI Engine', type: 'WEEKLY', pages: 12, status: 'completed' as const },
    { id: '3', title: 'EV Market Sentiment Deep Dive', date: new Date(Date.now() - 86400000 * 7).toISOString(), author: 'Industry Analysis', type: 'INDUSTRY', pages: 18, status: 'completed' as const },
    { id: '4', title: 'Monthly Portfolio Sentiment Review', date: new Date(Date.now() - 86400000 * 14).toISOString(), author: 'Portfolio Team', type: 'MONTHLY', pages: 32, status: 'completed' as const },
    { id: '5', title: 'AI Chip Market Competitive Analysis', date: new Date(Date.now() - 86400000 * 21).toISOString(), author: 'Research Desk', type: 'SECTOR', pages: 28, status: 'completed' as const },
  ];
}

export function generateMockWatchlistDefaults() {
  return ['AAPL', 'TSLA', 'NVDA', 'MSFT', 'GOOGL', 'AMZN'];
}

export function generateMockKPIData() {
  return {
    totalNewsProcessed: 12847,
    bullishPercent: 42,
    bearishPercent: 31,
    neutralPercent: 27,
    avgSentiment: 0.12,
    todayArticles: 156,
    avgLatency: 23,
    requestsPerSec: 847,
    queueDepth: 12,
  };
}

export function generateMockDashboardChartData() {
  const data = [];
  const now = new Date();
  const tickers = ['AAPL', 'MSFT', 'TSLA', 'NVDA', 'GOOGL', 'AMZN', 'META', 'AMD'];
  for (let i = 23; i >= 0; i--) {
    const time = new Date(now);
    time.setHours(time.getHours() - i);
    const point: Record<string, string | number> = {
      timestamp: time.toISOString(),
      time: `${time.getHours().toString().padStart(2, '0')}:00`,
    };
    tickers.forEach((ticker, idx) => {
      const trend = seededRandom(idx * 5 + 1) * 0.8 - 0.2;
      const noise = (seededRandom(i * 13 + idx * 7) - 0.5) * 0.3;
      point[ticker] = parseFloat(Math.max(-1, Math.min(1, trend + noise)).toFixed(2));
    });
    data.push(point);
  }
  return data;
}

export function generateMockNewsForTicker(ticker: string, count: number = 10) {
  const headlines = MOCK_HEADLINES[ticker] || [
    `${ticker} reports strong quarterly earnings`,
    `Analysts upgrade ${ticker} price target`,
    `${ticker} announces strategic partnership`,
  ];
  return Array.from({ length: count }, (_, i) => {
    const sentiment = seededRandom(ticker.charCodeAt(0) + i * 13) * 2 - 1;
    return {
      id: `${ticker}-${i}`,
      ticker,
      headline: headlines[i % headlines.length],
      source: MOCK_NEWS_SOURCES[i % MOCK_NEWS_SOURCES.length],
      timestamp: new Date(Date.now() - i * 1000 * 60 * (15 + Math.floor(seededRandom(i + 1) * 60))).toISOString(),
      sentiment: parseFloat(sentiment.toFixed(3)),
      label: (sentiment > 0.15 ? 'POSITIVE' : sentiment < -0.15 ? 'NEGATIVE' : 'NEUTRAL') as 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL',
      confidence: parseFloat((0.6 + seededRandom(i + ticker.charCodeAt(0)) * 0.35).toFixed(2)),
    };
  });
}

export function generateMockAnalyticsData() {
  return {
    kpi: generateMockKPIData(),
    sectorHeatmap: generateMockSectorData(),
    correlations: generateMockCorrelationMatrix(),
    timeSeries: generateMockDashboardChartData(),
  };
}

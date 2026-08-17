'use client';

import { useState, useEffect, useMemo, use } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { TICKER_INFO } from '@/lib/constants';
import { generateMockStockData, generateMockSentimentHistory, generateMockNewsForTicker } from '@/lib/mock-data';
import { useSentimentStream } from '@/hooks/use-sentiment-stream';
import { GaugeChart } from '@/components/charts/GaugeChart';
import { SentimentBadge } from '@/components/ui/SentimentBadge';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Area, AreaChart,
} from 'recharts';
import {
  ArrowLeft, TrendingUp, TrendingDown, BarChart3, Clock,
  Newspaper, ExternalLink, Activity, Zap, Users, Globe,
} from 'lucide-react';

export default function StockDetailPage({ params }: { params: Promise<{ ticker: string }> }) {
  const { ticker } = use(params);
  const [mounted, setMounted] = useState(false);
  const { data: liveData, isConnected } = useSentimentStream(ticker);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(t);
  }, []);

  const info = TICKER_INFO[ticker] || { name: ticker, color: '#3B82F6', sector: 'Unknown', marketCap: 'N/A' };
  const stockData = useMemo(() => generateMockStockData().find(s => s.ticker === ticker), [ticker]);
  const history = useMemo(() => generateMockSentimentHistory(ticker, 30), [ticker]);
  const news = useMemo(() => generateMockNewsForTicker(ticker, 12), [ticker]);

  const currentSentiment = liveData?.rollingAverage ?? stockData?.sentiment ?? 0;
  const currentTrend = liveData?.trend ?? stockData?.trend ?? 'NEUTRAL';

  if (!mounted) return <div className="p-8 text-[#94A3B8]">Loading...</div>;

  return (
    <div className="space-y-6">
      {/* Back + Header */}
      <div className="flex items-center gap-4 mb-2">
        <Link href="/dashboard/stocks" className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
          <ArrowLeft className="w-4 h-4 text-[#94A3B8]" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-white">{ticker}</h1>
            <SentimentBadge label={currentTrend as 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL'} />
            {isConnected && (
              <span className="flex items-center gap-1.5 text-xs text-[#22C55E]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E] animate-pulse" />
                Live
              </span>
            )}
          </div>
          <p className="text-[#94A3B8] text-sm">{info.name} · {info.sector}</p>
        </div>
      </div>

      {/* Price + Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="p-4 rounded-xl bg-white/[0.04] border border-white/[0.08]">
          <div className="text-xs text-[#94A3B8] mb-1">Price</div>
          <div className="text-2xl font-bold text-white">${stockData?.price.toLocaleString()}</div>
          <div className={`text-sm font-medium ${(stockData?.changePercent ?? 0) >= 0 ? 'text-[#22C55E]' : 'text-[#EF4444]'}`}>
            {(stockData?.changePercent ?? 0) >= 0 ? '+' : ''}{stockData?.changePercent}%
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="p-4 rounded-xl bg-white/[0.04] border border-white/[0.08]">
          <div className="text-xs text-[#94A3B8] mb-1">Sentiment Score</div>
          <div className={`text-2xl font-bold ${currentSentiment > 0 ? 'text-[#22C55E]' : currentSentiment < 0 ? 'text-[#EF4444]' : 'text-[#F59E0B]'}`}>
            {currentSentiment > 0 ? '+' : ''}{currentSentiment.toFixed(3)}
          </div>
          <div className="text-sm text-[#94A3B8]">{liveData?.sampleCount ?? stockData?.sampleCount ?? 0} samples</div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="p-4 rounded-xl bg-white/[0.04] border border-white/[0.08]">
          <div className="text-xs text-[#94A3B8] mb-1">Market Cap</div>
          <div className="text-2xl font-bold text-white">{info.marketCap}</div>
          <div className="text-sm text-[#94A3B8]">{info.sector}</div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="p-4 rounded-xl bg-white/[0.04] border border-white/[0.08]">
          <div className="text-xs text-[#94A3B8] mb-1">Volume</div>
          <div className="text-2xl font-bold text-white">{((stockData?.volume ?? 0) / 1e6).toFixed(1)}M</div>
          <div className="text-sm text-[#94A3B8]">Shares traded</div>
        </motion.div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Gauge + History (2/3) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Gauge */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="p-6 rounded-2xl bg-white/[0.04] border border-white/[0.08]"
          >
            <h2 className="text-lg font-semibold text-white mb-4">Sentiment Gauge</h2>
            <div className="flex justify-center">
              <GaugeChart score={currentSentiment} />
            </div>
          </motion.div>

          {/* Historical Chart */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
            className="p-6 rounded-2xl bg-white/[0.04] border border-white/[0.08]"
          >
            <h2 className="text-lg font-semibold text-white mb-4">30-Day Sentiment History</h2>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={history} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="sentGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={info.color} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={info.color} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="date" stroke="#64748b" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false}
                    tickFormatter={(v) => new Date(v).toLocaleDateString('en', { month: 'short', day: 'numeric' })} interval={4} />
                  <YAxis stroke="#64748b" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} domain={[-1, 1]} />
                  <Tooltip contentStyle={{ backgroundColor: 'rgba(15,23,42,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#f8fafc' }} />
                  <Area type="monotone" dataKey="score" stroke={info.color} fill="url(#sentGrad)" strokeWidth={2} dot={false} activeDot={{ r: 4, fill: info.color }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        </div>

        {/* News Panel (1/3) */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="rounded-2xl bg-white/[0.04] border border-white/[0.08] p-6 h-fit"
        >
          <div className="flex items-center gap-2 mb-5">
            <Newspaper className="w-5 h-5 text-[#3B82F6]" />
            <h2 className="text-lg font-semibold text-white">Recent Headlines</h2>
          </div>
          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
            {news.map((item, idx) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + idx * 0.04 }}
                className="p-3 rounded-xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.06] transition-colors"
              >
                <p className="text-sm text-white mb-2 leading-relaxed">{item.headline}</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <SentimentBadge label={item.label} />
                    <span className="text-[10px] text-[#94A3B8]">{item.confidence.toFixed(0)}% conf.</span>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-[#94A3B8]">
                    <Clock className="w-3 h-3" />
                    {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
                <p className="text-[10px] text-[#94A3B8] mt-1">{item.source}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TICKERS } from '@/lib/constants';
import { generateMockNewsForTicker } from '@/lib/mock-data';
import { SentimentBadge } from '@/components/ui/SentimentBadge';
import { Newspaper, Clock, Filter, ExternalLink, Search } from 'lucide-react';

export default function NewsPage() {
  const [mounted, setMounted] = useState(false);
  const [tickerFilter, setTickerFilter] = useState('ALL');
  const [sentimentFilter, setSentimentFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  useEffect(() => { setMounted(true); }, []);

  const allNews = useMemo(() => {
    const news = TICKERS.flatMap(t => generateMockNewsForTicker(t, 6));
    return news.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, []);

  const filtered = useMemo(() => {
    return allNews.filter(n =>
      (tickerFilter === 'ALL' || n.ticker === tickerFilter) &&
      (sentimentFilter === 'ALL' || n.label === sentimentFilter) &&
      (search === '' || n.headline.toLowerCase().includes(search.toLowerCase()))
    );
  }, [allNews, tickerFilter, sentimentFilter, search]);

  if (!mounted) return <div className="p-8 text-[#94A3B8]">Loading news...</div>;

  return (
    <div className="space-y-6">
      <header>
        <div className="flex items-center gap-2 mb-1">
          <Newspaper className="w-6 h-6 text-[#3B82F6]" />
          <h1 className="text-2xl font-bold text-white">Live News Feed</h1>
          <span className="flex items-center gap-1 text-xs text-[#22C55E] ml-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E] animate-pulse" /> Live
          </span>
        </div>
        <p className="text-[#94A3B8]">{filtered.length} articles from {TICKERS.length} tracked tickers</p>
      </header>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
          <input type="text" placeholder="Search headlines..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-white placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#3B82F6]/50 transition-all" />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {['ALL', ...TICKERS.slice(0, 12)].map(t => (
            <button key={t} onClick={() => setTickerFilter(t)}
              className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${tickerFilter === t ? 'bg-[#3B82F6] text-white' : 'bg-white/5 text-[#94A3B8] hover:bg-white/10'}`}>
              {t}
            </button>
          ))}
        </div>
        <div className="flex gap-1.5">
          {['ALL', 'POSITIVE', 'NEGATIVE', 'NEUTRAL'].map(s => (
            <button key={s} onClick={() => setSentimentFilter(s)}
              className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${sentimentFilter === s ? (
                s === 'POSITIVE' ? 'bg-[#22C55E]/20 text-[#22C55E]' :
                s === 'NEGATIVE' ? 'bg-[#EF4444]/20 text-[#EF4444]' :
                s === 'NEUTRAL' ? 'bg-[#F59E0B]/20 text-[#F59E0B]' :
                'bg-[#3B82F6] text-white'
              ) : 'bg-white/5 text-[#94A3B8] hover:bg-white/10'}`}>
              {s === 'ALL' ? 'All' : s.charAt(0) + s.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {/* News List */}
      <div className="space-y-3">
        <AnimatePresence>
          {filtered.map((item, idx) => (
            <motion.div key={item.id}
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              transition={{ delay: Math.min(idx * 0.03, 0.3) }}
              className="p-4 rounded-xl bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.07] hover:border-white/10 transition-all group"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-bold text-white bg-white/10 px-2 py-0.5 rounded">{item.ticker}</span>
                    <SentimentBadge label={item.label} />
                    <span className="text-xs text-[#94A3B8]">{item.confidence.toFixed(0)}% confidence</span>
                  </div>
                  <h3 className="text-sm font-medium text-white leading-relaxed mb-2 group-hover:text-[#3B82F6] transition-colors">{item.headline}</h3>
                  <div className="flex items-center gap-3 text-[10px] text-[#94A3B8]">
                    <span>{item.source}</span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{new Date(item.timestamp).toLocaleString()}</span>
                  </div>
                </div>
                <div className={`text-lg font-bold ${item.sentiment > 0 ? 'text-[#22C55E]' : item.sentiment < 0 ? 'text-[#EF4444]' : 'text-[#F59E0B]'}`}>
                  {item.sentiment > 0 ? '+' : ''}{item.sentiment.toFixed(2)}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

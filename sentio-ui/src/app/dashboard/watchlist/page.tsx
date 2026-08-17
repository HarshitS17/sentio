'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { TICKERS, TICKER_INFO } from '@/lib/constants';
import { generateMockStockData } from '@/lib/mock-data';
import { SentimentBadge } from '@/components/ui/SentimentBadge';
import { EmptyState } from '@/components/shared/EmptyState';
import { Star, Plus, X, TrendingUp, TrendingDown, ArrowRight } from 'lucide-react';

const STORAGE_KEY = 'sentio-watchlist';

export default function WatchlistPage() {
  const [mounted, setMounted] = useState(false);
  const [watchlist, setWatchlist] = useState<string[]>([]);
  const [showAdd, setShowAdd] = useState(false);

  useEffect(() => {
    let active = true;
    const t = setTimeout(() => {
      if (!active) return;
      setMounted(true);
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setWatchlist(JSON.parse(saved));
      } else {
        const defaults = ['AAPL', 'TSLA', 'NVDA', 'MSFT', 'GOOGL', 'AMZN'];
        setWatchlist(defaults);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(defaults));
      }
    }, 0);
    return () => {
      active = false;
      clearTimeout(t);
    };
  }, []);

  const stocks = useMemo(() => generateMockStockData(), []);

  const watchlistStocks = useMemo(
    () => watchlist.map(t => stocks.find(s => s.ticker === t)).filter(Boolean),
    [watchlist, stocks]
  );

  const availableToAdd = useMemo(
    () => stocks.filter(s => !watchlist.includes(s.ticker)),
    [stocks, watchlist]
  );

  const addTicker = (ticker: string) => {
    const updated = [...watchlist, ticker];
    setWatchlist(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const removeTicker = (ticker: string) => {
    const updated = watchlist.filter(t => t !== ticker);
    setWatchlist(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  if (!mounted) return <div className="p-8 text-[#94A3B8]">Loading watchlist...</div>;

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Watchlist</h1>
          <p className="text-[#94A3B8] mt-1">{watchlist.length} stocks tracked</p>
        </div>
        <button onClick={() => setShowAdd(!showAdd)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#3B82F6] text-white text-sm font-medium hover:bg-[#2563EB] transition-colors">
          <Plus className="w-4 h-4" /> Add Stock
        </button>
      </header>

      {/* Add Stock Panel */}
      <AnimatePresence>
        {showAdd && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden">
            <div className="p-4 rounded-xl bg-white/[0.04] border border-white/[0.08]">
              <p className="text-sm text-[#94A3B8] mb-3">Click to add to your watchlist</p>
              <div className="flex flex-wrap gap-2">
                {availableToAdd.slice(0, 20).map(s => (
                  <button key={s.ticker} onClick={() => addTicker(s.ticker)}
                    className="px-3 py-1.5 rounded-lg bg-white/5 text-xs text-white hover:bg-[#3B82F6]/20 hover:text-[#3B82F6] transition-all border border-white/[0.06]">
                    {s.ticker}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Watchlist Grid */}
      {watchlistStocks.length === 0 ? (
        <EmptyState
          title="Your watchlist is empty"
          description="Add stocks to track their sentiment and price movements."
          icon={<Star className="w-12 h-12 text-[#94A3B8]" />}
          action={<button onClick={() => setShowAdd(true)} className="px-4 py-2 rounded-xl bg-[#3B82F6] text-white text-sm">Add Stocks</button>}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {watchlistStocks.map((stock, idx) => stock && (
            <motion.div key={stock.ticker} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.04 }}
              className="p-5 rounded-2xl bg-white/[0.04] border border-white/[0.06] hover:border-white/15 transition-all group relative">
              {/* Remove Button */}
              <button onClick={() => removeTicker(stock.ticker)}
                className="absolute top-3 right-3 p-1 rounded-md bg-white/5 opacity-0 group-hover:opacity-100 hover:bg-[#EF4444]/20 transition-all">
                <X className="w-3.5 h-3.5 text-[#94A3B8] hover:text-[#EF4444]" />
              </button>

              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold"
                  style={{ backgroundColor: stock.color + '20', color: stock.color }}>
                  {stock.ticker.slice(0, 2)}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">{stock.ticker}</h3>
                  <p className="text-[10px] text-[#94A3B8]">{stock.name}</p>
                </div>
              </div>

              <div className="flex items-baseline justify-between mb-3">
                <span className="text-xl font-bold text-white">${stock.price}</span>
                <span className={`text-sm font-medium ${stock.changePercent >= 0 ? 'text-[#22C55E]' : 'text-[#EF4444]'}`}>
                  {stock.changePercent >= 0 ? '+' : ''}{stock.changePercent}%
                </span>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-white/5">
                <SentimentBadge label={stock.trend as 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL'} />
                <Link href={`/dashboard/stocks/${stock.ticker}`}>
                  <ArrowRight className="w-4 h-4 text-[#94A3B8] hover:text-[#3B82F6] transition-colors" />
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

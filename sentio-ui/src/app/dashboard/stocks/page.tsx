'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { TICKER_INFO, SECTORS } from '@/lib/constants';
import { generateMockStockData } from '@/lib/mock-data';
import { Search, TrendingUp, TrendingDown, Minus, ArrowRight, Filter } from 'lucide-react';

export default function StocksPage() {
  const [mounted, setMounted] = useState(false);
  const [search, setSearch] = useState('');
  const [sectorFilter, setSectorFilter] = useState('All');
  const [sortBy, setSortBy] = useState<'ticker' | 'sentiment' | 'change'>('ticker');

  useEffect(() => { setMounted(true); }, []);

  const stocks = useMemo(() => generateMockStockData(), []);

  const filteredStocks = useMemo(() => {
    let result = stocks.filter(s =>
      (s.ticker.includes(search.toUpperCase()) || s.name.toLowerCase().includes(search.toLowerCase())) &&
      (sectorFilter === 'All' || s.sector === sectorFilter)
    );
    if (sortBy === 'sentiment') result.sort((a, b) => b.sentiment - a.sentiment);
    else if (sortBy === 'change') result.sort((a, b) => b.changePercent - a.changePercent);
    else result.sort((a, b) => a.ticker.localeCompare(b.ticker));
    return result;
  }, [stocks, search, sectorFilter, sortBy]);

  const uniqueSectors = useMemo(() => ['All', ...new Set(stocks.map(s => s.sector))], [stocks]);

  if (!mounted) return <div className="p-8 text-[#94A3B8]">Loading stocks...</div>;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-white">Stock Directory</h1>
        <p className="text-[#94A3B8] mt-1">Browse and analyze sentiment for {stocks.length} tracked assets.</p>
      </header>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
          <input
            type="text"
            placeholder="Search stocks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-white placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#3B82F6]/50 focus:border-[#3B82F6]/50 transition-all"
          />
        </div>
        <select
          value={sectorFilter}
          onChange={(e) => setSectorFilter(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-[#3B82F6]/50 appearance-none cursor-pointer"
        >
          {uniqueSectors.map(s => <option key={s} value={s} className="bg-[#101826]">{s}</option>)}
        </select>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
          className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-[#3B82F6]/50 appearance-none cursor-pointer"
        >
          <option value="ticker" className="bg-[#101826]">Sort: A-Z</option>
          <option value="sentiment" className="bg-[#101826]">Sort: Sentiment</option>
          <option value="change" className="bg-[#101826]">Sort: Price Change</option>
        </select>
      </div>

      {/* Results count */}
      <p className="text-sm text-[#94A3B8]">{filteredStocks.length} stocks found</p>

      {/* Stock Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredStocks.map((stock, idx) => (
          <Link key={stock.ticker} href={`/dashboard/stocks/${stock.ticker}`}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(idx * 0.03, 0.5) }}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              className="p-5 rounded-2xl border border-white/[0.08] bg-white/[0.04] backdrop-blur-xl hover:border-white/20 hover:bg-white/[0.07] transition-all cursor-pointer group"
            >
              {/* Header */}
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-bold text-white group-hover:text-[#3B82F6] transition-colors">{stock.ticker}</h3>
                    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
                      stock.trend === 'POSITIVE' ? 'bg-[#22C55E]/15 text-[#22C55E]' :
                      stock.trend === 'NEGATIVE' ? 'bg-[#EF4444]/15 text-[#EF4444]' :
                      'bg-[#F59E0B]/15 text-[#F59E0B]'
                    }`}>
                      {stock.trend}
                    </span>
                  </div>
                  <p className="text-xs text-[#94A3B8] truncate max-w-[180px]">{stock.name}</p>
                </div>
                <div className="p-2 rounded-lg bg-white/5 group-hover:bg-[#3B82F6]/10 transition-colors">
                  {stock.changePercent >= 0 ?
                    <TrendingUp className="w-4 h-4 text-[#22C55E]" /> :
                    <TrendingDown className="w-4 h-4 text-[#EF4444]" />
                  }
                </div>
              </div>

              {/* Price */}
              <div className="flex items-baseline gap-2 mb-3">
                <span className="text-xl font-bold text-white">${stock.price.toLocaleString()}</span>
                <span className={`text-sm font-medium ${stock.changePercent >= 0 ? 'text-[#22C55E]' : 'text-[#EF4444]'}`}>
                  {stock.changePercent >= 0 ? '+' : ''}{stock.changePercent}%
                </span>
              </div>

              {/* Sentiment bar */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-[#94A3B8]">Sentiment</span>
                  <span className={stock.sentiment > 0 ? 'text-[#22C55E]' : stock.sentiment < 0 ? 'text-[#EF4444]' : 'text-[#F59E0B]'}>
                    {stock.sentiment > 0 ? '+' : ''}{stock.sentiment.toFixed(2)}
                  </span>
                </div>
                <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${((stock.sentiment + 1) / 2) * 100}%` }}
                    transition={{ delay: Math.min(idx * 0.03 + 0.3, 0.8), duration: 0.5 }}
                    className={`h-full rounded-full ${
                      stock.sentiment > 0.15 ? 'bg-[#22C55E]' :
                      stock.sentiment < -0.15 ? 'bg-[#EF4444]' :
                      'bg-[#F59E0B]'
                    }`}
                  />
                </div>
              </div>

              {/* Footer */}
              <div className="flex justify-between items-center mt-4 pt-3 border-t border-white/5">
                <span className="text-[10px] text-[#94A3B8]">{stock.sector}</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#94A3B8] group-hover:text-[#3B82F6] group-hover:translate-x-1 transition-all" />
              </div>
            </motion.div>
          </Link>
        ))}
      </div>
    </div>
  );
}

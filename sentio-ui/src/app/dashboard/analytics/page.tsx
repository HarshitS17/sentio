'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { generateMockSectorData, generateMockDashboardChartData, generateMockKPIData, generateMockStockData } from '@/lib/mock-data';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { BarChart3, TrendingUp, TrendingDown, PieChart as PieIcon, Activity, Layers } from 'lucide-react';

const PIE_COLORS = ['#22C55E', '#EF4444', '#F59E0B'];

export default function AnalyticsPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const sectorData = generateMockSectorData();
  const chartData = generateMockDashboardChartData();
  const kpi = generateMockKPIData();
  const stocks = useMemo(() => generateMockStockData(), []);
  const pieData = [
    { name: 'Bullish', value: kpi.bullishPercent },
    { name: 'Bearish', value: kpi.bearishPercent },
    { name: 'Neutral', value: kpi.neutralPercent },
  ];
  const topPositive = useMemo(() => stocks.filter(s => s.sentiment > 0).sort((a, b) => b.sentiment - a.sentiment).slice(0, 5), [stocks]);
  const topNegative = useMemo(() => stocks.filter(s => s.sentiment < 0).sort((a, b) => a.sentiment - b.sentiment).slice(0, 5), [stocks]);

  if (!mounted) return <div className="p-8 text-[#94A3B8]">Loading analytics...</div>;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-white">Advanced Analytics</h1>
        <p className="text-[#94A3B8] mt-1">Deep market sentiment insights across {stocks.length} assets.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sentiment Distribution Pie */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="p-6 rounded-2xl bg-white/[0.04] border border-white/[0.06]">
          <div className="flex items-center gap-2 mb-4">
            <PieIcon className="w-5 h-5 text-[#3B82F6]" />
            <h2 className="font-semibold text-white">Sentiment Distribution</h2>
          </div>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={4} dataKey="value" startAngle={90} endAngle={-270}>
                  {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} stroke="transparent" />)}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: 'rgba(7,11,20,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-4 mt-2">
            {pieData.map((d, i) => (
              <div key={d.name} className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PIE_COLORS[i] }} />
                <span className="text-xs text-[#94A3B8]">{d.name} {d.value}%</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Sector Heatmap */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className="lg:col-span-2 p-6 rounded-2xl bg-white/[0.04] border border-white/[0.06]">
          <div className="flex items-center gap-2 mb-4">
            <Layers className="w-5 h-5 text-[#3B82F6]" />
            <h2 className="font-semibold text-white">Sector Sentiment Heatmap</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {sectorData.map((sector, i) => {
              const intensity = Math.abs(sector.sentiment);
              const bg = sector.sentiment > 0
                ? `rgba(34, 197, 94, ${0.1 + intensity * 0.3})`
                : `rgba(239, 68, 68, ${0.1 + intensity * 0.3})`;
              return (
                <motion.div key={sector.sector} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.03 }}
                  whileHover={{ scale: 1.05 }}
                  className="p-3 rounded-xl border border-white/[0.06] transition-all cursor-pointer" style={{ backgroundColor: bg }}>
                  <div className="text-xs font-medium text-white truncate">{sector.sector}</div>
                  <div className={`text-lg font-bold mt-1 ${sector.sentiment > 0 ? 'text-[#22C55E]' : 'text-[#EF4444]'}`}>
                    {sector.sentiment > 0 ? '+' : ''}{sector.sentiment.toFixed(2)}
                  </div>
                  <div className="text-[10px] text-white/60">{sector.volume.toLocaleString()} mentions</div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </div>

      {/* Sector Bar Chart */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="p-6 rounded-2xl bg-white/[0.04] border border-white/[0.06]">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="w-5 h-5 text-[#3B82F6]" />
          <h2 className="font-semibold text-white">Sector Sentiment Comparison</h2>
        </div>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={sectorData} layout="vertical" margin={{ left: 100, right: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
              <XAxis type="number" domain={[-1, 1]} tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis dataKey="sector" type="category" tick={{ fill: '#94A3B8', fontSize: 11 }} axisLine={false} tickLine={false} width={95} />
              <Tooltip contentStyle={{ backgroundColor: 'rgba(7,11,20,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }} />
              <Bar dataKey="sentiment" radius={[0, 4, 4, 0]}>
                {sectorData.map((entry, i) => (
                  <Cell key={i} fill={entry.sentiment > 0 ? '#22C55E' : '#EF4444'} fillOpacity={0.7} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Top Stocks */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="p-6 rounded-2xl bg-white/[0.04] border border-white/[0.06]">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-[#22C55E]" />
            <h2 className="font-semibold text-white">Most Bullish</h2>
          </div>
          <div className="space-y-2">
            {topPositive.map((s, i) => (
              <div key={s.ticker} className="flex items-center justify-between p-3 rounded-lg bg-white/[0.03] hover:bg-white/[0.06] transition-colors">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-[#94A3B8] w-4">{i + 1}</span>
                  <div>
                    <span className="text-sm font-bold text-white">{s.ticker}</span>
                    <p className="text-[10px] text-[#94A3B8]">{s.name}</p>
                  </div>
                </div>
                <span className="text-sm font-bold text-[#22C55E]">+{s.sentiment.toFixed(3)}</span>
              </div>
            ))}
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="p-6 rounded-2xl bg-white/[0.04] border border-white/[0.06]">
          <div className="flex items-center gap-2 mb-4">
            <TrendingDown className="w-5 h-5 text-[#EF4444]" />
            <h2 className="font-semibold text-white">Most Bearish</h2>
          </div>
          <div className="space-y-2">
            {topNegative.map((s, i) => (
              <div key={s.ticker} className="flex items-center justify-between p-3 rounded-lg bg-white/[0.03] hover:bg-white/[0.06] transition-colors">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-[#94A3B8] w-4">{i + 1}</span>
                  <div>
                    <span className="text-sm font-bold text-white">{s.ticker}</span>
                    <p className="text-[10px] text-[#94A3B8]">{s.name}</p>
                  </div>
                </div>
                <span className="text-sm font-bold text-[#EF4444]">{s.sentiment.toFixed(3)}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

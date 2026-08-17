'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import AnimatedNumber from '@/components/ui/AnimatedNumber';
import { SentimentBadge } from '@/components/ui/SentimentBadge';
import { generateMockDashboardChartData, generateMockKPIData, generateMockAlerts, generateMockStockData } from '@/lib/mock-data';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, AreaChart, Area } from 'recharts';
import {
  Activity, Zap, TrendingUp, TrendingDown, Bell, Clock, Database,
  Cpu, Radio, Server, ArrowRight, Newspaper, BarChart3,
} from 'lucide-react';

const STATUS_ITEMS = [
  { name: 'API Health', icon: Server, status: 'operational' },
  { name: 'Kafka Pipeline', icon: Radio, status: 'operational' },
  { name: 'SSE Streaming', icon: Zap, status: 'operational' },
  { name: 'Redis Cache', icon: Database, status: 'operational' },
];

export default function DashboardPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(t);
  }, []);

  const kpi = generateMockKPIData();
  const chartData = generateMockDashboardChartData();
  const alerts = generateMockAlerts().slice(0, 4);
  const stocks = useMemo(() => generateMockStockData().slice(0, 8), []);

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good Morning';
    if (h < 18) return 'Good Afternoon';
    return 'Good Evening';
  })();

  if (!mounted) return <div className="p-8 text-[#94A3B8]">Loading dashboard...</div>;

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">{greeting}, Trader</h1>
          <p className="text-[#94A3B8] mt-1">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#22C55E]/10 border border-[#22C55E]/20">
          <span className="w-2 h-2 rounded-full bg-[#22C55E] animate-pulse" />
          <span className="text-xs font-medium text-[#22C55E]">Markets Open</span>
        </div>
      </header>

      {/* System Status Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {STATUS_ITEMS.map((item, i) => (
          <motion.div key={item.name} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.04] border border-white/[0.06]"
          >
            <item.icon className="w-4 h-4 text-[#94A3B8]" />
            <span className="text-sm text-[#94A3B8] flex-1">{item.name}</span>
            <span className="w-2 h-2 rounded-full bg-[#22C55E] animate-pulse" />
          </motion.div>
        ))}
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {[
          { label: 'Total News', value: kpi.totalNewsProcessed, icon: Newspaper, color: 'text-[#3B82F6]' },
          { label: 'Bullish %', value: kpi.bullishPercent, icon: TrendingUp, color: 'text-[#22C55E]', suffix: '%' },
          { label: 'Bearish %', value: kpi.bearishPercent, icon: TrendingDown, color: 'text-[#EF4444]', suffix: '%' },
          { label: 'Avg Latency', value: kpi.avgLatency, icon: Zap, color: 'text-[#F59E0B]', suffix: 'ms' },
          { label: 'Req/sec', value: kpi.requestsPerSec, icon: Activity, color: 'text-[#8B5CF6]' },
        ].map((item, i) => (
          <motion.div key={item.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            whileHover={{ y: -3, transition: { duration: 0.2 } }}
            className="p-4 rounded-xl bg-white/[0.04] border border-white/[0.06] hover:border-white/10 transition-all"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-[#94A3B8]">{item.label}</span>
              <item.icon className={`w-4 h-4 ${item.color}`} />
            </div>
            <div className="text-2xl font-bold text-white">
              <AnimatedNumber value={item.value} />{item.suffix || ''}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Main Content: Chart + Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sentiment Chart */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="lg:col-span-2 p-6 rounded-2xl bg-white/[0.04] border border-white/[0.06]"
        >
          <div className="flex items-center gap-2 mb-6">
            <BarChart3 className="w-5 h-5 text-[#3B82F6]" />
            <h2 className="font-semibold text-white">Live Sentiment Trends (24h)</h2>
          </div>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  {['AAPL', 'MSFT', 'TSLA', 'NVDA'].map((t, i) => {
                    const colors = ['#A2AAAD', '#00A4EF', '#E31937', '#76B900'];
                    return (
                      <linearGradient key={t} id={`grad-${t}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={colors[i]} stopOpacity={0.2} />
                        <stop offset="95%" stopColor={colors[i]} stopOpacity={0} />
                      </linearGradient>
                    );
                  })}
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis dataKey="time" stroke="#64748b" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis stroke="#64748b" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} domain={[-1, 1]} />
                <Tooltip contentStyle={{ backgroundColor: 'rgba(7,11,20,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#f8fafc', backdropFilter: 'blur(12px)' }} />
                <Area type="monotone" dataKey="AAPL" stroke="#A2AAAD" fill="url(#grad-AAPL)" strokeWidth={2} dot={false} />
                <Area type="monotone" dataKey="MSFT" stroke="#00A4EF" fill="url(#grad-MSFT)" strokeWidth={2} dot={false} />
                <Area type="monotone" dataKey="TSLA" stroke="#E31937" fill="url(#grad-TSLA)" strokeWidth={2} dot={false} />
                <Area type="monotone" dataKey="NVDA" stroke="#76B900" fill="url(#grad-NVDA)" strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="flex gap-4 mt-4 flex-wrap">
            {[
              { label: 'AAPL', color: '#A2AAAD' },
              { label: 'MSFT', color: '#00A4EF' },
              { label: 'TSLA', color: '#E31937' },
              { label: 'NVDA', color: '#76B900' },
            ].map(l => (
              <div key={l.label} className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: l.color }} />
                <span className="text-xs text-[#94A3B8]">{l.label}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Alerts */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="p-6 rounded-2xl bg-white/[0.04] border border-white/[0.06]"
        >
          <div className="flex items-center gap-2 mb-5">
            <Bell className="w-5 h-5 text-[#3B82F6]" />
            <h2 className="font-semibold text-white">Recent Alerts</h2>
          </div>
          <div className="space-y-3">
            {alerts.map((alert, idx) => (
              <motion.div key={alert.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 + idx * 0.05 }}
                className="p-3 rounded-xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.06] transition-colors"
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className={`w-1.5 h-1.5 rounded-full ${alert.severity === 'HIGH' ? 'bg-[#EF4444]' : alert.severity === 'MEDIUM' ? 'bg-[#F59E0B]' : 'bg-[#3B82F6]'}`} />
                  <span className="text-xs font-bold text-white">{alert.ticker}</span>
                  <span className="text-[10px] text-[#94A3B8]">{alert.type.replace(/_/g, ' ')}</span>
                </div>
                <p className="text-xs text-[#94A3B8] leading-relaxed">{alert.message}</p>
              </motion.div>
            ))}
          </div>
          <Link href="/dashboard/alerts" className="flex items-center gap-1 mt-4 text-xs text-[#3B82F6] hover:text-[#60A5FA] transition-colors">
            View all alerts <ArrowRight className="w-3 h-3" />
          </Link>
        </motion.div>
      </div>

      {/* Trending Stocks */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-white">Trending Stocks</h2>
          <Link href="/dashboard/stocks" className="flex items-center gap-1 text-xs text-[#3B82F6] hover:text-[#60A5FA] transition-colors">
            View all <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stocks.slice(0, 8).map((stock, idx) => (
            <Link key={stock.ticker} href={`/dashboard/stocks/${stock.ticker}`}>
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + idx * 0.04 }}
                whileHover={{ y: -3, transition: { duration: 0.2 } }}
                className="p-4 rounded-xl bg-white/[0.04] border border-white/[0.06] hover:border-white/15 transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <span className="text-sm font-bold text-white group-hover:text-[#3B82F6] transition-colors">{stock.ticker}</span>
                    <p className="text-[10px] text-[#94A3B8] truncate max-w-[120px]">{stock.name}</p>
                  </div>
                  <SentimentBadge label={stock.trend as 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL'} />
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-lg font-bold text-white">${stock.price}</span>
                  <span className={`text-xs font-medium ${stock.changePercent >= 0 ? 'text-[#22C55E]' : 'text-[#EF4444]'}`}>
                    {stock.changePercent >= 0 ? '+' : ''}{stock.changePercent}%
                  </span>
                </div>
              </motion.div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { generateMockAlerts } from '@/lib/mock-data';
import { TICKERS } from '@/lib/constants';
import { Bell, BellOff, Plus, Clock, AlertTriangle, TrendingUp, Activity, Trash2 } from 'lucide-react';

interface AlertRule {
  id: string;
  ticker: string;
  type: string;
  condition: string;
  threshold: number;
  active: boolean;
}

const DEFAULT_RULES: AlertRule[] = [
  { id: 'r1', ticker: 'TSLA', type: 'Sentiment Reversal', condition: 'below', threshold: -0.5, active: true },
  { id: 'r2', ticker: 'AAPL', type: 'Price Threshold', condition: 'above', threshold: 200, active: true },
  { id: 'r3', ticker: 'NVDA', type: 'Volume Spike', condition: 'above', threshold: 3, active: false },
  { id: 'r4', ticker: 'ALL', type: 'Sentiment Reversal', condition: 'any', threshold: 0, active: true },
];

export default function AlertsPage() {
  const [mounted, setMounted] = useState(false);
  const [rules, setRules] = useState<AlertRule[]>(DEFAULT_RULES);
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(t);
  }, []);

  const recentAlerts = generateMockAlerts();

  const toggleRule = (id: string) => {
    setRules(rules.map(r => r.id === id ? { ...r, active: !r.active } : r));
  };

  const deleteRule = (id: string) => {
    setRules(rules.filter(r => r.id !== id));
  };

  if (!mounted) return <div className="p-8 text-[#94A3B8]">Loading alerts...</div>;

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Alerts</h1>
          <p className="text-[#94A3B8] mt-1">Configure and manage real-time alert rules</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#3B82F6] text-white text-sm font-medium hover:bg-[#2563EB] transition-colors">
          <Plus className="w-4 h-4" /> New Rule
        </button>
      </header>

      {/* Active Rules */}
      <div>
        <h2 className="font-semibold text-white mb-4">Alert Rules</h2>
        <div className="space-y-3">
          {rules.map((rule, idx) => (
            <motion.div key={rule.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}
              className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${rule.active ? 'bg-white/[0.04] border-white/[0.08]' : 'bg-white/[0.02] border-white/[0.04] opacity-60'}`}>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${rule.active ? 'bg-[#3B82F6]/10' : 'bg-white/5'}`}>
                {rule.type === 'Sentiment Reversal' ? <Activity className={`w-5 h-5 ${rule.active ? 'text-[#3B82F6]' : 'text-[#94A3B8]'}`} /> :
                 rule.type === 'Price Threshold' ? <TrendingUp className={`w-5 h-5 ${rule.active ? 'text-[#22C55E]' : 'text-[#94A3B8]'}`} /> :
                 <AlertTriangle className={`w-5 h-5 ${rule.active ? 'text-[#F59E0B]' : 'text-[#94A3B8]'}`} />}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium text-white">{rule.type}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-[#94A3B8]">{rule.ticker}</span>
                </div>
                <p className="text-xs text-[#94A3B8]">
                  Trigger when {rule.condition} {rule.threshold !== 0 ? rule.threshold : 'any change'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => toggleRule(rule.id)}
                  className={`w-10 h-6 rounded-full transition-colors relative ${rule.active ? 'bg-[#3B82F6]' : 'bg-white/10'}`}>
                  <motion.div animate={{ x: rule.active ? 16 : 2 }} transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    className="w-5 h-5 rounded-full bg-white absolute top-0.5" />
                </button>
                <button onClick={() => deleteRule(rule.id)} className="p-1.5 rounded-lg hover:bg-[#EF4444]/10 transition-colors">
                  <Trash2 className="w-3.5 h-3.5 text-[#94A3B8] hover:text-[#EF4444]" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Alert History */}
      <div>
        <h2 className="font-semibold text-white mb-4">Recent Alert History</h2>
        <div className="space-y-3">
          {recentAlerts.map((alert, idx) => (
            <motion.div key={alert.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.04 }}
              className={`flex items-start gap-3 p-4 rounded-xl border transition-all ${alert.read ? 'bg-white/[0.02] border-white/[0.04]' : 'bg-white/[0.05] border-white/[0.08]'}`}>
              <span className={`mt-1 w-2 h-2 rounded-full shrink-0 ${
                alert.severity === 'HIGH' ? 'bg-[#EF4444]' : alert.severity === 'MEDIUM' ? 'bg-[#F59E0B]' : 'bg-[#3B82F6]'
              } ${!alert.read ? 'animate-pulse' : ''}`} />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold text-white">{alert.ticker}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                    alert.severity === 'HIGH' ? 'bg-[#EF4444]/10 text-[#EF4444]' :
                    alert.severity === 'MEDIUM' ? 'bg-[#F59E0B]/10 text-[#F59E0B]' : 'bg-[#3B82F6]/10 text-[#3B82F6]'
                  }`}>{alert.severity}</span>
                  <span className="text-[10px] text-[#94A3B8]">{alert.type.replace(/_/g, ' ')}</span>
                </div>
                <p className="text-sm text-[#94A3B8]">{alert.message}</p>
                <div className="flex items-center gap-1 mt-2 text-[10px] text-[#94A3B8]">
                  <Clock className="w-3 h-3" />{new Date(alert.time).toLocaleString()}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Settings, User, Key, Bell, Palette, Shield, Save } from 'lucide-react';

const TABS = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'api', label: 'API Keys', icon: Key },
  { id: 'preferences', label: 'Preferences', icon: Palette },
];

export default function SettingsPage() {
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(t);
  }, []);

  if (!mounted) return <div className="p-8 text-[#94A3B8]">Loading settings...</div>;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-[#94A3B8] mt-1">Manage your account and preferences</p>
      </header>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl bg-white/[0.04] border border-white/[0.06] w-fit">
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.id ? 'bg-[#3B82F6] text-white' : 'text-[#94A3B8] hover:text-white hover:bg-white/5'
            }`}>
            <tab.icon className="w-4 h-4" /> {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}
        className="p-6 rounded-2xl bg-white/[0.04] border border-white/[0.06]">

        {activeTab === 'profile' && (
          <div className="space-y-6 max-w-xl">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#3B82F6] to-[#8B5CF6] flex items-center justify-center text-xl font-bold text-white">AD</div>
              <div>
                <h3 className="text-white font-medium">Alex Doe</h3>
                <p className="text-sm text-[#94A3B8]">alex.doe@sentio.ai</p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-[#94A3B8] block mb-1.5">Full Name</label>
                <input defaultValue="Alex Doe" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-[#3B82F6]/50 transition-all" />
              </div>
              <div>
                <label className="text-xs text-[#94A3B8] block mb-1.5">Email</label>
                <input defaultValue="alex.doe@sentio.ai" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-[#3B82F6]/50 transition-all" />
              </div>
              <div>
                <label className="text-xs text-[#94A3B8] block mb-1.5">Role</label>
                <input defaultValue="Portfolio Manager" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-[#3B82F6]/50 transition-all" />
              </div>
            </div>
            <button className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#3B82F6] text-white text-sm font-medium hover:bg-[#2563EB] transition-colors">
              <Save className="w-4 h-4" /> Save Changes
            </button>
          </div>
        )}

        {activeTab === 'notifications' && (
          <div className="space-y-4 max-w-xl">
            {[
              { label: 'Sentiment Reversals', desc: 'Get notified when a stock sentiment flips', on: true },
              { label: 'Price Alerts', desc: 'Receive alerts when price thresholds are crossed', on: true },
              { label: 'Daily Summary', desc: 'Receive a daily market mood summary', on: false },
              { label: 'Breaking News', desc: 'Instant alerts for high-impact news', on: true },
              { label: 'Weekly Report', desc: 'Automated weekly sentiment report', on: false },
            ].map((item, idx) => (
              <div key={idx} className="flex items-center justify-between p-4 rounded-xl bg-white/[0.03] border border-white/5">
                <div>
                  <p className="text-sm font-medium text-white">{item.label}</p>
                  <p className="text-xs text-[#94A3B8] mt-0.5">{item.desc}</p>
                </div>
                <ToggleSwitch defaultOn={item.on} />
              </div>
            ))}
          </div>
        )}

        {activeTab === 'api' && (
          <div className="space-y-4 max-w-xl">
            <p className="text-sm text-[#94A3B8] mb-4">Manage your API keys for programmatic access to Sentio data.</p>
            {[
              { name: 'Production Key', key: 'sk_live_•••••••••••••••••••', created: '2026-07-15' },
              { name: 'Development Key', key: 'sk_test_•••••••••••••••••••', created: '2026-06-20' },
            ].map((item, idx) => (
              <div key={idx} className="flex items-center justify-between p-4 rounded-xl bg-white/[0.03] border border-white/5">
                <div>
                  <p className="text-sm font-medium text-white">{item.name}</p>
                  <p className="text-xs text-[#94A3B8] mt-0.5 font-mono">{item.key}</p>
                  <p className="text-[10px] text-[#94A3B8] mt-1">Created {item.created}</p>
                </div>
                <div className="flex gap-2">
                  <button className="px-3 py-1.5 rounded-lg bg-white/5 text-xs text-[#94A3B8] hover:bg-white/10 transition-colors">Copy</button>
                  <button className="px-3 py-1.5 rounded-lg bg-[#EF4444]/10 text-xs text-[#EF4444] hover:bg-[#EF4444]/20 transition-colors">Revoke</button>
                </div>
              </div>
            ))}
            <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 text-sm text-[#94A3B8] hover:bg-white/10 transition-colors border border-white/[0.06]">
              <Key className="w-4 h-4" /> Generate New Key
            </button>
          </div>
        )}

        {activeTab === 'preferences' && (
          <div className="space-y-4 max-w-xl">
            <div>
              <label className="text-xs text-[#94A3B8] block mb-1.5">Theme</label>
              <select className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-[#3B82F6]/50 appearance-none">
                <option className="bg-[#101826]">Dark (Default)</option>
                <option className="bg-[#101826]">System</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-[#94A3B8] block mb-1.5">Default Ticker</label>
              <select className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-[#3B82F6]/50 appearance-none">
                <option className="bg-[#101826]">AAPL</option>
                <option className="bg-[#101826]">TSLA</option>
                <option className="bg-[#101826]">NVDA</option>
                <option className="bg-[#101826]">MSFT</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-[#94A3B8] block mb-1.5">Data Refresh Rate</label>
              <select className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-[#3B82F6]/50 appearance-none">
                <option className="bg-[#101826]">Real-time (1s)</option>
                <option className="bg-[#101826]">Fast (5s)</option>
                <option className="bg-[#101826]">Normal (15s)</option>
                <option className="bg-[#101826]">Slow (30s)</option>
              </select>
            </div>
            <button className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#3B82F6] text-white text-sm font-medium hover:bg-[#2563EB] transition-colors">
              <Save className="w-4 h-4" /> Save Preferences
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}

function ToggleSwitch({ defaultOn = false }: { defaultOn?: boolean }) {
  const [on, setOn] = useState(defaultOn);
  return (
    <button onClick={() => setOn(!on)}
      className={`w-10 h-6 rounded-full transition-colors relative ${on ? 'bg-[#3B82F6]' : 'bg-white/10'}`}>
      <motion.div animate={{ x: on ? 16 : 2 }} transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        className="w-5 h-5 rounded-full bg-white absolute top-0.5" />
    </button>
  );
}

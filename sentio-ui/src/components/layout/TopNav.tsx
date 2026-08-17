'use client';

import React, { useEffect, useState } from 'react';
import { Search, Bell, Command } from 'lucide-react';
import { useCommandPalette } from '@/hooks/use-command-palette';

interface TopNavProps {
  collapsed?: boolean;
}

export default function TopNav({  }: TopNavProps) {
  const { open } = useCommandPalette();
  const [time, setTime] = useState<Date | null>(null);

  useEffect(() => {
    const initTimer = setTimeout(() => setTime(new Date()), 0);
    const intervalTimer = setInterval(() => setTime(new Date()), 1000);
    return () => {
      clearTimeout(initTimer);
      clearInterval(intervalTimer);
    };
  }, []);

  return (
    <header className="relative z-30 flex items-center justify-between h-16 px-6 rounded-2xl glass-panel shadow-lg w-full">
      <div className="flex items-center gap-4">
        <div className="text-sm font-medium text-slate-400 flex items-center gap-2">
          <span>Overview</span>
          <span className="text-white/20">/</span>
          <span className="text-white">Dashboard</span>
        </div>
      </div>

      <div className="flex items-center gap-6">
        <button
          onClick={open}
          className="group flex items-center gap-3 px-4 py-2 rounded-xl bg-black/20 border border-white/5 hover:border-white/10 hover:bg-white/5 transition-all text-slate-400"
        >
          <Search size={16} />
          <span className="text-sm hidden sm:inline">Search markets...</span>
          <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-white/10 text-xs font-medium text-white/50 group-hover:text-white/70">
            <Command size={12} /> K
          </div>
        </button>

        <div className="flex items-center gap-4 border-l border-white/10 pl-6">
          <div className="flex flex-col items-end hidden md:flex">
            <span className="text-xs text-slate-400">Market Status</span>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)] animate-pulse" />
              <span className="text-sm font-medium text-white">Open</span>
            </div>
          </div>

          <div className="text-right min-w-[80px] hidden md:block">
             <span className="text-xs text-slate-400 font-medium block">
              {time ? time.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '---'}
            </span>
            <span className="text-sm font-medium text-white font-mono">
              {time ? time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }) : '--:--:--'}
            </span>
          </div>

          <button className="relative p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors text-slate-400 hover:text-white">
            <Bell size={18} />
            <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]" />
          </button>
        </div>
      </div>
    </header>
  );
}

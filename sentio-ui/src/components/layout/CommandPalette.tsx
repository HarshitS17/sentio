'use client';

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ArrowRight, Settings, CreditCard, Activity, X } from 'lucide-react';
import { useCommandPalette } from '@/hooks/use-command-palette';
import { useRouter } from 'next/navigation';

export default function CommandPalette() {
  const { isOpen, close, toggle } = useCommandPalette();
  const router = useRouter();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        toggle();
      }
      if (e.key === 'Escape' && isOpen) {
        close();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, toggle, close]);

  const actions = [
    { name: 'Transfer Funds', icon: ArrowRight, shortcut: 'T', href: '/transfer' },
    { name: 'Trade Crypto', icon: Activity, shortcut: 'C', href: '/trading' },
    { name: 'Manage Cards', icon: CreditCard, shortcut: 'M', href: '/cards' },
    { name: 'Account Settings', icon: Settings, shortcut: 'S', href: '/settings' },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm"
            onClick={close}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed left-1/2 top-[15%] z-[101] w-full max-w-xl -translate-x-1/2 overflow-hidden rounded-2xl border border-white/10 bg-[#101826]/90 shadow-2xl backdrop-blur-xl"
          >
            <div className="flex items-center border-b border-white/10 px-4 py-3">
              <Search className="text-slate-400 mr-3" size={20} />
              <input
                autoFocus
                className="flex-1 bg-transparent text-white placeholder-slate-400 outline-none"
                placeholder="Type a command or search..."
              />
              <button onClick={close} className="p-1 rounded-md hover:bg-white/10 text-slate-400 hover:text-white transition-colors">
                <X size={16} />
              </button>
            </div>
            
            <div className="max-h-[300px] overflow-y-auto p-2 no-scrollbar">
              <div className="px-2 py-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Quick Actions
              </div>
              {actions.map((action, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    router.push(action.href);
                    close();
                  }}
                  className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 hover:bg-white/5 transition-colors group text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-white/5 text-slate-300 group-hover:text-white group-hover:bg-blue-500/20 transition-colors">
                      <action.icon size={16} />
                    </div>
                    <span className="text-sm font-medium text-slate-300 group-hover:text-white">
                      {action.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-white/5 text-xs font-medium text-white/40 border border-white/10">
                     ⌘ {action.shortcut}
                  </div>
                </button>
              ))}
            </div>
            <div className="border-t border-white/10 px-4 py-3 bg-black/20 flex items-center justify-between text-xs text-slate-500">
              <div className="flex items-center gap-4">
                 <span className="flex items-center gap-1"><kbd className="bg-white/10 rounded px-1.5 py-0.5">↑</kbd><kbd className="bg-white/10 rounded px-1.5 py-0.5">↓</kbd> to navigate</span>
                 <span className="flex items-center gap-1"><kbd className="bg-white/10 rounded px-1.5 py-0.5">↵</kbd> to select</span>
              </div>
              <span>Sentio OS</span>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

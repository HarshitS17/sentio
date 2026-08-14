'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, LogOut, User } from 'lucide-react';
import { NAV_ITEMS } from '@/lib/constants';

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: (v: boolean) => void;
}

export default function Sidebar({ collapsed, setCollapsed }: SidebarProps) {
  const pathname = usePathname();

  return (
    <motion.aside
      layout
      initial={{ width: 260 }}
      animate={{ width: collapsed ? 80 : 260 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="fixed left-4 top-4 bottom-4 z-40 flex flex-col justify-between rounded-2xl glass-sidebar shadow-2xl overflow-hidden"
    >
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between p-4 h-24 border-b border-[var(--glass-border)]">
          <AnimatePresence mode="popLayout">
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex items-center gap-3 w-full"
              >
                {/* Logo Graphic */}
                <div className="relative w-10 h-8 flex items-center shrink-0">
                  {/* Horizontal Line */}
                  <div className="absolute top-1/2 left-0 w-full h-[2px] bg-white -translate-y-1/2" />
                  {/* Bars */}
                  <div className="absolute bottom-1/2 left-[2px] w-[6px] h-5 bg-white" />
                  <div className="absolute bottom-1/2 left-[12px] w-[6px] h-3 bg-white" />
                  <div className="absolute top-1/2 left-[22px] w-[6px] h-3 bg-white" />
                  <div className="absolute top-1/2 left-[32px] w-[6px] h-5 bg-white" />
                </div>
                
                <div className="flex flex-col pt-1">
                  <span className="text-white text-3xl tracking-wide" style={{ fontFamily: 'var(--font-pacifico), cursive' }}>
                    Sentio
                  </span>
                  <span className="text-white/70 text-[0.45rem] tracking-[0.2em] font-bold mt-[-4px] uppercase">
                    Turning headlines into insights
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-white mx-auto shrink-0"
          >
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 flex flex-col gap-2 no-scrollbar">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href || (pathname === '/' && item.href === '/dashboard');
            const Icon = item.icon;
            return (
              <Link key={item.name} href={item.href}>
                <div
                  className={`relative flex items-center rounded-xl p-3 transition-all duration-200 group ${
                    isActive ? 'text-white bg-blue-600/20' : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                  title={collapsed ? item.name : undefined}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute inset-0 rounded-xl bg-blue-600/20 border border-blue-500/30"
                      initial={false}
                      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    />
                  )}
                  <div className="min-w-[20px] flex items-center justify-center z-10">
                    <Icon size={20} className={collapsed ? "mx-auto" : ""} />
                  </div>
                  <AnimatePresence mode="popLayout">
                    {!collapsed && (
                      <motion.span
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        className="ml-3 font-medium whitespace-nowrap z-10"
                      >
                        {item.name}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-[var(--glass-border)]">
          <div className={`flex items-center gap-3 p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors cursor-pointer group ${collapsed ? 'justify-center' : ''}`}>
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shrink-0">
              <User size={18} className="text-white" />
            </div>
            <AnimatePresence mode="popLayout">
              {!collapsed && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="flex-1 min-w-0"
                >
                  <div className="text-sm font-medium text-white truncate">Alex Doe</div>
                  <div className="text-xs text-slate-200 truncate">Pro Plan</div>
                </motion.div>
              )}
            </AnimatePresence>
            {!collapsed && <LogOut size={16} className="text-slate-300 group-hover:text-white transition-colors" />}
          </div>
        </div>
      </div>
    </motion.aside>
  );
}


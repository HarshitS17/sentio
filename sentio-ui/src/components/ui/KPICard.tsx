'use client';

import React, { useEffect, useState } from 'react';
import { GlassCard } from './GlassCard';
import { animate } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export interface KPICardProps {
  title: string;
  value: number;
  prefix?: string;
  suffix?: string;
  trend: number;
  icon: React.ReactNode;
  className?: string;
}

export function KPICard({ title, value, prefix = '', suffix = '', trend, icon, className = '' }: KPICardProps) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const controls = animate(0, value, {
      duration: 1.5,
      ease: 'easeOut',
      onUpdate: (v) => {
        setDisplayValue(v);
      },
    });

    return () => controls.stop();
  }, [value]);

  const isPositive = trend > 0;
  const isNegative = trend < 0;
  const isNeutral = trend === 0;

  return (
    <GlassCard hoverEffect className={`p-5 flex flex-col gap-4 ${className}`}>
      <div className="flex justify-between items-start">
        <h3 className="text-sm font-medium text-[#94A3B8]">{title}</h3>
        <div className="p-2 rounded-lg bg-white/5 text-[#3B82F6]">
          {icon}
        </div>
      </div>
      
      <div className="flex flex-col gap-1">
        <div className="text-3xl font-semibold text-white tracking-tight">
          {prefix}{displayValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}{suffix}
        </div>
        
        <div className="flex items-center gap-1.5 mt-2">
          <span
            className={`inline-flex items-center text-xs font-medium ${
              isPositive ? 'text-green-500' : isNegative ? 'text-red-500' : 'text-amber-500'
            }`}
          >
            {isPositive && <TrendingUp className="w-3 h-3 mr-1" />}
            {isNegative && <TrendingDown className="w-3 h-3 mr-1" />}
            {isNeutral && <Minus className="w-3 h-3 mr-1" />}
            {Math.abs(trend)}%
          </span>
          <span className="text-xs text-[#94A3B8]">vs last period</span>
        </div>
      </div>
    </GlassCard>
  );
}

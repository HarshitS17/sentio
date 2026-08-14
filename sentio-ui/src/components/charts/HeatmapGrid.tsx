'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';

interface HeatmapCell {
  id: string;
  symbol: string;
  sentimentScore: number; // -1 to 1
  mentions: number;
}

interface HeatmapGridProps {
  data: HeatmapCell[];
  className?: string;
}

// Function to map score to color
const getScoreColor = (score: number) => {
  if (score > 0.5) return 'bg-[#22C55E]/80 border-[#22C55E]';
  if (score > 0.1) return 'bg-[#22C55E]/40 border-[#22C55E]/50';
  if (score > -0.1) return 'bg-[#F59E0B]/40 border-[#F59E0B]/50';
  if (score > -0.5) return 'bg-[#EF4444]/40 border-[#EF4444]/50';
  return 'bg-[#EF4444]/80 border-[#EF4444]';
};

export function HeatmapGrid({ data, className = '' }: HeatmapGridProps) {
  return (
    <div className={`grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 p-4 bg-white/5 border border-white/10 rounded-2xl ${className}`}>
      {data.map((cell) => {
        const colorClass = getScoreColor(cell.sentimentScore);
        const isPositive = cell.sentimentScore > 0.1;
        const isNegative = cell.sentimentScore < -0.1;

        return (
          <motion.div
            key={cell.id}
            whileHover={{ scale: 1.05, zIndex: 10 }}
            className={`
              relative flex flex-col justify-between p-3 rounded-xl border backdrop-blur-sm cursor-pointer
              shadow-lg transition-colors
              ${colorClass}
            `}
            style={{ minHeight: '100px' }}
          >
            <div className="flex items-start justify-between">
              <span className="text-white font-bold tracking-tight">{cell.symbol}</span>
              {isPositive && <ArrowUpRight className="w-4 h-4 text-white/80" />}
              {isNegative && <ArrowDownRight className="w-4 h-4 text-white/80" />}
              {!isPositive && !isNegative && <Minus className="w-4 h-4 text-white/80" />}
            </div>
            
            <div className="flex flex-col">
              <span className="text-white/90 text-sm font-medium">
                {cell.sentimentScore > 0 ? '+' : ''}{cell.sentimentScore.toFixed(2)}
              </span>
              <span className="text-white/60 text-xs">
                {cell.mentions} mentions
              </span>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

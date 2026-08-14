'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface GaugeChartProps {
  score: number; // -1 to 1
  label?: string;
  className?: string;
}

export function GaugeChart({ score, label, className = '' }: GaugeChartProps) {
  // Normalize score from [-1, 1] to [0, 1] for rotation
  const normalizedScore = Math.max(0, Math.min(1, (score + 1) / 2));
  const angle = -90 + normalizedScore * 180;

  return (
    <div className={`relative flex flex-col items-center ${className}`}>
      <svg width="200" height="120" viewBox="0 0 200 120" className="overflow-visible">
        <defs>
          <linearGradient id="gauge-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#EF4444" />
            <stop offset="50%" stopColor="#F59E0B" />
            <stop offset="100%" stopColor="#22C55E" />
          </linearGradient>
        </defs>
        
        {/* Background Arc */}
        <path
          d="M 20 100 A 80 80 0 0 1 180 100"
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth="16"
          strokeLinecap="round"
        />
        
        {/* Colored Arc */}
        <path
          d="M 20 100 A 80 80 0 0 1 180 100"
          fill="none"
          stroke="url(#gauge-gradient)"
          strokeWidth="16"
          strokeLinecap="round"
          strokeDasharray="251.2"
          strokeDashoffset="0"
        />

        {/* Needle */}
        <motion.g
          initial={{ rotate: -90 }}
          animate={{ rotate: angle }}
          transition={{ duration: 1.5, type: 'spring', bounce: 0.2 }}
          style={{ transformOrigin: '100px 100px' }}
        >
          <path
            d="M 96 100 L 100 30 L 104 100 Z"
            fill="#FFFFFF"
          />
          <circle cx="100" cy="100" r="8" fill="#101826" stroke="#FFFFFF" strokeWidth="2" />
        </motion.g>
      </svg>
      
      <div className="absolute bottom-0 text-center">
        <div className="text-3xl font-bold text-white tracking-tight">
          {score > 0 ? '+' : ''}{score.toFixed(2)}
        </div>
        {label && <div className="text-sm text-[#94A3B8] font-medium mt-1">{label}</div>}
      </div>
    </div>
  );
}

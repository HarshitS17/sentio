'use client';

import React from 'react';

export type SentimentType = 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';

export interface SentimentBadgeProps {
  label: SentimentType;
  className?: string;
}

export function SentimentBadge({ label, className = '' }: SentimentBadgeProps) {
  let styles = '';
  
  switch (label) {
    case 'POSITIVE':
      styles = 'bg-green-500/10 text-green-500 border-green-500/20 shadow-[0_0_10px_rgba(34,197,94,0.2)]';
      break;
    case 'NEGATIVE':
      styles = 'bg-red-500/10 text-red-500 border-red-500/20 shadow-[0_0_10px_rgba(239,68,68,0.2)]';
      break;
    case 'NEUTRAL':
      styles = 'bg-amber-500/10 text-amber-500 border-amber-500/20 shadow-[0_0_10px_rgba(245,158,11,0.2)]';
      break;
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles} ${className}`}>
      {label}
    </span>
  );
}

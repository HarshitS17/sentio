'use client';

import React from 'react';
import { GlassCard } from '@/components/ui/GlassCard';

export function Skeleton({ className = '', style }: { className?: string, style?: React.CSSProperties }) {
  return (
    <div
      className={`animate-pulse bg-white/5 rounded-md ${className}`}
      style={{
        backgroundImage: 'linear-gradient(90deg, rgba(255,255,255,0) 0, rgba(255,255,255,0.05) 20%, rgba(255,255,255,0) 60%)',
        backgroundSize: '200% 100%',
        animation: 'shimmer 2s infinite linear',
        ...style
      }}
    />
  );
}

export function CardSkeleton() {
  return (
    <GlassCard className="p-5 flex flex-col gap-4">
      <div className="flex justify-between items-start">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-8 rounded-lg" />
      </div>
      <div className="flex flex-col gap-2 mt-4">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-3 w-24 mt-2" />
      </div>
    </GlassCard>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <GlassCard className="p-0 overflow-hidden">
      <div className="p-4 border-b border-white/10">
        <div className="flex justify-between">
          <Skeleton className="h-4 w-1/4" />
          <Skeleton className="h-4 w-1/4" />
          <Skeleton className="h-4 w-1/4" />
          <Skeleton className="h-4 w-1/4" />
        </div>
      </div>
      <div className="flex flex-col">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="p-4 border-b border-white/5 flex justify-between items-center">
            <Skeleton className="h-4 w-1/4 mr-4" />
            <Skeleton className="h-4 w-1/4 mr-4" />
            <Skeleton className="h-4 w-1/4 mr-4" />
            <Skeleton className="h-8 w-8 rounded-full" />
          </div>
        ))}
      </div>
    </GlassCard>
  );
}

export function ChartSkeleton() {
  return (
    <GlassCard className="p-5 h-[300px] flex flex-col">
      <Skeleton className="h-5 w-48 mb-6" />
      <div className="flex-1 w-full flex items-end gap-2 px-2">
        {Array.from({ length: 12 }).map((_, i) => (
          <Skeleton 
            key={i} 
            className="w-full rounded-t-sm" 
            style={{ height: `${20 + ((i * 37) % 80)}%` }} 
          />
        ))}
      </div>
    </GlassCard>
  );
}

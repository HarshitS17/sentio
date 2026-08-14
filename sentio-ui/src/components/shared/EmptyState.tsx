'use client';

import React from 'react';
import { GlassCard } from '@/components/ui/GlassCard';

export interface EmptyStateProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ title, description, icon, action, className = '' }: EmptyStateProps) {
  return (
    <GlassCard className={`flex flex-col items-center justify-center p-12 text-center ${className}`}>
      <div className="w-16 h-16 flex items-center justify-center rounded-full bg-white/5 text-[#94A3B8] mb-6 shadow-inner">
        {icon}
      </div>
      <h3 className="text-lg font-medium text-white mb-2">{title}</h3>
      <p className="text-sm text-[#94A3B8] max-w-sm mb-6 leading-relaxed">
        {description}
      </p>
      {action && (
        <div className="mt-2">
          {action}
        </div>
      )}
    </GlassCard>
  );
}

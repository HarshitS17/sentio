'use client';

import React from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { AlertCircle, RefreshCw } from 'lucide-react';

export interface ErrorStateProps {
  title: string;
  message: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({ title, message, onRetry, className = '' }: ErrorStateProps) {
  return (
    <GlassCard className={`border-red-500/20 bg-red-500/5 ${className}`}>
      <div className="flex items-start gap-4 p-4">
        <div className="p-2 rounded-full bg-red-500/10 text-red-500 flex-shrink-0">
          <AlertCircle className="w-6 h-6" />
        </div>
        <div className="flex-1">
          <h3 className="text-base font-medium text-white mb-1">{title}</h3>
          <p className="text-sm text-red-200/70 mb-4">{message}</p>
          
          {onRetry && (
            <button
              onClick={onRetry}
              className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-red-400 bg-red-500/10 hover:bg-red-500/20 rounded-md transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Try Again
            </button>
          )}
        </div>
      </div>
    </GlassCard>
  );
}

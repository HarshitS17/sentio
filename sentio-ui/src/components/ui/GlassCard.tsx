'use client';

import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';

export interface GlassCardProps extends HTMLMotionProps<'div'> {
  hoverEffect?: boolean;
  className?: string;
  children: React.ReactNode;
}

export function GlassCard({ hoverEffect = false, className = '', children, ...props }: GlassCardProps) {
  return (
    <motion.div
      className={`glass-card rounded-2xl p-6 ${className}`}
      whileHover={hoverEffect ? { y: -4 } : {}}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      {...props}
    >
      {children}
    </motion.div>
  );
}

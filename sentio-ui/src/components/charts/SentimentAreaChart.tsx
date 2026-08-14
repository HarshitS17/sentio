'use client';

import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

interface DataPoint {
  timestamp: string;
  [key: string]: string | number;
}

interface SentimentAreaChartProps {
  data: DataPoint[];
  series: {
    key: string;
    name: string;
    color: string;
  }[];
  height?: number;
  className?: string;
}

const GlassTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#101826]/80 backdrop-blur-md border border-white/10 p-4 rounded-xl shadow-xl">
        <p className="text-white font-medium mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={`item-${index}`} className="flex items-center gap-2 mb-1 last:mb-0">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-[#94A3B8] text-sm">{entry.name}:</span>
            <span className="text-white font-medium text-sm">{entry.value}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export function SentimentAreaChart({ data, series, height = 300, className = '' }: SentimentAreaChartProps) {
  return (
    <div style={{ height }} className={`w-full ${className}`}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
        >
          <defs>
            {series.map((s) => (
              <linearGradient key={s.key} id={`color${s.key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={s.color} stopOpacity={0.3} />
                <stop offset="95%" stopColor={s.color} stopOpacity={0} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" vertical={false} />
          <XAxis 
            dataKey="timestamp" 
            stroke="#94A3B8" 
            fontSize={12}
            tickLine={false}
            axisLine={false}
            dy={10}
          />
          <YAxis 
            stroke="#94A3B8" 
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => `${value}`}
          />
          <Tooltip content={<GlassTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.2)', strokeWidth: 1, strokeDasharray: '4 4' }} />
          {series.map((s) => (
            <Area
              key={s.key}
              type="monotone"
              dataKey={s.key}
              name={s.name}
              stroke={s.color}
              strokeWidth={2}
              fillOpacity={1}
              fill={`url(#color${s.key})`}
              activeDot={{ r: 4, strokeWidth: 0, fill: s.color }}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

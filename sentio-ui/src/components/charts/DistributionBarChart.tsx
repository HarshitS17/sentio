'use client';

import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell
} from 'recharts';

interface DistributionData {
  category: string;
  positive: number;
  neutral: number;
  negative: number;
}

interface DistributionBarChartProps {
  data: DistributionData[];
  height?: number;
  layout?: 'vertical' | 'horizontal';
  className?: string;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#101826]/80 backdrop-blur-md border border-white/10 p-3 rounded-xl shadow-xl">
        <p className="text-white font-medium mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={`item-${index}`} className="flex items-center justify-between gap-4 mb-1 last:mb-0">
            <div className="flex items-center gap-2">
              <div 
                className="w-2 h-2 rounded-full" 
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-[#94A3B8] text-sm capitalize">{entry.name}:</span>
            </div>
            <span className="text-white font-medium text-sm">{entry.value}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export function DistributionBarChart({ 
  data, 
  height = 300, 
  layout = 'horizontal',
  className = '' 
}: DistributionBarChartProps) {
  return (
    <div style={{ height }} className={`w-full ${className}`}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout={layout}
          margin={{ top: 10, right: 10, left: layout === 'vertical' ? 20 : -20, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" horizontal={layout === 'horizontal'} vertical={layout === 'vertical'} />
          {layout === 'horizontal' ? (
            <>
              <XAxis dataKey="category" stroke="#94A3B8" fontSize={12} tickLine={false} axisLine={false} dy={10} />
              <YAxis stroke="#94A3B8" fontSize={12} tickLine={false} axisLine={false} />
            </>
          ) : (
            <>
              <XAxis type="number" stroke="#94A3B8" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis dataKey="category" type="category" stroke="#94A3B8" fontSize={12} tickLine={false} axisLine={false} />
            </>
          )}
          <Tooltip cursor={{ fill: 'rgba(255,255,255,0.04)' }} content={<CustomTooltip />} />
          <Legend 
            wrapperStyle={{ paddingTop: '20px' }}
            iconType="circle"
          />
          <Bar dataKey="positive" name="Positive" stackId="a" fill="#22C55E" radius={layout === 'horizontal' ? [0, 0, 0, 0] : [0, 0, 0, 0]} />
          <Bar dataKey="neutral" name="Neutral" stackId="a" fill="#F59E0B" />
          <Bar dataKey="negative" name="Negative" stackId="a" fill="#EF4444" radius={layout === 'horizontal' ? [4, 4, 0, 0] : [0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

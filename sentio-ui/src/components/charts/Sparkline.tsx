'use client';

import React from 'react';
import { LineChart, Line, ResponsiveContainer, YAxis } from 'recharts';

interface SparklineProps {
  data: number[];
  color?: string;
  width?: number | string;
  height?: number | string;
  className?: string;
}

export function Sparkline({ 
  data, 
  color = '#3B82F6', 
  width = '100%', 
  height = 40,
  className = ''
}: SparklineProps) {
  const chartData = data.map((value, index) => ({ value, index }));
  const min = Math.min(...data);
  const max = Math.max(...data);

  return (
    <div style={{ width, height }} className={className}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <YAxis domain={[min, max]} hide />
          <Line
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2}
            dot={false}
            isAnimationActive={true}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

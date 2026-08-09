'use client';

import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface AcwrChartProps {
  history: { date: number; load: number }[];
}

export default function AcwrChart({ history }: AcwrChartProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart 
        data={history.map(h => ({ 
          name: `${new Date(h.date).getMonth() + 1}/${new Date(h.date).getDate()}`, 
          load: h.load 
        }))} 
        margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
      >
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} dy={10} />
        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} width={40} />
        <Tooltip 
          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
          labelStyle={{ fontSize: '12px', fontWeight: 'bold', color: '#334155', marginBottom: '4px' }}
          itemStyle={{ fontSize: '14px', fontWeight: '900', color: '#4f46e5' }}
        />
        <Line 
          type="monotone" 
          dataKey="load" 
          name="부하량" 
          stroke="#4f46e5" 
          strokeWidth={3} 
          dot={{ r: 4, fill: '#4f46e5', strokeWidth: 2, stroke: '#fff' }} 
          activeDot={{ r: 6 }} 
          animationDuration={1000} 
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

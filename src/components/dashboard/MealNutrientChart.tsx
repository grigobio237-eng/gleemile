'use client';

import React from 'react';
import { 
    PieChart, Pie, Cell, ResponsiveContainer, 
    Legend, Tooltip 
} from 'recharts';

interface MealNutrientChartProps {
    nutrients: {
        carbs: number;
        protein: number;
        fat: number;
    };
    advice?: string;
}

export default function MealNutrientChart({ nutrients, advice }: MealNutrientChartProps) {
    if (!nutrients) return null;

    const data = [
        { name: '탄수화물', value: nutrients.carbs || 0, color: '#0E3A3A' }, // chapter-accent
        { name: '단백질', value: nutrients.protein || 0, color: '#D4AF37' }, // reward-gold
        { name: '지방', value: nutrients.fat || 0, color: '#E5E7EB' }       // line
    ];


    return (
        <div className="bg-white p-6 rounded-[32px] border border-line shadow-xl shadow-obsidian/5 space-y-4">
            <div className="flex justify-between items-center">
                <h4 className="text-sm font-black text-obsidian uppercase tracking-widest">Nutrient Balance</h4>
                <div className="px-3 py-1 bg-mist rounded-full text-[10px] font-black italic text-slate uppercase">Latest Scan Analysis</div>
            </div>

            <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                        </Pie>
                        <Tooltip 
                            contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                            itemStyle={{ fontWeight: '800', fontSize: '12px' }}
                        />
                        <Legend 
                            verticalAlign="bottom" 
                            align="center"
                            iconType="circle"
                            formatter={(value) => <span className="text-xs font-bold text-slate ml-1">{value}</span>}
                        />
                    </PieChart>
                </ResponsiveContainer>
            </div>

            {advice && (
                <div className="p-4 bg-mist/50 rounded-2xl border border-line/50">
                    <p className="text-xs font-bold text-obsidian leading-relaxed italic">
                        "{advice}"
                    </p>
                </div>
            )}
        </div>
    );
}


import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Dumbbell, Utensils, Brain, Moon, Loader2 } from 'lucide-react';

interface AISolutionSectionProps {
    diagnosisResult: any; // Using any for flexibility with backend response structure
}

export function AISolutionSection({ diagnosisResult }: AISolutionSectionProps) {
    const solution = diagnosisResult?.aiSolution;
    const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);

    if (!diagnosisResult) return null;

    if (!solution) return null;

    const cards = [
        { icon: Dumbbell, title: "EXERCISE", color: "text-primary", bg: "bg-blue-50", content: solution.exercise },
        { icon: Utensils, title: "NUTRITION", color: "text-green-500", bg: "bg-green-50", content: solution.nutrition },
        { icon: Brain, title: "MINDSET", color: "text-secondary", bg: "bg-purple-50", content: solution.mindset },
        { icon: Moon, title: "SLEEP", color: "text-secondary", bg: "bg-indigo-50", content: solution.sleep },
    ];

    const renderContent = (content: any) => {
        if (!content) return null;
        if (typeof content === 'string') return content;
        if (typeof content === 'object') {
            // If AI returned structured object instead of string, try to join values
            return content.description || content.title || JSON.stringify(content);
        }
        return String(content);
    };

    return (
        <section className="py-12 w-full max-w-4xl mx-auto px-6">
            <div className="text-center mb-12">
                <h2 className="text-3xl font-black text-obsidian mb-4">YOUNIQLE PERSONAL SOLUTION</h2>
                <p className="text-obsidian text-lg max-w-2xl mx-auto">
                    {renderContent(solution.analysis)}
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {cards.map((card, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="bg-white rounded-[24px] md:rounded-3xl p-6 md:p-8 shadow-sm border border-line hover:shadow-md transition-shadow"
                    >
                        <div className="flex flex-row md:flex-col items-center md:items-start gap-4 md:gap-0 mb-4 md:mb-6">
                            <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl ${card.bg} ${card.color} flex items-center justify-center`}>
                                <card.icon className="w-5 h-5 md:w-6 md:h-6" />
                            </div>
                            <h3 className={`text-[10px] md:text-xs font-black tracking-widest md:mt-3 ${card.color}`}>{card.title}</h3>
                        </div>
                        <div className="text-obsidian text-sm md:text-base font-medium leading-relaxed break-keep">
                            {renderContent(card.content)}
                        </div>
                    </motion.div>
                ))}
            </div>

        </section>
    );
}


import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight, ShoppingBag, Wand2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ProductConciergeCardProps {
    productConcept: {
        name: string;
        reason: string;
        ingredients: string[];
    };
    onRequestCustom: () => void;
}

export function ProductConciergeCard({ productConcept, onRequestCustom }: ProductConciergeCardProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="group relative w-full max-w-2xl mx-auto mt-16 p-1 rounded-[32px] bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 overflow-hidden shadow-xl"
        >
            {/* Animated Gradient Background */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />

            <div className="bg-white/95 backdrop-blur-xl rounded-[28px] p-8 md:p-10 text-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 to-pink-500" />

                {/* Icon */}
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-indigo-50 text-secondary mb-6 shadow-sm group-hover:scale-110 transition-transform duration-300">
                    <Sparkles className="w-8 h-8" />
                </div>

                {/* Content */}
                <h3 className="text-sm font-bold text-secondary uppercase tracking-widest mb-2">YOUNIQLE PRODUCT CONCIERGE</h3>
                <h2 className="text-2xl md:text-3xl font-black text-obsidian mb-3">
                    "{typeof productConcept.name === 'object' ? (productConcept.name as any).title || (productConcept.name as any).name || JSON.stringify(productConcept.name) : productConcept.name}"
                </h2>
                <div className="text-obsidian mb-8 max-w-md mx-auto leading-relaxed">
                    {typeof productConcept.reason === 'object' ? (productConcept.reason as any).description || (productConcept.reason as any).reason || JSON.stringify(productConcept.reason) : productConcept.reason}
                    <br />
                    <span className="text-foreground/70 text-sm mt-2 block">
                        추천 성분/요소: {Array.isArray(productConcept.ingredients) ? productConcept.ingredients.join(', ') : String(productConcept.ingredients)}
                    </span>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <Button
                        variant="outline"
                        className="w-full sm:w-auto h-12 rounded-full border-line hover:bg-surface text-obsidian font-bold px-8"
                        onClick={() => window.open('/products', '_blank')}
                    >
                        <ShoppingBag className="w-4 h-4 mr-2" />
                        기존 상품 찾아보기
                    </Button>
                    <Button
                        onClick={onRequestCustom}
                        className="w-full sm:w-auto h-12 rounded-full bg-obsidian hover:bg-black text-white font-bold px-8 hover:shadow-lg hover:scale-[1.02] transition-all"
                    >
                        <Wand2 className="w-4 h-4 mr-2" />
                        이 제품 만들어주세요
                    </Button>
                </div>

                <p className="text-xs text-foreground/70 mt-6 font-medium">실제 요청이 많으면 gleemile 연구소에서 개발을 시작합니다.</p>
            </div>
        </motion.div>
    );
}

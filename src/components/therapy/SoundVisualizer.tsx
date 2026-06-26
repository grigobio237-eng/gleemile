'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export const SoundVisualizer = ({ isPlaying }: { isPlaying: boolean }) => {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Hydration mismatch avoidance: return a simplified placeholder during SSR
  if (!isMounted) {
    return <div className="relative w-full h-[400px] flex items-center justify-center overflow-hidden bg-transparent" />;
  }

  return (
    <div className="relative w-full h-[400px] flex items-center justify-center overflow-hidden">
      {/* Background Aurora-like Glows */}
      <motion.div
        animate={isPlaying ? {
          scale: [1, 1.2, 1],
          opacity: [0.1, 0.3, 0.1],
          rotate: [0, 90, 180, 270, 360],
        } : { opacity: 0.05 }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        className="absolute w-[600px] h-[600px] bg-chapter-accent/20 rounded-full blur-[120px]"
      />
      <motion.div
        animate={isPlaying ? {
          scale: [1.2, 1, 1.2],
          opacity: [0.1, 0.2, 0.1],
          rotate: [360, 270, 180, 90, 0],
        } : { opacity: 0.05 }}
        transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
        className="absolute w-[500px] h-[500px] bg-reward-gold/10 rounded-full blur-[100px]"
      />

      {/* Central Visualizer Bars */}
      <div className="relative flex items-end gap-1.5 h-32">
        {Array.from({ length: 48 }).map((_, i) => (
          <motion.div
            key={i}
            initial={{ height: 4 }}
            animate={isPlaying ? {
              height: [4, (Math.sin(i * 0.5) * 40) + 50 + (Math.random() * 20), 4],
              opacity: [0.3, 1, 0.3],
            } : { height: 4, opacity: 0.2 }}
            transition={{
              duration: 1 + (Math.sin(i) * 0.5 + 0.5), // Use deterministic delay
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.02,
            }}
            className="w-1 rounded-full bg-gradient-to-t from-chapter-accent via-chapter-accent/50 to-transparent shadow-lg shadow-chapter-accent/20"
          />
        ))}
      </div>

      {/* Floating Particles */}
      <div className="absolute inset-0 pointer-events-none">
        {Array.from({ length: 20 }).map((_, i) => (
          <motion.div
            key={i}
            initial={{ 
                x: (Math.cos(i) * 300), // Deterministic starting position to avoid mismatch if any
                y: (Math.sin(i) * 200),
                opacity: 0 
            }}
            animate={isPlaying ? {
              y: [0, -100, 0],
              x: [0, (Math.sin(i * 2) * 50), 0],
              opacity: [0, 0.5, 0],
            } : { opacity: 0 }}
            transition={{
              duration: 3 + (i % 5),
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.5,
            }}
            className="absolute left-1/2 top-1/2 w-1 h-1 bg-white rounded-full blur-[1px]"
          />
        ))}
      </div>
    </div>
  );
};

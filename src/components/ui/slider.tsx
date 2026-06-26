'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface SliderProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> {
  value: number[];
  onValueChange: (value: number[]) => void;
  max?: number;
  min?: number;
  step?: number;
}

const Slider = React.forwardRef<HTMLInputElement, SliderProps>(
  ({ className, value, onValueChange, max = 100, min = 0, step = 1, ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      onValueChange([parseFloat(e.target.value)]);
    };

    const percentage = ((value[0] - min) / (max - min)) * 100;
    const boundedPercentage = Math.max(0, Math.min(100, percentage));

    const containerRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        if (containerRef.current) {
            containerRef.current.style.setProperty('--slider-percentage', `${boundedPercentage}%`);
        }
    }, [boundedPercentage]);

    return (
      <div 
        ref={containerRef}
        className={cn(
          "relative flex w-full touch-none select-none items-center py-4", 
          className
        )}
      >
        <div className="relative h-1.5 w-full grow overflow-hidden rounded-full bg-white/10">
          <div 
            className="slider-fill absolute h-full bg-chapter-accent transition-all duration-300 shadow-[0_0_15px_rgba(255,255,255,0.3)] left-0 w-[var(--slider-percentage)]"
          />
        </div>
        <input
          type="range"
          ref={ref}
          min={min}
          max={max}
          step={step}
          value={value[0]}
          onChange={handleChange}
          className={cn(
            "absolute inset-0 w-full h-full opacity-0 cursor-pointer appearance-none z-10",
            "[&::-webkit-slider-runnable-track]:appearance-none",
            "[&::-webkit-slider-thumb]:appearance-none"
          )}
          {...props}
        />
        {/* Mirror Thumb for styling */}
        <div 
          className="slider-thumb absolute h-5 w-5 rounded-full border-2 border-white bg-chapter-accent shadow-xl transition-all duration-75 pointer-events-none z-0 left-[var(--slider-percentage)] -translate-x-1/2"
        />
      </div>
    );
  }
);

Slider.displayName = 'Slider';

export { Slider };

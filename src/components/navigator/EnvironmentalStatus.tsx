'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Sun, Cloud, CloudRain, Wind, Thermometer, Droplets, Zap } from 'lucide-react';

interface WeatherData {
  temp: number;
  condition: string;
  humidity: number;
  dust: string;
  city: string;
  icon: React.ReactNode;
}

export default function EnvironmentalStatus() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1단계: 스마트 템플릿 기반 (추후 API 연동)
    const fallbackDefaultWeather = () => {
      setWeather({
        temp: 18,
        condition: '구름 조금',
        humidity: 50,
        dust: '보통',
        city: '서울',
        icon: <Cloud className="w-5 h-5 text-foreground/70" />
      });
      setLoading(false);
    };

    const fetchEnvData = () => {
      // Feature Policy 또는 Permissions Policy 검사로 브라우저 경고 자체를 사전에 회피
      let isAllowed = true;
      try {
        if (typeof document !== 'undefined' && 'featurePolicy' in document) {
          isAllowed = (document as any).featurePolicy.allowsFeature('geolocation');
        }
      } catch (e) {
        isAllowed = false;
      }

      if (navigator.geolocation && isAllowed) {
        try {
          navigator.geolocation.getCurrentPosition(
            () => {
              // 위치 정보 성공 시 (샘플 데이터)
              setTimeout(() => {
                setWeather({
                  temp: 21,
                  condition: '쾌적한 맑음',
                  humidity: 45,
                  dust: '좋음',
                  city: '서울시 강남구',
                  icon: <Sun className="w-5 h-5 text-amber-400 fill-current" />
                });
                setLoading(false);
              }, 800);
            },
            () => {
              // 위치 정보 거부 시 기본값
              fallbackDefaultWeather();
            },
            { timeout: 5000 }
          );
        } catch (error) {
          fallbackDefaultWeather();
        }
      } else {
        fallbackDefaultWeather();
      }
    };

    fetchEnvData();
  }, []);

  if (loading) {
    return (
      <div className="flex gap-3 animate-pulse">
        <div className="h-8 w-32 bg-mist/50 rounded-full" />
        <div className="h-8 w-24 bg-mist/50 rounded-full" />
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-1.5 md:gap-3 flex-nowrap"
    >
      {/* Location Badge */}
      <div className="flex items-center gap-1 px-2 py-0.5 md:px-3 md:py-1.5 bg-white/80 backdrop-blur-md border border-line rounded-full shadow-sm flex-shrink-0">
        <MapPin className="w-2.5 h-2.5 md:w-3.5 md:h-3.5 text-primary" />
        <span className="text-[10px] md:text-[11px] font-black text-obsidian">{weather?.city.split(' ')[0]}</span>
      </div>

      {/* Weather Info */}
      <div className="flex items-center gap-2 px-2 py-0.5 md:px-4 md:py-1.5 bg-obsidian text-white rounded-full shadow-lg flex-shrink-0">
        <div className="flex items-center gap-1 border-r border-white/10 pr-1.5 md:pr-3">
          {weather?.icon}
          <span className="text-[10px] md:text-xs font-bold">{weather?.temp}°C</span>
        </div>
        
        <div className="hidden md:flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-mist/60">
          <div className="flex items-center gap-1.5">
            <Droplets className="w-3 h-3 text-sky-400" />
            <span>{weather?.humidity}%</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Wind className="w-3 h-3 text-emerald-400" />
            <span>미세먼지: {weather?.dust}</span>
          </div>
        </div>
      </div>

      {/* AI Context Badge */}
      <motion.div 
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 border border-primary/20 rounded-full flex-shrink-0"
      >
        <Zap className="w-3 h-3 text-primary fill-current" />
        <span className="text-[10px] font-black text-primary uppercase">루틴 최적화 중...</span>
      </motion.div>
    </motion.div>
  );
}

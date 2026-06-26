'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Locale, defaultLocale } from '@/i18n/config';

interface LanguageContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, params?: Record<string, any>) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(defaultLocale);
  const [messages, setMessages] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(true);

  // 로컬스토리지에서 언어 설정 로드
  useEffect(() => {
    const savedLocale = localStorage.getItem('locale') as Locale;
    if (savedLocale && ['ko', 'en', 'zh'].includes(savedLocale)) {
      setLocaleState(savedLocale);
    }
  }, []);

  // 언어가 변경되면 메시지 로드
  useEffect(() => {
    const loadMessages = async () => {
      try {
        setIsLoading(true);
        const msgs = await import(`@/locales/${locale}.json`);
        setMessages(msgs.default);
        setIsLoading(false);
      } catch (error) {
        console.error('Failed to load messages:', error);
        setIsLoading(false);
      }
    };
    loadMessages();
  }, [locale]);

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem('locale', newLocale);
  };

  // 번역 함수
  const t = (key: string, params?: Record<string, any>): string => {
    if (isLoading) {
      // 로딩 중일 때는 빈 문자열 또는 하위 키의 마지막 부분 반환 (예: customerCenter)
      // 또는 공식 가이드라인에 따른 기본값 처리를 선호할 수도 있음
      return '';
    }

    const keys = key.split('.');
    let value: any = messages;

    for (const k of keys) {
      if (value && typeof value === 'object') {
        value = value[k];
      } else {
        // 키를 찾지 못했을 때 가이드라인에 따라 빈 문자열 또는 기본값 반환
        // 여기서는 가이드라인을 준수하여 빈 문자열 반환 (필요시 특정 키에 대한 하드코딩된 fallback 가능)
        return '';
      }
    }

    if (typeof value !== 'string') {
      return '';
    }

    // 파라미터 치환
    if (params) {
      return value.replace(/\{(\w+)\}/g, (match, param) => {
        return params[param]?.toString() || match;
      });
    }

    return value;
  };

  return (
    <LanguageContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
}






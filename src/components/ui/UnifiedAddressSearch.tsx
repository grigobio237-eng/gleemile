'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, MapPin, AlertCircle, Wifi, WifiOff, Globe } from 'lucide-react';

export type AddressProvider = 'hybrid' | 'naver' | 'google' | 'public';

interface UnifiedAddressSearchProps {
  onAddressSelect: (data: {
    zonecode: string;
    address: string;
    addressEnglish: string;
    addressType: string;
    bname: string;
    buildingName: string;
  }) => void;
  disabled?: boolean;
  provider?: AddressProvider;
  placeholder?: string;
  className?: string;
}

/**
 * 프로젝트 전체에서 사용되는 통합 주소 검색 컴포넌트
 */
export default function UnifiedAddressSearch({
  onAddressSelect,
  disabled = false,
  provider = 'hybrid',
  placeholder = '주소를 검색하세요...',
  className = ''
}: UnifiedAddressSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [actualMethod, setActualMethod] = useState<'api' | 'local'>('api');

  // 온라인 상태 감지
  useEffect(() => {
    setIsOnline(navigator.onLine);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // 검색 수행
  const performSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      let results: any[] = [];
      let success = false;

      // 1. API 호출 시도 (Provider에 따라 분기)
      if (isOnline) {
        let endpoint = '/api/addresses/search';
        if (provider === 'google') endpoint = '/api/google/address';
        else if (provider === 'naver') endpoint = '/api/naver/address';

        try {
          const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query }),
          });

          if (response.ok) {
            const data = await response.json();
            if (data.success && data.results?.length > 0) {
              results = data.results;
              setActualMethod('api');
              success = true;
            }
          }
        } catch (e) {
          console.warn(`${provider} API failed, falling back to local search.`, e);
        }
      }

      // 2. 오프라인이거나 API 실패 시 로컬 검색 (국내 주소 한정)
      if (!success) {
        results = searchLocalDB(query);
        setActualMethod('local');
      }

      if (results.length > 0) {
        setSearchResults(results.slice(0, 10));
        setShowResults(true);
      } else {
        setError('검색 결과가 없습니다.');
      }
    } catch (err) {
      setError('주소 검색 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, [isOnline, provider]);

  // 로컬 폴백 데이터베이스 (최소한의 주요 지역)
  const searchLocalDB = (query: string) => {
    const db = [
      { zipcode: '06292', address: '서울특별시 강남구 테헤란로', bname: '역삼동' },
      { zipcode: '04524', address: '서울특별시 중구 세종대로', bname: '정동' },
      { zipcode: '05210', address: '서울특별시 강동구 명일동', bname: '명일동' },
      { zipcode: '48058', address: '부산광역시 해운대구 우동', bname: '우동' },
    ];
    const q = query.toLowerCase();
    return db.filter(item => item.address.includes(q) || item.bname.includes(q))
             .map(item => ({ zipCode: item.zipcode, address: item.address, bname: item.bname }));
  };

  const handleSelect = (result: any) => {
    onAddressSelect({
      zonecode: result.zipCode || '',
      address: result.address || '',
      addressEnglish: result.addressEnglish || '',
      addressType: 'R',
      bname: result.bname || '',
      buildingName: result.buildingName || '',
    });
    setShowResults(false);
    setSearchQuery('');
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && performSearch(searchQuery)}
            placeholder={placeholder}
            disabled={disabled || isLoading}
            className="pr-10"
          />
          {provider === 'google' && (
            <Globe className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground/70" />
          )}
        </div>
        <Button onClick={() => performSearch(searchQuery)} disabled={disabled || isLoading}>
          {isLoading ? <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" /> : <Search className="h-4 w-4" />}
        </Button>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-xs text-red-500 bg-red-50 p-2 rounded">
          <AlertCircle className="h-3 w-3" />
          {error}
        </div>
      )}

      {showResults && (
        <div className="absolute z-50 mt-1 w-full max-w-md bg-white border border-line rounded-lg shadow-xl overflow-hidden">
          <div className="p-2 bg-surface border-b flex justify-between items-center">
            <span className="text-[10px] font-bold text-foreground/70">ADDRESS RESULTS</span>
            <span className="flex items-center gap-1 text-[10px] text-foreground/70">
              {actualMethod === 'api' ? <Wifi className="h-2 w-2" /> : <WifiOff className="h-2 w-2" />}
              {actualMethod === 'api' ? 'CONNECTED' : 'LOCAL DB'}
            </span>
          </div>
          <ul className="max-h-60 overflow-y-auto divide-y divide-gray-100">
            {searchResults.map((res, i) => (
              <li key={i}>
                <button
                  onClick={() => handleSelect(res)}
                  className="w-full text-left p-3 hover:bg-blue-50 transition-colors flex items-start gap-3"
                >
                  <MapPin className="h-4 w-4 text-foreground/70 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="text-sm font-medium text-obsidian">{res.address}</div>
                    <div className="text-xs text-foreground/70 line-clamp-1">{res.addressEnglish || res.bname}</div>
                    <div className="text-[10px] text-primary mt-1 font-mono">{res.zipCode}</div>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

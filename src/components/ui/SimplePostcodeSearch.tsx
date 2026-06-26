'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, MapPin, AlertCircle } from 'lucide-react';

interface SimplePostcodeSearchProps {
  onAddressSelect: (data: {
    zonecode: string;
    address: string;
    addressEnglish: string;
    addressType: string;
    bname: string;
    buildingName: string;
  }) => void;
  disabled?: boolean;
}

export default function SimplePostcodeSearch({ onAddressSelect, disabled = false }: SimplePostcodeSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);

  // 확장된 주소 데이터베이스
  const addressDatabase = [
    // 강동구
    { zipcode: '05203', address: '서울특별시 강동구 고덕비즈밸리로 123', bname: '고덕동' },
    { zipcode: '05204', address: '서울특별시 강동구 고덕비즈밸리로 456', bname: '고덕동' },
    { zipcode: '05205', address: '서울특별시 강동구 고덕비즈밸리로 789', bname: '고덕동' },
    { zipcode: '05210', address: '서울특별시 강동구 명일동 123-45', bname: '명일동' },
    { zipcode: '05211', address: '서울특별시 강동구 명일동 456-78', bname: '명일동' },
    { zipcode: '05212', address: '서울특별시 강동구 명일동 789-12', bname: '명일동' },
    { zipcode: '05220', address: '서울특별시 강동구 상일동 123-45', bname: '상일동' },
    { zipcode: '05221', address: '서울특별시 강동구 상일동 456-78', bname: '상일동' },
    { zipcode: '05230', address: '서울특별시 강동구 암사동 123-45', bname: '암사동' },
    { zipcode: '05231', address: '서울특별시 강동구 암사동 456-78', bname: '암사동' },
    
    // 강남구
    { zipcode: '06292', address: '서울특별시 강남구 테헤란로 123', bname: '역삼동' },
    { zipcode: '06293', address: '서울특별시 강남구 테헤란로 456', bname: '역삼동' },
    { zipcode: '06294', address: '서울특별시 강남구 테헤란로 789', bname: '역삼동' },
    { zipcode: '06300', address: '서울특별시 강남구 논현동 123-45', bname: '논현동' },
    { zipcode: '06301', address: '서울특별시 강남구 논현동 456-78', bname: '논현동' },
    { zipcode: '06310', address: '서울특별시 강남구 신사동 123-45', bname: '신사동' },
    { zipcode: '06311', address: '서울특별시 강남구 신사동 456-78', bname: '신사동' },
    
    // 마포구
    { zipcode: '04066', address: '서울특별시 마포구 와우산로 123', bname: '상수동' },
    { zipcode: '04067', address: '서울특별시 마포구 와우산로 456', bname: '상수동' },
    { zipcode: '04068', address: '서울특별시 마포구 와우산로 789', bname: '상수동' },
    { zipcode: '04070', address: '서울특별시 마포구 홍대입구역 123-45', bname: '동교동' },
    { zipcode: '04071', address: '서울특별시 마포구 홍대입구역 456-78', bname: '동교동' },
    { zipcode: '04080', address: '서울특별시 마포구 연남동 123-45', bname: '연남동' },
    { zipcode: '04081', address: '서울특별시 마포구 연남동 456-78', bname: '연남동' },
    
    // 중구
    { zipcode: '04524', address: '서울특별시 중구 세종대로 123', bname: '정동' },
    { zipcode: '04525', address: '서울특별시 중구 세종대로 456', bname: '정동' },
    { zipcode: '04526', address: '서울특별시 중구 세종대로 789', bname: '정동' },
    { zipcode: '04530', address: '서울특별시 중구 명동 123-45', bname: '명동' },
    { zipcode: '04531', address: '서울특별시 중구 명동 456-78', bname: '명동' },
    { zipcode: '04540', address: '서울특별시 중구 을지로 123-45', bname: '을지로동' },
    { zipcode: '04541', address: '서울특별시 중구 을지로 456-78', bname: '을지로동' },
    
    // 송파구
    { zipcode: '05510', address: '서울특별시 송파구 올림픽로 123', bname: '신천동' },
    { zipcode: '05511', address: '서울특별시 송파구 올림픽로 456', bname: '신천동' },
    { zipcode: '05520', address: '서울특별시 송파구 잠실동 123-45', bname: '잠실동' },
    { zipcode: '05521', address: '서울특별시 송파구 잠실동 456-78', bname: '잠실동' },
    { zipcode: '05530', address: '서울특별시 송파구 문정동 123-45', bname: '문정동' },
    { zipcode: '05531', address: '서울특별시 송파구 문정동 456-78', bname: '문정동' },
    
    // 영등포구
    { zipcode: '07300', address: '서울특별시 영등포구 여의도동 123-45', bname: '여의도동' },
    { zipcode: '07301', address: '서울특별시 영등포구 여의도동 456-78', bname: '여의도동' },
    { zipcode: '07310', address: '서울특별시 영등포구 당산동 123-45', bname: '당산동' },
    { zipcode: '07311', address: '서울특별시 영등포구 당산동 456-78', bname: '당산동' },
    
    // 기타 주요 지역
    { zipcode: '03000', address: '서울특별시 종로구 세종대로 123', bname: '세종로' },
    { zipcode: '03001', address: '서울특별시 종로구 세종대로 456', bname: '세종로' },
    { zipcode: '03010', address: '서울특별시 종로구 청계천로 123-45', bname: '청계동' },
    { zipcode: '03011', address: '서울특별시 종로구 청계천로 456-78', bname: '청계동' },
  ];

  // 실시간 검색 함수
  const performSearch = (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setShowResults(false);
      setError('');
      return;
    }

    setError('');
    setIsLoading(true);

    const searchQuery = query.toLowerCase().trim();
    
    // 1. 정확한 매치 (동명, 도로명)
    let results = addressDatabase.filter(addr => 
      addr.bname === searchQuery ||
      addr.address.toLowerCase().includes(searchQuery)
    );

    // 2. 부분 매치 (동명의 일부)
    if (results.length === 0) {
      results = addressDatabase.filter(addr => 
        addr.bname.toLowerCase().includes(searchQuery) ||
        addr.address.toLowerCase().includes(searchQuery)
      );
    }

    // 3. 유사도 검색 (한글 초성, 자음/모음)
    if (results.length === 0) {
      results = addressDatabase.filter(addr => {
        const bname = addr.bname.toLowerCase();
        const address = addr.address.toLowerCase();
        
        // 한글 초성 검색
        const initials = getInitials(searchQuery);
        const bnameInitials = getInitials(bname);
        const addressInitials = getInitials(address);
        
        return bnameInitials.includes(initials) || 
               addressInitials.includes(initials) ||
               bname.includes(searchQuery) || 
               address.includes(searchQuery);
      });
    }

    // 4. 결과 정렬 (정확도 순)
    results = results.sort((a, b) => {
      const aScore = getMatchScore(a, searchQuery);
      const bScore = getMatchScore(b, searchQuery);
      return bScore - aScore;
    });

    if (results.length > 0) {
      setSearchResults(results.slice(0, 10)); // 최대 10개 결과
      setShowResults(true);
    } else {
      setError('검색 결과가 없습니다. 다른 검색어로 시도해보세요.');
    }
    setIsLoading(false);
  };

  const handleSearch = () => {
    if (!searchQuery.trim()) {
      setError('검색할 주소를 입력해주세요.');
      return;
    }
    performSearch(searchQuery);
  };

  // 실시간 검색 핸들러
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    
    // 이전 타이머 취소
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    
    // 300ms 후에 검색 실행
    const timeout = setTimeout(() => {
      performSearch(value);
    }, 300);
    
    setSearchTimeout(timeout);
  };

  // 한글 초성 추출 함수
  const getInitials = (text: string): string => {
    const initials = text.split('').map(char => {
      const code = char.charCodeAt(0);
      if (code >= 0xAC00 && code <= 0xD7A3) {
        return String.fromCharCode(((code - 0xAC00) / 28) / 21 + 0x1100);
      }
      return char;
    }).join('');
    return initials;
  };

  // 매치 점수 계산 함수
  const getMatchScore = (addr: any, query: string): number => {
    let score = 0;
    const q = query.toLowerCase();
    const bname = addr.bname.toLowerCase();
    const address = addr.address.toLowerCase();
    
    // 정확한 매치
    if (bname === q) score += 100;
    if (address.includes(q)) score += 50;
    
    // 부분 매치
    if (bname.includes(q)) score += 30;
    if (address.includes(q)) score += 20;
    
    // 초성 매치
    const initials = getInitials(q);
    const bnameInitials = getInitials(bname);
    if (bnameInitials.includes(initials)) score += 10;
    
    return score;
  };

  const handleSelectAddress = (result: any) => {
    onAddressSelect({
      zonecode: result.zipcode,
      address: result.address,
      addressEnglish: '',
      addressType: 'R',
      bname: result.bname,
      buildingName: '',
    });

    setShowResults(false);
    setSearchQuery('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // 컴포넌트 언마운트 시 타이머 정리
  React.useEffect(() => {
    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  }, [searchTimeout]);

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input
          value={searchQuery}
          onChange={handleInputChange}
          onKeyPress={handleKeyPress}
          placeholder="주소를 검색하세요 (예: 명일동, 고덕비즈밸리로)"
          disabled={disabled || isLoading}
          className="flex-1"
        />
        <Button
          onClick={handleSearch}
          disabled={disabled || isLoading}
          className="px-4"
        >
          {isLoading ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
          ) : (
            <Search className="h-4 w-4" />
          )}
        </Button>
      </div>
      
      {error && (
        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-2 rounded">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      {/* 검색 결과 */}
      {showResults && searchResults.length > 0 && (
        <div className="border border-line rounded-lg shadow-lg bg-white max-h-60 overflow-y-auto">
          <div className="p-3 border-b border-line">
            <h3 className="text-sm font-medium text-obsidian">
              검색 결과 ({searchResults.length}건)
            </h3>
          </div>
          <div className="divide-y divide-gray-100">
            {searchResults.map((result, index) => (
              <button
                key={index}
                onClick={() => handleSelectAddress(result)}
                className="w-full p-3 text-left hover:bg-surface focus:bg-surface focus:outline-none"
              >
                <div className="flex items-start space-x-2">
                  <MapPin className="h-4 w-4 text-foreground/70 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-obsidian">
                      {result.address}
                    </p>
                    <p className="text-xs text-foreground/70">
                      우편번호: {result.zipcode}
                    </p>
                    <p className="text-xs text-foreground/70">
                      {result.bname}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
      
      <div className="text-xs text-foreground/70 space-y-1">
        <div>💡 주소 검색이 안 되면 우편번호를 직접 입력해주세요.</div>
        <div>🔧 간단한 주소 검색 서비스를 사용합니다.</div>
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, MapPin } from 'lucide-react';

interface PostOfficeSearchProps {
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

interface PostOfficeResult {
  zipCode: string;
  address: string;
  addressDetail: string;
}

export default function PostOfficeSearch({ onAddressSelect, disabled = false }: PostOfficeSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<PostOfficeResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      alert('검색할 주소를 입력해주세요.');
      return;
    }

    setIsSearching(true);
    setSearchResults([]);

    try {
      // 우체국 API 호출 (실제로는 프록시 API를 통해 호출)
      const response = await fetch('/api/postcode/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: searchQuery }),
      });

      if (!response.ok) {
        throw new Error('주소 검색에 실패했습니다.');
      }

      const data = await response.json();
      setSearchResults(data.results || []);
      setShowResults(true);
    } catch (error) {
      console.error('우체국 주소 검색 오류:', error);
      alert('주소 검색 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectAddress = (result: PostOfficeResult) => {
    // 우체국 검색 결과를 카카오 우편번호 서비스 형식으로 변환
    onAddressSelect({
      zonecode: result.zipCode,
      address: result.address,
      addressEnglish: '', // 우체국 API에서는 영문 주소 제공 안함
      addressType: 'R', // 도로명 주소로 가정
      bname: result.addressDetail,
      buildingName: '',
    });

    // 검색 결과 숨기기
    setShowResults(false);
    setSearchQuery('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="relative">
      <div className="flex gap-2">
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="주소를 검색하세요 (예: 고덕비즈밸리로)"
          disabled={disabled}
          className="flex-1"
        />
        <Button
          onClick={handleSearch}
          disabled={disabled || isSearching}
          className="px-4"
        >
          {isSearching ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
          ) : (
            <Search className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* 검색 결과 */}
      {showResults && searchResults.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-line rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
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
                      우편번호: {result.zipCode}
                    </p>
                    {result.addressDetail && (
                      <p className="text-xs text-foreground/70">
                        {result.addressDetail}
                      </p>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 검색 결과가 없는 경우 */}
      {showResults && searchResults.length === 0 && !isSearching && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-line rounded-lg shadow-lg z-50">
          <div className="p-4 text-center text-foreground/70">
            <MapPin className="h-8 w-8 mx-auto mb-2 text-gray-300" />
            <p className="text-sm">검색 결과가 없습니다.</p>
            <p className="text-xs text-foreground/70 mt-1">
              다른 검색어로 시도해보세요.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import { useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';

interface PostcodeSearchProps {
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

declare global {
  interface Window {
    daum: any;
  }
}

export default function PostcodeSearch({ onAddressSelect, disabled = false }: PostcodeSearchProps) {
  const scriptRef = useRef<HTMLScriptElement | null>(null);

  useEffect(() => {
    // 카카오 우편번호 서비스 스크립트 로드
    const loadScript = () => {
      if (window.daum && window.daum.Postcode) {
        return;
      }

      if (scriptRef.current) {
        return;
      }

      const script = document.createElement('script');
      script.src = '//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js';
      script.async = true;
      script.onload = () => {
        console.log('카카오 우편번호 서비스 로드 완료');
      };
      script.onerror = () => {
        console.error('카카오 우편번호 서비스 로드 실패');
      };

      document.head.appendChild(script);
      scriptRef.current = script;
    };

    loadScript();

    return () => {
      if (scriptRef.current) {
        document.head.removeChild(scriptRef.current);
        scriptRef.current = null;
      }
    };
  }, []);

  const handleSearch = () => {
    // 카카오 우편번호 서비스가 차단된 경우 대체 방법 제공
    if (!window.daum || !window.daum.Postcode) {
      alert('우편번호 서비스를 불러오는 중입니다. 잠시 후 다시 시도해주세요.');
      return;
    }

    try {
      new window.daum.Postcode({
        oncomplete: function (data: any) {
          console.log('주소 선택 완료:', data);
          // 주소 정보를 부모 컴포넌트로 전달
          onAddressSelect({
            zonecode: data.zonecode,
            address: data.address,
            addressEnglish: data.addressEnglish || '',
            addressType: data.addressType,
            bname: data.bname || '',
            buildingName: data.buildingName || '',
          });
        },
        onclose: function (state: string) {
          // 팝업이 닫힐 때 상태 확인
          if (state === 'COMPLETE_CLOSE') {
            console.log('우편번호 검색이 완료되었습니다.');
          } else if (state === 'FORCE_CLOSE') {
            console.log('우편번호 검색이 강제로 닫혔습니다.');
          }
        },
        onresize: function (size: any) {
          console.log('팝업 크기 조정:', size);
        },
        width: '100%',
        height: '100%',
        maxSuggestItems: 5,
        showMoreHName: true,
        hideMapBtn: false,
        hideEngBtn: false,
        alwaysShowEngAddr: false,
        submitMode: false,
        useBanner: true,
        useSuggest: true,
        // 팝업이 제대로 표시되도록 설정 추가
        popupName: 'postcodePopup',
        popupKey: 'postcodePopup',
        theme: {
          bgColor: '#ffffff',
          searchBgColor: '#ffffff',
          contentBgColor: '#ffffff',
          pageBgColor: '#ffffff',
          textColor: '#333333',
          queryTextColor: '#222222',
          postcodeTextColor: '#fa4256',
          emphTextColor: '#008bd3',
          outlineColor: '#e0e0e0'
        }
      }).open({
        q: '', // 초기 검색어
        autoClose: false, // 자동 닫기 비활성화
      });
    } catch (error) {
      console.error('우편번호 서비스 오류:', error);
      alert('우편번호 서비스에 연결할 수 없습니다. 네트워크 연결을 확인해주세요.\n\n대안: 우편번호를 직접 입력하거나 다른 주소 검색 서비스를 이용해주세요.');
    }
  };

  const handleAlternativeSearch = () => {
    // 우체국 우편번호 서비스로 대체
    const newWindow = window.open(
      'https://www.epost.go.kr/search/zipcode/areacdAddressDown.jsp',
      'postcode',
      'width=500,height=600,scrollbars=yes,resizable=yes'
    );

    if (newWindow) {
      newWindow.focus();
    } else {
      alert('팝업이 차단되었습니다. 팝업 차단을 해제하고 다시 시도해주세요.');
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      onClick={handleSearch}
      disabled={disabled}
      className="flex items-center justify-center space-x-2 whitespace-nowrap"
    >
      <Search className="h-4 w-4" />
      <span>주소 검색</span>
    </Button>
  );
}

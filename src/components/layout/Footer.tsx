'use client';

import Link from 'next/link';
import CharacterImage from '@/components/ui/CharacterImage';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import ClientOnly from '@/components/common/ClientOnly';

interface PublicSettings {
  siteName: string;
  siteDescription: string;
  companyInfo: {
    companyName: string;
    businessNumber: string;
    ceoName: string;
    businessType: string;
    businessStatus: string;
  };
  businessRegistration: {
    registrationNumber: string;
    businessAddress: string;
    businessAddressDetail: string;
    businessPhone: string;
    businessEmail: string;
  };
  ecommerceRegistration: {
    reportNumber: string;
    reportAuthority: string;
  };
  contactInfo: {
    customerServicePhone: string;
    customerServiceEmail: string;
    address: string;
    addressDetail: string;
    postalCode: string;
  };
  legalInfo: {
    privacyPolicyUrl: string;
    termsOfServiceUrl: string;
  };
}

export default function Footer() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [settings, setSettings] = useState<PublicSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/settings');
      if (response.ok) {
        const data = await response.json();
        setSettings(data.settings);
      }
    } catch (error) {
      console.error('설정 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProtectedLink = (e: React.MouseEvent) => {
    if (!['admin', 'superadmin'].includes((session?.user as any)?.role)) {
      e.preventDefault();
      alert('관리자 권한이 없습니다.');
    }
  };

  // 모바일에서 푸터를 표시할 경로들
  const showFooterOnMobilePaths = [
    '/membership',
    '/membership/shop',
  ];

  // 현재 경로가 푸터 표시 경로인지 확인
  const shouldShowFooterOnMobile = showFooterOnMobilePaths.some(path =>
    pathname === path || pathname?.startsWith(path + '/')
  );

  // 기본값 설정 (실제 사업자 정보 반영)
  const defaultSettings: PublicSettings = {
    siteName: 'Youniqle',
    siteDescription: '데이터 기반 프리미엄 회복 큐레이션',
    companyInfo: {
      companyName: '주식회사 사피에넷 (Sapienet)',
      businessNumber: '838-88-02527', // 예시 기반 실제값 (확인 필요시 업데이트 가능)
      ceoName: '장범진',
      businessType: '통신판매업 / 바이오 헬스케어',
      businessStatus: '영업중'
    },
    businessRegistration: {
      registrationNumber: '838-88-02527',
      businessAddress: '서울특별시 강동구 고덕비즈밸리로 26, 6층(고덕동, 고덕비즈밸리)',
      businessAddressDetail: '',
      businessPhone: '-',
      businessEmail: 'contact@sapienet.co.kr'
    },
    ecommerceRegistration: {
      reportNumber: '2023-서울강동-1614',
      reportAuthority: '서울특별시 강동구청'
    },
    contactInfo: {
      customerServicePhone: '-',
      customerServiceEmail: 'contact@youniqle.co.kr',
      address: '서울특별시 강동구 고덕비즈밸리로 26',
      addressDetail: '7층(고덕동, 고덕비즈밸리)',
      postalCode: '05282'
    },
    legalInfo: {
      privacyPolicyUrl: '/privacy',
      termsOfServiceUrl: '/terms'
    }
  };

  const currentSettings = settings || defaultSettings;

  return (
    <footer className={`bg-obsidian text-slate border-t border-line/10 py-10 ${shouldShowFooterOnMobile ? '' : 'hidden md:block'}`}>
      <div className="container mx-auto px-6 max-w-6xl">
        {/* Re-engagement Section (Step 7) */}
        <div className="py-16 border-b border-line/10 flex flex-col md:flex-row items-center justify-between gap-12">
          <div className="space-y-4 text-center md:text-left">
            <div className="inline-flex items-center px-2 py-0.5 rounded-md bg-chapter-accent/20 text-chapter-accent text-[10px] font-black uppercase tracking-widest mb-2">
              Stay Re-connected
            </div>
            <h3 className="text-2xl md:text-3xl font-black text-white tracking-tight">다음에 또 만나면<br />더 정확한 피드백을 드려요</h3>
            <p className="text-gray-500 text-sm font-medium">데이터가 쌓일수록 당신의 회복 플랜은 더 정교해집니다.</p>
          </div>
          <div className="w-full max-w-md space-y-4">
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="이메일 주소를 입력하세요"
                className="flex-1 h-14 bg-white/5 border border-white/10 rounded-2xl px-6 text-white text-sm focus:outline-none focus:ring-2 focus:ring-chapter-accent transition-all"
              />
              <button className="h-14 px-8 bg-chapter-accent text-white font-black text-sm rounded-2xl hover:bg-chapter-accent/90 transition-all shadow-lg shadow-chapter-accent/20 whitespace-nowrap">
                알림 받기
              </button>
            </div>
            <p className="text-[10px] text-gray-600 text-center md:text-left">
              구독 시 <Link href="/privacy" className="font-bold">개인정보처리방침</Link>에 동의하는 것으로 간주됩니다.
            </p>
          </div>
        </div>

        {/* Top Section: Navigation Links */}
        <div className="flex flex-wrap items-center gap-x-8 gap-y-3 py-8 border-b border-line/5 text-[13px]">
          <Link href="/trainer" onClick={handleProtectedLink} className="text-gray-400 hover:text-white transition-colors">트레이너</Link>
          <Link href="/products/shop" onClick={handleProtectedLink} className="text-gray-400 hover:text-white transition-colors">gleemile 스토어</Link>
          <Link href="/community" onClick={handleProtectedLink} className="text-gray-400 hover:text-white transition-colors">커뮤니티</Link>
          <Link href="/sitemap" className="text-gray-400 hover:text-white transition-colors">사이트맵</Link>
        </div>

        {/* Middle Section: Legal Links & Copyright */}
        <div className="flex flex-wrap items-center justify-between gap-6 pt-6">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[13px] font-medium">
            <Link href={currentSettings.legalInfo.termsOfServiceUrl} className="text-gray-400 hover:text-white transition-colors">이용약관</Link>
            <Link href={currentSettings.legalInfo.privacyPolicyUrl} className="text-white hover:opacity-80">개인정보처리방침</Link>
            <Link href="/support/inquiry" onClick={handleProtectedLink} className="text-gray-400 hover:text-white transition-colors">고객센터</Link>
          </div>
          <div className="text-gray-600 text-[11px] tracking-tight">
            <span className="flex items-center gap-1">
              © <ClientOnly fallback={<span>2026</span>}>{new Date().getFullYear()}</ClientOnly> {currentSettings.siteName}. All rights reserved.
            </span>
          </div>
        </div>

        {/* Bottom Section: Company Details (Subtle) */}
        <div className="mt-8 pt-8 border-t border-line/5">
          <div className="flex flex-wrap gap-x-6 gap-y-1.5 text-[11px] text-gray-500/60 leading-relaxed font-light">
            <span className="text-gray-500/80 font-medium">상호명: {currentSettings.companyInfo.companyName}</span>
            <span>대표이사: {currentSettings.companyInfo.ceoName}</span>
            <span>사업자등록번호: {currentSettings.businessRegistration.registrationNumber}</span>
            <span>통신판매업신고: {currentSettings.ecommerceRegistration.reportNumber}</span>
            <span className="w-full lg:w-auto">주소: {currentSettings.businessRegistration.businessAddress}</span>
            <span>고객센터: {currentSettings.contactInfo.customerServiceEmail}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}


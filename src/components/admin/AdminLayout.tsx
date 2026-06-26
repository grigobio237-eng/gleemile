'use client';

import { useState, useEffect, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getAdminApiUrl, logEnvironmentInfo } from '@/lib/apiUtils';
import {
  LayoutDashboard,
  Users,
  Package,
  FileText,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  Shield,
  Bell,
  CheckCircle,
  Plus,
  Search,
  Store,
  ShoppingCart,
  Globe,
  Mail,
  Tag,
  Megaphone,
  TrendingUp,
  Bot,
  Zap,
  Target,
  Clock,
  DollarSign,
  MessageCircle,
  Sparkles,
  Building2
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import CharacterImage from '@/components/ui/CharacterImage';
import Image from 'next/image';

interface AdminLayoutProps {
  children: ReactNode;
}

interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: string;
  grade: string;
  avatar?: string;
}

const navigationItems = [
  {
    name: '대시보드',
    href: '/admin/dashboard',
    icon: LayoutDashboard,
    description: '전체 현황 및 통계'
  },
  {
    name: '회원 관리',
    href: '/admin/users',
    icon: Users,
    description: '사용자 정보 및 활동 모니터링'
  },
  {
    name: '사전 문진 관리',
    href: '/admin/consultations',
    icon: Target,
    description: '고객 사전 문진(Recovery Design) 리포트'
  },
  {
    name: '병원 관리',
    href: '/admin/hospitals',
    icon: Building2,
    description: '제휴 병원 및 고유 코드 관리'
  },
  {
    name: '⚽ 모임 팀 관리',
    href: '/admin/mile/teams',
    icon: Shield,
    description: '모임 팀 승인 및 관리'
  },
  {
    name: '📊 모임 플랫폼 통계',
    href: '/admin/mile/stats',
    icon: Shield,
    description: '모임 플랫폼 전체 현황 및 통계'
  },
  {
    name: '파트너 관리',
    href: '/admin/partners',
    icon: Store,
    description: '파트너 승인 및 관리'
  },
  {
    name: '정산 관리',
    href: '/admin/settlements',
    icon: TrendingUp,
    description: '파트너 정산 관리 및 처리'
  },
  {
    name: '주문 관리',
    href: '/admin/orders',
    icon: ShoppingCart,
    description: '전체 주문 관리 및 처리'
  },
  {
    name: '환불/교환',
    href: '/admin/refunds',
    icon: Clock,
    description: '환불 및 교환 요청 관리'
  },
  {
    name: '문의 관리',
    href: '/admin/inquiries',
    icon: MessageCircle,
    description: '고객 문의 관리 및 답변'
  },
  {
    name: 'FAQ 관리',
    href: '/admin/faq',
    icon: FileText,
    description: 'FAQ 작성 및 관리'
  },
  {
    name: '포인트 관리',
    href: '/admin/points',
    icon: DollarSign,
    description: '포인트 시스템 관리 및 규칙'
  },
  {
    name: '공지사항',
    href: '/admin/notices',
    icon: Megaphone,
    description: '공지사항 작성 및 관리'
  },
  {
    name: '상품 관리',
    href: '/admin/products',
    icon: Package,
    description: '상품 등록 및 관리',
    subItems: [
      {
        name: '상품 목록',
        href: '/admin/products',
        icon: Package,
        description: '전체 상품 목록'
      },
      {
        name: '상품 승인 관리',
        href: '/admin/products/approval',
        icon: CheckCircle,
        description: '파트너 상품 승인/거부'
      },
      {
        name: '새 상품 등록',
        href: '/admin/products/new',
        icon: Plus,
        description: '관리자 직접 상품 등록'
      },
      {
        name: 'gleemile 상세페이지 빌더',
        href: '/admin/ai-builder',
        icon: Sparkles,
        description: 'gleemile 싱크클럽 전용 빌더'
      }
    ]
  },
  {
    name: '마케팅',
    href: '/admin/marketing',
    icon: TrendingUp,
    description: '뉴스레터, 쿠폰, 프로모션 관리',
    subItems: [
      {
        name: '뉴스레터',
        href: '/admin/newsletter',
        icon: Mail,
        description: '뉴스레터 구독자 관리'
      },
      {
        name: '쿠폰',
        href: '/admin/coupons',
        icon: Tag,
        description: '쿠폰 생성 및 관리'
      },
      {
        name: '프로모션',
        href: '/admin/promotions',
        icon: Megaphone,
        description: '프로모션 관리'
      },
      {
        name: '알림',
        href: '/admin/notifications',
        icon: Bell,
        description: '알림 관리',
        subItems: [
          {
            name: '알림 관리',
            href: '/admin/notifications',
            icon: Bell,
            description: '알림 발송 및 관리'
          },
          {
            name: '템플릿 관리',
            href: '/admin/notifications/templates',
            icon: FileText,
            description: '알림 템플릿 생성 및 관리'
          },
          {
            name: '스케줄 관리',
            href: '/admin/notifications/schedules',
            icon: Clock,
            description: '예약 알림 스케줄 관리'
          },
          {
            name: '알림 분석',
            href: '/admin/notifications/analytics',
            icon: BarChart3,
            description: '알림 성과 분석'
          }
        ]
      },
      {
        name: '자동화',
        href: '/admin/automation',
        icon: Bot,
        description: '마케팅 자동화 규칙 관리'
      },
      {
        name: '개인화',
        href: '/admin/personalization',
        icon: Target,
        description: '사용자 개인화 및 추천 시스템'
      },
      {
        name: '추천 관리',
        href: '/admin/recommendations',
        icon: BarChart3,
        description: '추천 시스템 성과 분석 및 관리'
      }
    ]
  },
  {
    name: '콘텐츠 관리',
    href: '/admin/content',
    icon: FileText,
    description: '커뮤니티 글 및 동영상 관리'
  },
  {
    name: '자동 영상 만들기',
    href: '/admin/auto-video',
    icon: Sparkles,
    description: 'gleemile 기반 유튜브 영상 자동 생성'
  },
  {
    name: '분석',
    href: '/admin/analytics',
    icon: BarChart3,
    description: '사용자 활동 분석'
  },
  {
    name: '설정',
    href: '/admin/settings',
    icon: Settings,
    description: '시스템 설정',
    subItems: [
      {
        name: '약관 및 보안 관리',
        href: '/admin/settings/policies',
        icon: Shield,
        description: '동의서 및 약관 버전 관리'
      }
    ]
  }
];

interface NotificationData {
  pendingPartners: number;
  pendingConcierge: number;
  pendingInquiries: number;
  total: number;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [notifications, setNotifications] = useState<NotificationData>({ pendingPartners: 0, pendingConcierge: 0, pendingInquiries: 0, total: 0 });
  const [language, setLanguage] = useState('ko');
  const [imgError, setImgError] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // /admin 루트 경로로 접근 시 대기 없이 바로 로그인 페이지로 리다이렉트
    if (pathname === '/admin') {
      setLoading(false);
      router.replace('/admin/login');
      return;
    }
    checkAdminAuth();
  }, [pathname, router]);

  useEffect(() => {
    if (admin) {
      fetchNotifications();
      // 30초마다 알림 업데이트
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [admin]);

  const fetchNotifications = async () => {
    try {
      // 유틸리티 함수를 사용하여 API URL 생성
      const apiUrl = getAdminApiUrl('/notifications');

      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setNotifications(data);
      } else {
        console.error('Failed to fetch notifications, status:', response.status);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  };

  const checkAdminAuth = async () => {
    try {
      // 환경 정보 로깅
      logEnvironmentInfo();

      // Use relative URL for more reliable same-origin requests in dev environment
      const apiUrl = '/api/admin/auth/verify';

      console.log('--- Admin Auth Check Start ---');
      console.log('Path:', pathname);

      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        },
        credentials: 'include'
      });


      console.log('Admin auth response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('Admin auth success:', data.user?.email);
        setAdmin(data.user);
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Admin auth failed:', errorData);
        // 관리자 권한이 없으면 로그인 페이지로 리다이렉트
        router.push('/admin/login');
      }
    } catch (error) {
      console.error('Admin auth check failed:', error);
      // 네트워크 에러나 타임아웃의 경우에도 로그인 페이지로 리다이렉트
      router.push('/admin/login');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      // 유틸리티 함수를 사용하여 API URL 생성
      const apiUrl = getAdminApiUrl('/auth/logout');

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (response.ok) {
        setAdmin(null);
        router.push('/admin/login');
      } else {
        console.error('Logout failed with status:', response.status);
        // 로그아웃 실패해도 로그인 페이지로 이동
        setAdmin(null);
        router.push('/admin/login');
      }
    } catch (error) {
      console.error('Logout failed:', error);
      // 에러가 발생해도 로그인 페이지로 이동
      setAdmin(null);
      router.push('/admin/login');
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // 검색 기능 구현 (추후 확장)
      console.log('Search:', searchQuery);
    }
  };

  const handleLanguageChange = (newLanguage: string) => {
    setLanguage(newLanguage);
    // 언어 변경 로직을 여기에 추가할 수 있습니다
    console.log('Language changed to:', newLanguage);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="h-8 w-8 text-primary animate-spin" />
          </div>
          <p className="text-text-secondary">관리자 권한 확인 중...</p>
        </div>
      </div>
    );
  }

  if (!admin) {
    return null; // 리다이렉트 중
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between p-6 border-b">
            <Link href="/admin/dashboard" className="flex items-center space-x-3">
              <div className="relative h-8 w-8">
                <CharacterImage
                  src="/character/youniqle-1.png"
                  alt="관리자 로고"
                  fill
                  className="object-contain"
                  sizes="32px"
                />
              </div>
              <div>
                <span className="text-lg font-bold text-text-primary">Admin</span>
                <div className="text-xs text-text-secondary">grigobio.co.kr</div>
              </div>
            </Link>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Admin Info */}
          <div className="p-4 border-b bg-primary/5">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                {admin.avatar && !imgError ? (
                  <Image width={800} height={800} style={{ width: '100%', height: '100%', objectFit: 'inherit' }} unoptimized                     src={admin.avatar}
                    alt={admin.name}
                    className="w-10 h-10 rounded-full object-cover"
                    onError={() => setImgError(true)}
                  />
                ) : (
                  <Shield className="h-5 w-5 text-primary" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-text-primary truncate">
                  {admin.name}
                </p>
                <p className="text-xs text-text-secondary truncate">
                  {admin.email}
                </p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const safePathname = pathname || '';
              const isActive = safePathname === item.href || (item.subItems && item.subItems.some(sub => safePathname === sub.href));
              const isPartnersMenu = item.href === '/admin/partners';
              const isInquiriesMenu = item.href === '/admin/inquiries';

              const showNotification =
                (isPartnersMenu && notifications.pendingPartners > 0) ||
                (isInquiriesMenu && notifications.pendingInquiries > 0);

              const badgeCount =
                isPartnersMenu ? notifications.pendingPartners :
                  (isInquiriesMenu ? notifications.pendingInquiries : 0);

              const hasSubItems = item.subItems && item.subItems.length > 0;

              return (
                <div key={item.name} className="space-y-1">
                  <Link
                    href={item.href}
                    className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive
                      ? 'bg-primary text-white'
                      : 'text-text-secondary hover:text-text-primary hover:bg-gray-100'
                      }`}
                    onClick={() => !hasSubItems && setSidebarOpen(false)}
                  >
                    <div className="relative">
                      <Icon className="h-5 w-5" />
                      {showNotification && (
                        <Badge
                          variant="destructive"
                          className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center text-xs p-0 min-w-[20px]"
                        >
                          {badgeCount}
                        </Badge>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span>{item.name}</span>
                        {showNotification && (
                          <Badge
                            variant="destructive"
                            className={`text-xs ${isActive ? 'bg-red-500 text-white' : 'bg-red-500 text-white'
                              }`}
                          >
                            {badgeCount}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </Link>

                  {/* Sub Items */}
                  {hasSubItems && (isActive || (pathname && pathname.startsWith(item.href))) && item.subItems && (
                    <div className="ml-9 space-y-1 mt-1">
                      {item.subItems.map((subItem) => {
                        const SubIcon = subItem.icon;
                        const isSubActive = pathname === subItem.href;
                        return (
                          <Link
                            key={subItem.href}
                            href={subItem.href}
                            className={`flex items-center space-x-2 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${isSubActive
                              ? 'text-primary bg-primary/5'
                              : 'text-text-secondary hover:text-text-primary hover:bg-surface'
                              }`}
                            onClick={() => setSidebarOpen(false)}
                          >
                            <SubIcon className="h-4 w-4" />
                            <span>{subItem.name}</span>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>

          {/* Language Selection */}
          <div className="p-4 border-t">
            <div className="flex items-center space-x-3 mb-3">
              <Globe className="h-4 w-4 text-text-secondary" />
              <select
                value={language}
                onChange={(e) => handleLanguageChange(e.target.value)}
                className="flex-1 text-sm bg-transparent border-none outline-none text-text-secondary focus:text-text-primary"
                aria-label="언어 선택"
              >
                <option value="ko">한국어</option>
                <option value="en">English</option>
                <option value="zh">中文</option>
              </select>
            </div>

            {/* Logout */}
            <Button
              variant="ghost"
              onClick={handleLogout}
              className="w-full justify-start text-text-secondary hover:text-red-600 hover:bg-red-50"
            >
              <LogOut className="h-5 w-5 mr-3" />
              로그아웃
            </Button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:ml-64">
        {/* Mobile menu button */}
        <div className="lg:hidden p-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>

        {/* Page content */}
        <main className="p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

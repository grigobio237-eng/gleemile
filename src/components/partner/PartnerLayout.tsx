'use client';

import { useState, useEffect, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  FileText,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  Store,
  Bell,
  Search,
  Warehouse,
  Clock,
  AlertCircle,
  DollarSign,
  Megaphone,
  Globe,
  RotateCcw,
  Sparkles,
  Palette
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import CharacterImage from '@/components/ui/CharacterImage';
import Image from 'next/image';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface PartnerLayoutProps {
  children: ReactNode;
}

interface Partner {
  id: string;
  email: string;
  name: string;
  role: string;
  partnerStatus: string;
  partnerType?: string;
  businessName?: string;
  commissionRate: number;
  partnerStats?: {
    totalProducts: number;
    totalOrders: number;
    totalRevenue: number;
    totalCommission: number;
  };
  avatar?: string;
}

interface Notification {
  id: string;
  type: 'order' | 'stock' | 'payment' | 'system';
  title: string;
  message: string;
  createdAt: string;
  isRead: boolean;
  link?: string;
}

const navigationItems = [
  {
    name: '대시보드',
    href: '/partner/dashboard',
    icon: LayoutDashboard,
    description: '매출 통계 및 현황'
  },
  {
    name: '상품 관리',
    href: '/partner/products',
    icon: Package,
    description: '내 상품 등록 및 관리'
  },
  {
    name: '주문 관리',
    href: '/partner/orders',
    icon: ShoppingCart,
    description: '주문 처리 및 배송 관리'
  },
  {
    name: '환불/교환',
    href: '/partner/returns',
    icon: RotateCcw,
    description: '환불·교환 요청 처리'
  },
  {
    name: '재고 관리',
    href: '/partner/inventory',
    icon: Warehouse,
    description: '상품 재고 현황 및 관리'
  },
  {
    name: '정산 내역',
    href: '/partner/settlements',
    icon: DollarSign,
    description: '월별 정산 내역 및 수수료'
  },
  {
    name: '콘텐츠 관리',
    href: '/partner/content',
    icon: FileText,
    description: '커뮤니티 글 및 동영상'
  },
  {
    name: '매출 분석',
    href: '/partner/analytics',
    icon: BarChart3,
    description: '상세 매출 분석'
  },
  {
    name: 'gleemile 상세페이지 빌더',
    href: '/partner/ai-builder',
    icon: Sparkles,
    description: 'gleemile 싱크클럽 전용 빌더'
  },
  {
    name: '설정',
    href: '/partner/settings',
    icon: Settings,
    description: '파트너 설정'
  }
];

export default function PartnerLayout({ children }: PartnerLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [partner, setPartner] = useState<Partner | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [language, setLanguage] = useState('ko');
  const [unreadCount, setUnreadCount] = useState(0);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // 파트너 대시보드 접근 시 기존 토큰 삭제 후 새로 인증
    document.cookie = 'partner-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    console.log('파트너 대시보드 접근, 기존 토큰 삭제 완료');
    checkPartnerAuth();
    fetchNotifications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkPartnerAuth = async () => {
    try {
      const response = await fetch('/api/partner/auth/verify');

      if (response.ok) {
        const data = await response.json();
        console.log('파트너 정보:', data.partner); // 디버깅용
        setPartner(data.partner);
      } else if (response.status === 401) {
        console.log('파트너 토큰 없음, 소셜 로그인 사용자 확인 중...');

        // 소셜 로그인 사용자인지 확인
        const sessionResponse = await fetch('/api/auth/session');
        if (sessionResponse.ok) {
          const sessionData = await sessionResponse.json();
          if (sessionData.user) {
            console.log('소셜 로그인 사용자 발견:', sessionData.user);

            // 파트너 권한 확인
            const checkResponse = await fetch('/api/partner/auth/check-partner-status');
            const checkData = await checkResponse.json();

            if (checkResponse.ok && checkData.isPartner) {
              console.log('파트너 권한 확인됨, 토큰 발급 시작');

              // 파트너 토큰 발급
              const tokenResponse = await fetch('/api/partner/auth/social-login', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ provider: sessionData.user.provider || 'google' }),
              });

              if (tokenResponse.ok) {
                console.log('파트너 토큰 발급 성공, 재인증 시도');
                // 토큰 발급 후 다시 인증 확인
                setTimeout(() => {
                  checkPartnerAuth();
                }, 1000);
                return;
              } else {
                console.log('파트너 토큰 발급 실패:', tokenResponse.status);
              }
            } else {
              console.log('파트너 권한 없음:', checkData);
            }
          } else {
            console.log('소셜 로그인 사용자 없음');
          }
        } else {
          console.log('세션 확인 실패:', sessionResponse.status);
        }

        console.log('파트너 권한 확인 실패:', response.status);
        // 파트너 권한이 없으면 로그인 페이지로 리다이렉트
        router.push('/partner/login');
      } else {
        console.log('파트너 권한 확인 실패:', response.status);
        // 파트너 권한이 없으면 로그인 페이지로 리다이렉트
        router.push('/partner/login');
      }
    } catch (error) {
      console.error('Partner auth check failed:', error);
      router.push('/partner/login');
    } finally {
      setLoading(false);
    }
  };

  const fetchNotifications = async () => {
    try {
      const response = await fetch('/api/partner/notifications');
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/partner/auth/logout', { method: 'POST' });
      setPartner(null);
      router.push('/partner/login');
    } catch (error) {
      console.error('Logout failed:', error);
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

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'order':
        return <ShoppingCart className="h-4 w-4" />;
      case 'stock':
        return <AlertCircle className="h-4 w-4" />;
      case 'payment':
        return <DollarSign className="h-4 w-4" />;
      case 'system':
        return <Megaphone className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'order':
        return 'text-green-600';
      case 'stock':
        return 'text-orange-600';
      case 'payment':
        return 'text-primary';
      case 'system':
        return 'text-secondary';
      default:
        return 'text-obsidian';
    }
  };

  const formatTimeAgo = (date: string) => {
    const now = new Date();
    const notificationDate = new Date(date);
    const diffInSeconds = Math.floor((now.getTime() - notificationDate.getTime()) / 1000);

    if (diffInSeconds < 60) return '방금 전';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}분 전`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}시간 전`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}일 전`;
    return notificationDate.toLocaleDateString('ko-KR');
  };


  // 유형별 네비게이션 필터링 및 레이블 변경
  const getFilteredNavigation = () => {
    const type = partner?.partnerType;
    let items = [...navigationItems];

    if (type === 'medical') {
      // 의료 파트너는 재고/반품만 숨기고 상품/AI빌더는 허용
      items = items.filter(item => 
        !['/partner/inventory', '/partner/returns'].includes(item.href)
      );
      
      // 용어 변경 (상품 -> 상담/서비스)
      return items.map(item => {
        if (item.href === '/partner/products') {
          return { ...item, name: '상담/서비스 관리', description: '내 상담 및 진료 서비스 관리' };
        }
        if (item.href === '/partner/ai-builder') {
          return { ...item, name: 'gleemile 서비스 빌더', description: 'gleemile로 서비스 상세페이지 만들기' };
        }
        return item;
      });
    }
    
    if (type === 'trainer') {
      return items.filter(item => 
        !['/partner/inventory', '/partner/ai-builder'].includes(item.href)
      );
    }
    
    return items; // commerce 및 기타는 전체 노출
  };

  const filteredNavigation = getFilteredNavigation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-secondary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Store className="h-8 w-8 text-secondary animate-spin" />
          </div>
          <p className="text-text-secondary">파트너 권한 확인 중...</p>
        </div>
      </div>
    );
  }

  if (!partner) {
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
            <Link href="/partner/dashboard" className="flex items-center space-x-3">
              <div className="relative h-8 w-8">
                <CharacterImage
                  src="/character/youniqle-4.png"
                  alt="파트너 로고"
                  fill
                  className="object-contain"
                  sizes="32px"
                />
              </div>
              <div>
                <span className="text-lg font-bold text-text-primary">Partner</span>
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

          {/* Partner Info */}
          <div className="p-4 border-b bg-secondary/5">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-secondary/10 rounded-full flex items-center justify-center">
                {partner.avatar ? (
                  <Image width={800} height={800} style={{ width: '100%', height: '100%', objectFit: 'inherit' }} unoptimized                     src={partner.avatar}
                    alt={partner.name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <Store className="h-5 w-5 text-secondary" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-text-primary truncate">
                  {partner.name || '파트너'}
                </p>
                <p className="text-xs text-text-secondary truncate">
                  {partner.businessName || partner.email || '파트너샵'}
                </p>
              </div>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <Badge variant="secondary" className="text-xs">
                수수료 {partner.commissionRate}%
              </Badge>
              <Badge variant="default" className="text-xs">
                {partner.partnerType ? partner.partnerType.toUpperCase() : '파트너'}
              </Badge>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            {filteredNavigation.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive
                    ? 'bg-chapter-accent text-white'
                    : 'text-text-secondary hover:text-text-primary hover:bg-gray-100'
                    }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <Icon className="h-5 w-5" />
                  <div className="flex-1">
                    <div>{item.name}</div>
                    <div className={`text-xs ${isActive ? 'text-white/80' : 'text-text-secondary'
                      }`}>
                      {item.description}
                    </div>
                  </div>
                </Link>
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
        {/* Fixed Header Bar */}
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b">
          <div className="flex items-center justify-between p-4">
            {/* Mobile menu button */}
            <div className="lg:hidden">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="h-5 w-5" />
              </Button>
            </div>

            {/* Search (Desktop) */}
            <form onSubmit={handleSearch} className="hidden lg:flex flex-1 max-w-md">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-secondary" />
                <Input
                  type="text"
                  placeholder="상품, 주문번호 검색..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 rounded-full bg-mist border-0 focus-visible:ring-1"
                />
              </div>
            </form>

            {/* Right Side Actions */}
            <div className="flex items-center gap-2">
              {/* Notifications */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative rounded-full">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80 p-0">
                  <div className="p-4 border-b bg-mist">
                    <h3 className="font-bold text-sm">알림</h3>
                    <p className="text-xs text-text-secondary">읽지 않은 알림 {unreadCount}개</p>
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.slice(0, 5).map((notification) => (
                      <div
                        key={notification.id}
                        className={`p-3 border-b last:border-0 hover:bg-mist transition-colors ${!notification.isRead ? 'bg-blue-50' : ''}`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`mt-0.5 p-1.5 rounded-lg ${getNotificationColor(notification.type)}`}>
                            {getNotificationIcon(notification.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-text-primary truncate">{notification.title}</p>
                            <p className="text-xs text-text-secondary line-clamp-2">{notification.message}</p>
                            <p className="text-xs text-foreground/70 mt-1">{formatTimeAgo(notification.createdAt)}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                    {notifications.length === 0 && (
                      <div className="p-6 text-center text-text-secondary">
                        <Bell className="h-8 w-8 mx-auto mb-2 opacity-30" />
                        <p className="text-sm">새로운 알림이 없습니다</p>
                      </div>
                    )}
                  </div>
                  <div className="p-2 border-t">
                    <Button variant="ghost" size="sm" className="w-full text-xs">모든 알림 보기</Button>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Profile Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                      {partner.avatar ? (
                        <Image width={800} height={800} style={{ width: '100%', height: '100%', objectFit: 'inherit' }} unoptimized src={partner.avatar} alt={partner.name} className="w-8 h-8 rounded-full object-cover" crossOrigin="anonymous" />
                      ) : (
                        <Store className="h-4 w-4 text-white" />
                      )}
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div>
                      <p className="font-medium">{partner.name || '파트너'}</p>
                      <p className="text-xs text-text-secondary">{partner.businessName || '파트너샵'}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/partner/settings" className="cursor-pointer">
                      <Settings className="h-4 w-4 mr-2" />
                      설정
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/" className="cursor-pointer">
                      <Store className="h-4 w-4 mr-2" />
                      쇼핑몰 보기
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:text-red-600 cursor-pointer">
                    <LogOut className="h-4 w-4 mr-2" />
                    로그아웃
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

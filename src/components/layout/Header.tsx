'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { ShoppingCart, User, Menu, X, ShoppingBag, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import CharacterImage from '@/components/ui/CharacterImage';
import { motion } from 'framer-motion';
import NoticeTicker from './NoticeTicker';
import { AccessControl } from '@/lib/logic/access-control';
import { getKSTDate } from '@/lib/date';

export default function Header() {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { data: session, status } = useSession();
  const loading = status === 'loading';
  const [cartCount, setCartCount] = useState(0);

  // Gate Logic
  const [isGateMode, setIsGateMode] = useState(false);

  useEffect(() => {
    if (pathname === '/') {
      const today = getKSTDate();
      const lastCheck = localStorage.getItem('recovery_last_check');
      if (lastCheck !== today) {
        setIsGateMode(true);
      } else {
        setIsGateMode(false);
      }
    } else {
      setIsGateMode(false);
    }
  }, [pathname]);

  useEffect(() => {
    const handleGatePass = () => setIsGateMode(false);
    window.addEventListener('recovery-gate-passed', handleGatePass);
    return () => window.removeEventListener('recovery-gate-passed', handleGatePass);
  }, []);

  // 모바일 메뉴가 열려있을 때 경로가 변경되면 메뉴를 자동으로 닫습니다.
  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (session) {
      fetchCartCount();
    }

    const handleCartUpdate = () => fetchCartCount();
    window.addEventListener('cartUpdated', handleCartUpdate);
    return () => {
      window.removeEventListener('cartUpdated', handleCartUpdate);
    };
  }, [session]);

  const fetchCartCount = async () => {
    try {
      const response = await fetch('/api/cart');
      if (response.ok) {
        const data = await response.json();
        setCartCount(data.cart?.totalItems || 0);
      }
    } catch (error) {
      console.error('Error fetching cart:', error);
    }
  };

  const menuItems = [
    { label: 'Youniqle?', href: '/about', desc: '브랜드 및 회복 경로 소개' },
    { label: '오늘 리듬체크', href: '/ai-navigator', desc: '데이터 기반 맞춤 루틴 제안' },
    // @ts-ignore — 모임 유저 및 어드민/수퍼어드민에게만 클럽하우스 메뉴 노출
    ...((session?.user?.mileRole || AccessControl.isAdmin(session?.user) || (session?.user as any)?.role === 'superadmin')
      ? [{ label: '⚽ 클럽하우스', href: '/mile/mypage', desc: '팀 일정 & 컨디션 소통' }] : []),
    { label: '내 회복 리포트', href: '/reports', desc: '나의 모든 체크 및 회복 리포트' },
    { label: '대시보드', href: '/dashboard', desc: '나의 회복 현황 대시보드' },
    { label: '힐링 라운지', href: '/products', desc: '프리미엄 회복 공간 및 프로그램' },
    { label: '파트너', href: '/partners', desc: '협업 및 제휴 안내' },

    // @ts-ignore
    ...(session?.user?.isNavigator === true ? [{ label: '네비게이터', href: '/navigator', desc: '네비게이터 전용 공간' }] : []),
  ];

  const handleSignOut = async () => {
    try {
      await fetch('/api/auth/signout', { method: 'POST' });
      localStorage.clear();
      window.location.href = '/';
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 w-full transition-all duration-500 ${
      isMenuOpen ? 'bg-background shadow-2xl shadow-primary/5' : 'bg-background/80 backdrop-blur-xl border-b border-primary/5'
    }`}>
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex h-16 md:h-20 items-center justify-between">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center space-x-3 group"
            onClick={() => setIsMenuOpen(false)}
          >
            <div className="relative h-9 w-9 md:h-11 md:w-11 transition-all duration-500 group-hover:scale-110">
              <CharacterImage
                src="/character/youniqle-1.png"
                alt="Logo"
                fill
                className="object-contain"
                priority
              />
            </div>
            <span className="font-bold text-foreground tracking-tight text-xl md:text-2xl">Youniqle</span>
          </Link>

          {/* Nav */}
          <nav className="hidden md:flex items-center space-x-8">
            {menuItems.map((item) => {
              const isActive = pathname?.startsWith(item.href) || false;
              return (
                <div key={item.label} className="relative group">
                  <Link
                    href={item.href}
                    className={`text-[15px] font-semibold transition-all duration-300 relative py-2 ${
                      isActive ? 'text-primary' : 'text-foreground/60 hover:text-primary'
                    }`}
                  >
                    {item.label}
                    {isActive && (
                      <motion.div
                        layoutId="nav-underline"
                        className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-primary rounded-full"
                        transition={{ type: "spring", stiffness: 380, damping: 30 }}
                      />
                    )}
                  </Link>
                </div>
              );
            })}
          </nav>

          {/* Right Side */}
          <div className="flex items-center space-x-2 md:space-x-3">
            <Button 
              variant="ghost" 
              size="icon" 
              className="relative hover:bg-primary/5 rounded-full"
              onClick={() => window.dispatchEvent(new Event('open-unni-chat'))}
              title="매니저 유니 상담"
            >
              <HelpCircle className="h-6 w-6 text-foreground/80" />
            </Button>

            <Link href="/cart">
              <Button variant="ghost" size="icon" className="relative hover:bg-primary/5 rounded-full">
                <ShoppingCart className="h-6 w-6 text-foreground/80" />
                {cartCount > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 bg-secondary-container text-on-secondary-container flex items-center justify-center p-0 text-[10px] border-none">
                    {cartCount}
                  </Badge>
                )}
              </Button>
            </Link>

            {session ? (
              <Button variant="ghost" size="icon" asChild className="hidden md:flex hover:bg-primary/5 rounded-full">
                <Link href="/me"><User className="h-6 w-6 text-foreground/80" /></Link>
              </Button>
            ) : (
              <Button variant="primary" size="sm" asChild className="hidden sm:inline-flex">
                <Link href="/auth/signin">로그인</Link>
              </Button>
            )}

            <Button
              variant="ghost"
              size="icon"
              className="md:hidden hover:bg-primary/5 rounded-full"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="h-7 w-7" /> : <Menu className="h-7 w-7" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-primary/5 py-10 max-h-[85vh] overflow-y-auto bg-background animate-in slide-in-from-top-4 duration-500">
            <nav className="flex flex-col space-y-8 px-6">
              {menuItems.map((item) => (
                <div key={item.label} className="flex flex-col space-y-2">
                  <Link
                    href={item.href}
                    className="flex flex-col gap-1 group"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <span className="font-bold text-foreground group-active:text-primary transition-colors text-xl">
                      {item.label}
                    </span>
                    <span className="text-xs font-medium text-foreground/40">
                      {item.desc}
                    </span>
                  </Link>
                </div>
              ))}
              {!session && (
                <Link href="/auth/signin" className="group flex flex-col gap-1 pt-4" onClick={() => setIsMenuOpen(false)}>
                  <span className="font-bold text-primary text-xl">로그인</span>
                  <span className="text-xs font-medium text-foreground/40">회원 서비스 이용을 위한 로그인</span>
                </Link>
              )}
            </nav>
          </div>
        )}
      </div>
      <NoticeTicker />
    </header>
  );
}

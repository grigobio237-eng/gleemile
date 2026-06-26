'use client';

import { usePathname } from 'next/navigation';
import Header from './Header';

export default function ConditionalHeader() {
  const pathname = usePathname();

  // 관리자 페이지에서는 헤더를 숨김
  const shouldHideHeader = pathname?.startsWith('/admin');

  if (shouldHideHeader) {
    return null;
  }

  return <Header />;
}

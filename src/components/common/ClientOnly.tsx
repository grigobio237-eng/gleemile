'use client';

import { ReactNode, useEffect, useState } from 'react';

interface ClientOnlyProps {
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * 렌더링 시 서버/클라이언트 불일치(Hydration Error)가 우려되는 요소를 감싸는 컴포넌트입니다.
 * 마운트가 완료된 후(Client-side)에만 자식을 렌더링합니다.
 */
export default function ClientOnly({ children, fallback = null }: ClientOnlyProps) {
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  if (!hasMounted) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

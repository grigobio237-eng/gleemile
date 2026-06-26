'use client';

import { useState } from 'react';

interface UseCartReturn {
  addToCart: (productId: string, quantity?: number) => Promise<boolean>;
  loading: boolean;
}

export function useCart(): UseCartReturn {
  const [loading, setLoading] = useState(false);

  const addToCart = async (productId: string, quantity: number = 1): Promise<boolean> => {
    setLoading(true);
    try {
      const response = await fetch('/api/cart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId,
          quantity,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        // 성공 메시지 표시 (선택사항)
        return true;
      } else {
        const errorData = await response.json();
        alert(`장바구니 추가 실패: ${errorData.error}`);
        return false;
      }
    } catch (error) {
      console.error('장바구니 추가 실패:', error);
      alert('장바구니 추가 중 오류가 발생했습니다.');
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { addToCart, loading };
}










import { z } from 'zod';

/**
 * 전역 공통 Zod 스키마 정의
 */

// 페이지네이션 스키마
export const paginationSchema = z.object({
  page: z.string().optional().transform(v => v ? parseInt(v) : 1),
  limit: z.string().optional().transform(v => v ? parseInt(v) : 20),
});

// 상품 조회 쿼리 스키마
export const productQuerySchema = z.object({
  q: z.string().optional(),
  search: z.string().optional(),
  category: z.string().optional(),
  sort: z.enum(['newest', 'price_asc', 'price_desc', 'popular']).optional().default('newest'),
  isFunding: z.string().optional().transform(v => v === 'true'),
  page: z.string().optional().transform(v => v ? parseInt(v) : 1),
  limit: z.string().optional().transform(v => v ? parseInt(v) : 20),
  preview: z.string().optional().transform(v => v === 'true'),
}).partial();

// 로그인 요청 스키마
export const loginSchema = z.object({
  email: z.string().email('유효한 이메일 형식이 아닙니다.'),
  password: z.string().min(1, '비밀번호를 입력해주세요.'),
});

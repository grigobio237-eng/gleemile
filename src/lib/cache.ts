// 메모리 캐싱 시스템 (Vercel 서버리스 환경 최적화)
class CacheManager {
  private memoryCache = new Map<string, { value: any; expires: number }>();

  constructor() {
    this.startMemoryCacheCleanup();
  }

  // 메모리 캐시 정리 (만료된 항목 제거)
  private startMemoryCacheCleanup() {
    setInterval(() => {
      const now = Date.now();
      for (const [key, cached] of this.memoryCache.entries()) {
        if (now > cached.expires) {
          this.memoryCache.delete(key);
        }
      }
    }, 60000); // 1분마다 정리
  }

  // 캐시에 데이터 저장
  async set(key: string, value: any, ttl: number = 300): Promise<boolean> {
    try {
      const expires = Date.now() + (ttl * 1000);
      this.memoryCache.set(key, { value, expires });
      console.log(`📝 메모리 캐시 저장: ${key} (TTL: ${ttl}s)`);
      return true;
    } catch (error) {
      console.error(`❌ 캐시 저장 실패: ${key}`, error);
      return false;
    }
  }

  // 캐시에서 데이터 조회
  async get(key: string): Promise<any | null> {
    try {
      const cached = this.memoryCache.get(key);
      if (!cached) return null;
      
      if (Date.now() > cached.expires) {
        this.memoryCache.delete(key);
        return null;
      }
      
      console.log(`📖 메모리 캐시 조회: ${key}`);
      return cached.value;
    } catch (error) {
      console.error(`❌ 캐시 조회 실패: ${key}`, error);
      return null;
    }
  }

  // 캐시에서 데이터 삭제
  async del(key: string): Promise<boolean> {
    try {
      const deleted = this.memoryCache.delete(key);
      if (deleted) {
        console.log(`🗑️ 캐시 삭제: ${key}`);
      }
      return deleted;
    } catch (error) {
      console.error(`❌ 캐시 삭제 실패: ${key}`, error);
      return false;
    }
  }

  // 패턴으로 캐시 삭제
  async delPattern(pattern: string): Promise<boolean> {
    try {
      let deletedCount = 0;
      const regex = new RegExp(pattern.replace(/\*/g, '.*'));
      
      for (const key of this.memoryCache.keys()) {
        if (regex.test(key)) {
          this.memoryCache.delete(key);
          deletedCount++;
        }
      }
      
      if (deletedCount > 0) {
        console.log(`🗑️ 패턴 캐시 삭제: ${pattern} (${deletedCount}개)`);
      }
      return true;
    } catch (error) {
      console.error(`❌ 패턴 캐시 삭제 실패: ${pattern}`, error);
      return false;
    }
  }

  // 캐시 TTL 확인
  async ttl(key: string): Promise<number> {
    try {
      const cached = this.memoryCache.get(key);
      if (!cached) return -1;
      
      const remaining = Math.max(0, Math.floor((cached.expires - Date.now()) / 1000));
      return remaining;
    } catch (error) {
      console.error(`❌ TTL 조회 실패: ${key}`, error);
      return -1;
    }
  }

  // 캐시 존재 확인
  async exists(key: string): Promise<boolean> {
    try {
      const cached = this.memoryCache.get(key);
      if (!cached) return false;
      
      if (Date.now() > cached.expires) {
        this.memoryCache.delete(key);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error(`❌ 캐시 존재 확인 실패: ${key}`, error);
      return false;
    }
  }

  // 캐시 키 목록 조회
  async keys(pattern: string = '*'): Promise<string[]> {
    try {
      const regex = new RegExp(pattern.replace(/\*/g, '.*'));
      const matchingKeys: string[] = [];
      
      for (const key of this.memoryCache.keys()) {
        if (regex.test(key)) {
          // 만료된 키는 제외
          const cached = this.memoryCache.get(key);
          if (cached && Date.now() <= cached.expires) {
            matchingKeys.push(key);
          }
        }
      }
      
      return matchingKeys;
    } catch (error) {
      console.error(`❌ 키 목록 조회 실패: ${pattern}`, error);
      return [];
    }
  }

  // 캐시 통계 조회
  async getStats(): Promise<any> {
    try {
      const now = Date.now();
      let validKeys = 0;
      let totalMemory = 0;
      
      for (const [key, cached] of this.memoryCache.entries()) {
        if (now <= cached.expires) {
          validKeys++;
          totalMemory += JSON.stringify(cached.value).length;
        }
      }
      
      return {
        connected: true,
        keyCount: validKeys,
        memory: `${Math.round(totalMemory / 1024)}KB`,
        uptime: 'N/A',
        connectedClients: '1'
      };
    } catch (error) {
      console.error('❌ 캐시 통계 조회 실패:', error);
      return {
        connected: true,
        keyCount: 0,
        memory: '0KB',
        uptime: 'N/A',
        connectedClients: '1'
      };
    }
  }

  // 캐시 연결 종료 (메모리 캐시는 자동 정리됨)
  async disconnect(): Promise<void> {
    this.memoryCache.clear();
    console.log('🔌 메모리 캐시 정리 완료');
  }
}

// 싱글톤 인스턴스
const cacheManager = new CacheManager();

// 캐시 키 생성 헬퍼 함수들
export const CacheKeys = {
  // 상품 관련
  products: (page: number, limit: number, filters?: any) => 
    `products:${page}:${limit}:${JSON.stringify(filters || {})}`,
  product: (id: string) => `product:${id}`,
  productSearch: (query: string, page: number, limit: number) => 
    `product_search:${query}:${page}:${limit}`,
  
  // 사용자 관련
  user: (id: string) => `user:${id}`,
  userProfile: (id: string) => `user_profile:${id}`,
  
  // 주문 관련
  userOrders: (userId: string, page: number, limit: number) => 
    `user_orders:${userId}:${page}:${limit}`,
  order: (id: string) => `order:${id}`,
  
  // 장바구니 관련
  cart: (userId: string) => `cart:${userId}`,
  
  // 추천 관련
  recommendations: (userId: string, type: string, limit: number) => 
    `recommendations:${userId}:${type}:${limit}`,
  personalizedRecommendations: (userId: string, limit: number) => 
    `personalized_recommendations:${userId}:${limit}`,
  
  // 분석 관련
  analytics: (type: string, range: string) => `analytics:${type}:${range}`,
  
  // 알림 관련
  userNotifications: (userId: string, page: number, limit: number) => 
    `user_notifications:${userId}:${page}:${limit}`,
};

// 캐시 래퍼 함수들
export const cache = {
  // 기본 캐시 작업
  set: (key: string, value: any, ttl: number = 3600) => 
    cacheManager.set(key, value, ttl),
  get: (key: string) => cacheManager.get(key),
  del: (key: string) => cacheManager.del(key),
  delPattern: (pattern: string) => cacheManager.delPattern(pattern),
  exists: (key: string) => cacheManager.exists(key),
  ttl: (key: string) => cacheManager.ttl(key),
  
  // 상품 캐시
  setProducts: (page: number, limit: number, products: any, filters?: any, ttl: number = 1800) => 
    cacheManager.set(CacheKeys.products(page, limit, filters), products, ttl),
  getProducts: (page: number, limit: number, filters?: any) => 
    cacheManager.get(CacheKeys.products(page, limit, filters)),
  
  // 사용자 캐시
  setUser: (id: string, user: any, ttl: number = 3600) => 
    cacheManager.set(CacheKeys.user(id), user, ttl),
  getUser: (id: string) => cacheManager.get(CacheKeys.user(id)),
  
  // 추천 캐시
  setRecommendations: (userId: string, type: string, limit: number, recommendations: any, ttl: number = 1800) => 
    cacheManager.set(CacheKeys.recommendations(userId, type, limit), recommendations, ttl),
  getRecommendations: (userId: string, type: string, limit: number) => 
    cacheManager.get(CacheKeys.recommendations(userId, type, limit)),
  
  // 분석 캐시
  setAnalytics: (type: string, range: string, data: any, ttl: number = 300) => 
    cacheManager.set(CacheKeys.analytics(type, range), data, ttl),
  getAnalytics: (type: string, range: string) => 
    cacheManager.get(CacheKeys.analytics(type, range)),
  
  // 통계
  getStats: () => cacheManager.getStats(),
  
  // 키 목록 조회
  keys: (pattern: string = '*') => cacheManager.keys(pattern),
  
  // 연결 종료
  disconnect: () => cacheManager.disconnect(),
};

// getCacheManager 함수 추가
export function getCacheManager() {
  return cache;
}

export default cache;
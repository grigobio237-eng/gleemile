import mongoose from 'mongoose';
import { getCacheManager } from './cache';

export interface IndexConfig {
  collection: string;
  fields: { [key: string]: 1 | -1 | 'text' | '2dsphere' };
  options?: {
    unique?: boolean;
    sparse?: boolean;
    background?: boolean;
    name?: string;
    partialFilterExpression?: any;
    expireAfterSeconds?: number;
  };
}

export class DatabaseOptimizer {
  private cacheManager = getCacheManager();

  // 인덱스 생성
  public async createIndex(config: IndexConfig): Promise<boolean> {
    try {
      const collection = mongoose.connection.db?.collection(config.collection);
      if (!collection) {
        throw new Error(`Collection ${config.collection} not found`);
      }

      const indexSpec = Object.entries(config.fields).map(([field, direction]) => ({
        [field]: direction
      }));

      const indexOptions = {
        background: true,
        ...config.options
      };

      await collection.createIndex(indexSpec, indexOptions);
      
      console.log(`Index created for ${config.collection}:`, indexSpec);
      return true;
    } catch (error) {
      console.error('Error creating index:', error);
      return false;
    }
  }

  // 인덱스 삭제
  public async dropIndex(collection: string, indexName: string): Promise<boolean> {
    try {
      const coll = mongoose.connection.db?.collection(collection);
      if (!coll) {
        throw new Error(`Collection ${collection} not found`);
      }

      await coll.dropIndex(indexName);
      console.log(`Index ${indexName} dropped from ${collection}`);
      return true;
    } catch (error) {
      console.error('Error dropping index:', error);
      return false;
    }
  }

  // 인덱스 목록 조회
  public async listIndexes(collection: string): Promise<any[]> {
    try {
      const coll = mongoose.connection.db?.collection(collection);
      if (!coll) {
        throw new Error(`Collection ${collection} not found`);
      }

      return await coll.listIndexes().toArray();
    } catch (error) {
      console.error('Error listing indexes:', error);
      return [];
    }
  }

  // 쿼리 성능 분석
  public async analyzeQuery(collection: string, query: any, options: any = {}): Promise<{
    executionTime: number;
    documentsExamined: number;
    documentsReturned: number;
    indexUsed: string | null;
    executionStats: any;
  }> {
    try {
      const coll = mongoose.connection.db?.collection(collection);
      if (!coll) {
        throw new Error(`Collection ${collection} not found`);
      }

      const startTime = Date.now();
      
      // explain() 실행
      const explainResult = await coll.find(query, options).explain('executionStats');
      const executionTime = Date.now() - startTime;

      const executionStats = explainResult.executionStats;
      
      return {
        executionTime,
        documentsExamined: executionStats.totalDocsExamined || 0,
        documentsReturned: executionStats.totalDocsReturned || 0,
        indexUsed: executionStats.executionStages?.indexName || null,
        executionStats
      };
    } catch (error) {
      console.error('Error analyzing query:', error);
      return {
        executionTime: 0,
        documentsExamined: 0,
        documentsReturned: 0,
        indexUsed: null,
        executionStats: {}
      };
    }
  }

  // 캐시를 활용한 최적화된 쿼리 실행
  public async optimizedFind<T>(
    collection: string,
    query: any,
    options: any = {},
    cacheKey?: string,
    cacheTTL: number = 300 // 5분
  ): Promise<T[]> {
    try {
      // 캐시 키가 제공된 경우 캐시에서 먼저 확인
      if (cacheKey) {
        const cached = await this.cacheManager.get(cacheKey);
        if (cached) {
          return cached;
        }
      }

      // 데이터베이스에서 쿼리 실행
      const coll = mongoose.connection.db?.collection(collection);
      if (!coll) {
        throw new Error(`Collection ${collection} not found`);
      }

      const results = await coll.find(query, options).toArray();

      // 결과를 캐시에 저장
      if (cacheKey && results.length > 0) {
        await this.cacheManager.set(cacheKey, results, cacheTTL);
      }

      return results as T[];
    } catch (error) {
      console.error('Error in optimized find:', error);
      return [];
    }
  }

  // 페이지네이션 최적화
  public async paginatedFind<T>(
    collection: string,
    query: any,
    page: number = 1,
    limit: number = 10,
    sort: any = {},
    cacheKey?: string,
    cacheTTL: number = 300
  ): Promise<{
    data: T[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  }> {
    try {
      const skip = (page - 1) * limit;
      
      // 캐시 키 생성
      const finalCacheKey = cacheKey || `paginated_${collection}_${JSON.stringify(query)}_${page}_${limit}`;
      
      // 캐시에서 확인
      const cached = await this.cacheManager.get(finalCacheKey);
      
      if (cached) {
        return cached;
      }

      const coll = mongoose.connection.db?.collection(collection);
      if (!coll) {
        throw new Error(`Collection ${collection} not found`);
      }

      // 총 문서 수 조회
      const total = await coll.countDocuments(query);
      
      // 데이터 조회
      const data = await coll
        .find(query)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .toArray() as T[];

      const pages = Math.ceil(total / limit);
      const pagination = {
        page,
        limit,
        total,
        pages,
        hasNext: page < pages,
        hasPrev: page > 1
      };

      const result = { data, pagination };

      // 결과를 캐시에 저장
      await this.cacheManager.set(finalCacheKey, result, cacheTTL);

      return result;
    } catch (error) {
      console.error('Error in paginated find:', error);
      return {
        data: [],
        pagination: {
          page: 1,
          limit: 10,
          total: 0,
          pages: 0,
          hasNext: false,
          hasPrev: false
        }
      };
    }
  }

  // 집계 쿼리 최적화
  public async optimizedAggregate<T>(
    collection: string,
    pipeline: any[],
    cacheKey?: string,
    cacheTTL: number = 300
  ): Promise<T[]> {
    try {
      // 캐시 키가 제공된 경우 캐시에서 먼저 확인
      if (cacheKey) {
        const cached = await this.cacheManager.get(cacheKey);
        if (cached) {
          return cached;
        }
      }

      const coll = mongoose.connection.db?.collection(collection);
      if (!coll) {
        throw new Error(`Collection ${collection} not found`);
      }

      const results = await coll.aggregate(pipeline).toArray();

      // 결과를 캐시에 저장
      if (cacheKey && results.length > 0) {
        await this.cacheManager.set(cacheKey, results, cacheTTL);
      }

      return results as T[];
    } catch (error) {
      console.error('Error in optimized aggregate:', error);
      return [];
    }
  }

  // 데이터베이스 연결 상태 확인
  public async checkConnection(): Promise<{
    connected: boolean;
    readyState: number;
    host: string;
    port: number;
    name: string;
  }> {
    const connection = mongoose.connection;
    
    return {
      connected: connection.readyState === 1,
      readyState: connection.readyState,
      host: connection.host,
      port: connection.port,
      name: connection.name
    };
  }

  // 데이터베이스 통계 조회
  public async getDatabaseStats(): Promise<{
    collections: number;
    dataSize: number;
    storageSize: number;
    indexes: number;
    indexSize: number;
  }> {
    try {
      const stats = await mongoose.connection.db?.stats();
      
      return {
        collections: stats?.collections || 0,
        dataSize: stats?.dataSize || 0,
        storageSize: stats?.storageSize || 0,
        indexes: stats?.indexes || 0,
        indexSize: stats?.indexSize || 0
      };
    } catch (error) {
      console.error('Error getting database stats:', error);
      return {
        collections: 0,
        dataSize: 0,
        storageSize: 0,
        indexes: 0,
        indexSize: 0
      };
    }
  }

  // 권장 인덱스 생성
  public async createRecommendedIndexes(): Promise<void> {
    const recommendedIndexes: IndexConfig[] = [
      // User 컬렉션
      {
        collection: 'users',
        fields: { email: 1 },
        options: { unique: true }
      },
      {
        collection: 'users',
        fields: { role: 1, createdAt: -1 }
      },
      {
        collection: 'users',
        fields: { 'profile.grade': 1, points: -1 }
      },

      // Product 컬렉션
      {
        collection: 'products',
        fields: { category: 1, price: 1 }
      },
      {
        collection: 'products',
        fields: { name: 'text', description: 'text' }
      },
      {
        collection: 'products',
        fields: { status: 1, createdAt: -1 }
      },
      {
        collection: 'products',
        fields: { tags: 1 }
      },

      // Order 컬렉션
      {
        collection: 'orders',
        fields: { userId: 1, createdAt: -1 }
      },
      {
        collection: 'orders',
        fields: { status: 1, createdAt: -1 }
      },
      {
        collection: 'orders',
        fields: { 'shippingAddress.zipCode': 1 }
      },

      // Review 컬렉션
      {
        collection: 'reviews',
        fields: { productId: 1, rating: -1 }
      },
      {
        collection: 'reviews',
        fields: { userId: 1, createdAt: -1 }
      },

      // Notification 컬렉션
      {
        collection: 'notifications',
        fields: { userId: 1, createdAt: -1 }
      },
      {
        collection: 'notifications',
        fields: { type: 1, status: 1 }
      },

      // AnalyticsEvent 컬렉션
      {
        collection: 'analyticevents',
        fields: { userId: 1, eventType: 1, timestamp: -1 }
      },
      {
        collection: 'analyticevents',
        fields: { eventType: 1, timestamp: -1 }
      }
    ];

    for (const indexConfig of recommendedIndexes) {
      try {
        await this.createIndex(indexConfig);
      } catch (error) {
        console.error(`Failed to create index for ${indexConfig.collection}:`, error);
      }
    }
  }

  // 캐시 무효화
  public async invalidateCache(pattern: string): Promise<boolean> {      
    return await this.cacheManager.delPattern(pattern);
  }

  // 성능 모니터링
  public async getPerformanceMetrics(): Promise<{
    cache: any;
    database: any;
    connection: any;
  }> {
    const [cacheStats, dbStats, connection] = await Promise.all([
      this.cacheManager.getStats(),
      this.getDatabaseStats(),
      this.checkConnection()
    ]);

    return {
      cache: cacheStats,
      database: dbStats,
      connection
    };
  }
}

// 싱글톤 인스턴스
let dbOptimizer: DatabaseOptimizer | null = null;

export function getDatabaseOptimizer(): DatabaseOptimizer {
  if (!dbOptimizer) {
    dbOptimizer = new DatabaseOptimizer();
  }
  return dbOptimizer;
}

export default DatabaseOptimizer;


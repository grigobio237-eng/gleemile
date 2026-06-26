/**
 * ChromaDB 클라이언트 - 모의 구현
 * 
 * 실제 ChromaDB 패키지는 Vercel 서버리스 함수 크기 제한(250MB)으로 인해
 * 프로덕션 배포에서 제외되었습니다.
 * 
 * AI 챗봇 기능은 추후 다음 방식으로 구현 예정:
 * 1. 외부 ChromaDB 서비스 사용 (ChromaDB Cloud)
 * 2. Pinecone, Weaviate 등 다른 벡터 DB 서비스
 * 3. OpenAI Embeddings API 직접 사용
 */

/**
 * Chroma DB 클라이언트 초기화 (모의)
 */
export async function initializeChromaClient() {
  console.log('[Chroma Client] 모의 모드 - AI 챗봇 기능은 현재 비활성화됨');
  return null;
}

/**
 * 벡터 검색 (모의)
 */
export async function searchSimilarDocuments(
  embedding: number[],
  topK: number = 5
): Promise<any[]> {
  console.log('[Chroma Client] 모의 검색 - 빈 결과 반환');
  // 빈 배열 반환 (AI 챗봇 비활성화)
  return [];
}

/**
 * 문서 추가 (모의)
 */
export async function addDocument(
  id: string,
  text: string,
  embedding: number[],
  metadata: any
) {
  console.log('[Chroma Client] 모의 문서 추가 - 아무 작업도 수행하지 않음');
  // 아무 작업도 하지 않음
}

/**
 * 컬렉션 통계 (모의)
 */
export async function getCollectionStats() {
  console.log('[Chroma Client] 모의 통계 - 기본값 반환');
  return {
    name: 'youniqle_knowledge',
    count: 0,
    metadata: { description: 'AI 챗봇 기능은 현재 개발 중입니다' }
  };
}


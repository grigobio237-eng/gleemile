/**
 * 외부 쇼핑 API 연동 (네이버 쇼핑 API)
 */

export interface ExternalProduct {
    id: string;
    title: string;
    link: string;
    image: string;
    lprice: number;  // 최저가
    hprice: number;  // 최고가
    mallName: string;
    productId: string;
    productType: string;
    brand: string;
    maker: string;
    category1: string;
    category2: string;
    category3: string;
    category4: string;
    source: 'naver' | 'coupang';
}

export interface NaverShoppingResponse {
    lastBuildDate: string;
    total: number;
    start: number;
    display: number;
    items: Array<{
        title: string;
        link: string;
        image: string;
        lprice: string;
        hprice: string;
        mallName: string;
        productId: string;
        productType: string;
        brand: string;
        maker: string;
        category1: string;
        category2: string;
        category3: string;
        category4: string;
    }>;
}

/**
 * 네이버 쇼핑 API 호출
 */
export async function searchNaverShopping(
    keyword: string,
    options: {
        display?: number;  // 검색 결과 수 (기본 10, 최대 100)
        start?: number;    // 시작 위치 (기본 1)
        sort?: 'sim' | 'date' | 'asc' | 'dsc';  // sim: 정확도, date: 날짜순, asc: 가격오름차순, dsc: 가격내림차순
    } = {}
): Promise<ExternalProduct[]> {
    const { display = 10, start = 1, sort = 'sim' } = options;

    const clientId = process.env.NAVER_SHOPPING_CLIENT_ID;
    const clientSecret = process.env.NAVER_SHOPPING_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
        console.error('Naver Shopping API credentials not configured');
        return [];
    }

    try {
        const encodedQuery = encodeURIComponent(keyword);
        const url = `https://openapi.naver.com/v1/search/shop.json?query=${encodedQuery}&display=${display}&start=${start}&sort=${sort}`;

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'X-Naver-Client-Id': clientId,
                'X-Naver-Client-Secret': clientSecret,
            },
        });

        if (!response.ok) {
            console.error('Naver Shopping API error:', response.status, response.statusText);
            return [];
        }

        const data: NaverShoppingResponse = await response.json();

        // 응답 데이터 변환
        return data.items.map((item, index) => ({
            id: `naver-${item.productId || index}`,
            title: item.title.replace(/<[^>]*>/g, ''), // HTML 태그 제거
            link: item.link,
            image: item.image,
            lprice: parseInt(item.lprice) || 0,
            hprice: parseInt(item.hprice) || 0,
            mallName: item.mallName,
            productId: item.productId,
            productType: item.productType,
            brand: item.brand,
            maker: item.maker,
            category1: item.category1,
            category2: item.category2,
            category3: item.category3,
            category4: item.category4,
            source: 'naver' as const
        }));

    } catch (error) {
        console.error('Naver Shopping API request failed:', error);
        return [];
    }
}

/**
 * 여러 키워드로 통합 검색
 */
export async function searchMultipleKeywords(
    keywords: string[],
    options: {
        displayPerKeyword?: number;
        totalLimit?: number;
        sort?: 'sim' | 'date' | 'asc' | 'dsc';
        start?: number;  // 시작 위치 (페이지네이션용)
        shuffle?: boolean;  // 결과 셔플 여부
    } = {}
): Promise<ExternalProduct[]> {
    const { displayPerKeyword = 5, totalLimit = 10, sort = 'sim', start = 1, shuffle = false } = options;

    // 각 키워드별로 검색 (오프셋 적용)
    const searchPromises = keywords.slice(0, 5).map(keyword =>
        searchNaverShopping(keyword, { display: displayPerKeyword, sort, start })
    );

    const results = await Promise.all(searchPromises);

    // 결과 병합 및 중복 제거
    const allProducts: ExternalProduct[] = [];
    const seenIds = new Set<string>();

    for (const products of results) {
        for (const product of products) {
            if (!seenIds.has(product.productId)) {
                seenIds.add(product.productId);
                allProducts.push(product);
            }
        }
    }

    // 셔플 옵션이 활성화되면 랜덤하게 섞기
    if (shuffle) {
        for (let i = allProducts.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [allProducts[i], allProducts[j]] = [allProducts[j], allProducts[i]];
        }
        return allProducts.slice(0, totalLimit);
    }

    // 기본: 가격 오름차순 정렬 후 제한
    return allProducts
        .sort((a, b) => a.lprice - b.lprice)
        .slice(0, totalLimit);
}

/**
 * 가격 포맷팅
 */
export function formatPrice(price: number): string {
    return new Intl.NumberFormat('ko-KR').format(price) + '원';
}

/**
 * 상품 타이틀 정리 (HTML 태그 및 특수문자 제거)
 */
export function cleanTitle(title: string): string {
    return title
        .replace(/<[^>]*>/g, '')  // HTML 태그 제거
        .replace(/&[^;]+;/g, ' ') // HTML 엔티티 제거
        .trim();
}

export default {
    searchNaverShopping,
    searchMultipleKeywords,
    formatPrice,
    cleanTitle
};

/**
 * 웹툰 다운로드 유틸리티
 * 
 * Base64 이미지를 PNG 파일로 다운로드하는 기능을 제공합니다.
 */

/**
 * 단일 패널 이미지를 PNG로 다운로드
 * 
 * @param base64Image - Base64 인코딩된 이미지 (data URL 또는 순수 Base64)
 * @param filename - 저장할 파일명 (예: "webtoon-panel-1.png")
 */
export function downloadPanelImage(
    base64Image: string,
    filename: string = 'webtoon-panel.png'
): void {
    const link = document.createElement('a');
    link.download = filename;

    // Base64가 이미 data URL 형식인지 확인
    link.href = base64Image.startsWith('data:')
        ? base64Image
        : `data:image/png;base64,${base64Image}`;

    link.click();
}

/**
 * 여러 패널 이미지를 하나의 PNG로 합쳐서 다운로드
 * 
 * @param images - Base64 이미지 배열
 * @param layout - 레이아웃 ('grid' | 'horizontal' | 'vertical')
 * @param filename - 저장할 파일명
 */
export async function downloadCombinedImages(
    images: string[],
    layout: 'grid' | 'horizontal' | 'vertical' = 'grid',
    filename: string = 'webtoon-combined.png'
): Promise<void> {
    if (images.length === 0) {
        throw new Error('No images to download');
    }

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
        throw new Error('Canvas context creation failed');
    }

    // 이미지 로드
    const loadedImages = await Promise.all(
        images.map((img) => {
            return new Promise<HTMLImageElement>((resolve, reject) => {
                const image = new Image();
                image.crossOrigin = 'anonymous';

                image.src = img.startsWith('data:')
                    ? img
                    : `data:image/png;base64,${img}`;

                image.onload = () => resolve(image);
                image.onerror = reject;
            });
        })
    );

    if (loadedImages.length === 0) {
        throw new Error('Failed to load images');
    }

    const panelWidth = loadedImages[0].width;
    const panelHeight = loadedImages[0].height;
    const gap = 20; // 패널 간 간격

    // 레이아웃별 캔버스 크기 설정
    if (layout === 'grid') {
        const cols = 2;
        const rows = Math.ceil(images.length / cols);
        canvas.width = panelWidth * cols + gap * (cols - 1);
        canvas.height = panelHeight * rows + gap * (rows - 1);
    } else if (layout === 'horizontal') {
        canvas.width = panelWidth * images.length + gap * (images.length - 1);
        canvas.height = panelHeight;
    } else {
        // vertical
        canvas.width = panelWidth;
        canvas.height = panelHeight * images.length + gap * (images.length - 1);
    }

    // 배경 흰색
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 이미지 배치
    if (layout === 'grid') {
        const cols = 2;
        loadedImages.forEach((img, i) => {
            const col = i % cols;
            const row = Math.floor(i / cols);
            const x = col * (panelWidth + gap);
            const y = row * (panelHeight + gap);
            ctx.drawImage(img, x, y);
        });
    } else if (layout === 'horizontal') {
        loadedImages.forEach((img, i) => {
            ctx.drawImage(img, i * (panelWidth + gap), 0);
        });
    } else {
        // vertical
        loadedImages.forEach((img, i) => {
            ctx.drawImage(img, 0, i * (panelHeight + gap));
        });
    }

    // 다운로드
    canvas.toBlob((blob) => {
        if (blob) {
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.download = filename;
            link.href = url;
            link.click();
            URL.revokeObjectURL(url);
        }
    }, 'image/png');
}

/**
 * 개별 패널들을 각각 다운로드
 * 
 * @param panels - { imageUrl, panelNumber } 배열
 * @param filenamePrefix - 파일명 접두사 (예: "webtoon")
 */
export function downloadIndividualPanels(
    panels: Array<{ imageUrl: string; panelNumber: number }>,
    filenamePrefix: string = 'webtoon'
): void {
    panels.forEach(({ imageUrl, panelNumber }) => {
        downloadPanelImage(imageUrl, `${filenamePrefix}-panel-${panelNumber}.png`);
    });
}

/**
 * 웹툰 전체를 다양한 형식으로 다운로드할 수 있는 옵션 제공
 */
export interface DownloadOptions {
    panels: Array<{ imageUrl: string; panelNumber: number }>;
    title?: string;
}

export async function downloadWebtoon(
    options: DownloadOptions,
    format: 'individual' | 'grid' | 'horizontal' | 'vertical'
): Promise<void> {
    const { panels, title = 'webtoon' } = options;
    const images = panels.map(p => p.imageUrl);

    if (format === 'individual') {
        downloadIndividualPanels(panels, title);
    } else {
        await downloadCombinedImages(images, format, `${title}-${format}.png`);
    }
}

import sharp from 'sharp';

/**
 * 서버 사이드에서 이미지 위에 텍스트를 합성합니다. (Sharp 라이브러리 활용)
 * 
 * @param base64Image 원본 이미지 (Base64 형식, 접두사 제외)
 * @param text 합성할 텍스트
 * @returns 텍스트가 합성된 이미지 (Base64 형식, 접두사 제외)
 */
export async function drawTextOnImage(
    base64Image: string,
    text: string
): Promise<string> {
    try {
        const imageBuffer = Buffer.from(base64Image, 'base64');
        const metadata = await sharp(imageBuffer).metadata();

        if (!metadata.width || !metadata.height) {
            throw new Error('Could not get image metadata');
        }

        const { width, height } = metadata;

        if (!text?.trim()) {
            return base64Image;
        }

        // 텍스트 박스 설정
        const padding = width * 0.05;
        const fontSize = Math.max(20, Math.floor(width / 25));
        const maxWidth = width - padding * 2;

        // SVG 줄바꿈 처리 (간단한 버전)
        const lines = wrapTextForSvg(text, fontSize, maxWidth);
        const lineHeight = fontSize * 1.4;
        const boxHeight = lines.length * lineHeight + padding;
        const boxY = height - boxHeight - padding;

        // SVG 생성 (한글 폰트 지원을 위해 폰트 패밀리 보완)
        const svgOverlay = `
      <svg width="${width}" height="${height}">
        <rect x="${padding}" y="${boxY}" width="${maxWidth}" height="${boxHeight}" fill="rgba(255, 255, 255, 0.9)" rx="10" />
        <text x="${padding + padding / 2}" y="${boxY + padding / 2 + fontSize}" font-family="'Noto Sans KR', 'Nanum Gothic', 'Malgun Gothic', sans-serif" font-size="${fontSize}" font-weight="bold" fill="black">
          ${lines.map((line, i) => `<tspan x="${padding + padding / 2}" dy="${i === 0 ? 0 : lineHeight}">${escapeHtml(line)}</tspan>`).join('')}
        </text>
      </svg>
    `;

        const processedImage = await sharp(imageBuffer)
            .composite([{ input: Buffer.from(svgOverlay), top: 0, left: 0 }])
            .png()
            .toBuffer();

        return processedImage.toString('base64');
    } catch (error) {
        console.error('Error drawing text on image:', error);
        return base64Image;
    }
}

function wrapTextForSvg(text: string, fontSize: number, maxWidth: number): string[] {
    // 간단한 한글 기준 줄바꿈 (1글자당 약 fontSize * 0.7px 가정)
    const charWidth = fontSize * 0.7;
    const charsPerLine = Math.floor(maxWidth / charWidth);

    const lines: string[] = [];
    let currentLine = '';

    const words = text.split(' ');
    for (const word of words) {
        if ((currentLine + word).length <= charsPerLine) {
            currentLine += (currentLine ? ' ' : '') + word;
        } else {
            if (currentLine) lines.push(currentLine);
            currentLine = word;

            // 단어 자체가 너무 긴 경우 강제 개행
            while (currentLine.length > charsPerLine) {
                lines.push(currentLine.substring(0, charsPerLine));
                currentLine = currentLine.substring(charsPerLine);
            }
        }
    }
    if (currentLine) lines.push(currentLine);
    return lines;
}

function escapeHtml(text: string): string {
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

/**
 * 클라이언트 사이드(브라우저)에서 이미지 위에 한글 텍스트를 합성합니다.
 * HTML5 Canvas를 사용하여 폰트 호환성 문제를 완벽하게 해결합니다.
 */

export async function drawTextOnImageClient(
    base64Image: string,
    text: string
): Promise<string> {
    return new Promise((resolve, reject) => {
        if (!text?.trim()) {
            resolve(base64Image);
            return;
        }

        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = base64Image.startsWith('data:') ? base64Image : `data:image/png;base64,${base64Image}`;

        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');

            if (!ctx) {
                reject(new Error('Canvas context failed'));
                return;
            }

            // 1. 원본 이미지 그리기
            ctx.drawImage(img, 0, 0);

            // 2. 텍스트 설정 (서버 렌더링 로직과 동일하게 유지)
            const width = img.width;
            const height = img.height;
            const padding = width * 0.05;
            const fontSize = Math.max(20, Math.floor(width / 25));
            const maxWidth = width - padding * 2;
            
            // 폰트 설정 (Noto Sans KR 권장, 시스템 폰트 폴백)
            ctx.font = `bold ${fontSize}px 'Noto Sans KR', 'Pretendard', 'Malgun Gothic', sans-serif`;
            ctx.textBaseline = 'top';

            // 3. 줄바꿈 처리
            const lines = wrapText(ctx, text, maxWidth);
            const lineHeight = fontSize * 1.4;
            const boxHeight = lines.length * lineHeight + padding;
            const boxY = height - boxHeight - padding;

            // 4. 배경 박스 그리기
            ctx.fillStyle = 'rgba(255, 255, 255, 0.92)';
            roundRect(ctx, padding, boxY, maxWidth, boxHeight, 10);
            ctx.fill();

            // 5. 텍스트 그리기
            ctx.fillStyle = '#000000';
            lines.forEach((line, i) => {
                ctx.fillText(line, padding + padding / 2, boxY + padding / 2 + (i * lineHeight));
            });

            resolve(canvas.toDataURL('image/png').split(',')[1]);
        };

        img.onerror = (err) => reject(err);
    });
}

/**
 * 텍스트 줄바꿈 처리 유틸리티
 */
function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';

    for (let i = 0; i < words.length; i++) {
        const testLine = currentLine + (currentLine ? ' ' : '') + words[i];
        const metrics = ctx.measureText(testLine);
        
        if (metrics.width > maxWidth && i > 0) {
            lines.push(currentLine);
            currentLine = words[i];
        } else {
            currentLine = testLine;
        }
    }
    lines.push(currentLine);
    return lines;
}

/**
 * 둥근 모서리 사각형 그리기
 */
function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
}

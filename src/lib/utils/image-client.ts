/**
 * Base64 이미지를 지정된 해상도와 품질로 압축합니다.
 * @param base64 - 원본 Base64 문자열
 * @param maxWidth - 최대 너비 (기본 1024)
 * @param quality - JPEG 압축 품질 (0~1, 기본 0.8)
 */
export async function compressImage(
    base64: string,
    maxWidth: number = 1024,
    quality: number = 0.8
): Promise<string> {
    return new Promise((resolve, reject) => {
        if (!base64 || !base64.startsWith('data:image/')) {
            return resolve(base64);
        }

        const img = new Image();
        img.src = base64;
        img.onload = () => {
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;

            // 해상도 조절
            if (width > maxWidth) {
                height = (height * maxWidth) / width;
                width = maxWidth;
            }

            canvas.width = width;
            canvas.height = height;

            const ctx = canvas.getContext('2d');
            if (!ctx) return reject(new Error('Canvas context not found'));

            ctx.drawImage(img, 0, 0, width, height);

            // JPEG로 압축하여 용량 축소
            const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
            resolve(compressedBase64);
        };
        img.onerror = (err) => reject(err);
    });
}

/**
 * 브라우저 Canvas API를 사용하여 이미지 위에 텍스트를 합성합니다.
 * 서버의 폰트 제한을 우회하여 사용자의 로컬 폰트(Noto Sans KR 등)를 안전하게 사용합니다.
 */
export async function drawTextOnImageClient(
    base64: string,
    text: string
): Promise<string> {
    return new Promise((resolve, reject) => {
        if (!text?.trim()) return resolve(base64);

        const img = new Image();
        img.src = base64;
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const width = img.width;
            const height = img.height;
            canvas.width = width;
            canvas.height = height;

            const ctx = canvas.getContext('2d');
            if (!ctx) return reject(new Error('Canvas context failure'));

            // 1. 원본 이미지 그리기
            ctx.drawImage(img, 0, 0);

            // 2. 텍스트 설정
            const padding = width * 0.05;
            const fontSize = Math.max(24, Math.floor(width / 22));
            ctx.font = `bold ${fontSize}px 'Noto Sans KR', 'Nanum Gothic', 'Malgun Gothic', sans-serif`;
            ctx.textBaseline = 'top';

            // 3. 줄바꿈 처리
            const maxWidth = width - padding * 4;
            const words = text.split(' ');
            const lines: string[] = [];
            let currentLine = '';

            for (const word of words) {
                const testLine = currentLine + (currentLine ? ' ' : '') + word;
                const metrics = ctx.measureText(testLine);
                if (metrics.width > maxWidth && currentLine) {
                    lines.push(currentLine);
                    currentLine = word;
                } else {
                    currentLine = testLine;
                }
            }
            if (currentLine) lines.push(currentLine);

            // 4. 하단 텍스트 박스 높이 계산 및 그리기
            const lineHeight = fontSize * 1.4;
            const boxHeight = lines.length * lineHeight + padding * 2;
            const boxY = height - boxHeight - padding;

            // 반투명 흰색 박스 (모서리 둥글게)
            ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
            const radius = 15;
            ctx.beginPath();
            ctx.moveTo(padding + radius, boxY);
            ctx.lineTo(padding + maxWidth + padding * 2 - radius, boxY);
            ctx.quadraticCurveTo(padding + maxWidth + padding * 2, boxY, padding + maxWidth + padding * 2, boxY + radius);
            ctx.lineTo(padding + maxWidth + padding * 2, boxY + boxHeight - radius);
            ctx.quadraticCurveTo(padding + maxWidth + padding * 2, boxY + boxHeight, padding + maxWidth + padding * 2 - radius, boxY + boxHeight);
            ctx.lineTo(padding + radius, boxY + boxHeight);
            ctx.quadraticCurveTo(padding, boxY + boxHeight, padding, boxY + boxHeight - radius);
            ctx.lineTo(padding, boxY + radius);
            ctx.quadraticCurveTo(padding, boxY, padding + radius, boxY);
            ctx.closePath();
            ctx.fill();

            // 5. 텍스트 그리기
            ctx.fillStyle = '#000000';
            lines.forEach((line, i) => {
                ctx.fillText(line, padding + padding, boxY + padding + (i * lineHeight));
            });

            resolve(canvas.toDataURL('image/png'));
        };
        img.onerror = (err) => reject(err);
    });
}

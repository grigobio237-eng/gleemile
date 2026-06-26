import axios from 'axios';
import fs from 'fs';
import path from 'path';

export class AIVideoEngine {
    private static API_KEY = process.env.GEMINI_API_KEY;
    private static BASE_URL = 'https://generativelanguage.googleapis.com/v1beta';

    /**
     * Google Veo 3.1을 사용하여 이미지로부터 영상을 생성합니다.
     * @param imagePath 소스 이미지의 절대 경로
     * @param outputPath 저장할 영상의 절대 경로
     * @param prompt 영상의 움직임 등을 설명하는 프롬프트 (선택)
     */
    static async generateVideoFromImage(imagePath: string, outputPath: string, prompt: string = "Cinematic slow motion, high quality, realistic movements"): Promise<string> {
        if (!this.API_KEY) throw new Error('GEMINI_API_KEY is missing');

        console.log(`[AIVideoEngine] Starting Veo 3.1 Video Generation for: ${imagePath}`);

        // 1. 이미지를 Base64로 인코딩
        const imageBuffer = fs.readFileSync(imagePath);
        const base64Image = imageBuffer.toString('base64');

        // 2. 영상 생성 요청 (LRO - Vertex AI/Gemini API 표준 규격으로 수정)
        const requestBody = {
            instances: [
                {
                    prompt: prompt,
                    image: {
                        bytesBase64Encoded: base64Image,
                        mimeType: "image/png"
                    }
                }
            ],
            parameters: {
                aspectRatio: "9:16",
                sampleCount: 1
            }
        };

        try {
            const response = await axios.post(
                `${this.BASE_URL}/models/veo-3.1-generate-preview:predictLongRunning?key=${this.API_KEY}`,
                requestBody
            );

            const operationName = response.data.name;
            console.log(`[AIVideoEngine] Operation started: ${operationName}`);

            // 3. 작업 완료 폴링 (Polling)
            const resultUrl = await this.pollOperationResult(operationName);

            // 4. 영상 다운로드 및 저장
            await this.downloadFile(resultUrl, outputPath);

            console.log(`[AIVideoEngine] Video successfully generated and saved to: ${outputPath}`);
            return outputPath;

        } catch (error: any) {
            console.error('[AIVideoEngine] Generation failed:', error.response?.data || error.message);
            throw error;
        }
    }

    private static async pollOperationResult(operationName: string): Promise<string> {
        const pollUrl = `${this.BASE_URL}/${operationName}?key=${this.API_KEY}`;
        let attempts = 0;
        const maxAttempts = 60; // 최대 10분 (10초 간격)

        while (attempts < maxAttempts) {
            attempts++;
            const response = await axios.get(pollUrl);
            const { done, response: resultResponse, error } = response.data;

            if (done) {
                if (error) {
                    throw new Error(`Veo Operation Error: ${JSON.stringify(error)}`);
                }

                // Veo 3.1 PredictLongRunningResponse 구조 보정
                const videoUrl = resultResponse?.generateVideoResponse?.generatedSamples?.[0]?.video?.uri ||
                    resultResponse?.generatedSamples?.[0]?.video?.uri ||
                    resultResponse?.video?.uri;

                if (!videoUrl) throw new Error('Video URL not found in completed operation');
                return videoUrl;
            }

            console.log(`[AIVideoEngine] Still generating... (${attempts}/${maxAttempts})`);
            await new Promise(resolve => setTimeout(resolve, 10000)); // 10초 대기
        }

        throw new Error('Video generation timed out');
    }

    private static async downloadFile(url: string, outputPath: string): Promise<void> {
        // 영상 다운로드 URL에도 API 키 인증이 필요함
        const authenticatedUrl = url.includes('key=') ? url : `${url}${url.includes('?') ? '&' : '?'}key=${this.API_KEY}`;

        const response = await axios({
            url: authenticatedUrl,
            method: 'GET',
            responseType: 'stream'
        });

        const writer = fs.createWriteStream(outputPath);
        response.data.pipe(writer);

        return new Promise((resolve, reject) => {
            writer.on('finish', resolve);
            writer.on('error', reject);
        });
    }
}

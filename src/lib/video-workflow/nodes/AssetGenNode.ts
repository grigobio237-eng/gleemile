
import { ExecutionContext, AssetNodeConfig, WorkflowNode } from '@/lib/video-workflow/types';
import { GeminiAIEngine } from '../../ai/gemini-engine';
import path from 'path';
import fs from 'fs';
import { TextToSpeechClient } from '@google-cloud/text-to-speech';

// Google Cloud TTS Client 초기화
const getTTSClient = () => {
    if (process.env.GOOGLE_CREDENTIALS_JSON) {
        try {
            const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS_JSON);
            return new TextToSpeechClient({ credentials });
        } catch (error) {
            console.error('[AssetGenNode] Failed to parse GOOGLE_CREDENTIALS_JSON', error);
        }
    }
    // Fallback to local file for development
    return new TextToSpeechClient({
        keyFilename: path.join(process.cwd(), 'google-tts.json')
    });
};

const ttsClient = getTTSClient();

export class AssetGenNode {
    static async execute(node: WorkflowNode, context: ExecutionContext): Promise<any> {
        const config = node.data as AssetNodeConfig;

        const inputEdge = context.edges.find(e => e.target === node.id);
        const scriptContext = inputEdge ? context.results[inputEdge.source] : config.scriptContext;

        if (!scriptContext || !scriptContext.scenes) {
            throw new Error('Script context is missing or invalid');
        }

        console.log(`[AssetNode] Generating REAL assets for ${scriptContext.scenes.length} scenes...`);

        const assets = [];
        const outputDir = path.join(process.cwd(), 'public', 'output', context.projectId);
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        // 0. 마스터 앵커(Master Anchor) 확보 시도 (일관성 100% 전략)
        const anchorAsset = await AssetGenNode.ensureMasterAnchor(context.projectId, outputDir);
        if (anchorAsset) {
            assets.push(anchorAsset);
        }

        for (const scene of scriptContext.scenes) {
            // 1. 이미지 생성
            const imageAsset = await this.generateImage(scene, context.projectId, outputDir);
            assets.push(imageAsset);
        }

        return { assets };
    }

    static async generateImage(scene: any, projectId: string, outputDir: string, project?: any): Promise<any> {
        const imagePath = path.join(outputDir, `scene_${scene.id}.png`);
        const publicImagePath = `/output/${projectId}/scene_${scene.id}.png`;

        try {
            // [Product Promo] 백그라운드 실행 시 프로젝트 데이터가 없으면 로드
            if (!project && projectId) {
                try {
                    const { connectDB } = await import('@/lib/db');
                    const VideoProject = (await import('@/models/VideoProject')).default;
                    await connectDB();
                    project = await VideoProject.findById(projectId);
                } catch (dbError) {
                    console.warn("[AssetNode] Failed to auto-load project for vision consistency", dbError);
                }
            }

            const assets = project?.workflow?.data?.assets || [];
            const assignedAsset = assets.filter((a: any) => a.sceneId === scene.id && a.type === 'image')[0];

            if (assignedAsset && !fs.existsSync(imagePath)) {
                const sourcePath = assignedAsset.path.startsWith('/')
                    ? path.join(process.cwd(), 'public', assignedAsset.path)
                    : assignedAsset.path;

                if (fs.existsSync(sourcePath)) {
                    console.log(`[AssetNode] Using assigned asset for scene ${scene.id}: ${sourcePath}`);
                    fs.copyFileSync(sourcePath, imagePath);
                }
            }

            // 3. 파일이 없는 경우에만 Youniqle 엔진 생성 (Vision 분석 포함)
            if (!fs.existsSync(imagePath)) {
                console.log(`[AssetNode] Analyzing reference assets for scene ${scene.id}...`);

                // 참조 이미지 로드 (사장님 전략: Anchor가 있으면 오직 Anchor만 참조)
                const masterAnchorPath = path.join(outputDir, 'master_anchor.png');
                const referenceImagesBase64: string[] = [];
                let hasAnchor = false;

                if (fs.existsSync(masterAnchorPath)) {
                    referenceImagesBase64.push(fs.readFileSync(masterAnchorPath).toString('base64'));
                    hasAnchor = true;
                    console.log(`[AssetNode] Using Master Anchor as the SOLE visual standard.`);
                }

                // 앵커가 없을 때만 원본/배경제거본 주입 (백업 전략)
                if (!hasAnchor) {
                    const productCutout = assets.find((a: any) => a.role === 'product_cutout' && a.path);
                    const productAsset = assets.find((a: any) => a.role === 'product' && a.path);
                    const modelCutout = assets.find((a: any) => a.role === 'model_cutout' && a.path);
                    const modelAsset = assets.find((a: any) => (a.role === 'model' || a.role === 'model_image') && a.path);

                    for (const asset of [productCutout || productAsset, modelCutout || modelAsset]) {
                        if (asset && asset.path) {
                            if (asset.path.startsWith('http')) {
                                try {
                                    const res = await fetch(asset.path);
                                    if (res.ok) {
                                        const buffer = await res.arrayBuffer();
                                        referenceImagesBase64.push(Buffer.from(buffer).toString('base64'));
                                        console.log(`[AssetNode] Added remote asset to anchor refs: ${asset.role}`);
                                    }
                                } catch (fetchError) {
                                    console.warn(`[AssetNode] Failed to fetch remote asset: ${asset.path}`, fetchError);
                                }
                            } else {
                                const p = path.join(process.cwd(), 'public', asset.path);
                                if (fs.existsSync(p)) {
                                    referenceImagesBase64.push(fs.readFileSync(p).toString('base64'));
                                    console.log(`[AssetNode] Added local asset to anchor refs: ${asset.role}`);
                                }
                            }
                        }
                    }
                }

                console.log(`[AssetNode] Optimizing prompt for scene ${scene.id}...`);

                const rawVisualPrompt = scene.visualPrompt || "";
                const optimizationPrompt = `
                Convert the following description into a high-quality AI image prompt.
                
                [CORE IDENTITY - IMMUTABLE]:
                - BRAND: GRICO (그리코)
                - PRODUCT: Premium Sunscreen tube
                - VISUAL SOURCE: ${hasAnchor ? "The provided Master Anchor is the ONLY visual truth. REPLICATE THE FACE AND PRODUCT FROM IT 100%." : "Follow the provided reference images exactly."}
                
                [SCENE ACTION]: ${rawVisualPrompt}
                
                [CONSISTENCY RULES]:
                1. BRAND LOGO: Only use "GRICO". Never use "L'ECLAT" or other brands.
                2. SUBJECT: Replicate the person's facial features and hair from the reference 1:1.
                3. STYLE: High-end production, photorealistic, premium lighting.
                4. Output ONLY the technical English prompt.
                `;

                let finalPrompt = rawVisualPrompt;
                try {
                    const optimizedResponse = await GeminiAIEngine.generateWithFallback(optimizationPrompt, "You are a Specialist in Visual Consistency. Replicate the reference subject and product perfectly. Brand is GRICO.", 0.2);
                    finalPrompt = optimizedResponse.trim();
                } catch (optError) {
                    finalPrompt = rawVisualPrompt;
                }

                console.log(`[AssetNode] Final Prompt for Scene ${scene.id}: ${finalPrompt}`);
                await GeminiAIEngine.generateImageAndSave(finalPrompt, imagePath, referenceImagesBase64, "9:16");
                console.log(`[AssetNode] Image generated with 2-step anchoring for scene ${scene.id}`);
            }
            return { sceneId: scene.id, type: 'image', path: publicImagePath };
        } catch (e) {
            console.error(`Failed to generate image for scene ${scene.id}`, e);
            if (!fs.existsSync(imagePath)) fs.writeFileSync(imagePath, 'error fallback');
            return { sceneId: scene.id, type: 'image', path: publicImagePath };
        }
    }

    /**
     * 프로젝트별 마스터 앵커(Master Anchor) 생성 보장 및 에셋 정보 반환
     */
    static async ensureMasterAnchor(projectId: string, outputDir: string): Promise<any | null> {
        const anchorPath = path.join(outputDir, 'master_anchor.png');
        const publicPath = `/output/${projectId}/master_anchor.png`;
        const anchorAsset = { id: Date.now(), type: 'image', role: 'master_anchor', path: publicPath, sceneId: null, aspectRatio: "4:3" };

        if (fs.existsSync(anchorPath)) return anchorAsset;

        console.log(`[AssetNode] Generating Master Anchor for 100% consistency...`);
        try {
            const { connectDB } = await import('@/lib/db');
            const VideoProject = (await import('@/models/VideoProject')).default;
            await connectDB();
            const project = await VideoProject.findById(projectId);
            if (!project) return null;

            const assets = project.workflow?.data?.assets || [];
            console.log(`[AssetNode] Found ${assets.length} assets for project ${projectId}.`);

            const anchorRefs: string[] = [];
            // 모든 이미지 관련 에셋을 일단 다 긁어모음 (정확도보다 가용성 우선)
            const imageAssets = assets.filter((a: any) =>
                (a.path && (a.role?.includes('image') || a.role?.includes('product') || a.role?.includes('model') || a.type?.includes('image')))
            );

            for (const asset of imageAssets) {
                if (asset.path.startsWith('http')) {
                    try {
                        const res = await fetch(asset.path);
                        if (res.ok) {
                            const buffer = await res.arrayBuffer();
                            anchorRefs.push(Buffer.from(buffer).toString('base64'));
                            console.log(`[AssetNode] Added remote asset to anchor refs: ${asset.role || asset.type}`);
                        }
                    } catch (fetchError) {
                        console.warn(`[AssetNode] Failed to fetch remote asset: ${asset.path}`, fetchError);
                    }
                } else {
                    const p = path.join(process.cwd(), 'public', asset.path);
                    if (fs.existsSync(p)) {
                        anchorRefs.push(fs.readFileSync(p).toString('base64'));
                        console.log(`[AssetNode] Added local asset to anchor refs: ${asset.role || asset.type}`);
                    }
                }
            }

            if (anchorRefs.length === 0) {
                console.warn("[AssetNode] NO reference assets found even with relaxed filters.");
                return null;
            }

            const anchorPrompt = `
            Analyze the provided images deeply. 
            IMAGE 1: The Product (GRICO Premium Sunscreen tube).
            IMAGE 2: The Model.
            TASK: Create a clean, high-end 4:3 studio master reference image. 
            MUST: Keep the BRAND NAME "GRICO" and the product GEOMETRY exactly as in the photo. 
            MUST: Keep the MODEL'S FACE exactly as in the photo. 
            This is the ANCHOR for an entire video campaign.
            `;

            await GeminiAIEngine.generateImageAndSave(anchorPrompt, anchorPath, anchorRefs, "4:3");
            console.log(`[AssetNode] Master Anchor created successfully: ${anchorPath}`);
            return anchorAsset;
        } catch (e) {
            console.error("[AssetNode] Failed to create Master Anchor", e);
            return null;
        }
    }

    static async generateAudio(scene: any, projectId: string, outputDir: string, voiceName: string = 'ko-KR-Neural2-A', gender?: string): Promise<any> {
        const audioPath = path.join(outputDir, `scene_${scene.id}.mp3`);
        const publicAudioPath = `/output/${projectId}/scene_${scene.id}.mp3`;

        try {
            // For interactive mode, we might want to force overwrite if voice changed.
            // For now, simple check.
            if (fs.existsSync(audioPath)) {
                console.log(`[AssetNode] Audio for scene ${scene.id} already exists. Skipping generation.`);
                return { sceneId: scene.id, type: 'audio', path: publicAudioPath };
            }

            console.log(`[AssetNode] Generating TTS for scene ${scene.id} using ${voiceName}...`);

            // 1. ElevenLabs Integration (if voiceName is ElevenLabs ID or specific prefix)
            const isElevenLabs = voiceName.includes('/') || (voiceName.length >= 20 && !voiceName.startsWith('ko-KR'));
            console.log(`[AssetNode] isElevenLabs: ${isElevenLabs}, voiceName: ${voiceName}, length: ${voiceName.length}`);

            if (isElevenLabs) {
                const apiKey = process.env.ELEVENLABS_API_KEY;
                if (!apiKey) throw new Error('ElevenLabs API Key is missing in environment');

                const voiceId = voiceName; // Assuming voiceName is the ID
                const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'xi-api-key': apiKey
                    },
                    body: JSON.stringify({
                        text: scene.audioScript,
                        model_id: "eleven_multilingual_v2",
                        voice_settings: {
                            stability: 0.5,
                            similarity_boost: 0.75
                        }
                    })
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(`ElevenLabs API failed: ${JSON.stringify(errorData)}`);
                }

                const buffer = await response.arrayBuffer();
                fs.writeFileSync(audioPath, Buffer.from(buffer));
                console.log(`[AssetNode] ElevenLabs TTS generated: ${audioPath}`);
            } else {
                // 2. Google Cloud TTS (Existing logic)
                // Determine correct gender
                const lowerVoice = voiceName.toLowerCase();
                let ssmlGender = gender || 'NEUTRAL';

                if (ssmlGender === 'NEUTRAL') {
                    if (lowerVoice.includes('male')) ssmlGender = 'MALE';
                    else if (lowerVoice.includes('female')) ssmlGender = 'FEMALE';
                    else {
                        // Pattern matching for standard Google voices if keywords missing
                        // Neural2-A (F), Neural2-B (F), Neural2-C (M)
                        if (lowerVoice.endsWith('-a') || lowerVoice.endsWith('-b') || lowerVoice.endsWith('-d') || lowerVoice.includes('leda') || lowerVoice.includes('gacrux') || lowerVoice.includes('kore')) {
                            ssmlGender = 'FEMALE';
                        } else if (lowerVoice.endsWith('-c') || lowerVoice.includes('orus') || lowerVoice.includes('enceladus') || lowerVoice.includes('charon')) {
                            ssmlGender = 'MALE';
                        }
                    }
                }

                const request = {
                    input: { text: scene.audioScript },
                    voice: {
                        languageCode: 'ko-KR',
                        name: voiceName,
                        ssmlGender: ssmlGender as any
                    },
                    audioConfig: {
                        audioEncoding: 'MP3' as const,
                        effectsProfileId: ['small-bluetooth-speaker-class-device'],
                        pitch: 0,
                        speakingRate: 1.0
                    },
                };

                const speechResponse = await ttsClient.synthesizeSpeech(request as any);
                const response = (speechResponse as any)[0];
                if (response.audioContent) {
                    await fs.promises.writeFile(audioPath, response.audioContent as Uint8Array, 'binary');
                    console.log(`[AssetNode] TTS generated: ${audioPath}`);
                } else {
                    throw new Error('No audio content received from TTS');
                }
            }
            return { sceneId: scene.id, type: 'audio', path: publicAudioPath };
        } catch (e: any) {
            console.error(`Failed to generate TTS for scene ${scene.id}`, e);
            if (!fs.existsSync(audioPath)) fs.writeFileSync(audioPath, 'tts error fallback');
            return { sceneId: scene.id, type: 'audio', path: publicAudioPath };
        }
    }
}

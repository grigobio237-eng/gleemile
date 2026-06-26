
import { ExecutionContext, VideoNodeConfig, WorkflowNode } from '@/lib/video-workflow/types';
import path from 'path';
import fs from 'fs';
import { spawn } from 'child_process';

export class VideoGenNode {
    static async execute(node: WorkflowNode, context: ExecutionContext): Promise<any> {
        const config = node.data as VideoNodeConfig;

        // Find input from previous node (AssetGenNode)
        const inputEdge = context.edges.find(e => e.target === node.id);
        const assetContext = inputEdge ? context.results[inputEdge.source] : null;

        if (!assetContext || !assetContext.assets) {
            throw new Error('Asset context is missing for VideoGenNode');
        }

        console.log(`[VideoGenNode] Generating REAL videos for ${assetContext.assets.length} assets...`);
        const videoClips: string[] = [];
        const outputDir = path.join(process.cwd(), 'public', 'output', context.projectId);

        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        // FFmpeg Helper function
        const generateVideoFromImage = (imagePath: string, audioPath: string, outputPath: string, duration: number): Promise<void> => {
            return new Promise((resolve, reject) => {
                // Ken Burns Effect (Zoom In)
                // cmd: ffmpeg -loop 1 -i image.png -i audio.mp3 -vf "zoompan=z='min(zoom+0.0015,1.5)':d=700:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)'" -c:v libx264 -t 5 -s 1080x1920 -pix_fmt yuv420p -shortest output.mp4
                // 복잡한 필터 대신 간단한 줌인 효과 사용

                // 이미지 인풋이 존재하는지 확인
                if (!fs.existsSync(imagePath)) {
                    return reject(new Error(`Image file not found: ${imagePath}`));
                }

                // 오디오 길이를 먼저 알아내거나, 오디오 길이에 맞춤 (-shortest)
                // 여기서는 오디오가 있으면 오디오 길이에 맞추고, 없으면 5초로 고정
                const inputs = ['-loop', '1', '-i', imagePath];
                if (fs.existsSync(audioPath)) {
                    // Audio input
                    inputs.push('-i', audioPath);
                } else {
                    // Silent audio if missing
                    inputs.push('-f', 'lavfi', '-i', 'anullsrc=channel_layout=stereo:sample_rate=44100');
                }

                // Simple Zoom In Effect (Top-left to Center or Center Zoom)
                // zoompan=z='min(zoom+0.0015,1.5)':d=125:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)'
                // d=duration in frames (25fps * 5s = 125)
                const vf = "zoompan=z='min(zoom+0.0015,1.5)':d=700:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)',scale=1080:1920";

                const args = [
                    ...inputs,
                    '-vf', vf,
                    '-c:v', 'libx264',
                    '-t', '5', // Force 5 seconds per clip for simplicity
                    '-s', '1080x1920',
                    '-pix_fmt', 'yuv420p',
                    '-y', // Overwrite
                    outputPath
                ];

                console.log(`[FFmpeg] Executing: ffmpeg ${args.join(' ')}`);

                const ffmpeg = spawn('ffmpeg', args);

                // Stream stderr to console instead of buffering infinite string
                ffmpeg.stderr.on('data', (data) => {
                    // console.log(`[FFmpeg] ${data.toString()}`); // Optional: Log to console if needed
                    // Just keeping it alive without crashing process memory.
                });

                ffmpeg.on('close', (code) => {
                    if (code === 0) {
                        resolve();
                    } else {
                        console.error(`[FFmpeg Error] Process exited with code ${code}`);
                        reject(new Error(`FFmpeg process exited with code ${code}`));
                    }
                });
            });
        };

        for (const asset of assetContext.assets) {
            if (asset.type !== 'image') continue;

            const assetId = asset.sceneId;
            // Find corresponding audio asset
            const audioAsset = assetContext.assets.find((a: any) => a.sceneId === assetId && a.type === 'audio');

            // Paths
            const imageSystemPath = path.join(process.cwd(), 'public', asset.path);
            const audioSystemPath = audioAsset ? path.join(process.cwd(), 'public', audioAsset.path) : '';

            // Output path for AI Video (before audio mix)
            const rawVideoPath = path.join(outputDir, `raw_video_scene_${assetId}.mp4`);
            const finalVideoPath = path.join(outputDir, `video_scene_${assetId}.mp4`);
            const publicVideoPath = `/output/${context.projectId}/video_scene_${assetId}.mp4`;

            try {
                if (!fs.existsSync(finalVideoPath)) {
                    console.log(`[VideoGenNode] Generating AI Video for scene ${assetId} via Veo 3.1...`);

                    // 1. AI Video Generation (Image-to-Video)
                    const { AIVideoEngine } = await import('../../ai/ai-video-engine');
                    await AIVideoEngine.generateVideoFromImage(imageSystemPath, rawVideoPath);

                    // 2. Mix AI Video with Audio via FFmpeg
                    console.log(`[VideoGenNode] Mixing Audio for scene ${assetId}...`);
                    await this.mixAudio(rawVideoPath, audioSystemPath, finalVideoPath);

                    // Clean up raw video
                    if (fs.existsSync(rawVideoPath)) fs.unlinkSync(rawVideoPath);
                }
                videoClips.push(publicVideoPath);
            } catch (e) {
                console.error(`[VideoGenNode] Failed AI Video for scene ${assetId}, falling back to static`, e);
                // Fallback: Static Ken Burns if Veo fails (previous logic)
                await this.runFFmpeg(imageSystemPath, audioSystemPath, finalVideoPath, 5);
                videoClips.push(publicVideoPath);
            }
        }

        return { videoClips };
    }

    static async generateVideoClip(sceneId: number, imagePath: string, audioPath: string, projectId: string, outputDir: string): Promise<string | null> {
        const rawVideoPath = path.join(outputDir, `raw_video_scene_${sceneId}.mp4`);
        const finalVideoPath = path.join(outputDir, `video_scene_${sceneId}.mp4`);
        const publicVideoPath = `/output/${projectId}/video_scene_${sceneId}.mp4`;

        try {
            // Force regenerate logic is handled by the caller (deleting file), 
            // but we can add a check here for safety.
            if (!fs.existsSync(finalVideoPath)) {
                console.log(`[VideoGenNode] API Call: Generating AI Video for scene ${sceneId} via Veo 3.1...`);

                // 1. AI Video Generation
                const { AIVideoEngine } = await import('../../ai/ai-video-engine');
                await AIVideoEngine.generateVideoFromImage(imagePath, rawVideoPath);

                // 2. Mix Audio
                await this.mixAudio(rawVideoPath, audioPath, finalVideoPath);

                // Clean up
                if (fs.existsSync(rawVideoPath)) fs.unlinkSync(rawVideoPath);
            }
            return publicVideoPath;
        } catch (e) {
            console.error(`[VideoGenNode] AI Video failed for scene ${sceneId}, falling back`, e);
            // Fallback to static if Veo fails
            try {
                await this.runFFmpeg(imagePath, audioPath, finalVideoPath, 5);
                return publicVideoPath;
            } catch (fallbackError) {
                console.error(`[VideoGenNode] Fallback also failed for scene ${sceneId}`, fallbackError);
                return null;
            }
        }
    }

    static async mixAudio(videoPath: string, audioPath: string, outputPath: string): Promise<void> {
        return new Promise((resolve, reject) => {
            // cmd: ffmpeg -i video.mp4 -i audio.mp3 -c:v copy -c:a aac -shortest output.mp4
            // cmd: ffmpeg -i video.mp4 -i audio.mp3 -vf "scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920" -c:v libx264 -c:a aac -shortest output.mp4
            // We force re-encoding to ensure the layout is perfect 9:16
            const vf = "scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920";

            const args = [
                '-i', videoPath,
                '-i', audioPath || 'anullsrc',
                '-vf', vf,
                '-c:v', 'libx264',
                '-c:a', 'aac',
                '-map', '0:v:0',
                '-map', '1:a:0',
                '-shortest',
                '-y',
                outputPath
            ];

            if (!audioPath) {
                // If no audio, use null source
                args[2] = 'f:lavfi'; // This is tricky in simple array, let's adjust
                // For simplicity, if no audio, just copy video
                const simpleArgs = ['-i', videoPath, '-c', 'copy', '-y', outputPath];
                const ffmpeg = spawn('ffmpeg', simpleArgs);
                ffmpeg.on('close', code => code === 0 ? resolve() : reject());
                return;
            }

            const ffmpeg = spawn('ffmpeg', args);
            ffmpeg.on('close', code => code === 0 ? resolve() : reject());
        });
    }

    static runFFmpeg(imagePath: string, audioPath: string, outputPath: string, duration: number): Promise<void> {
        return new Promise((resolve, reject) => {
            if (!fs.existsSync(imagePath)) {
                return reject(new Error(`Image file not found: ${imagePath}`));
            }

            const inputs = ['-loop', '1', '-i', imagePath];
            if (fs.existsSync(audioPath)) {
                inputs.push('-i', audioPath);
            } else {
                inputs.push('-f', 'lavfi', '-i', 'anullsrc=channel_layout=stereo:sample_rate=44100');
            }

            // Simple Zoom In Effect with Aspect Ratio Correction (No stretching)
            // 9:16 비율로 비율 유지 후 확대하여 채우고(crop), 줌 효과 적용
            const vf = "scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,zoompan=z='min(zoom+0.0015,1.5)':d=700:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)'";

            const args = [
                ...inputs,
                '-vf', vf,
                '-c:v', 'libx264',
                '-t', '5',
                '-s', '1080x1920',
                '-pix_fmt', 'yuv420p',
                '-y',
                outputPath
            ];

            console.log(`[FFmpeg] Executing: ffmpeg ${args.join(' ')}`);

            const ffmpeg = spawn('ffmpeg', args);

            ffmpeg.stderr.on('data', () => { }); // Swallow stderr to prevent crash

            ffmpeg.on('close', (code) => {
                if (code === 0) {
                    resolve();
                } else {
                    console.error(`[FFmpeg Error] Process exited with code ${code}`);
                    reject(new Error(`FFmpeg process exited with code ${code}`));
                }
            });
        });
    }
}

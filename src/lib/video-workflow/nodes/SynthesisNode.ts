
import { ExecutionContext, SynthesisNodeConfig, WorkflowNode } from '@/lib/video-workflow/types';
import path from 'path';
import fs from 'fs';
import { spawn } from 'child_process';

export class SynthesisNode {
    static async execute(node: WorkflowNode, context: ExecutionContext): Promise<any> {
        const config = node.data as SynthesisNodeConfig;

        // Find input from previous node (VideoGenNode)
        const inputEdge = context.edges.find(e => e.target === node.id);
        const result = inputEdge ? context.results[inputEdge.source] : null;

        let videoClips = config.videoClips;
        if (result && result.videoClips) {
            videoClips = result.videoClips;
        }

        if (!videoClips || videoClips.length === 0) {
            throw new Error('[SynthesisNode] No video clips provided for synthesis');
        }

        const transitionType = config.transitionType || 'none';
        const transitionDuration = config.transitionDuration || 0.5;

        console.log(`[SynthesisNode] Combining ${videoClips.length} clips (Transition: ${transitionType}, Duration: ${transitionDuration}s)...`);

        const outputDir = path.join(process.cwd(), 'public', 'output', context.projectId);
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }
        const finalPath = path.join(outputDir, `final_output.mp4`);

        const clipPaths = videoClips.map((clip: string) => path.join(process.cwd(), 'public', clip).replace(/\\/g, '/'));

        if (transitionType === 'none' || videoClips.length < 2) {
            // Use existing concat logic for performance
            await this.concatSimple(clipPaths, outputDir, finalPath);
        } else {
            // Use complex filter for transitions
            await this.concatWithTransitions(clipPaths, transitionType, transitionDuration, finalPath);
        }

        return {
            finalVideoUrl: `/output/${context.projectId}/final_output.mp4`,
            status: 'completed'
        };
    }

    private static async concatSimple(clipPaths: string[], outputDir: string, finalPath: string): Promise<void> {
        const fileListPath = path.join(outputDir, 'filelist.txt');
        const fileContent = clipPaths.map(p => `file '${p}'`).join('\n');
        fs.writeFileSync(fileListPath, fileContent);

        await new Promise<void>((resolve, reject) => {
            const args = ['-f', 'concat', '-safe', '0', '-i', fileListPath, '-c', 'copy', '-y', finalPath];
            const ffmpeg = spawn('ffmpeg', args);
            let stderr = '';
            ffmpeg.stderr.on('data', d => stderr += d);
            ffmpeg.on('close', (code) => {
                if (code === 0) resolve();
                else reject(new Error(`FFmpeg Concat failed: ${stderr}`));
            });
        });
        if (fs.existsSync(fileListPath)) fs.unlinkSync(fileListPath);
    }

    private static async concatWithTransitions(clipPaths: string[], type: string, duration: number, finalPath: string): Promise<void> {
        // 1. Get durations of all clips
        const durations: number[] = [];
        for (const p of clipPaths) {
            durations.push(await this.getDuration(p));
        }

        // 2. Build FFmpeg command with filter_complex
        // [0:v][1:v]xfade=transition=fade:duration=1:offset=4[v1];
        // [v1][2:v]xfade=transition=fade:duration=1:offset=8[v2];
        const args: string[] = [];
        clipPaths.forEach(p => {
            args.push('-i', p);
        });

        let filter = '';
        let lastVTag = '[0:v]';
        let lastATag = '[0:a]';
        let currentOffset = 0;

        for (let i = 1; i < clipPaths.length; i++) {
            currentOffset += durations[i - 1] - duration;
            const nextVTag = `[v${i}]`;
            const nextATag = `[a${i}]`;

            filter += `${lastVTag}[${i}:v]xfade=transition=${type}:duration=${duration}:offset=${currentOffset}${nextVTag};`;
            filter += `${lastATag}[${i}:a]acrossfade=d=${duration}${nextATag};`;

            lastVTag = nextVTag;
            lastATag = nextATag;
        }

        args.push('-filter_complex', filter);
        const finalVTag = `[v${clipPaths.length - 1}]`;
        const finalATag = `[a${clipPaths.length - 1}]`;
        args.push('-map', finalVTag, '-map', finalATag);
        args.push('-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-y', finalPath);

        console.log('[SynthesisNode] FFmpeg Complex Filter:', args.join(' '));

        await new Promise<void>((resolve, reject) => {
            const ffmpeg = spawn('ffmpeg', args);
            let stderr = '';
            ffmpeg.stderr.on('data', d => stderr += d);
            ffmpeg.on('close', code => {
                if (code === 0) resolve();
                else {
                    const lines = stderr.split('\n');
                    const errorMsg = lines.filter(l => l.includes('Error') || l.includes('failed') || l.includes('exist')).join('\n');
                    reject(new Error(`FFmpeg Synthesis with Transition failed: ${errorMsg || stderr.slice(-500)}`));
                }
            });
        });
    }

    private static async getDuration(filePath: string): Promise<number> {
        return new Promise((resolve, reject) => {
            const ffprobe = spawn('ffprobe', [
                '-v', 'error',
                '-show_entries', 'format=duration',
                '-of', 'default=noprint_wrappers=1:nokey=1',
                filePath
            ]);
            let output = '';
            ffprobe.stdout.on('data', d => output += d);
            ffprobe.on('close', code => {
                if (code === 0) resolve(parseFloat(output.trim()));
                else reject(new Error(`ffprobe failed with code ${code}`));
            });
        });
    }
}

import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import dbConnect from '../../db';
import AdminSettings from '@/models/AdminSettings';

let _genAI: GoogleGenerativeAI | null = null;
let _studioGenAI: GoogleGenerativeAI | null = null;

export const getGenAI = () => {
    if (!_genAI) _genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
    return _genAI;
};

export const getStudioGenAI = () => {
    if (!_studioGenAI) {
        const key = process.env.GEMINI_STUDIO_API_KEY || process.env.GEMINI_API_KEY || '';
        _studioGenAI = new GoogleGenerativeAI(key);
    }
    return _studioGenAI;
};

export class GeminiCore {
    private static availableTextModels: string[] = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-pro'];
    private static availableImageModels: string[] = ['imagen-3.0-generate-001'];
    
    private static sortModelsByPriority(models: string[]): string[] {
        const getPriority = (name: string) => {
            if (name === 'gemini-2.5-flash') return 0;
            if (name.includes('2.5-flash')) return 1;
            if (name.includes('2.5-pro')) return 2;
            if (name.includes('2.0')) return 3;
            if (name.includes('pro')) return 4;
            if (name.includes('flash')) return 5;
            return 6;
        };
        return [...models].sort((a, b) => getPriority(a) - getPriority(b));
    }

    private static get isInitialized(): boolean {
        return (global as any)._geminiInitialized || false;
    }
    private static set isInitialized(val: boolean) {
        (global as any)._geminiInitialized = val;
    }

    private static get initializationPromise(): Promise<void> | null {
        return (global as any)._geminiInitPromise || null;
    }
    private static set initializationPromise(val: Promise<void> | null) {
        (global as any)._geminiInitPromise = val;
    }

    public static async initializeDynamicModels(forceRefresh = false): Promise<void> {
        if (this.isInitialized && !forceRefresh) return;

        const currentPromise = this.initializationPromise;
        if (currentPromise && !forceRefresh) return currentPromise;

        this.initializationPromise = (async () => {
            try {
                if (this.availableTextModels.length === 0) {
                    this.availableTextModels = ['gemini-2.5-flash', 'gemini-2.5-pro'];
                }

                await dbConnect();
                const settings = await (AdminSettings as any).findOne().sort({ createdAt: -1 });

                const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
                const isStale = !settings?.ai?.lastModelRefresh || settings.ai.lastModelRefresh < oneDayAgo;

                if (!isStale && !forceRefresh && settings?.ai?.availableTextModels?.length > 0) {
                    this.availableTextModels = this.sortModelsByPriority(settings.ai.availableTextModels);
                    this.availableImageModels = settings.ai.availableImageModels || [];
                    this.isInitialized = true;
                    return;
                }

                const discoveryKey = process.env.GEMINI_STUDIO_API_KEY || process.env.GEMINI_API_KEY;

                if (!discoveryKey) {
                    this.isInitialized = true;
                    return;
                }

                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 5000);

                try {
                    const response = await fetch(`https://generativelanguage.googleapis.com/v1/models?key=${discoveryKey}`, {
                        signal: controller.signal
                    });
                    const data = await response.json();
                    clearTimeout(timeoutId);

                    if (data.models) {
                        const allModels: any[] = data.models;

                        const textModels = allModels
                            .filter(m => m.supportedGenerationMethods.includes('generateContent') && m.name.includes('gemini'))
                            .map(m => m.name.replace('models/', ''))
                            .sort((a, b) => {
                                const getPriority = (name: string) => {
                                    if (name === 'gemini-2.5-flash') return 0;
                                    if (name.includes('2.5-flash')) return 1;
                                    if (name.includes('2.5-pro')) return 2;
                                    if (name.includes('2.0')) return 3;
                                    if (name.includes('pro')) return 4;
                                    if (name.includes('flash')) return 5;
                                    return 6;
                                };
                                return getPriority(a) - getPriority(b);
                            });

                        const imageModels = allModels
                            .filter(m => m.name.includes('imagen'))
                            .map(m => m.name.replace('models/', ''));

                        if (textModels.length > 0) this.availableTextModels = this.sortModelsByPriority(textModels);
                        if (imageModels.length > 0) this.availableImageModels = imageModels;

                        (AdminSettings as any).findOneAndUpdate(
                            {},
                            {
                                $set: {
                                    'ai.availableTextModels': this.availableTextModels,
                                    'ai.availableImageModels': this.availableImageModels,
                                    'ai.lastModelRefresh': new Date()
                                }
                            },
                            { upsert: true }
                        ).catch((e: any) => console.error('[Gemini] DB update error:', e));
                    }
                } catch (fetchErr) {
                    console.warn('[Gemini] Discovery fetch failed or timed out.');
                }

                this.isInitialized = true;
            } catch (err: any) {
                console.error('[Gemini] Failed to initialize dynamic models:', err.message);
                this.isInitialized = true;
            } finally {
                this.initializationPromise = null;
            }
        })();

        return this.initializationPromise;
    }

    public static async getTieredModels(type: 'text' | 'image' = 'text'): Promise<string[]> {
        if (!this.isInitialized) await this.initializeDynamicModels();
        return type === 'text' ? this.availableTextModels : this.availableImageModels;
    }

    public static async generateWithFallback(
        prompt: string | any[],
        systemInstruction?: string,
        temperature: number = 0.7
    ): Promise<string> {
        let models = await this.getTieredModels('text');
        
        if (models.length === 0) {
            await this.initializeDynamicModels(false);
            models = await this.getTieredModels('text');
        }

        const effectiveModels = models.length > 0 ? this.sortModelsByPriority(models) : ['gemini-2.5-flash', 'gemini-2.5-pro'];
        let lastError: any;

        for (let i = 0; i < effectiveModels.length; i++) {
            const modelName = effectiveModels[i];
            try {
                const text = await this.executeModelRequest(modelName, prompt, systemInstruction, temperature);
                if (text) return text;
            } catch (error: any) {
                lastError = error;
                if (i === effectiveModels.length - 1 && models.length > 0) {
                    await this.initializeDynamicModels(true);
                    const freshModels = await this.getTieredModels('text');
                    const backupModel = freshModels[0] || 'gemini-2.5-flash';
                    try {
                        const emergencyText = await this.executeModelRequest(backupModel, prompt, systemInstruction, temperature);
                        if (emergencyText) return emergencyText;
                    } catch (e) {
                        lastError = e;
                    }
                }
            }
        }

        throw lastError || new Error('All AI models failed');
    }

    public static async executeModelRequest(
        modelName: string,
        prompt: string | any[],
        systemInstruction?: string,
        temperature: number = 0.7
    ): Promise<string | null> {
        const engines = [getGenAI(), getStudioGenAI()];
        let lastError: any;

        for (const engine of engines) {
            try {
                const model = engine.getGenerativeModel({
                    model: modelName,
                    safetySettings: [
                        { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
                        { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
                        { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
                        { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
                    ],
                    systemInstruction: systemInstruction ? { parts: [{ text: systemInstruction }], role: "system" } : undefined
                });

                const promptParts = Array.isArray(prompt)
                    ? prompt.map(p => typeof p === 'string' ? { text: p } : p)
                    : [{ text: prompt }];

                const result = await model.generateContent({
                    contents: [{ role: 'user', parts: promptParts }],
                    generationConfig: { temperature }
                });
                const response = await result.response;
                const text = response.text();

                if (text) return text;
            } catch (error: any) {
                lastError = error;
                continue;
            }
        }
        throw lastError || new Error(`Execution failed for ${modelName}`);
    }
}

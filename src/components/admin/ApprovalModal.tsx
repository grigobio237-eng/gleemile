'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Loader2, Check, X, FileText, Image as ImageIcon, Video } from 'lucide-react';
import Image from 'next/image';

interface VideoProject {
    _id: string;
    topic: string;
    status: string;
    script?: string;
    youtubeUrl?: string; // Preview URL
    logs: string[];
}

interface ApprovalModalProps {
    project: VideoProject | null;
    isOpen: boolean;
    onClose: () => void;
    onApprove: (id: string, action: string, feedback?: any) => Promise<void>;
}

export default function ApprovalModal({ project, isOpen, onClose, onApprove }: ApprovalModalProps) {
    const [loading, setLoading] = useState(false);
    const [scriptEdits, setScriptEdits] = useState('');
    const [rejectReason, setRejectReason] = useState('');

    if (!project) return null;

    // Initialize script edit state when modal opens
    if (project.status === 'script_generated' && !scriptEdits && project.script) {
        try {
            const scriptJson = JSON.parse(project.script);
            setScriptEdits(JSON.stringify(scriptJson, null, 2));
        } catch (e) {
            setScriptEdits(project.script);
        }
    }

    const handleAction = async (action: string) => {
        setLoading(true);
        try {
            let feedback = {};
            if (action === 'approve_script') {
                feedback = { script: scriptEdits };
            } else if (action === 'reject') {
                feedback = { reason: rejectReason };
            }

            await onApprove(project._id, action, feedback);
            onClose();
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const renderContent = () => {
        switch (project.status) {
            case 'script_generated':
                return (
                    <div className="space-y-4">
                        <div className="flex items-center space-x-2">
                            <FileText className="text-primary" />
                            <h3 className="font-semibold">대본 검수</h3>
                        </div>
                        <p className="text-sm text-foreground/70">gleemile이 생성한 대본입니다. 수정이 필요하면 직접 편집하세요.</p>
                        <Textarea
                            value={scriptEdits}
                            onChange={(e) => setScriptEdits(e.target.value)}
                            className="h-[300px] font-mono text-sm"
                        />
                        <div className="flex justify-end space-x-2">
                            <Button variant="outline" onClick={() => handleAction('reject')} disabled={loading}>
                                <X className="mr-2 h-4 w-4" /> 반려 (재생성)
                            </Button>
                            <Button onClick={() => handleAction('approve_script')} disabled={loading}>
                                <Check className="mr-2 h-4 w-4" /> 대본 승인 (자산 생성 시작)
                            </Button>
                        </div>
                    </div>
                );

            case 'assets_generated':
                let scriptData: any = {};
                try {
                    scriptData = typeof project.script === 'string' ? JSON.parse(project.script) : project.script;
                } catch (e) {
                    scriptData = { segments: [] };
                }

                return (
                    <div className="space-y-4">
                        <div className="flex items-center space-x-2">
                            <ImageIcon className="text-secondary" />
                            <h3 className="font-semibold">자산 검수</h3>
                        </div>
                        <div className="space-y-4 max-h-[400px] overflow-y-auto p-2 border rounded">
                            {scriptData.segments && scriptData.segments.map((segment: any, idx: number) => (
                                <div key={idx} className="flex gap-4 p-3 bg-surface rounded border">
                                    <div className="w-1/3 space-y-2">
                                        {segment.image_path ? (
                                            <div className="relative aspect-[9/16] bg-black rounded overflow-hidden shadow-sm">
                                                <Image width={800} height={800} style={{ width: '100%', height: '100%', objectFit: 'inherit' }} unoptimized 
                                                    src={`/api/admin/video/assets?path=${encodeURIComponent(segment.image_path)}`}
                                                    alt={`Scene ${idx}`}
                                                    className="object-cover w-full h-full"
                                                />
                                            </div>
                                        ) : (
                                            <div className="w-full h-32 bg-gray-200 flex items-center justify-center text-xs">No Image</div>
                                        )}
                                        {segment.audio_path && (
                                            <audio controls className="w-full h-8" src={`/api/admin/video/assets?path=${encodeURIComponent(segment.audio_path)}`} />
                                        )}
                                    </div>
                                    <div className="w-2/3 text-sm space-y-1">
                                        <Badge variant="outline" className="mb-1">Scene {idx + 1}</Badge>
                                        <p className="font-medium text-obsidian">{segment.text || segment.narration}</p>
                                        <p className="text-xs text-foreground/70 italic mt-2">Visual Prompt: {segment.visual_cue}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="flex justify-end space-x-2">
                            <Button variant="outline" onClick={() => handleAction('reject')} disabled={loading}>
                                <X className="mr-2 h-4 w-4" /> 반려
                            </Button>
                            <Button onClick={() => handleAction('approve_assets')} disabled={loading}>
                                <Check className="mr-2 h-4 w-4" /> 자산 승인 (영상 렌더링 시작)
                            </Button>
                        </div>
                    </div>
                );

            case 'review_ready':
                return (
                    <div className="space-y-4">
                        <div className="flex items-center space-x-2">
                            <Video className="text-green-500" />
                            <h3 className="font-semibold">최종 영상 검수</h3>
                        </div>
                        <div className="aspect-video bg-black rounded-md flex items-center justify-center overflow-hidden">
                            {project.youtubeUrl ? (
                                <video
                                    src={project.youtubeUrl}
                                    controls
                                    className="w-full h-full"
                                    preload="metadata"
                                >
                                    Your browser does not support the video tag.
                                </video>
                            ) : (
                                <p className="text-white">영상 URL이 없습니다.</p>
                            )}
                        </div>
                        <div className="flex justify-between items-center">
                            {project.youtubeUrl && (
                                <Button variant="secondary" size="sm" asChild>
                                    <a href={project.youtubeUrl} download target="_blank" rel="noopener noreferrer">
                                        <div className="flex items-center">
                                            <Video className="mr-2 h-4 w-4" />
                                            영상 다운로드
                                        </div>
                                    </a>
                                </Button>
                            )}
                            <div className="flex space-x-2 ml-auto">
                                <Button variant="outline" onClick={() => handleAction('reject')} disabled={loading}>
                                    <X className="mr-2 h-4 w-4" /> 반려
                                </Button>
                                <Button onClick={() => handleAction('approve_video')} disabled={loading}>
                                    <Check className="mr-2 h-4 w-4" /> 최종 승인 (유튜브 업로드)
                                </Button>
                            </div>
                        </div>
                    </div>
                );

            default:
                return <div>검수할 항목이 없습니다. 현재 상태: {project.status}</div>;
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>프로젝트 검수: {project.topic}</DialogTitle>
                </DialogHeader>

                {renderContent()}

            </DialogContent>
        </Dialog>
    );
}

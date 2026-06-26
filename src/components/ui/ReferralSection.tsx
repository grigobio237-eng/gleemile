'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { User, Users, Share2, Copy, Check, Link as LinkIcon } from 'lucide-react';

interface ReferralStats {
    referralCount: number;
    totalEarned: number;
    referrals: Array<{
        id: string;
        name: string;
        email: string;
        grade: string;
        joinedAt: string;
    }>;
}

export default function ReferralSection({ referralCode }: { referralCode?: string }) {
    const [stats, setStats] = useState<ReferralStats>({ referralCount: 0, totalEarned: 0, referrals: [] });
    const [loading, setLoading] = useState(false);
    const [copied, setCopied] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            setLoading(true);
            const res = await fetch('/api/me/referrals');
            if (res.ok) {
                const data = await res.json();
                setStats(data);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const link = typeof window !== 'undefined' ? `${window.location.origin}/auth/signup?ref=${referralCode}` : '';

    const handleShare = async () => {
        // Mobile Native Share if available
        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'Youniqle 초대',
                    text: 'Youniqle에 초대합니다! 가입하고 혜택을 받아보세요.',
                    url: link,
                });
                return;
            } catch (err) {
                console.log('Share canceled or failed', err);
            }
        }
    };

    const copyLink = async () => {
        if (!referralCode) return;

        // 1. Try Modern API
        if (navigator.clipboard && window.isSecureContext) {
            try {
                await navigator.clipboard.writeText(link);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
                return;
            } catch (err) {
                console.error('Clipboard API failed', err);
            }
        }

        // 2. Fallback using the visible input
        if (inputRef.current) {
            try {
                inputRef.current.select();
                inputRef.current.setSelectionRange(0, 99999); // For mobile

                const successful = document.execCommand('copy');
                if (successful) {
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                    return;
                }
            } catch (err) {
                console.error('ExecCommand failed', err);
            }
        }

        // 3. Final fallback logic is implicit: text remains selected in the input for manual copy
        alert('링크가 선택되었습니다. Ctrl+C를 눌러 복사해주세요.');
    };

    return (
        <Card className="shadow-lg mt-6">
            <CardHeader>
                <CardTitle className="text-lg flex items-center text-secondary">
                    <User className="h-5 w-5 mr-2" />
                    친구 초대 혜택
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* 새로운 안내 문구 */}
                <div className="bg-gradient-to-r from-indigo-50 to-blue-50 p-5 rounded-xl border border-indigo-100">
                    <h4 className="font-bold text-indigo-900 mb-2 text-lg">친구 초대하고 최대 3% 적립받기!</h4>
                    <p className="text-sm text-secondary mb-4 leading-relaxed">
                        나의 초대로 가입한 친구가 구매하면 <b>구매 금액의 2%</b>가 적립되고,<br />
                        친구가 초대한 사람이 구매하면 <b>1%</b>가 나에게 추가 적립됩니다!
                    </p>

                    <div className="flex justify-center">
                        <Dialog>
                            <DialogTrigger asChild>
                                <Button
                                    className="bg-secondary hover:bg-secondary w-full md:w-auto"
                                    onClick={handleShare}
                                >
                                    <Share2 className="h-4 w-4 mr-2" />
                                    친구 초대 링크 공유하기
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-md">
                                <DialogHeader>
                                    <DialogTitle>친구 초대 링크 공유</DialogTitle>
                                </DialogHeader>
                                <div className="flex items-center space-x-2 mt-4">
                                    <div className="grid flex-1 gap-2">
                                        <Input
                                            ref={inputRef}
                                            id="link"
                                            defaultValue={link}
                                            readOnly
                                            className="bg-surface"
                                        />
                                    </div>
                                    <Button onClick={copyLink} size="sm" className="px-3">
                                        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                                        <span className="sr-only">Copy</span>
                                    </Button>
                                </div>
                                <div className="text-xs text-foreground/70 mt-2">
                                    버튼을 눌러 링크를 복사하거나, 링크를 직접 선택하여 복사(Ctrl+C)하세요.
                                </div>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>

                {/* 모니터링 대시보드 */}
                <div>
                    <h5 className="font-semibold text-obsidian mb-4 flex items-center">
                        <Users className="h-4 w-4 mr-2" />
                        나의 초대 현황
                    </h5>

                    <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="bg-surface p-4 rounded-lg text-center">
                            <div className="text-foreground/70 text-xs mb-1">총 초대한 친구</div>
                            <div className="font-bold text-obsidian text-xl">{stats.referralCount}명</div>
                        </div>
                        <div className="bg-indigo-50 p-4 rounded-lg text-center">
                            <div className="text-secondary text-xs mb-1">누적 초대 보상</div>
                            <div className="font-bold text-secondary text-xl">{stats.totalEarned.toLocaleString()}P</div>
                        </div>
                    </div>

                    {/* 친구 목록 (접기/펼치기 UI가 좋겠지만 일단 리스트로) */}
                    {stats.referrals.length > 0 ? (
                        <div className="border rounded-lg overflow-hidden">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-surface text-foreground/70 font-medium">
                                    <tr>
                                        <th className="px-4 py-3">친구</th>
                                        <th className="px-4 py-3">가입일</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {stats.referrals.slice(0, 5).map((ref) => (
                                        <tr key={ref.id} className="hover:bg-surface">
                                            <td className="px-4 py-3">
                                                <div className="font-medium text-obsidian">{ref.name}</div>
                                                <div className="text-xs text-foreground/70">{ref.email}</div>
                                            </td>
                                            <td className="px-4 py-3 text-foreground/70">
                                                {new Date(ref.joinedAt).toLocaleDateString()}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {stats.referrals.length > 5 && (
                                <div className="p-2 text-center text-xs text-foreground/70 bg-surface border-t">
                                    최근 5명만 표시됩니다.
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="text-center py-8 text-foreground/70 bg-surface rounded-lg text-sm">
                            아직 초대한 친구가 없습니다.<br />
                            링크를 공유해서 혜택을 받아보세요!
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

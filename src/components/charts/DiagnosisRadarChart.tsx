import React from 'react';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, Tooltip } from 'recharts';

export interface RadarDataPoint {
    subject: string;
    score: number;
    fullMark: number;
}

interface DiagnosisRadarChartProps {
    data: RadarDataPoint[];
    color?: string;
    className?: string;
}

export function DiagnosisRadarChart({ data, color = '#2563eb', className }: DiagnosisRadarChartProps) {
    const [mounted, setMounted] = React.useState(false);

    React.useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return <div className={`w-full h-full ${className}`} />;

    // Translate English category/subject to beautiful premium Korean labels
    const TRANSLATION_MAP: Record<string, string> = {
        'PHYSICAL': '신체 리듬',
        'MENTAL': '정신 리듬',
        'SLEEP': '수면 리듬',
        'LIFESTYLE': '생활 리듬',
        'physical': '신체 리듬',
        'mental': '정신 리듬',
        'sleep': '수면 리듬',
        'lifestyle': '생활 리듬'
    };

    const formattedData = (data || []).map(item => {
        const rawSubject = item.subject || (item as any).category || '';
        const translatedSubject = TRANSLATION_MAP[rawSubject] || rawSubject;
        const scoreVal = Number(item.score);
        return {
            ...item,
            subject: translatedSubject,
            score: isNaN(scoreVal) || !isFinite(scoreVal) ? 0 : scoreVal,
            fullMark: Number(item.fullMark) || 100
        };
    });

    // 레이더 차트는 최소 3개 이상의 데이터 포인트가 있어야 정상적인 다각형(SVG Path) 생성이 가능합니다.
    // 3개 미만이거나 유효하지 않은 데이터가 유입되면 Recharts가 렌더링 중 오류를 발생시키므로 안전 차단 처리를 합니다.
    if (formattedData.length < 3) {
        return (
            <div className={`w-full h-full flex flex-col items-center justify-center text-center p-4 ${className || ''}`}>
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-slate-100 flex items-center justify-center mb-3">
                    <span className="text-lg md:text-xl">📊</span>
                </div>
                <p className="text-xs md:text-sm font-bold text-foreground/70 mb-1">분석 데이터가 부족합니다</p>
                <p className="text-[10px] md:text-xs text-foreground/70 break-keep">정밀 리듬체크를 완료하시면 4가지 핵심 영역의<br/>회복 탄력성 밸런스를 확인할 수 있습니다.</p>
            </div>
        );
    }

    return (
        <div className={`w-full h-full ${className}`}>
            <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="75%" data={formattedData}>
                    <PolarGrid stroke="#cbd5e1" strokeWidth={1} strokeDasharray="3 3" />
                    <PolarAngleAxis
                        dataKey="subject"
                        tick={{ fill: '#1e293b', fontSize: 9.5, fontWeight: 'bold' }}
                    />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                    <Radar
                        name="리듬 점수"
                        dataKey="score"
                        stroke="#0D9488"
                        strokeWidth={2}
                        fill="#14B8A6"
                        fillOpacity={0.35}
                        dot={{ r: 3.5, fill: '#0E3A3A', stroke: '#2DD4BF', strokeWidth: 1.5 }}
                    />
                    <Tooltip
                        contentStyle={{
                            borderRadius: '14px',
                            border: '1px solid rgba(14, 58, 58, 0.08)',
                            boxShadow: '0 8px 24px rgba(14, 58, 58, 0.1)',
                            backgroundColor: 'rgba(255, 255, 255, 0.95)',
                            backdropFilter: 'blur(4px)',
                            color: '#0E3A3A',
                            fontSize: '10.5px',
                            fontWeight: 'bold'
                        }}
                        itemStyle={{ color: '#0D9488', fontWeight: 'bold' }}
                    />
                </RadarChart>
            </ResponsiveContainer>
        </div>
    );
}


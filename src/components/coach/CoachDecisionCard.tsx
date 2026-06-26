'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle2, ShieldAlert, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PlayerStatus {
  id: string;
  name: string;
  status: 'GREEN' | 'YELLOW' | 'RED';
  reason?: string;
  fatigueLevel: number; // 1-10
}

interface CoachDecisionCardProps {
  teamName: string;
  players: PlayerStatus[];
  onPlayerClick?: (playerId: string) => void;
}

export default function CoachDecisionCard({ teamName, players, onPlayerClick }: CoachDecisionCardProps) {
  const greenCount = players.filter(p => p.status === 'GREEN').length;
  const yellowCount = players.filter(p => p.status === 'YELLOW').length;
  const redCount = players.filter(p => p.status === 'RED').length;

  const attentionPlayers = players.filter(p => p.status !== 'GREEN');

  return (
    <Card className="bg-white border-none shadow-2xl rounded-[32px] overflow-hidden">
      <div className="bg-obsidian px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Badge className="bg-white/20 text-white border-none tracking-widest text-[10px] uppercase font-black">
            10-Sec Dashboard
          </Badge>
          <h2 className="text-white font-serif text-xl">{teamName} 상태 브리핑</h2>
        </div>
        <div className="text-white/60 text-xs font-medium">
          {new Date().toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })} 훈련 전 확인
        </div>
      </div>

      <CardContent className="p-6 md:p-8 space-y-8 bg-[#FDFBF7]">
        {/* 신호등 요약 */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 flex flex-col items-center justify-center text-center">
            <CheckCircle2 className="w-8 h-8 text-secondary mb-2" />
            <span className="text-[10px] font-black text-secondary/60 uppercase tracking-widest mb-1">Optimal</span>
            <span className="text-2xl font-black text-secondary">{greenCount}명</span>
          </div>
          
          <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex flex-col items-center justify-center text-center">
            <AlertCircle className="w-8 h-8 text-primary mb-2" />
            <span className="text-[10px] font-black text-primary/60 uppercase tracking-widest mb-1">Warning</span>
            <span className="text-2xl font-black text-primary">{yellowCount}명</span>
          </div>

          <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4 flex flex-col items-center justify-center text-center">
            <ShieldAlert className="w-8 h-8 text-rose-500 mb-2" />
            <span className="text-[10px] font-black text-rose-600/60 uppercase tracking-widest mb-1">Danger</span>
            <span className="text-2xl font-black text-rose-600">{redCount}명</span>
          </div>
        </div>

        {/* 집중 케어 팀원/스터디원 리스트 (글로만 간결하게 표시) */}
        <div className="space-y-4">
          <h3 className="text-sm font-black text-obsidian tracking-tight flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-500" /> 집중 모니터링 대상 ({attentionPlayers.length}명)
          </h3>
          
          {attentionPlayers.length > 0 ? (
            <div className="space-y-3">
              {attentionPlayers.map(player => (
                <div 
                  key={player.id} 
                  onClick={() => onPlayerClick?.(player.id)}
                  className="flex items-center justify-between p-4 bg-white border border-line/10 rounded-2xl hover:border-obsidian/20 transition-all cursor-pointer group shadow-sm"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-3 h-3 rounded-full ${player.status === 'RED' ? 'bg-rose-500' : 'bg-primary'} shadow-sm`} />
                    <span className="font-bold text-obsidian">{player.name}</span>
                    <Badge variant="outline" className="border-line/10 bg-mist/30 text-slate/60 text-[10px]">
                      {player.reason || '회복 필요'}
                    </Badge>
                  </div>
                  <Button variant="ghost" size="icon" className="group-hover:bg-mist/50 text-obsidian/40 group-hover:text-obsidian transition-colors">
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center border border-dashed border-line/20 rounded-2xl">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2 opacity-50" />
              <p className="text-sm font-bold text-slate/50">오늘 주의해야 할 팀원/스터디원가 없습니다.</p>
              <p className="text-xs text-slate/40 mt-1">모든 팀원/스터디원가 정상적인 훈련 부하를 감당할 수 있습니다.</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

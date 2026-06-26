'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Loader2, Users, Activity, AlertTriangle, CheckCircle2,
  ChevronRight, RefreshCw, ArrowLeft, Eye, MessageSquare, Brain
} from 'lucide-react';
import Link from 'next/link';

interface SquadMember {
  memberId: string;
  userId: string;
  name: string;
  avatar?: string;
  position?: string;
  playerNumber?: number;
  todayCheck: {
    mentalStrainIndex: number;
    sleep: number;
    fatigue: number;
    stress: number;
    tension: number;
    collaborationVolume?: number;
    dailyCognitiveLoad?: number;
  } | null;
  acwr?: {
    acwr: number;
    zone: string;
    zoneLabel: string;
    zoneColor: string;
    acuteLoad: number;
    chronicLoad: number;
  };
  checkedIn: boolean;
}

export default function CoachDashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [squad, setSquad] = useState<SquadMember[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [teamInfo, setTeamInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPlayer, setSelectedPlayer] = useState<SquadMember | null>(null);
  const [probingMessage, setProbingMessage] = useState<string>('');
  const [isProbing, setIsProbing] = useState(false);

  const handleRunProbing = async (player: SquadMember) => {
    setIsProbing(true);
    setProbingMessage('');
    try {
      const res = await fetch('/api/mile/probing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateType: teamInfo?.team?.templateType || 'sports',
          memberName: player.name,
          mentalStrainIndex: player.todayCheck?.mentalStrainIndex,
          volume: player.todayCheck?.collaborationVolume,
          zoneLabel: player.acwr?.zoneLabel,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setProbingMessage(data.probingMessage);
      }
    } catch (e) {
      console.error(e);
      setProbingMessage('AI 분석 중 오류가 발생했습니다.');
    } finally {
      setIsProbing(false);
    }
  };
  useEffect(() => {
    if (status === 'authenticated') {
      fetchDashboard();
    } else if (status === 'unauthenticated') {
      window.location.href = '/api/auth/signin';
    }
  }, [status]);

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const teamRes = await fetch('/api/mile/team');
      let teamId = '';
      if (teamRes.ok) {
        const teamData = await teamRes.json();
        if (teamData.teams?.length > 0) {
          setTeamInfo(teamData.teams[0]);
          teamId = teamData.teams[0].team?._id;
        }
      }

      if (!teamId) {
        setLoading(false);
        return;
      }

      const wellnessRes = await fetch(`/api/mile/wellness?view=team&teamId=${teamId}`);
      if (wellnessRes.ok) {
        const data = await wellnessRes.json();
        setSquad(data.squad || []);
        setSummary(data.summary || {});
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading || status === 'loading') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-green-600" />
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return null;
  }

  // 그룹 분류: ACWR 기준
  // Danger (> 1.5), Caution (1.3 ~ 1.5), Optimal (0.8 ~ 1.3), Undertrained (< 0.8)
  const dangerPlayers = squad.filter(p => p.checkedIn && p.acwr && p.acwr.zone === 'danger');
  const cautionPlayers = squad.filter(p => p.checkedIn && p.acwr && p.acwr.zone === 'caution');
  const optimalPlayers = squad.filter(p => p.checkedIn && p.acwr && p.acwr.zone === 'optimal');
  const underPlayers = squad.filter(p => p.checkedIn && p.acwr && p.acwr.zone === 'undertrained');
  const unchecked = squad.filter(p => !p.checkedIn);

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-background p-4 pb-24">
      <div className="max-w-2xl mx-auto space-y-6 pt-4 md:pt-24">
        {/* 헤더 */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Link href="/mile/mypage" className="text-slate hover:text-obsidian">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <Badge className="bg-green-100 text-green-700 border-none font-bold text-xs">DIRECTOR DASHBOARD</Badge>
            </div>
            <h1 className="text-2xl font-black text-obsidian">
              {teamInfo?.team?.teamName || '모임'} 멤버 관리
            </h1>
            <p className="text-xs text-slate mt-1">Cognitive ACWR 기반 인지 부하 예측</p>
          </div>
          <Button variant="outline" size="sm" onClick={fetchDashboard} className="gap-1 rounded-xl">
            <RefreshCw className="w-4 h-4" /> 새로고침
          </Button>
        </div>

        {/* 요약 카드 */}
        <Card className="rounded-2xl border-none shadow-xl overflow-hidden">
          <div className="h-2 bg-gradient-to-r from-green-500 via-yellow-400 to-red-500" />
          <CardContent className="p-4 sm:p-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
              <div className="bg-surface rounded-xl p-3">
                <p className="text-3xl font-black text-obsidian">{summary?.total || 0}</p>
                <p className="text-[10px] text-slate font-bold mt-1">전체 멤버</p>
              </div>
              <div className="bg-green-50 rounded-xl p-3">
                <p className="text-3xl font-black text-green-600">{summary?.checkedIn || 0}</p>
                <p className="text-[10px] text-green-700 font-bold mt-1">체크 완료</p>
              </div>
              <div className="bg-yellow-50 rounded-xl p-3">
                <p className="text-3xl font-black text-yellow-600">{unchecked.length}</p>
                <p className="text-[10px] text-yellow-700 font-bold mt-1">미체크</p>
              </div>
              <div className="bg-blue-50 rounded-xl p-3">
                <p className="text-3xl font-black text-primary">{summary?.avgWellness || '-'}</p>
                <p className="text-[10px] text-primary font-bold mt-1">평균 피로 지수</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 심각한 인지적 번아웃 (Danger) */}
        {dangerPlayers.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-black text-red-600 flex items-center gap-1">
              <AlertTriangle className="w-4 h-4" /> 심각한 인지적 번아웃 및 이탈 임박 단계 ({dangerPlayers.length})
            </h3>
            {dangerPlayers.map((player) => (
              <PlayerCard key={player.memberId} player={player} onSelect={setSelectedPlayer} />
            ))}
          </div>
        )}

        {/* 과밀 소통 및 주의 요망 (Caution) */}
        {cautionPlayers.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-black text-yellow-600 flex items-center gap-1">
              🟡 과밀 소통 및 주의 요망 단계 ({cautionPlayers.length})
            </h3>
            {cautionPlayers.map((player) => (
              <PlayerCard key={player.memberId} player={player} onSelect={setSelectedPlayer} />
            ))}
          </div>
        )}

        {/* 조직 소외 및 동기 고갈 (Undertrained) */}
        {underPlayers.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-black text-blue-600 flex items-center gap-1">
              ❄️ 조직 소외 및 참여 동기 고갈 단계 ({underPlayers.length})
            </h3>
            {underPlayers.map((player) => (
              <PlayerCard key={player.memberId} player={player} onSelect={setSelectedPlayer} />
            ))}
          </div>
        )}

        {/* 최적 몰입 (Optimal) */}
        {optimalPlayers.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-black text-green-600 flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" /> 🟢 최적 몰입 및 안전성 확립 단계 ({optimalPlayers.length})
            </h3>
            {optimalPlayers.map((player) => (
              <PlayerCard key={player.memberId} player={player} onSelect={setSelectedPlayer} />
            ))}
          </div>
        )}

        {/* 미체크 멤버 */}
        {unchecked.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-black text-foreground/70 uppercase flex items-center gap-1">
              ⬜ 무드 체크인 미제출 ({unchecked.length})
            </h3>
            {unchecked.map((player) => (
              <Card key={player.memberId} className="rounded-2xl border-none shadow-md opacity-60">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-foreground/70 font-bold text-sm">
                      {player.name[0] || '?'}
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-obsidian">{player.name}</p>
                    </div>
                    <Badge className="bg-gray-100 text-foreground/70 border-none text-xs">미제출</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {squad.length === 0 && (
          <Card className="rounded-2xl border-none shadow-xl">
            <CardContent className="p-10 text-center space-y-4">
              <Users className="w-12 h-12 mx-auto text-gray-300" />
              <h3 className="text-lg font-bold text-obsidian">아직 모임 멤버가 없습니다</h3>
              <p className="text-sm text-slate">모임 초대 링크를 공유해 주세요</p>
            </CardContent>
          </Card>
        )}

        {/* 팀원/스터디원 상세 모달 (Intervention) */}
        {selectedPlayer && selectedPlayer.todayCheck && selectedPlayer.acwr && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4" onClick={() => setSelectedPlayer(null)}>
            <Card className="w-full max-w-md rounded-t-[32px] sm:rounded-[32px] border-none shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <CardContent className="p-6 space-y-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center font-black text-green-700">
                      {selectedPlayer.name[0]}
                    </div>
                    <div>
                      <h3 className="font-black text-lg text-obsidian">{selectedPlayer.name}</h3>
                      <p className="text-xs text-slate">Cognitive ACWR: {selectedPlayer.acwr.acwr}</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => {
                    setSelectedPlayer(null);
                    setProbingMessage('');
                  }}>✕</Button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-50 rounded-xl p-3 text-center">
                    <p className="text-xs text-slate font-bold">정신적 피로 지수</p>
                    <p className="font-black text-obsidian text-2xl">{selectedPlayer.todayCheck.mentalStrainIndex}</p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-3 text-center">
                    <p className="text-xs text-slate font-bold">협업 부량(Volume)</p>
                    <p className="font-black text-obsidian text-2xl">{selectedPlayer.todayCheck.collaborationVolume}</p>
                  </div>
                </div>

                {/* 상세 항목 */}
                <div className="overflow-x-auto pb-2 custom-scrollbar">
                  <div className="grid grid-cols-4 gap-2 text-center min-w-[280px]">
                  {[
                    { label: '수면 부족', value: selectedPlayer.todayCheck.sleep, emoji: '🌙' },
                    { label: '주관 피로', value: selectedPlayer.todayCheck.fatigue, emoji: '⚡' },
                    { label: '관계 스트레스', value: selectedPlayer.todayCheck.stress, emoji: '🧠' },
                    { label: '긴장도', value: selectedPlayer.todayCheck.tension, emoji: '🔥' },
                  ].map((item) => (
                    <div key={item.label} className={`py-2 rounded-xl text-xs font-bold ${
                      item.value >= 4 ? 'bg-red-100 text-red-700' :
                      item.value >= 3 ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'
                    }`}>
                      <span className="text-base">{item.emoji}</span>
                      <p className="text-lg font-black">{item.value}</p>
                      <p className="text-[10px]">{item.label}</p>
                    </div>
                  ))}
                  </div>
                </div>

                {/* 자동 개입 (Intervention) 가이드 */}
                <div className="p-4 rounded-xl border-2" style={{ borderColor: selectedPlayer.acwr.zoneColor, backgroundColor: `${selectedPlayer.acwr.zoneColor}10` }}>
                  <p className="text-xs font-bold mb-2 flex items-center gap-1" style={{ color: selectedPlayer.acwr.zoneColor }}>
                    <Brain className="w-4 h-4" /> 자동 개입 추천 솔루션
                  </p>
                  <p className="text-sm font-bold text-obsidian mb-1">{selectedPlayer.acwr.zoneLabel}</p>
                  <p className="text-xs text-slate">
                    {selectedPlayer.acwr.zone === 'danger' && '비상 개입: 즉시 1on1 면담을 배정하고 활동 양해(Excuse) 메시지를 통해 휴식을 권고하세요.'}
                    {selectedPlayer.acwr.zone === 'caution' && '알림 무음 설정 권고 및 비동기식 상호작용 비중을 늘려 스트레스를 완화하세요.'}
                    {selectedPlayer.acwr.zone === 'optimal' && '팀원 간 긍정적 피드백(Happily 스타일)을 장려하여 심리적 안전감을 유지하세요.'}
                    {selectedPlayer.acwr.zone === 'undertrained' && '가벼운 아이스브레이킹 태스크를 배정하여 소외감을 극복하고 참여 동기를 유발하세요.'}
                  </p>

                  {/* 팝업 버튼들 */}
                  <div className="mt-4 flex flex-col gap-2">
                    {selectedPlayer.acwr.zone === 'danger' && (
                      <>
                        <Button className="w-full h-10 font-bold bg-red-600 hover:bg-red-700 text-white shadow-md">
                          <MessageSquare className="w-4 h-4 mr-2" /> CLAP 1on1 면담 생성
                        </Button>
                        <Button variant="outline" className="w-full h-10 font-bold text-red-600 border-red-200 hover:bg-red-50">
                          활동 양해(Excuse) 메시지 전송
                        </Button>
                      </>
                    )}
                    {selectedPlayer.acwr.zone === 'caution' && (
                      <Button className="w-full h-10 font-bold bg-yellow-500 hover:bg-yellow-600 text-white shadow-md">
                        잠시 알림 무음 설정 권고 알림 발송
                      </Button>
                    )}
                    {selectedPlayer.acwr.zone === 'optimal' && (
                      <Button className="w-full h-10 font-bold bg-green-500 hover:bg-green-600 text-white shadow-md">
                        칭찬/인정 메시지 (Happily) 발송
                      </Button>
                    )}
                    {selectedPlayer.acwr.zone === 'undertrained' && (
                      <Button className="w-full h-10 font-bold bg-blue-500 hover:bg-blue-600 text-white shadow-md">
                        가벼운 아이스브레이킹 태스크 자동 배정
                      </Button>
                    )}
                  </div>

                  {/* AI Dynamic Probing */}
                  {(selectedPlayer.acwr.zone === 'danger' || selectedPlayer.acwr.zone === 'caution') && (
                    <div className="mt-4 p-4 rounded-xl border border-blue-200 bg-blue-50/50">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs font-bold text-blue-700 flex items-center gap-1">
                          <Brain className="w-4 h-4" /> AI 맞춤 질의 생성 (Dynamic Probing)
                        </p>
                      </div>
                      {!probingMessage && !isProbing && (
                        <Button
                          variant="outline"
                          className="w-full text-xs h-8 border-blue-200 text-blue-600 hover:bg-blue-100 font-bold"
                          onClick={() => handleRunProbing(selectedPlayer)}
                        >
                          맥락 기반 질문 자동 생성하기
                        </Button>
                      )}
                      {isProbing && (
                        <div className="flex items-center justify-center py-4">
                          <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                          <span className="text-xs text-blue-600 ml-2 font-bold">생성 중...</span>
                        </div>
                      )}
                      {probingMessage && (
                        <div className="text-sm font-bold text-slate-700 bg-white p-3 rounded-lg border border-blue-100 whitespace-pre-wrap leading-relaxed shadow-sm">
                          {probingMessage}
                          <Button className="w-full mt-3 bg-blue-600 hover:bg-blue-700 text-white font-bold h-8 text-xs">
                            <MessageSquare className="w-3 h-3 mr-1" /> 이 메시지로 1on1 제안하기
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <Button asChild variant="ghost" className="w-full h-11 rounded-2xl font-bold">
                  <Link href={`/mile/players?id=${selectedPlayer.userId}`}>
                    상세 기록 전체 열람
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

// 팀원/스터디원 카드 서브컴포넌트
function PlayerCard({ player, onSelect }: { player: SquadMember; onSelect: (p: SquadMember) => void }) {
  if (!player.todayCheck || !player.acwr) return null;
  const { acwr, zone, zoneColor } = player.acwr;

  return (
    <Card className={`rounded-2xl border-none shadow-lg cursor-pointer transition-all hover:bg-gray-50`} onClick={() => onSelect(player)}>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          {/* 신호등 */}
          <div className="w-3 h-3 rounded-full ring-2 ring-offset-2" style={{ backgroundColor: zoneColor, borderColor: zoneColor }} />
          {/* 번호/이니셜 */}
          <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center font-black text-sm text-obsidian">
            {player.name[0]}
          </div>
          {/* 이름 */}
          <div className="flex-1">
            <p className="font-bold text-obsidian">{player.name}</p>
            <p className="text-[10px] text-slate">DCL: {player.todayCheck.dailyCognitiveLoad || '-'} AU</p>
          </div>
          {/* 웰니스 점수 */}
          <div className="text-right">
            <p className="text-xl font-black text-obsidian">{player.todayCheck.mentalStrainIndex}</p>
            <p className="text-[10px] text-slate">피로 지수</p>
          </div>
          {/* ACWR */}
          <div className="text-right">
            <p className="text-sm font-black" style={{ color: zoneColor }}>{acwr}</p>
            <p className="text-[10px] text-slate">ACWR</p>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-300" />
        </div>
      </CardContent>
    </Card>
  );
}

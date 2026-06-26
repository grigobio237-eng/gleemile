'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSession } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Loader2, Users, ArrowLeft, Activity, BarChart3, User
} from 'lucide-react';
import Link from 'next/link';

function PlayersContent() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const playerId = searchParams?.get('id') || null;

  const [playerData, setPlayerData] = useState<any>(null);
  const [squad, setSquad] = useState<any[]>([]);
  const [teamInfo, setTeamInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [playerId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 팀 정보
      const teamRes = await fetch('/api/mile/team');
      let teamId = '';
      if (teamRes.ok) {
        const teamData = await teamRes.json();
        if (teamData.teams?.length > 0) {
          setTeamInfo(teamData.teams[0]);
          teamId = teamData.teams[0].team?._id;
        }
      }

      if (playerId) {
        // 특정 팀원/스터디원 상세 (28일 데이터)
        const res = await fetch(`/api/mile/wellness?view=my&days=28&playerId=${playerId}`);
        if (res.ok) {
          const data = await res.json();
          setPlayerData(data);
        }
      } else if (teamId) {
        // 팀원/스터디원 명단
        const res = await fetch(`/api/mile/wellness?view=team&teamId=${teamId}`);
        if (res.ok) {
          const data = await res.json();
          setSquad(data.squad || []);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const getPositionLabel = (pos?: string) => {
    if (!pos) return '미지정';
    const map: Record<string, string> = { MF: '미드필더', FW: '공격수', DF: '수비수', GK: '골키퍼' };
    return map[pos] || pos;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-green-600" />
      </div>
    );
  }

  // 팀원/스터디원 상세 뷰
  if (playerId && playerData) {
    const { checks, acwr, stats } = playerData;

    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-background p-4 pb-24">
        <div className="max-w-lg mx-auto space-y-6 pt-4 md:pt-24">
          <div>
            <Link href="/mile/players" className="text-slate hover:text-obsidian inline-flex items-center gap-1 text-sm mb-1">
              <ArrowLeft className="w-4 h-4" /> 팀원/스터디원 명단
            </Link>
            <h1 className="text-2xl font-black text-obsidian flex items-center gap-2">
              <User className="w-6 h-6" /> 팀원/스터디원 상세 기록
            </h1>
          </div>

          {/* ACWR */}
          {acwr && acwr.acwr > 0 && (
            <Card className={`rounded-2xl border-2 shadow-xl ${
              acwr.zone === 'optimal' ? 'border-green-300 bg-green-50' :
              acwr.zone === 'caution' ? 'border-yellow-300 bg-yellow-50' :
              acwr.zone === 'danger' ? 'border-red-300 bg-red-50' : 'border-primary/30 bg-blue-50'
            }`}>
              <CardContent className="p-6 text-center space-y-2">
                <p className="text-sm font-bold opacity-70">ACWR (부하 비율)</p>
                <p className="font-black text-xl">{acwr.acwr}</p>
                <Badge className="bg-white/50 border-none font-bold">{acwr.zoneLabel}</Badge>
                <div className="grid grid-cols-2 gap-3 pt-2 text-sm">
                  <div className="bg-white/40 rounded-xl p-2">
                    <p className="text-xs opacity-60">급성 (7일)</p>
                    <p className="font-black">{acwr.acuteLoad} AU</p>
                  </div>
                  <div className="bg-white/40 rounded-xl p-2">
                    <p className="text-xs opacity-60">만성 (28일)</p>
                    <p className="font-black">{acwr.chronicLoad} AU/주</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* 통계 */}
          <Card className="rounded-2xl border-none shadow-xl">
            <CardContent className="p-6">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-black text-green-600">{stats?.totalDays || 0}</p>
                  <p className="text-xs text-slate font-bold">기록 일수</p>
                </div>
                <div>
                  <p className="text-2xl font-black text-primary">{stats?.avgWellness || 0}</p>
                  <p className="text-xs text-slate font-bold">평균 피로</p>
                </div>
                <div>
                  <p className="text-2xl font-black text-secondary">{stats?.avgLoad || 0}</p>
                  <p className="text-xs text-slate font-bold">평균 DCL</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 웰니스 이력 */}
          <div className="space-y-3">
            <h3 className="text-sm font-black text-slate uppercase px-1">웰니스 이력</h3>
            {checks?.slice(0, 14).map((check: any) => (
              <Card key={check._id} className="rounded-2xl border-none shadow-md">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-bold text-slate">{check.date}</span>
                    <span className={`text-lg font-black ${
                      check.mentalStrainIndex >= 4 ? 'text-red-600' :
                      check.mentalStrainIndex >= 3 ? 'text-yellow-600' : 'text-green-600'
                    }`}>{check.mentalStrainIndex}</span>
                  </div>
                  <div className="grid grid-cols-4 gap-1 text-center text-[10px]">
                    {[
                      { l: '수면', v: check.sleep },
                      { l: '피로', v: check.fatigue },
                      { l: '스트레스', v: check.stress },
                      { l: '긴장', v: check.tension },
                    ].map((item) => (
                      <div key={item.l} className={`py-1 rounded-lg font-bold flex flex-col items-center justify-center ${
                        item.v >= 4 ? 'bg-red-100 text-red-700' :
                        item.v >= 3 ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'
                      }`}>
                        <span>{item.l} {item.v}</span>
                      </div>
                    ))}
                  </div>
                  {check.dailyCognitiveLoad && (
                    <p className="text-xs text-primary font-bold mt-2">DCL: {check.dailyCognitiveLoad} AU (Volume {check.collaborationVolume})</p>
                  )}
                  {check.injuryNote && (
                    <p className="text-xs text-red-500 mt-1">⚠️ {check.injuryNote}</p>
                  )}
                  {check.notes && Object.values(check.notes).some(v => v) && (
                    <div className="mt-2.5 pt-2 border-t border-line flex flex-wrap gap-1.5">
                      {Object.entries(check.notes).map(([key, val]) => {
                        if (!val) return null;
                        const labels: Record<string, string> = {
                          sleep: '수면',
                          fatigue: '피로',
                          stress: '스트레스',
                          tension: '긴장'
                        };
                        return (
                          <div key={key} className="text-[10px] bg-surface border border-line text-obsidian px-2 py-0.5 rounded-lg flex items-center gap-1 font-bold">
                            <span className="text-[9px] text-green-600 font-black">[{labels[key] || key}]</span>
                            <span className="line-clamp-1">{val as string}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // 팀원/스터디원 명단 뷰 (기본)
  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-background p-4 pb-24">
      <div className="max-w-lg mx-auto space-y-6 pt-4 md:pt-24">
        <div>
          <Link href="/mile/mypage" className="text-slate hover:text-obsidian inline-flex items-center gap-1 text-sm mb-1">
            <ArrowLeft className="w-4 h-4" /> 클럽하우스 홈
          </Link>
          <h1 className="text-2xl font-black text-obsidian flex items-center gap-2">
            <Users className="w-6 h-6" /> 팀원/스터디원 명단
          </h1>
          {teamInfo && (
            <p className="text-sm text-slate mt-1">{teamInfo.team?.teamName} • 팀원/스터디원 {squad.length}명</p>
          )}
        </div>

        {squad.length === 0 ? (
          <Card className="rounded-2xl border-none shadow-xl">
            <CardContent className="p-10 text-center space-y-4">
              <Users className="w-12 h-12 mx-auto text-gray-300" />
              <p className="text-slate">아직 팀원/스터디원가 없습니다</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {squad.map((player) => {
              const hasCheck = player.checkedIn && player.todayCheck;
              const score = player.todayCheck?.wellnessScore;
              return (
                <Link key={player.memberId} href={`/mile/players?id=${player.userId}`}>
                  <Card className="rounded-2xl border-none shadow-lg hover:shadow-xl transition-all cursor-pointer mb-3">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        {hasCheck && (
                          <div className={`w-3 h-3 rounded-full ${
                            score >= 4 ? 'bg-green-500' : score >= 3 ? 'bg-yellow-400' : 'bg-red-500'
                          }`} />
                        )}
                        <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center font-black text-sm">
                          {player.playerNumber || '?'}
                        </div>
                        <div className="flex-1">
                          <p className="font-bold text-obsidian">{player.name}</p>
                          <p className="text-xs text-slate">{getPositionLabel(player.position)}</p>
                        </div>
                        {hasCheck ? (
                          <Badge className={`border-none font-bold ${
                            score >= 4 ? 'bg-green-100 text-green-700' :
                            score >= 3 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                          }`}>{score}/5</Badge>
                        ) : (
                          <Badge className="bg-gray-100 text-foreground/70 border-none text-xs">미체크</Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default function PlayersPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-green-600" />
      </div>
    }>
      <PlayersContent />
    </Suspense>
  );
}

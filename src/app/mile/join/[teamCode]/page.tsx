'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, Shield, MapPin, Loader2, CheckCircle2, AlertTriangle, Trophy } from 'lucide-react';
import Link from 'next/link';

const POSITION_OPTIONS = [
  { value: 'MF', label: '미드필더 (MF)', emoji: '🟢', desc: '경기의 심장, 지구력과 균형' },
  { value: 'FW', label: '공격수 (FW)', emoji: '🔴', desc: '폭발적 스프린트, 순발력' },
  { value: 'DF', label: '수비수 (DF)', emoji: '🔵', desc: '안정적 체력, 강인한 피지컬' },
  { value: 'GK', label: '골키퍼 (GK)', emoji: '🟡', desc: '집중력, 순간 반응속도' },
];

export default function TeamJoinPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, status: authStatus } = useSession();
  const teamCode = params?.teamCode as string;

  const [team, setTeam] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [joining, setJoining] = useState(false);
  const [joined, setJoined] = useState(false);

  // 폼 상태
  const [role, setRole] = useState<'member' | 'supporter'>('member');
  const [position, setPosition] = useState('');
  const [playerNumber, setPlayerNumber] = useState('');

  useEffect(() => {
    if (teamCode) fetchTeamInfo();
  }, [teamCode]);

  const fetchTeamInfo = async () => {
    try {
      const res = await fetch(`/api/mile/team/join?teamCode=${teamCode}`);
      if (res.ok) {
        const data = await res.json();
        setTeam(data.team);
      } else {
        const errData = await res.json();
        setError(errData.error || '팀을 찾을 수 없습니다');
      }
    } catch (e) {
      setError('팀 정보를 불러오는 중 오류가 발생했습니다');
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    if (!session) {
      router.push(`/auth/signin?callbackUrl=/mile/join/${teamCode}`);
      return;
    }

    if (role === 'member' && !position) {
      setError('포지션을 선택해 주세요');
      return;
    }

    setJoining(true);
    setError('');

    try {
      const res = await fetch('/api/mile/team/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teamCode,
          role,
          position: role === 'member' ? position : undefined,
          playerNumber: playerNumber ? parseInt(playerNumber) : undefined,
          pastDataConsent: true,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setJoined(true);
      } else {
        setError(data.error || '팀 합류에 실패했습니다');
      }
    } catch (e) {
      setError('네트워크 오류가 발생했습니다');
    } finally {
      setJoining(false);
    }
  };

  const getCategoryLabel = (cat: string) => {
    const map: Record<string, string> = { youth: '유소년', pro: '프로', amateur: '동호회' };
    return map[cat] || cat;
  };

  // 로딩 중
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  // 팀을 찾을 수 없음
  if (!team) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full rounded-[32px] border-none shadow-2xl">
          <CardContent className="p-10 text-center space-y-6">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto">
              <AlertTriangle className="w-10 h-10 text-red-500" />
            </div>
            <h1 className="text-2xl font-black text-obsidian">팀을 찾을 수 없습니다</h1>
            <p className="text-slate">{error || '유효하지 않은 초대 링크입니다.'}</p>
            <Button asChild className="w-full h-14 rounded-2xl font-black">
              <Link href="/">홈으로 돌아가기</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 합류 완료
  if (joined) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full rounded-[32px] border-none shadow-2xl">
          <CardContent className="p-10 text-center space-y-6">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-10 h-10 text-green-600" />
            </div>
            <h1 className="text-2xl font-black text-obsidian">환영합니다! 🎉</h1>
            <p className="text-slate text-lg">
              <strong className="text-obsidian">{team.teamName}</strong> 팀에 합류했습니다.
            </p>
            <div className="flex flex-col gap-3 pt-4">
              <Button asChild className="w-full h-14 rounded-2xl font-black bg-primary">
                <Link href="/mile/mypage">⚽ 나의 클럽하우스 시작하기</Link>
              </Button>
              <Button asChild variant="outline" className="w-full h-12 rounded-2xl font-bold">
                <Link href="/">홈으로 돌아가기</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 합류 폼
  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-background flex items-center justify-center p-4">
      <div className="max-w-lg w-full space-y-6">
        {/* 팀 정보 카드 */}
        <Card className="rounded-[32px] border-none shadow-2xl overflow-hidden">
          <div className="h-32 bg-gradient-to-br from-green-600 to-emerald-700 flex items-center justify-center relative">
            <div className="absolute inset-0 bg-[url('/pattern-dots.svg')] opacity-10" />
            <div className="relative z-10 text-center text-white">
              <Trophy className="w-10 h-10 mx-auto mb-2" />
              <h1 className="text-2xl font-black">{team.teamName}</h1>
            </div>
          </div>
          <CardContent className="p-8 space-y-4">
            <div className="flex flex-wrap gap-2">
              <Badge className="bg-green-100 text-green-700 border-none font-bold">
                {getCategoryLabel(team.category)}
              </Badge>
              {team.ageGroup && (
                <Badge variant="outline" className="font-bold">{team.ageGroup}</Badge>
              )}
            </div>
            <div className="flex items-center gap-6 text-sm text-slate">
              <span className="flex items-center gap-1">
                <Users className="w-4 h-4" /> 팀원/스터디원 {team.memberCount || 0}명
              </span>
              {team.region && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" /> {team.region}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Shield className="w-4 h-4" /> {team.createdBy?.name || '총무/조장'}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* 역할 선택 */}
        <Card className="rounded-[32px] border-none shadow-xl">
          <CardContent className="p-8 space-y-6">
            <h2 className="font-black text-obsidian text-xl">합류 정보 입력</h2>

            {/* 역할 */}
            <div className="space-y-3">
              <label className="text-sm font-bold text-slate">나는...</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setRole('member')}
                  className={`p-4 rounded-2xl border-2 text-left transition-all ${
                    role === 'member'
                      ? 'border-green-500 bg-green-50'
                      : 'border-line hover:border-gray-300'
                  }`}
                >
                  <span className="text-2xl">⚽</span>
                  <p className="font-black text-obsidian mt-1">팀원/스터디원</p>
                  <p className="text-xs text-slate">직접 경기에 참여</p>
                </button>
                <button
                  onClick={() => setRole('supporter')}
                  className={`p-4 rounded-2xl border-2 text-left transition-all ${
                    role === 'supporter'
                      ? 'border-primary/30 bg-blue-50'
                      : 'border-line hover:border-gray-300'
                  }`}
                >
                  <span className="text-2xl">👨‍👩‍👦</span>
                  <p className="font-black text-obsidian mt-1">청강생/외부 자문</p>
                  <p className="text-xs text-slate">자녀의 활동 확인</p>
                </button>
              </div>
            </div>

            {/* 포지션 (팀원/스터디원만) */}
            {role === 'member' && (
              <div className="space-y-3">
                <label className="text-sm font-bold text-slate">포지션</label>
                <div className="grid grid-cols-2 gap-3">
                  {POSITION_OPTIONS.map((pos) => (
                    <button
                      key={pos.value}
                      onClick={() => setPosition(pos.value)}
                      className={`p-3 rounded-xl border-2 text-left transition-all ${
                        position === pos.value
                          ? 'border-primary bg-primary/5'
                          : 'border-line hover:border-gray-300'
                      }`}
                    >
                      <span className="text-lg">{pos.emoji}</span>
                      <p className="font-bold text-sm text-obsidian">{pos.label}</p>
                      <p className="text-[10px] text-slate">{pos.desc}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 등번호 (팀원/스터디원만) */}
            {role === 'member' && (
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate">등번호 (선택)</label>
                <input
                  type="number"
                  value={playerNumber}
                  onChange={(e) => setPlayerNumber(e.target.value)}
                  placeholder="예: 10"
                  className="w-full h-12 px-4 rounded-xl border-2 border-line focus:border-primary focus:outline-none font-bold text-lg"
                  min="1"
                  max="99"
                />
              </div>
            )}

            {error && (
              <p className="text-red-500 text-sm font-bold bg-red-50 p-3 rounded-xl">{error}</p>
            )}

            {!session ? (
              <div className="space-y-3">
                <p className="text-sm text-slate text-center">팀에 합류하려면 먼저 로그인해 주세요</p>
                <Button
                  asChild
                  className="w-full h-14 rounded-2xl font-black text-lg"
                >
                  <Link href={`/auth/signin?callbackUrl=/mile/join/${teamCode}`}>
                    로그인 후 합류하기
                  </Link>
                </Button>
              </div>
            ) : (
              <Button
                onClick={handleJoin}
                disabled={joining}
                className="w-full h-14 rounded-2xl font-black text-lg bg-green-600 hover:bg-green-700"
              >
                {joining ? (
                  <><Loader2 className="animate-spin mr-2 w-5 h-5" /> 합류 처리 중...</>
                ) : (
                  `${team.teamName} 팀에 합류하기`
                )}
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

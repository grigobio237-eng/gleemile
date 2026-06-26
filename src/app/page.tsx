'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Loader2, Shield, Users, Settings, Plus, Search, CheckCircle2, ChevronRight, ActivitySquare, LayoutTemplate, Globe, ArrowDown
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AuthInterceptModal } from '@/components/auth/AuthInterceptModal';

interface TeamInfo {
  membership: {
    _id: string;
    role: string;
    position?: string;
  };
  team: {
    _id: string;
    teamName: string;
    teamCode: string;
    category: string;
    templateType?: string;
    ageGroup?: string;
    isPublic?: boolean;
    memberCount?: number;
    description?: string;
    isJoined?: boolean; // public explore 용
  };
}

export default function RootHubPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [teams, setTeams] = useState<TeamInfo[]>([]);
  const [publicTeams, setPublicTeams] = useState<TeamInfo['team'][]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Auth Intercept Modal State
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authCallbackUrl, setAuthCallbackUrl] = useState('/');

  // 프로필 로컬 상태
  const [profile, setProfile] = useState({
    name: '사피엔스',
    bio: '끊임없이 성장하는 플레이어입니다.',
    avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026024d'
  });
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [editProfile, setEditProfile] = useState(profile);

  // 창단 모달 상태
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [newCategory, setNewCategory] = useState('youth');
  const [newTemplateType, setNewTemplateType] = useState('sports');
  const [newIsPublic, setNewIsPublic] = useState(true);
  const [creationLoading, setCreationLoading] = useState(false);

  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      setProfile({
        name: session.user.name || '사피엔스',
        bio: '끊임없이 성장하는 플레이어입니다.',
        avatar: session.user.image || 'https://i.pravatar.cc/150?u=a042581f4e29026024d'
      });
      fetchMyTeams();
    } else if (status === 'unauthenticated') {
      setLoading(false);
    }
  }, [status, session]);

  useEffect(() => {
    // 공개 모임은 로그인 여부와 관계없이 Fetch
    fetchPublicTeams('');
  }, []);

  const fetchMyTeams = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/mile/team');
      if (res.ok) {
        const data = await res.json();
        setTeams(data.teams || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPublicTeams = async (q: string) => {
    try {
      const res = await fetch(`/api/mile/team/explore?q=${encodeURIComponent(q)}`);
      if (res.ok) {
        const data = await res.json();
        setPublicTeams(data.teams || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    const debounce = setTimeout(() => {
      fetchPublicTeams(searchQuery);
    }, 500);
    return () => clearTimeout(debounce);
  }, [searchQuery]);

  const handleCreateTeamClick = () => {
    if (status === 'unauthenticated') {
      setAuthCallbackUrl('/');
      setAuthModalOpen(true);
      return;
    }
    setCreateModalOpen(true);
  };

  const handleCreateTeam = async () => {
    if (!newTeamName) return;
    try {
      setCreationLoading(true);
      const res = await fetch('/api/mile/team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teamName: newTeamName,
          category: newCategory,
          templateType: newTemplateType,
          isPublic: newIsPublic,
        })
      });
      if (res.ok) {
        setCreateModalOpen(false);
        setNewTeamName('');
        await fetchMyTeams();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCreationLoading(false);
    }
  };

  const handleJoinPublic = async (teamId: string) => {
    if (status === 'unauthenticated') {
      setAuthCallbackUrl(`/mile/join-public/${teamId}`);
      setAuthModalOpen(true);
      return;
    }

    try {
      const res = await fetch('/api/mile/team/join-public', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamId })
      });
      if (res.ok) {
        // Refresh
        await fetchMyTeams();
        await fetchPublicTeams(searchQuery);
        router.push(`/mile/team/${teamId}`); // 가입 후 바로 이동
      } else {
        const data = await res.json();
        alert(data.error || '가입에 실패했습니다.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleProfileClick = () => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin?callbackUrl=/');
      return;
    }
    setProfileModalOpen(true);
  };

  if (loading || status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F7FA] pb-24">
      {/* 1. 프리미엄 프로필 바 */}
      <div className="bg-white px-6 pt-10 pb-6 rounded-b-[40px] shadow-sm mb-6">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-emerald-100 shadow-sm relative group cursor-pointer" onClick={handleProfileClick}>
              <img src={profile.avatar} alt="avatar" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Settings className="w-5 h-5 text-white" />
              </div>
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-1.5">
                {status === 'authenticated' ? profile.name : '게스트'}
                <Badge variant="secondary" className="bg-emerald-50 text-emerald-600 border border-emerald-100 px-1.5 py-0 text-[10px]">
                  {status === 'authenticated' ? 'PRO' : 'GUEST'}
                </Badge>
              </h2>
              <p className="text-xs text-slate-500 mt-1 font-medium">
                {status === 'authenticated' ? profile.bio : '로그인하고 모든 기능을 즐겨보세요!'}
              </p>
            </div>
          </div>
          <button 
            onClick={handleProfileClick}
            className="text-[11px] font-bold text-slate-400 bg-slate-50 px-3 py-1.5 rounded-full hover:bg-slate-100 transition-colors flex items-center gap-1 border border-slate-200"
          >
            {status === 'authenticated' ? '내 정보 수정 ✏️' : '로그인 🚀'}
          </button>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 space-y-10">
        
        {/* 2. 내 모임 라이브러리 (밴드 스타일) */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <LayoutTemplate className="w-5 h-5 text-emerald-500" />
              내 모임 라운지
            </h3>
            <span className="text-xs font-bold text-slate-400 bg-white px-2 py-1 rounded-full border border-slate-200">
              {teams.length}개 참여 중
            </span>
          </div>

          {teams.length === 0 ? (
            <div className="bg-white rounded-[2rem] border border-slate-100 p-8 flex flex-col items-center justify-center shadow-sm text-center">
              <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mb-4">
                <Globe className="w-8 h-8 text-emerald-400" />
              </div>
              <h4 className="text-base font-bold text-slate-800 mb-2">아직 참여 중인 모임이 없네요!</h4>
              <p className="text-sm text-slate-500 mb-6">
                새로운 모임을 개설하거나<br/>아래에서 흥미로운 모임을 찾아보세요.
              </p>
              
              <Button 
                onClick={handleCreateTeamClick}
                className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl shadow-lg shadow-emerald-200 px-8 py-6 flex items-center gap-2 mb-8"
              >
                <Plus className="w-5 h-5" />
                첫 모임 개설하기
              </Button>

              <div className="flex flex-col items-center animate-bounce text-emerald-400">
                <span className="text-[10px] font-bold mb-1">공개 모임 둘러보기</span>
                <ArrowDown className="w-5 h-5" />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {/* + 새 모임 만들기 카드 상시 배치 */}
              <button 
                onClick={handleCreateTeamClick}
                className="aspect-square bg-emerald-50 border-2 border-dashed border-emerald-200 rounded-3xl flex flex-col items-center justify-center hover:bg-emerald-100 transition-colors text-emerald-600 group"
              >
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm mb-3 group-hover:scale-110 transition-transform">
                  <Plus className="w-6 h-6" />
                </div>
                <span className="text-sm font-bold">새 모임 만들기</span>
              </button>

              {teams.map(({ team, membership }) => (
                <button
                  key={team._id}
                  onClick={() => router.push(`/mile/team/${team._id}`)}
                  className="aspect-square bg-white border border-slate-100 rounded-3xl p-5 flex flex-col justify-between hover:shadow-xl hover:shadow-emerald-500/10 transition-all text-left group overflow-hidden relative"
                >
                  <div className="absolute -right-4 -top-4 w-20 h-20 bg-gradient-to-br from-emerald-50 to-cyan-50 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <div>
                    <Badge variant="secondary" className="bg-slate-100 text-slate-600 mb-3 hover:bg-slate-200 text-[10px]">
                      {team.templateType?.toUpperCase() || 'SPORTS'}
                    </Badge>
                    <h4 className="font-bold text-slate-800 text-base leading-tight mb-1 line-clamp-2">{team.teamName}</h4>
                  </div>
                  <div className="flex items-center justify-between mt-auto">
                    <span className="text-xs text-slate-400 font-medium">{membership.role.toUpperCase()}</span>
                    <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-emerald-50 transition-colors">
                      <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-500" />
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>

        {/* 3. 공개 모임 탐색 스페이스 */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Globe className="w-5 h-5 text-cyan-500" />
              공개 모임 탐색
            </h3>
          </div>

          <div className="bg-white rounded-[2rem] border border-slate-100 p-5 shadow-sm">
            <div className="relative mb-6">
              <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="관심있는 모임 키워드를 검색해보세요"
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 pl-12 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="space-y-3">
              {publicTeams.length === 0 ? (
                <div className="text-center py-10 text-slate-400 text-sm">
                  조건에 맞는 공개 모임이 없습니다.
                </div>
              ) : (
                publicTeams.map(pt => (
                  <div key={pt._id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-cyan-100 transition-colors cursor-pointer group" onClick={() => router.push(`/mile/team/${pt._id}`)}>
                    <div className="flex-1 min-w-0 pr-4">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="secondary" className="bg-white text-slate-500 border border-slate-200 text-[9px]">{pt.templateType}</Badge>
                        <span className="text-xs text-slate-400 font-medium">멤버 {pt.memberCount}명</span>
                      </div>
                      <h4 className="font-bold text-slate-800 text-sm truncate group-hover:text-cyan-600 transition-colors">{pt.teamName}</h4>
                      {pt.description && <p className="text-[11px] text-slate-500 mt-1 truncate">{pt.description}</p>}
                    </div>
                    {pt.isJoined ? (
                      <button 
                        onClick={(e) => { e.stopPropagation(); router.push(`/mile/team/${pt._id}`); }}
                        className="px-4 py-2 bg-slate-200 text-slate-500 rounded-xl text-xs font-bold cursor-not-allowed flex items-center gap-1"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> 가입됨
                      </button>
                    ) : (
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleJoinPublic(pt._id); }}
                        className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-cyan-200"
                      >
                        가입하기 🔓
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </section>

      </div>

      {/* 모임 개설 모달 */}
      {createModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-[2rem] w-full max-w-sm overflow-hidden shadow-2xl p-6 animate-in zoom-in-95">
            <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
              <Plus className="w-6 h-6 text-emerald-500" /> 새 모임 파기
            </h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-500 mb-1.5 block">모임 이름</label>
                <input
                  type="text"
                  placeholder="예: 강남 풋살 러너스"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                />
              </div>
              
              <div>
                <label className="text-xs font-bold text-slate-500 mb-1.5 block">템플릿 유형</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'sports', label: '⚽ 스포츠' },
                    { id: 'study', label: '📚 스터디' },
                    { id: 'business', label: '💼 비즈니스' },
                    { id: 'hobby', label: '🎨 취미/창작' },
                  ].map(t => (
                    <button
                      key={t.id}
                      onClick={() => setNewTemplateType(t.id)}
                      className={`py-3 rounded-xl text-xs font-bold transition-all border ${
                        newTemplateType === t.id 
                          ? 'bg-emerald-50 border-emerald-500 text-emerald-700' 
                          : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                <div>
                  <h4 className="text-sm font-bold text-slate-800">공개 여부</h4>
                  <p className="text-[10px] text-slate-500 mt-0.5">탐색창에 모임을 노출할까요?</p>
                </div>
                <Switch 
                  checked={newIsPublic} 
                  onCheckedChange={setNewIsPublic} 
                  className="data-[state=checked]:bg-emerald-500"
                />
              </div>

            </div>
            <div className="flex gap-2 mt-8">
              <Button onClick={() => setCreateModalOpen(false)} variant="outline" className="flex-1 rounded-xl h-12">취소</Button>
              <Button 
                onClick={handleCreateTeam} 
                disabled={creationLoading || !newTeamName}
                className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl h-12 font-bold"
              >
                {creationLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : '모임 개설'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 프로필 수정 모달 (UI Only) */}
      {profileModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-[2rem] w-full max-w-sm p-6 shadow-2xl animate-in zoom-in-95">
            <h3 className="text-lg font-bold text-slate-800 mb-6">프로필 수정</h3>
            <div className="space-y-4">
              <input
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                value={editProfile.name}
                onChange={e => setEditProfile({...editProfile, name: e.target.value})}
                placeholder="닉네임"
              />
              <textarea
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 min-h-[80px]"
                value={editProfile.bio}
                onChange={e => setEditProfile({...editProfile, bio: e.target.value})}
                placeholder="한 줄 소개"
              />
            </div>
            <div className="flex gap-2 mt-6">
              <Button onClick={() => setProfileModalOpen(false)} variant="outline" className="flex-1 rounded-xl">취소</Button>
              <Button onClick={() => { setProfile(editProfile); setProfileModalOpen(false); }} className="flex-1 bg-slate-800 text-white rounded-xl hover:bg-slate-900">저장</Button>
            </div>
          </div>
        </div>
      )}

      <AuthInterceptModal 
        isOpen={authModalOpen} 
        onClose={() => setAuthModalOpen(false)} 
        callbackUrl={authCallbackUrl} 
      />
    </div>
  );
}

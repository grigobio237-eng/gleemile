'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Loader2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { AuthInterceptModal } from '@/components/auth/AuthInterceptModal';
import { GuestLounge } from '@/components/lounge/GuestLounge';
import { MarketingLandingPage } from '@/components/landing/MarketingLandingPage';
import { db } from '@/lib/firebase';
import { collection, addDoc, doc, setDoc, getDoc, getDocs, query, where, orderBy, limit, serverTimestamp } from 'firebase/firestore';

export default function RootHubPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Auth Intercept Modal State
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authCallbackUrl, setAuthCallbackUrl] = useState('/');

  // 모임 개설 모달 상태
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [newTemplateType, setNewTemplateType] = useState('sports');
  const [newIsPublic, setNewIsPublic] = useState(true);
  const [creationLoading, setCreationLoading] = useState(false);

  // 새로 추가된 상태: 유저의 팀 리스트와 퍼블릭 추천 팀 리스트
  const [myTeams, setMyTeams] = useState<any[]>([]);
  const [publicTeams, setPublicTeams] = useState<any[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    const fetchLandingData = async () => {
      if (status === 'authenticated' && session?.user?.id) {
        try {
          // 1. 내 모임 조회
          const myTeamsRef = collection(db, `users/${session.user.id}/teams`);
          const myTeamsSnap = await getDocs(myTeamsRef);
          
          const myTeamsPromises = myTeamsSnap.docs.map(async (d) => {
            const mappingData = d.data();
            const teamDocRef = doc(db, 'teams', d.id);
            const teamSnap = await getDoc(teamDocRef);
            return {
              id: d.id,
              ...mappingData,
              ...(teamSnap.exists() ? teamSnap.data() : {})
            };
          });
          const myTeamsData = await Promise.all(myTeamsPromises);
          
          setMyTeams(myTeamsData);

          // 2. 공개 모임(추천) 조회 (간단히 isPublic == true 인 것을 최신순 몇 개 가져옴)
          const publicTeamsRef = collection(db, 'teams');
          const q = query(publicTeamsRef, where('isPublic', '==', true), limit(10));
          const publicSnap = await getDocs(q);
          const publicTeamsData = publicSnap.docs.map(d => ({ id: d.id, ...d.data() }));
          setPublicTeams(publicTeamsData);
        } catch (error) {
          console.error("Error fetching landing data", error);
        }
      }
      setDataLoading(false);
    };

    fetchLandingData();
  }, [status, session]);

  const handleCreateTeamClick = () => {
    setCreateModalOpen(true);
  };

  const handleCreateTeam = async () => {
    if (!newTeamName || !session?.user?.id) return;
    try {
      setCreationLoading(true);
      
      // 1. Create team document
      const teamData = {
        teamName: newTeamName,
        templateType: newTemplateType,
        isPublic: newIsPublic,
        createdAt: serverTimestamp(),
        ownerId: session.user.id,
        memberCount: 1
      };
      
      const teamRef = await addDoc(collection(db, 'teams'), teamData);
      const teamId = teamRef.id;

      // 2. Add creator to team's member_summaries
      const memberSummaryRef = doc(db, `teams/${teamId}/member_summaries`, session.user.id);
      await setDoc(memberSummaryRef, {
        name: session.user.name || '방장',
        avatar: session.user.image || null,
        role: 'owner',
        lastUpdated: serverTimestamp()
      });

      // 3. Add team mapping to user's teams subcollection
      const userTeamMappingRef = doc(db, `users/${session.user.id}/teams`, teamId);
      await setDoc(userTeamMappingRef, {
        teamName: newTeamName,
        role: 'owner',
        joinedAt: serverTimestamp()
      });

      setCreateModalOpen(false);
      setNewTeamName('');
      
      // Redirect to the new team's setup wizard
      router.push(`/mile/${teamId}/setup`);
      
    } catch (err) {
      console.error('Error creating team:', err);
      alert('모임 개설 중 오류가 발생했습니다.');
    } finally {
      setCreationLoading(false);
    }
  };

  const handleJoinWithCode = (code: string) => {
    router.push(`/mile/join/${code}`);
  };

  if (status === 'loading' || dataLoading) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  // 1. 비회원 마케팅 랜딩 페이지 분기
  if (status === 'unauthenticated') {
    return <MarketingLandingPage />;
  }

  // 2. 로그인 후 라운지 페이지 (소프트 프리미엄 웰커밍)
  return (
    <div className="min-h-screen bg-[#FAF9F6] relative">
      <div className="absolute top-0 right-0 p-6 z-10">
        <button 
          onClick={() => router.push('/me')}
          className="text-[11px] font-bold text-slate-400 bg-white px-4 py-2 rounded-full hover:bg-slate-50 transition-colors flex items-center gap-1 border border-slate-200 shadow-sm"
        >
          내 정보 ✏️
        </button>
      </div>

      <GuestLounge 
        onCreateTeamClick={handleCreateTeamClick}
        onJoinWithCode={handleJoinWithCode}
        status={status}
        userId={session?.user?.id}
        myTeams={myTeams}
        publicTeams={publicTeams}
      />
      <AuthInterceptModal 
        isOpen={authModalOpen} 
        onClose={() => setAuthModalOpen(false)} 
        callbackUrl={authCallbackUrl} 
      />

      {createModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-[2rem] w-full max-w-sm overflow-hidden shadow-2xl p-6 animate-in zoom-in-95">
            <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
              <Plus className="w-6 h-6 text-emerald-500" /> 새 모임 시작하기
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
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { Shield, Zap, KeyRound, Plus, ArrowRight, Search, Users, LayoutGrid } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { db } from '@/lib/firebase';
import { doc, collection, onSnapshot, query, where, limit } from 'firebase/firestore';

function TeamUnreadBadge({ teamId, userId }: { teamId: string, userId: string }) {
  const [totalUnread, setTotalUnread] = useState(0);

  useEffect(() => {
    if (!teamId || !userId) return;
    let unsubs: (() => void)[] = [];
    
    const counts = { ann: 0, com: 0, sch: 0, pl: 0, exp: 0, chat: 0, att: 0, lin: 0, kan: 0 };
    const checkTotal = () => {
      const total = Object.values(counts).reduce((a,b) => a+b, 0);
      setTotalUnread(total);
    };

    // 1. users/.../team_metadata (Ann, Com, Sch, Pl, Exp)
    const metaUnsub = onSnapshot(doc(db, `users/${userId}/team_metadata`, teamId), (metaSnap) => {
      const data = metaSnap.exists() ? metaSnap.data() : {};
      
      let qAnn = collection(db, `teams/${teamId}/announcements`);
      if (data.lastReadAnnouncementAt) qAnn = query(qAnn, where('createdAt', '>', data.lastReadAnnouncementAt)) as any;
      unsubs.push(onSnapshot(qAnn, (snap) => { counts.ann = snap.size; checkTotal(); }));

      let qCom = collection(db, `teams/${teamId}/community_posts`);
      if (data.lastReadCommunityAt) qCom = query(qCom, where('createdAt', '>', data.lastReadCommunityAt)) as any;
      unsubs.push(onSnapshot(qCom, (snap) => { counts.com = snap.size; checkTotal(); }));

      let qSch = collection(db, `teams/${teamId}/schedules`);
      if (data.lastReadScheduleAt) qSch = query(qSch, where('createdAt', '>', data.lastReadScheduleAt)) as any;
      unsubs.push(onSnapshot(qSch, (snap) => { counts.sch = snap.size; checkTotal(); }));

      let qPl = collection(db, `teams/${teamId}/member_summaries`);
      if (data.lastReadPlayersAt) qPl = query(qPl, where('lastUpdated', '>', data.lastReadPlayersAt)) as any;
      unsubs.push(onSnapshot(qPl, (snap) => { counts.pl = snap.size; checkTotal(); }));

      let qExp = collection(db, `teams/${teamId}/expenses`);
      if (data.lastReadExpenseAt) qExp = query(qExp, where('createdAt', '>', data.lastReadExpenseAt)) as any;
      unsubs.push(onSnapshot(qExp, (snap) => { counts.exp = snap.size; checkTotal(); }));
    });

    // 2. teams/.../memberMeta (Chat, Lineup, Kanban)
    const memberMetaUnsub = onSnapshot(doc(db, `teams/${teamId}/memberMeta`, userId), (metaSnap) => {
      const data = metaSnap.exists() ? metaSnap.data() : {};

      // Chat
      let qChat = collection(db, `teams/${teamId}/messages`);
      if (data.lastReadChatAt) qChat = query(qChat, where('createdAt', '>', data.lastReadChatAt)) as any;
      unsubs.push(onSnapshot(qChat, (snap) => { counts.chat = snap.size; checkTotal(); }));

      // Lineup
      unsubs.push(onSnapshot(doc(db, `teams/${teamId}/lineups`, 'current'), (snap) => {
        if (snap.exists()) {
          const lData = snap.data();
          if (lData.updatedBy === userId) {
            counts.lin = 0;
          } else if (!data.lastReadLineupAt || (lData.updatedAt && lData.updatedAt > data.lastReadLineupAt)) {
            counts.lin = 1;
          } else {
            counts.lin = 0;
          }
        } else {
          counts.lin = 0;
        }
        checkTotal();
      }));

      // Kanban
      let qKan = collection(db, `teams/${teamId}/kanban_tasks`);
      if (data.lastReadKanbanAt) qKan = query(qKan, where('updatedAt', '>', data.lastReadKanbanAt)) as any;
      unsubs.push(onSnapshot(qKan, (snap) => {
        const unreadDocs = snap.docs.filter((doc) => doc.data().updatedBy !== userId);
        counts.kan = unreadDocs.length;
        checkTotal();
      }));
    });

    // 3. Attendance Event RSVP
    const qActiveEvent = query(collection(db, `teams/${teamId}/attendance_events`), where('isActive', '==', true), limit(1));
    const attUnsub = onSnapshot(qActiveEvent, (eventSnap) => {
      if (!eventSnap.empty) {
        const activeEventId = eventSnap.docs[0].id;
        const rsvpRef = doc(db, `teams/${teamId}/attendance_events/${activeEventId}/rsvps`, userId);
        unsubs.push(onSnapshot(rsvpRef, (rsvpSnap) => {
          if (rsvpSnap.exists() && rsvpSnap.data().status && rsvpSnap.data().status !== 'pending') {
            counts.att = 0;
          } else {
            counts.att = 1;
          }
          checkTotal();
        }));
      } else {
        counts.att = 0;
        checkTotal();
      }
    });

    return () => {
      metaUnsub();
      memberMetaUnsub();
      attUnsub();
      unsubs.forEach(u => u());
    };
  }, [teamId, userId]);

  if (totalUnread === 0) return null;
  return (
    <div className="absolute -top-1.5 -right-1.5 flex items-center justify-center min-w-[20px] h-5 px-1.5 bg-red-500 rounded-full border-2 border-white shadow-sm z-10 animate-in zoom-in-50 text-white text-[10px] font-black">
      {totalUnread > 99 ? '99+' : totalUnread}
    </div>
  );
}

interface GuestLoungeProps {
  onCreateTeamClick: () => void;
  onJoinWithCode: (code: string) => void;
  status: 'authenticated' | 'loading' | 'unauthenticated';
  userId?: string;
  myTeams?: any[];
  publicTeams?: any[];
}

export function GuestLounge({ onCreateTeamClick, onJoinWithCode, status, userId, myTeams = [], publicTeams = [] }: GuestLoungeProps) {
  const [inviteCode, setInviteCode] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const handleJoinClick = () => {
    if (inviteCode.trim().length > 0) {
      onJoinWithCode(inviteCode.trim().toUpperCase());
    }
  };

  const filteredPublicTeams = publicTeams.filter(team => 
    team.teamName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen flex flex-col items-center p-4 md:p-6 bg-[#FAF9F6] animate-in fade-in duration-500 font-sans w-full overflow-hidden">
      
      {/* Hero Section */}
      <div className="text-center max-w-lg mb-8 mt-4 md:mt-8">
        <div className="inline-flex items-center justify-center px-4 py-1.5 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-600 text-xs font-bold mb-4">
          ✨ Welcome to Gleemile
        </div>
        <h1 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight leading-tight mb-3">
          우리 팀의 즐거운 기록이<br/>시작되는 곳
        </h1>
        <p className="text-slate-500 text-xs md:text-sm font-medium leading-relaxed px-4">
          팀원들과의 따뜻한 소통, 그리고 정교한 웰니스 관리를 통해<br/>
          더 건강하고 결속력 있는 커뮤니티를 지휘해 보세요.
        </p>
      </div>

      <div className="w-full max-w-3xl space-y-8 pb-20">
        
        {/* 1. 내 모임 (My Clubs) - 가로 스크롤 아이콘 */}
        {myTeams.length > 0 && (
          <section className="space-y-4 w-full">
            <h2 className="text-xl font-black text-slate-800 flex items-center gap-2 pl-2 md:pl-0">
              <LayoutGrid className="w-5 h-5 text-emerald-600" /> 내가 소속된 클럽
            </h2>
            <div className="flex gap-4 overflow-x-auto pb-4 pt-2 px-2 md:px-0 snap-x snap-mandatory scrollbar-hide">
              {myTeams.map(team => {
                const isEmoji = team.teamIcon && team.teamIcon.length <= 4; // Emoji detection
                const iconContent = team.teamIcon ? (
                  isEmoji ? <span className="text-2xl">{team.teamIcon}</span> : <img src={team.teamIcon} alt={team.teamName} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-xl font-black text-emerald-600">{team.teamName?.charAt(0)}</span>
                );

                return (
                  <Link key={team.id} href={`/mile/${team.id}/dashboard`} className="snap-start shrink-0">
                    <div className="flex flex-col items-center gap-2 w-20 group">
                      <div className="relative">
                        <div className="w-16 h-16 rounded-3xl bg-white shadow-sm border border-slate-100 flex items-center justify-center overflow-hidden group-hover:shadow-md group-hover:scale-105 group-hover:border-emerald-200 transition-all relative">
                          {iconContent}
                        </div>
                        {userId && <TeamUnreadBadge teamId={team.id} userId={userId} />}
                      </div>
                      <div className="text-center w-full">
                        <h3 className="font-bold text-slate-800 text-[11px] truncate w-full group-hover:text-emerald-700 transition-colors">
                          {team.teamName}
                        </h3>
                        <p className="text-[9px] text-slate-400 truncate">
                          {(() => {
                            const { normalizeRole, ROLE_LABELS } = require('@/types/role');
                            return ROLE_LABELS[normalizeRole(team.role)] || '멤버';
                          })()}
                        </p>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* 2. 퀵 액션 (가로로 긴 세로 2단 레이아웃) */}
        <section className="flex flex-col gap-3 sm:gap-4">
          {/* 초대 코드 카드 */}
          <div className="bg-white rounded-2xl p-4 sm:px-6 shadow-sm border border-slate-100 flex flex-col sm:flex-row items-center sm:justify-between gap-4 group hover:shadow-md transition-all">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="w-10 h-10 shrink-0 bg-slate-50 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform">
                <KeyRound className="w-5 h-5 text-slate-600" />
              </div>
              <div className="text-left">
                <h3 className="text-sm sm:text-base font-bold text-slate-800">초대 코드가 있나요?</h3>
                <p className="text-[11px] sm:text-xs text-slate-400 font-medium mt-0.5">부여받은 코드를 입력하세요.</p>
              </div>
            </div>
            
            <div className="w-full sm:w-[240px] flex gap-2 shrink-0">
              <input
                type="text"
                maxLength={6}
                placeholder="코드 6자리"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-center text-sm font-mono tracking-widest uppercase text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all placeholder:tracking-normal"
              />
              <Button 
                onClick={handleJoinClick}
                disabled={inviteCode.length < 4}
                className="w-12 shrink-0 h-auto p-0 rounded-xl bg-slate-800 hover:bg-slate-900 text-white shadow-sm disabled:opacity-50"
              >
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* 모임 개설 카드 */}
          <div className="bg-white rounded-2xl p-4 sm:px-6 shadow-sm border border-slate-100 flex flex-col sm:flex-row items-center sm:justify-between gap-4 group hover:shadow-md transition-all">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="w-10 h-10 shrink-0 bg-emerald-50 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <Plus className="w-5 h-5 text-emerald-500" />
              </div>
              <div className="text-left">
                <h3 className="text-sm sm:text-base font-bold text-slate-800">새로운 모임 개설</h3>
                <p className="text-[11px] sm:text-xs text-slate-400 font-medium mt-0.5">직접 방장이 되어 팀을 지휘하세요.</p>
              </div>
            </div>
            
            <Button 
              onClick={onCreateTeamClick}
              className="w-full sm:w-[240px] shrink-0 h-10 sm:h-11 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold text-sm shadow-md transition-all border-0"
            >
              팀 개설하기
            </Button>
          </div>
        </section>

        {/* 3. 모임 탐색 (Discover) */}
        <section className="space-y-6 pt-4 border-t border-slate-200">
          <div className="space-y-2 text-center md:text-left">
            <h2 className="text-xl font-black text-slate-800 flex items-center justify-center md:justify-start gap-2">
              <Search className="w-5 h-5 text-emerald-600" /> 클럽 탐색 및 추천
            </h2>
            <p className="text-sm text-slate-500">Gleemile에서 활동 중인 멋진 팀들을 만나보세요.</p>
          </div>

          {/* 검색 바 */}
          <div className="relative max-w-lg mx-auto md:mx-0">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-slate-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-11 pr-4 py-3 sm:py-4 bg-white border border-slate-200 rounded-2xl text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-sm"
              placeholder="클럽 이름을 검색해보세요"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* 추천 목록 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filteredPublicTeams.length > 0 ? (
              filteredPublicTeams.map(team => (
                <div key={team.id} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex items-center justify-between">
                  <div className="space-y-1 text-left">
                    <h3 className="font-bold text-slate-800 text-base">{team.teamName}</h3>
                    <p className="text-xs text-slate-500 flex items-center gap-1">
                      <Users className="w-3 h-3" /> 멤버 {team.memberCount || 1}명
                    </p>
                  </div>
                  <Button variant="outline" className="rounded-xl h-8 text-xs font-bold shrink-0">가입 신청</Button>
                </div>
              ))
            ) : (
              <div className="col-span-full py-12 text-center bg-white rounded-2xl border border-dashed border-slate-200">
                <p className="text-slate-500 text-sm font-medium">검색 결과가 없습니다.</p>
              </div>
            )}
          </div>
        </section>

      </div>
      
      {/* Stability Footer */}
      <div className="flex items-center justify-center gap-6 text-slate-400 text-xs font-semibold pb-8 w-full border-t border-slate-200 pt-6">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-slate-400" />
          <span>안전한 웰니스 데이터 관리</span>
        </div>
      </div>
      
    </div>
  );
}

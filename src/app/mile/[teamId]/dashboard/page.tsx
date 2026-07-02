'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { doc, getDoc, collection, query, where, getDocs, onSnapshot } from 'firebase/firestore';
import { limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Loader2, ArrowLeft, UserPlus, LayoutDashboard, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { normalizeRole, isManagerOrHigher } from '@/types/role';

// Import all 24 blocks
import { AnnouncementBlock } from '@/components/blocks/AnnouncementBlock';
import { CommunityBlock } from '@/components/blocks/CommunityBlock';
import { ScheduleBlock } from '@/components/blocks/ScheduleBlock';
import { ExpenseSettlementBlock } from '@/components/blocks/ExpenseSettlementBlock';
import { WellnessBlock } from '@/components/blocks/WellnessBlock';

import { PhysicalACWRBlock } from '@/components/blocks/PhysicalACWRBlock';
import { TacticalDrawingBlock } from '@/components/blocks/TacticalDrawingBlock';
import { BracketPositionBlock } from '@/components/blocks/BracketPositionBlock';
import { PlayersBlock } from '@/components/blocks/PlayersBlock';
import { SessionDifficultyBlock } from '@/components/blocks/SessionDifficultyBlock';

import { ClassAttendanceBlock } from '@/components/blocks/ClassAttendanceBlock';


import { KanbanTaskBlock } from '@/components/blocks/KanbanTaskBlock';
import { TeamChatRoom } from '@/components/chat/TeamChatRoom';

const BLOCK_REGISTRY: Record<string, React.FC<any>> = {
  AnnouncementBlock, CommunityBlock, ScheduleBlock, ExpenseSettlementBlock, WellnessBlock,
  PhysicalACWRBlock, TacticalDrawingBlock, BracketPositionBlock, PlayersBlock, SessionDifficultyBlock,
  ClassAttendanceBlock,
  KanbanTaskBlock
};

function DashboardContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const teamId = params?.teamId as string;
  const searchParams = useSearchParams();
  const view = searchParams?.get('view') || 'dashboard';
  
  const [loading, setLoading] = useState(true);
  const [teamInfo, setTeamInfo] = useState<any>(null);
  const [enabledModules, setEnabledModules] = useState<string[]>([]);
  const [pendingRequests, setPendingRequests] = useState(0);
  const [userRole, setUserRole] = useState('guest');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/');
    } else if (status === 'authenticated') {
      fetchDashboard();
    }
  }, [status, teamId]);

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const teamRef = doc(db, 'teams', teamId);
      const teamSnap = await getDoc(teamRef);
      
      if (teamSnap.exists()) {
        const data = teamSnap.data();
        setTeamInfo({ _id: teamId, ...data });
        setEnabledModules(data.enabledModules || []);

        let fetchedRole = 'guest';
        if (session?.user?.id) {
          const myMemberRef = doc(db, `teams/${teamId}/member_summaries/${session.user.id}`);
          const mySnap = await getDoc(myMemberRef);
          
          if (mySnap.exists()) {
            fetchedRole = mySnap.data().role;
          } else if (data.ownerId === session.user.id) {
            fetchedRole = 'owner';
          }
          
          if (fetchedRole === 'owner' || fetchedRole === 'manager') {
            const reqQ = query(collection(db, `teams/${teamId}/join_requests`), where('status', '==', 'pending'));
            const reqSnap = await getDocs(reqQ);
            setPendingRequests(reqSnap.size);
          }
        }
        setUserRole(fetchedRole);
      } else {
        setTeamInfo({ _id: teamId, teamName: '알 수 없는 팀' });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const [announcementsUnreadCount, setAnnouncementsUnreadCount] = useState(0);
  const [communityUnreadCount, setCommunityUnreadCount] = useState(0);
  const [scheduleUnreadCount, setScheduleUnreadCount] = useState(0);
  const [playersUnreadCount, setPlayersUnreadCount] = useState(0);
  const [expenseUnreadCount, setExpenseUnreadCount] = useState(0);
  const [chatUnreadCount, setChatUnreadCount] = useState(0);
  const [attendanceUnreadCount, setAttendanceUnreadCount] = useState(0);
  const [lineupUnreadCount, setLineupUnreadCount] = useState(0);
  const [kanbanUnreadCount, setKanbanUnreadCount] = useState(0);

  useEffect(() => {
    if (!teamId || !session?.user?.id) return;

    let unsubAnnouncements: () => void;
    let unsubCommunity: () => void;
    let unsubSchedule: () => void;
    let unsubPlayers: () => void;
    
    const unsubMeta = onSnapshot(doc(db, `users/${session.user.id}/team_metadata`, teamId), (metaSnap) => {
      const lastReadAnn = metaSnap.exists() ? metaSnap.data().lastReadAnnouncementAt : null;
      const lastReadCom = metaSnap.exists() ? metaSnap.data().lastReadCommunityAt : null;
      const lastReadSchedule = metaSnap.exists() ? metaSnap.data().lastReadScheduleAt : null;
      const lastReadPlayers = metaSnap.exists() ? metaSnap.data().lastReadPlayersAt : null;
      
      let qAnn: any = collection(db, `teams/${teamId}/announcements`);
      if (lastReadAnn) {
        qAnn = query(qAnn, where('createdAt', '>', lastReadAnn));
      }
      if (unsubAnnouncements) unsubAnnouncements();
      unsubAnnouncements = onSnapshot(qAnn, (annSnap: any) => {
        setAnnouncementsUnreadCount(annSnap.size);
      });

      let qCom: any = collection(db, `teams/${teamId}/community_posts`);
      if (lastReadCom) {
        qCom = query(qCom, where('createdAt', '>', lastReadCom));
      }
      if (unsubCommunity) unsubCommunity();
      unsubCommunity = onSnapshot(qCom, (comSnap: any) => {
        setCommunityUnreadCount(comSnap.size);
      });

      let qSchedule: any = collection(db, `teams/${teamId}/schedules`);
      if (lastReadSchedule) {
        qSchedule = query(qSchedule, where('createdAt', '>', lastReadSchedule));
      }
      if (unsubSchedule) unsubSchedule();
      unsubSchedule = onSnapshot(qSchedule, (schSnap: any) => {
        setScheduleUnreadCount(schSnap.size);
      });

      let qPlayers: any = collection(db, `teams/${teamId}/member_summaries`);
      if (lastReadPlayers) {
        qPlayers = query(qPlayers, where('joinedAt', '>', lastReadPlayers));
      }
      if (unsubPlayers) unsubPlayers();
      unsubPlayers = onSnapshot(qPlayers, (playSnap: any) => {
        setPlayersUnreadCount(playSnap.size);
      });

      let qExpense: any = collection(db, `teams/${teamId}/expenses`);
      if (metaSnap.exists() && metaSnap.data().lastReadExpenseAt) {
        qExpense = query(qExpense, where('createdAt', '>', metaSnap.data().lastReadExpenseAt));
      }
      const unsubExpense = onSnapshot(qExpense, (expSnap: any) => {
        setExpenseUnreadCount(expSnap.size);
      });

      // ==========================================
      // Chat Unread Count (limit 100 적용)
      // ==========================================
      let unsubChatMeta: () => void;
      let unsubChatMessages: () => void;

      unsubChatMeta = onSnapshot(doc(db, `teams/${teamId}/memberMeta`, session.user.id), (chatMetaSnap) => {
        let qChat: any = collection(db, `teams/${teamId}/messages`);
        
        if (chatMetaSnap.exists() && chatMetaSnap.data().lastReadChatAt) {
          qChat = query(qChat, where('createdAt', '>', chatMetaSnap.data().lastReadChatAt), limit(100));
        } else {
          // 최초 접속 등으로 lastReadChatAt이 없을 때 전체 스캔 방지를 위해 limit(100)
          qChat = query(qChat, limit(100));
        }

        if (unsubChatMessages) unsubChatMessages();
        unsubChatMessages = onSnapshot(qChat, (msgSnap: any) => {
          setChatUnreadCount(msgSnap.size);
        });
      });

      // ==========================================
      // Class Attendance (RSVP) Unread Count (이중 쿼리 연동)
      // ==========================================
      let unsubAttendanceEvent: () => void;
      let unsubAttendanceRsvp: () => void;

      const qActiveEvent = query(collection(db, `teams/${teamId}/attendance_events`), where('isActive', '==', true), limit(1));
      unsubAttendanceEvent = onSnapshot(qActiveEvent, (eventSnap) => {
        if (!eventSnap.empty) {
          const activeEventId = eventSnap.docs[0].id;
          const rsvpRef = doc(db, `teams/${teamId}/attendance_events/${activeEventId}/rsvps`, session.user.id);
          
          if (unsubAttendanceRsvp) unsubAttendanceRsvp();
          unsubAttendanceRsvp = onSnapshot(rsvpRef, (rsvpSnap) => {
            if (rsvpSnap.exists() && rsvpSnap.data().status && rsvpSnap.data().status !== 'pending') {
              setAttendanceUnreadCount(0); // 투표 완료
            } else {
              setAttendanceUnreadCount(1); // 아직 투표 안 함
            }
          });
        } else {
          setAttendanceUnreadCount(0); // 활성 이벤트 없음
          if (unsubAttendanceRsvp) unsubAttendanceRsvp();
        }
      });

      // ==========================================
      // Lineup Unread Count (단일 문서 교차 검증)
      // ==========================================
      let unsubLineupMeta: () => void;
      let unsubLineupCurrent: () => void;

      unsubLineupMeta = onSnapshot(doc(db, `teams/${teamId}/memberMeta`, session.user.id), (metaSnap) => {
        const lastReadAt = metaSnap.exists() ? metaSnap.data().lastReadLineupAt : null;
        
        if (unsubLineupCurrent) unsubLineupCurrent();
        unsubLineupCurrent = onSnapshot(doc(db, `teams/${teamId}/lineups`, 'current'), (lineupSnap) => {
          if (lineupSnap.exists()) {
            const data = lineupSnap.data();
            if (data.updatedBy === session.user.id) {
              setLineupUnreadCount(0); // 내가 수정한 경우 알람 제외
            } else if (!lastReadAt || (data.updatedAt && data.updatedAt > lastReadAt)) {
              setLineupUnreadCount(1); // 알람 활성화
            } else {
              setLineupUnreadCount(0);
            }
          } else {
            setLineupUnreadCount(0);
          }
        });
      });

      // ==========================================
      // Kanban Unread Count (Index-free with client filter)
      // ==========================================
      let unsubKanbanMeta: () => void;
      let unsubKanbanTasks: () => void;

      unsubKanbanMeta = onSnapshot(doc(db, `teams/${teamId}/memberMeta`, session.user.id), (metaSnap) => {
        const lastReadAt = metaSnap.exists() ? metaSnap.data().lastReadKanbanAt : null;
        
        let qKanban: any = collection(db, `teams/${teamId}/kanban_tasks`);
        if (lastReadAt) {
          qKanban = query(qKanban, where('updatedAt', '>', lastReadAt), limit(100));
        } else {
          qKanban = query(qKanban, limit(100));
        }

        if (unsubKanbanTasks) unsubKanbanTasks();
        unsubKanbanTasks = onSnapshot(qKanban, (kanbanSnap: any) => {
          const unreadDocs = kanbanSnap.docs.filter((doc: any) => {
            const data = doc.data();
            return data.updatedBy !== session.user.id;
          });
          setKanbanUnreadCount(unreadDocs.length);
        });
      });

      return () => {
        if (unsubAnnouncements) unsubAnnouncements();
        if (unsubCommunity) unsubCommunity();
        if (unsubSchedule) unsubSchedule();
        if (unsubPlayers) unsubPlayers();
        if (unsubExpense) unsubExpense();
        if (unsubChatMeta) unsubChatMeta();
        if (unsubChatMessages) unsubChatMessages();
        if (unsubAttendanceEvent) unsubAttendanceEvent();
        if (unsubAttendanceRsvp) unsubAttendanceRsvp();
        if (unsubLineupMeta) unsubLineupMeta();
        if (unsubLineupCurrent) unsubLineupCurrent();
        if (unsubKanbanMeta) unsubKanbanMeta();
        if (unsubKanbanTasks) unsubKanbanTasks();
      };
    });
    
    return () => unsubMeta();
  }, [teamId, session?.user?.id]);

  if (loading || status === 'loading') {
    return (
      <div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (status === 'unauthenticated') return null;

  return (
    <div className={`bg-[#FAF9F6] p-4 font-sans selection:bg-emerald-200 ${view === 'chat' ? 'h-screen overflow-hidden pb-4' : 'min-h-screen pb-24'}`}>
      <div className={`max-w-4xl mx-auto pt-4 md:pt-10 flex flex-col ${view === 'chat' ? 'h-full space-y-4' : 'space-y-6'}`}>
        
        {/* 헤더 */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Link href="/" className="inline-flex items-center gap-1 text-slate-400 hover:text-emerald-600 transition-colors text-sm font-bold">
                <ArrowLeft className="w-4 h-4" /> 홈
              </Link>
              <span className="text-slate-300">|</span>
              <Badge className="bg-emerald-100 text-emerald-700 border-none font-bold text-xs uppercase">
                {teamInfo?.templateType || 'Custom'} DASHBOARD
              </Badge>
            </div>
            <h1 className="text-2xl font-black text-slate-800">
              {teamInfo?.teamName || '모임'}
            </h1>
            <p className="text-xs text-slate-500 mt-1 font-medium">선택된 맞춤형 모듈에 따라 최적화된 뷰를 제공합니다.</p>
          </div>
          
          <div className="flex gap-2">
            {isManagerOrHigher(normalizeRole(userRole)) && (
              <Link href={`/mile/${teamId}/setup`}>
                <Button variant="outline" size="sm" className="gap-1 rounded-xl bg-white shadow-sm hover:bg-slate-50">
                  <LayoutDashboard className="w-4 h-4" /> 대시보드 설정
                </Button>
              </Link>
            )}
            <Link href={`/mile/${teamId}/invite`}>
              <Button variant="outline" size="sm" className="gap-1 rounded-xl bg-white shadow-sm hover:bg-slate-50 text-blue-600 border-blue-100 hover:bg-blue-50">
                <UserPlus className="w-4 h-4" /> 팀원 초대
              </Button>
            </Link>
          </div>
        </div>


        {/* 하이브리드 탭 UI */}
        <div className="flex gap-1.5 mb-6 bg-slate-200/50 p-1.5 rounded-full w-fit mx-auto shadow-inner border border-slate-200/60">
          <button 
            onClick={() => router.push('?view=dashboard', {scroll: false})} 
            className={`px-6 py-2 text-sm rounded-full transition-all duration-200 ${view === 'dashboard' ? 'bg-white shadow-sm font-black text-slate-800' : 'font-bold text-slate-500 hover:text-slate-700'}`}
          >
            클럽 대시보드
          </button>
          <button 
            onClick={() => router.push('?view=chat', {scroll: false})} 
            className={`px-6 py-2 text-sm rounded-full transition-all duration-200 relative flex items-center gap-1.5 ${view === 'chat' ? 'bg-white shadow-sm font-black text-emerald-600' : 'font-bold text-slate-500 hover:text-slate-700'}`}
          >
            클럽 대화방
            {chatUnreadCount > 0 && view !== 'chat' && (
              <span className="absolute -top-1 -right-2 bg-[#E05A47] text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full font-black animate-bounce shadow-sm">
                {chatUnreadCount > 99 ? '99+' : chatUnreadCount}
              </span>
            )}
          </button>
        </div>

        {view === 'dashboard' ? (
          <>

        {/* 가입 승인 대기 알림 위젯 */}
        {pendingRequests > 0 && isManagerOrHigher(normalizeRole(userRole)) && (
          <Link href={`/mile/${teamId}/members/requests`}>
            <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-center justify-between shadow-sm hover:bg-rose-100 transition-colors cursor-pointer mb-6 animate-in slide-in-from-bottom-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-rose-100 rounded-full flex items-center justify-center text-rose-500">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-rose-700">신규 가입 요청이 있습니다</h3>
                  <p className="text-xs text-rose-500 mt-0.5">승인 대기 중인 멤버: <strong>{pendingRequests}명</strong></p>
                </div>
              </div>
              <Button variant="outline" size="sm" className="bg-white text-rose-600 border-rose-200 hover:bg-rose-50 font-bold rounded-xl">
                심사하기
              </Button>
            </div>
          </Link>
        )}

        {enabledModules.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-slate-100 shadow-sm">
            <LayoutDashboard className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-700">활성화된 모듈이 없습니다</h3>
            {isManagerOrHigher(normalizeRole(userRole)) ? (
              <>
                <p className="text-sm text-slate-500 mb-6">모듈 설정을 통해 필요한 기능들을 켜주세요.</p>
                <Link href={`/mile/${teamId}/setup`}>
                  <Button className="rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold">
                    대시보드 설정하러 가기
                  </Button>
                </Link>
              </>
            ) : (
              <p className="text-sm text-slate-500 mb-6">관리자에게 대시보드 모듈 활성화를 요청해 주세요.</p>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
            {enabledModules.map(moduleId => {
              const BlockComponent = BLOCK_REGISTRY[moduleId];
              if (!BlockComponent) return null;
              
              return (
                <div key={moduleId} className="w-full">
                  <BlockComponent 
                    role={userRole} 
                    teamId={teamId} 
                    userId={session?.user?.id || 'test_user'} 
                    unreadCount={
                      moduleId === 'AnnouncementBlock' ? announcementsUnreadCount :
                      moduleId === 'CommunityBlock' ? communityUnreadCount :
                      moduleId === 'ScheduleBlock' ? scheduleUnreadCount : 
                      moduleId === 'PlayersBlock' ? playersUnreadCount :
                      moduleId === 'ExpenseSettlementBlock' ? expenseUnreadCount : 
                      moduleId === 'ClassAttendanceBlock' ? attendanceUnreadCount : 
                      moduleId === 'BracketPositionBlock' ? lineupUnreadCount : 
                      moduleId === 'KanbanTaskBlock' ? kanbanUnreadCount : 0
                    }
                  />
                </div>
              );
            })}
          </div>
        )}
          </>
        ) : (
          <div className="flex-1 w-full max-w-2xl mx-auto rounded-3xl overflow-hidden shadow-sm border border-slate-200 bg-white flex flex-col">
            <TeamChatRoom teamId={teamId} currentUserId={session?.user?.id} currentUserRole={userRole as any} />
          </div>
        )}
      </div>
    </div>
  );
}

export default function TeamDashboardPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-emerald-600" /></div>}>
      <DashboardContent />
    </Suspense>
  );
}


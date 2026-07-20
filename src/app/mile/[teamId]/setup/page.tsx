'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { doc, getDoc, updateDoc, collection, query, orderBy, onSnapshot, Timestamp } from 'firebase/firestore';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
import { assignMemberRole } from '@/lib/firebase/teamService';
import { normalizeRole, ROLE_LABELS, type TeamRole } from '@/types/role';
import { 
  Loader2, Settings, ArrowRight, ArrowLeft, Search,
  Megaphone, MessageCircle, Calendar, DollarSign, HeartPulse,
  Activity, PenTool, LayoutTemplate, Users, ShieldAlert,
  GraduationCap, BookOpen, ThumbsUp, Timer, CalendarCheck,
  Target, KanbanSquare, RefreshCw, ActivitySquare, ClipboardList,
  Flame, Image, FileVideo, Scale, Crown, ChevronDown, UserCircle2, Flag
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import Link from 'next/link';

const AVAILABLE_MODULES = [
  // 공통
  { id: 'AnnouncementBlock', category: 'common', label: '공지사항', description: '팀의 중요 공지를 띄워줍니다.', icon: Megaphone, color: 'text-indigo-500', bg: 'bg-indigo-50' },
  { id: 'CommunityBlock', category: 'common', label: '커뮤니티', description: '팀원 간 자유로운 소통 공간.', icon: MessageCircle, color: 'text-blue-500', bg: 'bg-blue-50' },
  { id: 'ScheduleBlock', category: 'common', label: '일정 관리', description: '팀 캘린더 및 일정 투표 기능.', icon: Calendar, color: 'text-emerald-500', bg: 'bg-emerald-50' },
  { id: 'ExpenseSettlementBlock', category: 'common', label: '회비/비용 정산', description: 'N빵 정산과 회비 내역 공유.', icon: DollarSign, color: 'text-yellow-600', bg: 'bg-yellow-50' },
  { id: 'WellnessBlock', category: 'common', label: '웰니스 컨디션', description: '멤버들의 피로도와 웰니스 기록.', icon: HeartPulse, color: 'text-rose-500', bg: 'bg-rose-50' },

  // 스포츠
  { id: 'SmartPinFinderBlock', category: 'sports', label: '스마트 핀 파인더', description: '카메라로 깃대를 조준하여 샷 거리와 고저차를 측정합니다.', icon: Flag, color: 'text-blue-500', bg: 'bg-blue-50' },
  { id: 'SmartPuttingAssistantBlock', category: 'sports', label: '스마트 퍼팅 어시스턴트', description: 'AR 화면으로 홀컵을 비추면 보정 거리와 에이밍을 알려줍니다.', icon: Target, color: 'text-emerald-500', bg: 'bg-emerald-50' },
  { id: 'PhysicalACWRBlock', category: 'sports', label: '부상 위험도 모니터링', description: '부상 방지 및 훈련 부하량 관리.', icon: Activity, color: 'text-red-500', bg: 'bg-red-50' },
  { id: 'TacticalDrawingBlock', category: 'sports', label: '전술 보드', description: '경기 전술을 그리기 및 공유.', icon: PenTool, color: 'text-slate-600', bg: 'bg-slate-100' },
  { id: 'BracketPositionBlock', category: 'sports', label: '전술 보드 및 라인업', description: '실시간 포메이션 전술판 및 라인업.', icon: LayoutTemplate, color: 'text-sky-500', bg: 'bg-sky-50' },
  { id: 'PlayersBlock', category: 'common', label: '회원 명단', description: '우리 모임 회원들의 프로필 관리.', icon: Users, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  { id: 'SessionDifficultyBlock', category: 'sports', label: '오늘 모임 어땠나요?', description: '당일 모임 체감 난이도 수렴기.', icon: ShieldAlert, color: 'text-orange-500', bg: 'bg-orange-50' },

  // 스터디
  { id: 'ClassAttendanceBlock', category: 'study', label: '참석 예약', description: '독립형 참석 예약(RSVP) 및 모임 인원 관리.', icon: GraduationCap, color: 'text-violet-500', bg: 'bg-violet-50' },

  // 비즈니스

  { id: 'KanbanTaskBlock', category: 'business', label: '업무현황', description: '할 일, 진행 중, 완료 작업 관리.', icon: KanbanSquare, color: 'text-indigo-600', bg: 'bg-indigo-50' }
];

const CATEGORY_TABS = [
  { id: 'all', label: '전체보기' },
  { id: 'common', label: '공통' },
  { id: 'sports', label: '⚽ 스포츠' },
  { id: 'study', label: '📚 스터디' },
  { id: 'business', label: '💼 비즈니스' }
];

const PREDEFINED_EMOJIS = ['🚀', '⚽', '🎨', '💼', '🏆', '🔥', '💡', '🌟', '📚', '💪'];

interface MemberSummary {
  id: string;
  name: string;
  role: string;
  joinedAt?: Timestamp;
}

const ROLE_OPTIONS: { value: TeamRole; label: string; color: string; bg: string }[] = [
  { value: 'manager', label: '운영진', color: 'text-orange-700', bg: 'bg-orange-50 border-orange-200' },
  { value: 'member', label: '회원', color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
  { value: 'guest', label: '참관인', color: 'text-slate-600', bg: 'bg-slate-50 border-slate-200' },
];

export default function TeamSetupPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const teamId = params?.teamId as string;

  const [loading, setLoading] = useState(true);
  const [teamName, setTeamName] = useState('새로운 팀');
  const [teamDescription, setTeamDescription] = useState('');
  const [teamTemplate, setTeamTemplate] = useState('common');
  const [teamIcon, setTeamIcon] = useState<string>('');
  const [selectedModules, setSelectedModules] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);
  
  const [iconUploading, setIconUploading] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  // 👑 회원 등급 관리 상태
  const [isOwner, setIsOwner] = useState(false);
  const [members, setMembers] = useState<MemberSummary[]>([]);
  const [teamOwnerId, setTeamOwnerId] = useState('');
  const [roleChanging, setRoleChanging] = useState<string | null>(null); // 변경 중인 멤버 ID
  const [openDropdown, setOpenDropdown] = useState<string | null>(null); // 열린 드롭다운 ID

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/');
      return;
    }
    if (status === 'authenticated') {
      fetchTeamData();
    }
  }, [status, teamId]);

  const fetchTeamData = async () => {
    if (!teamId) return;
    try {
      const teamRef = doc(db, 'teams', teamId);
      const teamSnap = await getDoc(teamRef);
      if (teamSnap.exists()) {
        const data = teamSnap.data();
        setTeamName(data.teamName || '새로운 팀');
        setTeamDescription(data.description || '');
        setTeamIcon(data.teamIcon || '');
        
        const ownerId = data.ownerId || '';
        setTeamOwnerId(ownerId);
        
        // Owner 여부 확인
        const currentUserId = session?.user?.id;
        if (currentUserId && ownerId === currentUserId) {
          setIsOwner(true);
        } else if (currentUserId) {
          // member_summaries에서도 확인
          const mySummaryRef = doc(db, `teams/${teamId}/member_summaries`, currentUserId);
          const mySummarySnap = await getDoc(mySummaryRef);
          if (mySummarySnap.exists() && mySummarySnap.data().role === 'owner') {
            setIsOwner(true);
          }
        }
        
        const template = data.templateType || 'common';
        setTeamTemplate(template);
        
        // Auto select tab based on template
        if (template && template !== 'common') {
          setActiveTab(template);
        }

        if (data.enabledModules && data.enabledModules.length > 0) {
          // If already has modules set
          const mods: Record<string, boolean> = {};
          data.enabledModules.forEach((m: string) => mods[m] = true);
          setSelectedModules(mods);
        } else {
          // Default selection: common + template specific
          const defaults: Record<string, boolean> = {};
          AVAILABLE_MODULES.forEach(m => {
            if (m.category === 'common' || m.category === template) {
              defaults[m.id] = true;
            }
          });
          setSelectedModules(defaults);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // 👑 Owner일 때 멤버 목록 실시간 리스닝
  useEffect(() => {
    if (!isOwner || !teamId) return;
    const q = query(collection(db, `teams/${teamId}/member_summaries`), orderBy('joinedAt', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetched: MemberSummary[] = [];
      snapshot.forEach(docSnap => {
        fetched.push({ id: docSnap.id, ...docSnap.data() } as MemberSummary);
      });
      setMembers(fetched);
    });
    return () => unsubscribe();
  }, [isOwner, teamId]);

  const handleRoleChange = async (targetUserId: string, newRole: TeamRole) => {
    if (!session?.user?.id || !teamId) return;
    setRoleChanging(targetUserId);
    try {
      await assignMemberRole(teamId, targetUserId, newRole as 'manager' | 'member' | 'guest', session.user.id);
      setOpenDropdown(null);
    } catch (error: any) {
      alert(error.message || '등급 변경에 실패했습니다.');
    } finally {
      setRoleChanging(null);
    }
  };

  const handleToggle = (moduleId: string, checked: boolean) => {
    setSelectedModules(prev => ({
      ...prev,
      [moduleId]: checked
    }));
  };

  const handleComplete = async () => {
    if (!teamId) return;
    try {
      setSaving(true);
      const enabled = Object.keys(selectedModules).filter(k => selectedModules[k]);
      const teamRef = doc(db, 'teams', teamId);
      await updateDoc(teamRef, {
        enabledModules: enabled,
        description: teamDescription,
        teamIcon: teamIcon,
        updatedAt: new Date()
      });
      alert('대시보드 설정이 저장되었습니다.');
      router.push(`/mile/${teamId}/dashboard`);
    } catch (error) {
      console.error(error);
      alert('설정 저장 중 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const filteredModules = useMemo(() => {
    return AVAILABLE_MODULES.filter(m => {
      const matchesSearch = m.label.includes(searchQuery) || m.description.includes(searchQuery);
      const matchesTab = activeTab === 'all' || m.category === activeTab;
      return matchesSearch && matchesTab;
    });
  }, [searchQuery, activeTab]);

  const activeCount = Object.values(selectedModules).filter(Boolean).length;

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !teamId) return;

    setIconUploading(true);
    try {
      const img = document.createElement('img');
      img.src = URL.createObjectURL(file);
      await new Promise((resolve) => { img.onload = resolve; });

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      // 최대 256x256 해상도로 리사이징
      const MAX_SIZE = 256;
      let width = img.width;
      let height = img.height;
      if (width > height) {
        if (width > MAX_SIZE) { height *= MAX_SIZE / width; width = MAX_SIZE; }
      } else {
        if (height > MAX_SIZE) { width *= MAX_SIZE / height; height = MAX_SIZE; }
      }
      canvas.width = width;
      canvas.height = height;
      ctx?.drawImage(img, 0, 0, width, height);
      
      const webpDataUrl = canvas.toDataURL('image/webp', 0.8);
      
      const iconRef = ref(storage, `teams/${teamId}/icon.webp`);
      await uploadString(iconRef, webpDataUrl, 'data_url');
      const downloadURL = await getDownloadURL(iconRef);
      
      setTeamIcon(downloadURL);
    } catch (error) {
      console.error('Image upload failed:', error);
      alert('이미지 업로드에 실패했습니다.');
    } finally {
      setIconUploading(false);
    }
  };

  if (loading || status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF9F6]">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF9F6] pb-24 selection:bg-emerald-200 font-sans">
      
      {/* Header */}
      <div className="bg-white px-6 py-10 border-b border-slate-100 shadow-sm text-center sticky top-0 z-30 relative">
        <Link 
          href={`/mile/${teamId}/dashboard`} 
          className="absolute top-6 left-6 inline-flex items-center gap-1 text-slate-400 hover:text-emerald-600 transition-colors text-sm font-bold"
        >
          <ArrowLeft className="w-4 h-4" /> 뒤로가기
        </Link>

        <div className="w-14 h-14 bg-slate-50 rounded-2xl mx-auto flex items-center justify-center mb-4 shadow-inner border border-slate-100">
          <Settings className="w-7 h-7 text-slate-700" />
        </div>
        <h1 className="text-2xl font-black text-slate-800 tracking-tight mb-2">
          대시보드 맞춤 설정
        </h1>
        <p className="text-slate-500 text-sm font-medium max-w-sm mx-auto leading-relaxed">
          <span className="text-emerald-600 font-bold">{teamName}</span>의 성격에 맞춰
          필요한 모듈을 탐색하고 조합해 보세요.
        </p>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
        
        {/* Team Icon Setup */}
        <section className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col md:flex-row items-center md:items-start gap-6">
          <div className="flex-1 space-y-2 text-center md:text-left">
            <h2 className="text-lg font-black text-slate-800">클럽 프로필 이미지 설정</h2>
            <p className="text-sm text-slate-500">
              클럽을 대표하는 사진을 업로드하거나 어울리는 이모지를 선택하세요.<br className="hidden md:block"/>설정된 사진은 메인 화면의 내 클럽 목록에 표시됩니다.
            </p>
            <div className="pt-4 flex flex-wrap items-center justify-center md:justify-start gap-3">
              <label className="cursor-pointer">
                <Input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={iconUploading} />
                <Button asChild variant="outline" className="rounded-xl border-emerald-200 text-emerald-700 hover:bg-emerald-50 h-10" disabled={iconUploading}>
                  <span>
                    {iconUploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Image className="w-4 h-4 mr-2" />}
                    사진 업로드
                  </span>
                </Button>
              </label>
              <Button 
                variant="outline" 
                className="rounded-xl h-10 text-slate-600 hover:bg-slate-50"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              >
                😀 이모지 선택
              </Button>
            </div>
            
            {showEmojiPicker && (
              <div className="mt-4 p-4 bg-slate-50 rounded-2xl flex flex-wrap gap-2 justify-center md:justify-start animate-in slide-in-from-top-2">
                {PREDEFINED_EMOJIS.map(emoji => (
                  <button 
                    key={emoji} 
                    onClick={() => { setTeamIcon(emoji); setShowEmojiPicker(false); }}
                    className="w-10 h-10 text-2xl hover:scale-125 transition-transform bg-white rounded-xl shadow-sm border border-slate-200 flex items-center justify-center"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="shrink-0 flex flex-col items-center">
            <div className="w-24 h-24 rounded-3xl bg-slate-50 border border-slate-200 shadow-inner flex items-center justify-center overflow-hidden relative">
              {iconUploading ? (
                <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
              ) : teamIcon ? (
                teamIcon.length <= 4 ? (
                  <span className="text-4xl">{teamIcon}</span>
                ) : (
                  <img src={teamIcon} alt="Team Icon" className="w-full h-full object-cover" />
                )
              ) : (
                <span className="text-3xl font-black text-slate-300">{teamName.charAt(0)}</span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-2 font-bold uppercase tracking-widest">Preview</p>
          </div>
        </section>

        {/* Team Description Setup */}
        <section className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 pb-12">
          <div className="flex items-center gap-3 mb-4">
            <div>
              <h2 className="text-lg font-black text-slate-800">클럽 한줄 소개 설정</h2>
              <p className="text-xs text-slate-500 font-medium mt-1">클럽의 정체성을 한 문장으로 표현해보세요.</p>
            </div>
          </div>
          
          <div className="border-t border-slate-100 pt-4">
            <label className="text-xs font-bold text-slate-500 mb-1.5 flex justify-between">
              <span>한줄 소개 입력</span>
              <span className="text-slate-400 font-normal">{teamDescription.length}/60</span>
            </label>
            <input
              type="text"
              placeholder="예: 매주 토요일 오전에 달리는 모임입니다."
              maxLength={60}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              value={teamDescription}
              onChange={(e) => setTeamDescription(e.target.value)}
            />
          </div>
        </section>

        {/* 👑 회원 등급 관리 섹션 — Owner만 표시 */}
        {isOwner && (
          <section className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center">
                <Crown className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <h2 className="text-lg font-black text-slate-800">회원 등급 관리</h2>
                <p className="text-xs text-slate-500 font-medium">관리자만 회원의 등급을 변경할 수 있습니다.</p>
              </div>
            </div>
            
            <div className="mt-4 border-t border-slate-100 pt-4">
              <div className="grid grid-cols-[auto_1fr_auto] gap-x-3 gap-y-0.5 items-center px-2 mb-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">프로필</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">이름</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right">등급</span>
              </div>
              
              <div className="space-y-2">
                {members.map((member) => {
                  const memberRole = normalizeRole(member.role);
                  const isSelf = member.id === session?.user?.id;
                  const isMemberOwner = member.id === teamOwnerId || memberRole === 'owner';
                  const isDropdownOpen = openDropdown === member.id;
                  const isChanging = roleChanging === member.id;
                  
                  return (
                    <div key={member.id} className="relative">
                      <div className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${
                        isMemberOwner ? 'bg-amber-50/50 border-amber-200' : 'bg-slate-50/50 border-slate-100'
                      }`}>
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 bg-white rounded-full flex items-center justify-center text-slate-400 shrink-0 border border-slate-200">
                            {isMemberOwner ? (
                              <Crown className="w-4 h-4 text-amber-500" />
                            ) : (
                              <UserCircle2 className="w-5 h-5" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <span className="text-sm font-bold text-slate-800 block truncate">
                              {member.name}
                              {isSelf && <span className="text-[10px] text-emerald-500 ml-1">(나)</span>}
                            </span>
                          </div>
                        </div>
                        
                        {/* 등급 표시 / 변경 버튼 */}
                        {isMemberOwner ? (
                          <span className="text-xs font-bold text-amber-600 bg-amber-100 px-3 py-1.5 rounded-lg border border-amber-200 shrink-0">
                            👑 관리자
                          </span>
                        ) : (
                          <button
                            onClick={() => setOpenDropdown(isDropdownOpen ? null : member.id)}
                            disabled={isChanging}
                            className={`flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-lg border transition-all shrink-0 ${
                              isDropdownOpen 
                                ? 'bg-emerald-50 border-emerald-300 text-emerald-700 ring-1 ring-emerald-300'
                                : memberRole === 'manager'
                                  ? 'bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100'
                                  : memberRole === 'member'
                                    ? 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
                                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                            }`}
                          >
                            {isChanging ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <>
                                {ROLE_LABELS[memberRole] || '회원'}
                                <ChevronDown className={`w-3 h-3 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                              </>
                            )}
                          </button>
                        )}
                      </div>
                      
                      {/* 드롭다운 */}
                      {isDropdownOpen && !isMemberOwner && (
                        <div className="absolute right-0 top-full mt-1 z-20 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden min-w-[140px] animate-in slide-in-from-top-2 duration-150">
                          {ROLE_OPTIONS.map(option => (
                            <button
                              key={option.value}
                              onClick={() => handleRoleChange(member.id, option.value)}
                              disabled={memberRole === option.value}
                              className={`w-full text-left px-4 py-2.5 text-sm font-bold transition-colors flex items-center justify-between ${
                                memberRole === option.value
                                  ? 'bg-emerald-50 text-emerald-700'
                                  : 'text-slate-700 hover:bg-slate-50'
                              }`}
                            >
                              <span>{option.label}</span>
                              {memberRole === option.value && (
                                <span className="text-emerald-500 text-xs">✓ 현재</span>
                              )}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              
              {members.length === 0 && (
                <p className="text-center text-sm text-slate-400 py-8 font-medium">등록된 회원이 없습니다.</p>
              )}
            </div>
          </section>
        )}

        {/* Search & Filter */}
        <div className="space-y-4">
          <div className="relative">
            <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input 
              placeholder="모듈 이름이나 기능을 검색해 보세요..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-14 bg-white border-slate-200 rounded-2xl shadow-sm text-base focus-visible:ring-emerald-500"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {CATEGORY_TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`whitespace-nowrap px-4 py-2 rounded-xl text-sm font-bold transition-all border ${
                  activeTab === tab.id
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-700'
                    : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Modules Grid */}
        {filteredModules.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-slate-400 font-bold">검색 결과가 없습니다.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredModules.map(module => {
              const Icon = module.icon;
              const isChecked = selectedModules[module.id] || false;
              
              return (
                <div 
                  key={module.id} 
                  className={`p-5 rounded-2xl border transition-all duration-300 flex items-center justify-between cursor-pointer ${
                    isChecked 
                      ? 'bg-white border-emerald-500 shadow-md shadow-emerald-500/10 ring-1 ring-emerald-500' 
                      : 'bg-white border-slate-200 hover:border-emerald-300 hover:shadow-sm'
                  }`}
                  onClick={() => handleToggle(module.id, !isChecked)}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${module.bg}`}>
                      <Icon className={`w-6 h-6 ${module.color}`} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider bg-slate-100 px-1.5 py-0.5 rounded-sm">
                          {module.category}
                        </span>
                        <h3 className="text-base font-bold text-slate-800">
                          {module.label}
                        </h3>
                      </div>
                      <p className="text-xs text-slate-500 font-medium">
                        {module.description}
                      </p>
                    </div>
                  </div>
                  
                  <div onClick={(e) => e.stopPropagation()}>
                    <Switch 
                      checked={isChecked}
                      onCheckedChange={(checked) => handleToggle(module.id, checked)}
                      className="data-[state=checked]:bg-emerald-500"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Submit */}
        <div className="pt-8 pb-10">
          <Button 
            onClick={handleComplete}
            disabled={saving || activeCount === 0}
            className="w-full h-14 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold text-lg shadow-xl shadow-emerald-500/20 transition-all flex items-center justify-center gap-2"
          >
            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : (
              <>총 {activeCount}개 모듈로 대시보드 조립 <ArrowRight className="w-5 h-5" /></>
            )}
          </Button>
          <p className="text-center text-xs text-slate-400 mt-4 font-medium">
            언제든지 셋업 화면으로 돌아와 모듈을 추가/제거할 수 있습니다.
          </p>
        </div>

      </div>
    </div>
  );
}

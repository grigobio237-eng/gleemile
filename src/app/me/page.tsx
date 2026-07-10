'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Loader2, LogOut, Shield, Mail, User, Camera, Smartphone, MapPin, Activity, Flame, HeartPulse, Plus, Settings2, Bell, EyeOff, Users, Trash2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { db } from '@/lib/firebase';
import { doc, collection, onSnapshot, setDoc, getDoc, deleteDoc, updateDoc, arrayUnion, writeBatch } from 'firebase/firestore';
import { GleemileUser } from '@/types/user';
import { requestFCMToken, removeFCMToken } from '@/lib/firebase/messaging';

export default function MyPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [userData, setUserData] = useState<GleemileUser | null>(null);
  const [joinedTeams, setJoinedTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Settings Form State
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | 'none'>('none');
  const [ageGroup, setAgeGroup] = useState<string>('');
  const [recommender, setRecommender] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [privacyMode, setPrivacyMode] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(false);

  // Club Management State
  const [squadEditMode, setSquadEditMode] = useState(false);
  const [selectedTeamForLeave, setSelectedTeamForLeave] = useState<any>(null);
  const [leaveModalType, setLeaveModalType] = useState<'leave' | 'delegate' | 'delete' | null>(null);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    if (status !== 'authenticated' || !session?.user?.id) return;
    
    const userRef = doc(db, 'users', session.user.id);
    const unsubscribe = onSnapshot(userRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as GleemileUser;
        setUserData(data);
        // Form init if not touched
        if (!phone && data.phoneNumber) setPhone(data.phoneNumber);
        if (!address && data.address) setAddress(data.address);
        if (data.gender) setGender(data.gender);
        if (data.ageGroup) setAgeGroup(data.ageGroup);
        if (data.recommender) setRecommender(data.recommender);
        
        // FCM 토큰 존재 여부에 따라 스위치 초기화
        const tokens = (data as any).fcmTokens || [];
        setPushEnabled(tokens.length > 0);
      }
      setLoading(false);
    }, (error) => {
      console.error(error);
      setLoading(false);
    });

    const teamsRef = collection(db, `users/${session.user.id}/teams`);
    const unsubscribeTeams = onSnapshot(teamsRef, async (snapshot) => {
      const promises = snapshot.docs.map(async (d) => {
        const teamId = d.id;
        const teamDocRef = doc(db, 'teams', teamId);
        const teamSnap = await getDoc(teamDocRef);
        return {
          id: teamId,
          ...d.data(),
          ...(teamSnap.exists() ? teamSnap.data() : {})
        };
      });
      const fetchedTeams = await Promise.all(promises);
      setJoinedTeams(fetchedTeams);
    });

    return () => {
      unsubscribe();
      unsubscribeTeams();
    };
  }, [status, session]);

  // 팀 분리 로직 (useMemo로 렌더링 최적화)
  const ownerTeams = useMemo(() => joinedTeams.filter(t => t.role === 'owner'), [joinedTeams]);
  const memberTeams = useMemo(() => joinedTeams.filter(t => t.role !== 'owner'), [joinedTeams]);

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF9F6]">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  if (status === 'unauthenticated' || !session?.user || !userData) {
    router.replace('/');
    return null;
  }

  const handleSaveSettings = async () => {
    if (!session?.user?.id) return;
    setIsSaving(true);
    try {
      const userRef = doc(db, 'users', session.user.id);
      await setDoc(userRef, { 
        phoneNumber: phone, 
        address: address,
        gender: gender,
        ageGroup: ageGroup,
        recommender: recommender
      }, { merge: true });
      // Optional: Toast success
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  const handlePushToggle = async (checked: boolean) => {
    if (!session?.user?.id) return;
    setPushEnabled(checked);
    
    try {
      if (checked) {
        const token = await requestFCMToken();
        if (token) {
          const userRef = doc(db, 'users', session.user.id);
          await updateDoc(userRef, { fcmTokens: arrayUnion(token) });
        } else {
          setPushEnabled(false);
        }
      } else {
        const token = await requestFCMToken(); // 이미 승인된 상태라 바로 가져옴
        if (token) {
          await removeFCMToken(session.user.id, token);
        }
      }
    } catch (e) {
      console.error(e);
      setPushEnabled(!checked); // 원상복구
    }
  };

  const handleSignOut = async () => {
    try {
      if (session?.user?.id) {
        const token = await requestFCMToken();
        if (token) {
          await removeFCMToken(session.user.id, token);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      signOut({ callbackUrl: '/' });
    }
  };

  const handleLeaveClick = async (team: any) => {
    if (!session?.user?.id) return;
    setSelectedTeamForLeave(team);
    
    if (team.role !== 'owner') {
      setLeaveModalType('leave'); // 일반 멤버 탈퇴
      return;
    }

    try {
      const teamRef = doc(db, 'teams', team.id);
      const teamSnap = await getDoc(teamRef);
      if (teamSnap.exists()) {
        const memberCount = teamSnap.data().memberCount || 1;
        if (memberCount > 1) {
          setLeaveModalType('delegate');
        } else {
          setLeaveModalType('delete');
        }
      } else {
        setLeaveModalType('delete');
      }
    } catch (e) {
      console.error(e);
      alert('데이터를 확인하는 중 오류가 발생했습니다.');
    }
  };

  const handleConfirmLeave = async () => {
    if (!session?.user?.id || !selectedTeamForLeave || !leaveModalType) return;
    setIsLeaving(true);
    try {
      const teamId = selectedTeamForLeave.id;
      const userId = session.user.id;

      if (leaveModalType === 'leave') {
        // 일반 멤버 탈퇴 (원자적 삭제)
        const batch = writeBatch(db);
        batch.delete(doc(db, `users/${userId}/teams`, teamId));
        batch.delete(doc(db, `teams/${teamId}/member_summaries`, userId));
        await batch.commit();
      } else if (leaveModalType === 'delete') {
        // 방장 방 삭제 (API 호출하여 재귀적 폭파)
        const res = await fetch(`/api/mile/team/${teamId}`, { method: 'DELETE' });
        if (!res.ok) {
          throw new Error('클럽 삭제에 실패했습니다.');
        }
        // 내 목록에서도 제거
        const batch = writeBatch(db);
        batch.delete(doc(db, `users/${userId}/teams`, teamId));
        await batch.commit();
      } else if (leaveModalType === 'delegate') {
        router.push(`/mile/${teamId}/members`);
        return; // Redirecting
      }
      
      setLeaveModalType(null);
      setSelectedTeamForLeave(null);
      setSquadEditMode(false);
    } catch (e) {
      console.error(e);
      alert('처리 중 오류가 발생했습니다.');
    } finally {
      setIsLeaving(false);
    }
  };

  const handleAvatarUpload = () => {
    alert('향후 업데이트를 통해 갤러리 접근 및 업로드 기능이 제공됩니다.');
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6] pt-12 pb-24 px-4 font-sans selection:bg-emerald-200">
      <div className="max-w-md mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">마이 프로필</h1>
          <div className="flex items-center gap-1">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => router.push('/')}
              className="text-slate-400 hover:text-emerald-600 font-bold px-2"
            >
              메인 홈
            </Button>
          </div>
        </div>

        {/* 1. Avatar & Future Kakao Sync */}
        <Card className="rounded-[32px] border-none shadow-sm overflow-hidden relative group bg-white">
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-gradient-to-br from-emerald-100 to-green-50 rounded-full blur-3xl opacity-60 pointer-events-none" />
          <CardContent className="p-8 flex flex-col items-center text-center relative z-10">
            <div className="relative mb-4">
              <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-emerald-50 shadow-md relative">
                {userData.avatarUrl || userData.avatar ? (
                  <img src={userData.avatarUrl || userData.avatar} alt={userData.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-400">
                    <User className="w-10 h-10" />
                  </div>
                )}
              </div>
              <button 
                onClick={handleAvatarUpload}
                className="absolute bottom-0 right-0 w-8 h-8 bg-white border border-slate-100 rounded-full flex items-center justify-center shadow-md text-slate-600 hover:text-emerald-600 hover:scale-105 transition-all"
              >
                <Camera className="w-4 h-4" />
              </button>
            </div>
            
            <h2 className="text-xl font-black text-slate-800 mb-1">{userData.name}</h2>
            <div className="flex items-center gap-1.5 text-slate-500 text-sm mb-4 font-medium">
              <Mail className="w-3.5 h-3.5" />
              <span>{userData.email}</span>
            </div>

            <div className="w-full bg-slate-50/50 rounded-2xl p-4 border border-line flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-slate-700">
                  <Shield className="w-4 h-4 text-emerald-500" />
                  <span className="text-xs font-bold">플랫폼 권한</span>
                </div>
                <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-none font-bold text-[10px] px-2.5">
                  {userData.globalRole?.toUpperCase()}
                </Badge>
              </div>
              <p className="text-[10px] text-slate-400 text-left leading-relaxed mt-1">
                ※ 소셜 로그인 연동 시 프로필이 자동으로 동기화됩니다.
              </p>
            </div>
          </CardContent>
        </Card>


        {/* 3. Multi-Squad Switcher */}
        <div className="bg-white rounded-[28px] border border-line shadow-sm p-5 space-y-8">
          
          {/* Section 1: 내가 개설한 방 */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-obsidian flex items-center gap-2">
                내가 개설한 방
                <button 
                  onClick={() => setSquadEditMode(!squadEditMode)} 
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-md transition-colors ${squadEditMode ? 'bg-red-50 text-red-600' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                >
                  {squadEditMode ? '완료' : '관리'}
                </button>
              </h3>
              <span className="text-[10px] font-bold text-slate-400">{ownerTeams.length}개 소속됨</span>
            </div>
            
            {ownerTeams.length === 0 ? (
              <div className="py-4 text-center text-xs text-slate-400">개설한 방이 없습니다.</div>
            ) : (
              <div className="flex gap-4 overflow-x-auto pt-2 pb-2 px-1 custom-scrollbar items-start">
                {ownerTeams.map((team) => {
                  const isEmoji = team.teamIcon && team.teamIcon.length <= 4;
                  const hasImage = team.logoUrl || team.logo || (team.teamIcon && !isEmoji);
                  const imgSource = team.logoUrl || team.logo || team.teamIcon;

                  return (
                    <div 
                      key={team.id} 
                      className="relative shrink-0 cursor-pointer group flex flex-col items-center gap-1.5 w-14"
                      onClick={() => squadEditMode ? handleLeaveClick(team) : router.push(`/mile/${team.id}/dashboard`)}
                    >
                      <div 
                        className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-md border-2 border-white ring-2 transition-all overflow-hidden group-hover:scale-105 ${squadEditMode ? 'opacity-90 ring-red-100 group-hover:ring-red-200' : 'ring-emerald-100'} ${!hasImage ? 'bg-gradient-to-br from-green-500 to-emerald-600' : 'bg-slate-50'}`}
                        title={team.teamName}
                      >
                        {isEmoji ? (
                          <span className="text-2xl">{team.teamIcon}</span>
                        ) : hasImage ? (
                          <img src={imgSource} alt={team.teamName} className="w-full h-full object-cover" />
                        ) : (
                          <span>{team.teamName?.charAt(0)?.toUpperCase() || 'T'}</span>
                        )}
                        {squadEditMode && (
                          <div className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg border-2 border-white animate-in zoom-in-50 z-10 group-hover:scale-110 transition-transform">
                            <Trash2 className="w-3.5 h-3.5" />
                          </div>
                        )}
                      </div>
                      <span className="text-[10px] font-bold text-slate-600 truncate w-[120%] text-center group-hover:text-emerald-600 transition-colors">
                        {team.teamName}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Section 2: 내가 가입한 방 */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-obsidian flex items-center gap-2">
                내가 가입한 방
              </h3>
              <span className="text-[10px] font-bold text-slate-400">{memberTeams.length}개 소속됨</span>
            </div>
            
            {memberTeams.length === 0 ? (
              <div className="py-4 text-center text-xs text-slate-400">가입한 방이 없습니다.</div>
            ) : (
              <div className="flex gap-4 overflow-x-auto pt-2 pb-2 px-1 custom-scrollbar items-start">
                {memberTeams.map((team) => {
                  const isEmoji = team.teamIcon && team.teamIcon.length <= 4;
                  const hasImage = team.logoUrl || team.logo || (team.teamIcon && !isEmoji);
                  const imgSource = team.logoUrl || team.logo || team.teamIcon;

                  return (
                    <div 
                      key={team.id} 
                      className="relative shrink-0 cursor-pointer group flex flex-col items-center gap-1.5 w-14"
                      onClick={() => squadEditMode ? handleLeaveClick(team) : router.push(`/mile/${team.id}/dashboard`)}
                    >
                      <div 
                        className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-md border-2 border-white ring-2 transition-all overflow-hidden group-hover:scale-105 ${squadEditMode ? 'opacity-90 ring-red-100 group-hover:ring-red-200' : 'ring-emerald-100'} ${!hasImage ? 'bg-gradient-to-br from-green-500 to-emerald-600' : 'bg-slate-50'}`}
                        title={team.teamName}
                      >
                        {isEmoji ? (
                          <span className="text-2xl">{team.teamIcon}</span>
                        ) : hasImage ? (
                          <img src={imgSource} alt={team.teamName} className="w-full h-full object-cover" />
                        ) : (
                          <span>{team.teamName?.charAt(0)?.toUpperCase() || 'T'}</span>
                        )}
                        {squadEditMode && (
                          <div className="absolute -top-2 -right-2 w-6 h-6 bg-slate-500 text-white rounded-full flex items-center justify-center shadow-lg border-2 border-white animate-in zoom-in-50 z-10 group-hover:scale-110 transition-transform">
                            <LogOut className="w-3.5 h-3.5" />
                          </div>
                        )}
                      </div>
                      <span className="text-[10px] font-bold text-slate-600 truncate w-[120%] text-center group-hover:text-emerald-600 transition-colors">
                        {team.teamName}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          
          {/* Create New Team Button */}
          <div className="pt-2 flex justify-center">
            <button 
              onClick={() => router.push('/')}
              className="w-14 h-14 bg-slate-50 border border-dashed border-slate-300 rounded-2xl flex-shrink-0 flex flex-col items-center justify-center text-slate-400 hover:text-emerald-600 hover:border-emerald-300 transition-all shrink-0 hover:scale-105"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 4. Settings: Commerce Expansion Layer */}
        <div className="bg-white rounded-[28px] border border-line shadow-sm overflow-hidden">
          <div className="p-5 border-b border-line bg-slate-50/50 flex items-center gap-2">
            <Settings2 className="w-4 h-4 text-slate-500" />
            <h3 className="text-sm font-black text-obsidian">내 정보 관리</h3>
          </div>
          <div className="p-5 space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 flex items-center gap-1.5">
                <Smartphone className="w-3.5 h-3.5" /> 연락처
              </label>
              <Input 
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="010-0000-0000"
                className="h-12 rounded-xl bg-slate-50 border-line text-sm font-medium"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" /> 기본 주소지
              </label>
              <Input 
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="상세 주소를 입력해주세요"
                className="h-12 rounded-xl bg-slate-50 border-line text-sm font-medium"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" /> 성별
              </label>
              <div className="flex gap-2">
                {['male', 'female', 'none'].map((g) => (
                  <Button
                    key={g}
                    variant={gender === g ? "default" : "outline"}
                    onClick={() => setGender(g as any)}
                    className={`flex-1 h-12 rounded-xl font-bold ${gender === g ? 'bg-emerald-500 text-white hover:bg-emerald-600' : 'text-slate-500'}`}
                  >
                    {g === 'male' ? '남성' : g === 'female' ? '여성' : '선택안함'}
                  </Button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5" /> 연령대 (10대 ~ 60대 이상)
              </label>
              <div className="px-2 pb-6">
                <input
                  type="range"
                  min="10"
                  max="60"
                  step="10"
                  value={ageGroup || '30'}
                  onChange={(e) => setAgeGroup(e.target.value)}
                  className="w-full accent-emerald-500"
                />
                <div className="text-center mt-2 text-sm font-bold text-emerald-600">
                  {ageGroup ? (ageGroup === '60' ? '60대 이상' : `${ageGroup}대`) : '선택해주세요 (슬라이더 이동)'}
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" /> 소개자 (선택)
              </label>
              <Input 
                value={recommender}
                onChange={(e) => setRecommender(e.target.value)}
                placeholder="추천인/소개자가 있다면 입력"
                className="h-12 rounded-xl bg-slate-50 border-line text-sm font-medium"
              />
            </div>
            <Button 
              onClick={handleSaveSettings}
              disabled={isSaving}
              className="w-full h-12 rounded-xl bg-obsidian hover:bg-slate-800 text-white font-bold"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : '변경사항 저장'}
            </Button>
          </div>
        </div>

        {/* 5. Privacy & Notification Control Center */}
        <div className="bg-white rounded-[28px] border border-line shadow-sm overflow-hidden">
          <div className="p-5 space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-sm font-black text-obsidian">
                  <EyeOff className="w-4 h-4 text-indigo-500" /> 익명 요약 공개 모드
                </div>
                <p className="text-[10px] text-slate-500 font-medium">웰니스 지표를 리더보드에 익명으로 요약하여 노출합니다.</p>
              </div>
              <Switch checked={privacyMode} onCheckedChange={setPrivacyMode} />
            </div>
            <div className="h-px w-full bg-line" />
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-sm font-black text-obsidian">
                  <Bell className="w-4 h-4 text-rose-500" /> 긴급 공지 알림 수신
                </div>
                <p className="text-[10px] text-slate-500 font-medium">일정 알림 및 FCM 푸시 메시지를 수신합니다.</p>
              </div>
              <Switch checked={pushEnabled} onCheckedChange={handlePushToggle} />
            </div>
          </div>
        </div>

        {/* Logout Button */}
        <Button 
          onClick={handleSignOut}
          variant="outline"
          className="w-full h-14 bg-transparent hover:bg-rose-50 text-rose-500 border border-slate-200 hover:border-rose-200 rounded-2xl font-bold text-sm shadow-sm transition-all flex items-center justify-center gap-2"
        >
          <LogOut className="w-4 h-4" />
          안전하게 로그아웃
        </Button>

      </div>

      {/* Modals for Leave/Delete */}
      {leaveModalType && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[2rem] w-full max-w-sm overflow-hidden shadow-2xl p-6 animate-in zoom-in-95">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className={`w-14 h-14 rounded-full flex items-center justify-center ${leaveModalType === 'delegate' ? 'bg-amber-100 text-amber-500' : 'bg-red-100 text-red-500'}`}>
                <AlertTriangle className="w-6 h-6" />
              </div>
              
              <div className="space-y-2">
                <h3 className="text-lg font-black text-slate-800">
                  {leaveModalType === 'delegate' && '방장 권한 위임 필요'}
                  {leaveModalType === 'leave' && '클럽에서 탈퇴하시겠습니까?'}
                  {leaveModalType === 'delete' && '클럽을 영구 삭제하시겠습니까?'}
                </h3>
                <p className="text-sm font-medium text-slate-500">
                  {leaveModalType === 'delegate' && '다른 멤버가 활동 중이므로 삭제할 수 없습니다. 방장 권한을 다른 멤버에게 넘겨야 탈퇴가 가능합니다.'}
                  {leaveModalType === 'leave' && `정말 [${selectedTeamForLeave?.teamName}] 클럽에서 탈퇴하시겠습니까?`}
                  {leaveModalType === 'delete' && `나 홀로 있는 클럽입니다. 삭제 시 모든 활동 데이터가 영구히 지워집니다.`}
                </p>
              </div>

              <div className="flex gap-3 w-full pt-4">
                <Button 
                  onClick={() => { setLeaveModalType(null); setSelectedTeamForLeave(null); }}
                  variant="outline"
                  className="flex-1 rounded-xl h-12 text-slate-500 font-bold border-slate-200"
                >
                  취소
                </Button>
                <Button 
                  onClick={handleConfirmLeave}
                  disabled={isLeaving}
                  className={`flex-1 rounded-xl h-12 font-bold text-white ${leaveModalType === 'delegate' ? 'bg-amber-500 hover:bg-amber-600' : 'bg-red-500 hover:bg-red-600'}`}
                >
                  {isLeaving ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                    leaveModalType === 'delegate' ? '위임하러 가기' : '네, 진행합니다'
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

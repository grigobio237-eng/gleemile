'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Users, Shield, MapPin, Loader2, CheckCircle2, User, Activity, Smartphone, Flame } from 'lucide-react';
import Link from 'next/link';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, setDoc, serverTimestamp, getDoc } from 'firebase/firestore';

export default function TeamJoinPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, status: authStatus } = useSession();
  const teamCode = params?.teamCode as string;

  const [team, setTeam] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [joining, setJoining] = useState(false);
  const [joined, setJoined] = useState(false); // 가입 신청 완료 상태

  // 폼 상태
  const [name, setName] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | 'none'>('none');
  const [ageGroup, setAgeGroup] = useState<string>('30');
  const [contact, setContact] = useState('');
  const [recommender, setRecommender] = useState('');
  const [introduction, setIntroduction] = useState('');
  const [consent, setConsent] = useState(false);
  const [loadingMyInfo, setLoadingMyInfo] = useState(false);

  useEffect(() => {
    if (teamCode) fetchTeamInfo();
  }, [teamCode]);

  useEffect(() => {
    if (session?.user?.name && !name) {
      setName(session.user.name);
    }
  }, [session]);

  const fetchTeamInfo = async () => {
    try {
      const q = query(collection(db, 'teams'), where('teamCode', '==', teamCode));
      const snap = await getDocs(q);
      
      if (!snap.empty) {
        const docSnap = snap.docs[0];
        setTeam({ id: docSnap.id, ...docSnap.data() });
      } else {
        setError('유효하지 않은 초대 코드입니다.');
      }
    } catch (e) {
      console.error(e);
      setError('팀 정보를 불러오는 중 오류가 발생했습니다');
    } finally {
      setLoading(false);
    }
  };

  const handleLoadMyInfo = async () => {
    if (!session?.user?.id) return;
    setLoadingMyInfo(true);
    try {
      const userDoc = await getDoc(doc(db, 'users', session.user.id));
      if (userDoc.exists()) {
        const data = userDoc.data();
        if (data.name) setName(data.name);
        if (data.gender) setGender(data.gender);
        if (data.ageGroup) setAgeGroup(data.ageGroup);
        if (data.phoneNumber) setContact(data.phoneNumber);
        if (data.recommender) setRecommender(data.recommender);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingMyInfo(false);
    }
  };

  const handleJoin = async () => {
    if (!session?.user?.id) {
      router.push(`/auth/signin?callbackUrl=/mile/join/${teamCode}`);
      return;
    }
    if (!name || !contact) {
      setError('이름과 연락처는 필수 입력 항목입니다.');
      return;
    }
    if (!consent) {
      setError('개인정보 수집 및 이용에 동의해야 합니다.');
      return;
    }

    setJoining(true);
    setError('');

    try {
      const requestRef = doc(db, `teams/${team.id}/join_requests`, session.user.id);
      await setDoc(requestRef, {
        id: session.user.id,
        name,
        avatar: session.user.image || null,
        gender,
        ageGroup,
        phoneNumber: contact,
        recommender,
        introduction,
        status: 'pending',
        appliedAt: serverTimestamp()
      });

      setJoined(true);
    } catch (e) {
      console.error(e);
      setError('가입 신청 처리 중 오류가 발생했습니다.');
    } finally {
      setJoining(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-10 h-10 animate-spin text-emerald-500 mx-auto" />
          <p className="text-sm font-bold text-slate-500 animate-pulse">초대 정보를 확인하고 있습니다...</p>
        </div>
      </div>
    );
  }

  if (error || !team) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center p-4">
        <Card className="max-w-sm w-full rounded-[32px] border-none shadow-xl">
          <CardContent className="p-8 text-center space-y-4">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto text-red-500">
              <span className="text-2xl font-black">!</span>
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-800 mb-2">초대 확인 실패</h2>
              <p className="text-sm text-slate-500">{error || '유효하지 않은 링크입니다.'}</p>
            </div>
            <Button onClick={() => router.push('/')} className="w-full h-12 rounded-2xl bg-slate-800 font-bold">홈으로 돌아가기</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (joined) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center p-4">
        <Card className="max-w-sm w-full rounded-[32px] border-none shadow-xl">
          <CardContent className="p-10 text-center space-y-6">
            <div className="w-24 h-24 bg-green-100 rounded-[2rem] flex items-center justify-center mx-auto animate-in zoom-in">
              <CheckCircle2 className="w-12 h-12 text-green-500" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-black text-slate-800">신청 완료!</h2>
              <p className="text-sm font-medium text-slate-500 leading-relaxed">
                <strong className="text-emerald-600">{team.teamName}</strong> 모임에<br/>가입 신청이 정상적으로 접수되었습니다.<br/>관리자 승인 후 합류가 완료됩니다.
              </p>
            </div>
            <Button onClick={() => router.push('/')} className="w-full h-14 rounded-2xl font-black text-lg bg-green-600 hover:bg-green-700">홈으로</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF9F6] p-4 flex items-center justify-center relative overflow-hidden font-sans">
      <div className="absolute top-0 inset-x-0 h-[400px] bg-gradient-to-b from-green-500/20 to-transparent pointer-events-none" />
      <div className="max-w-md w-full space-y-4 z-10">
        <Card className="rounded-[32px] border-none shadow-xl overflow-hidden bg-white/80 backdrop-blur-xl">
          <div className="h-32 bg-green-600 relative overflow-hidden flex items-center justify-center">
            <h1 className="text-2xl font-black text-white z-10 text-center flex items-center gap-2">
              <span className="text-3xl">🏆</span> {team.teamName}
            </h1>
          </div>
          <CardContent className="p-8 space-y-4">
            <div className="flex flex-wrap gap-2">
              {team.templateType && (
                <Badge className="bg-green-100 text-green-700 border-none font-bold px-3 py-1 text-sm">
                  {team.templateType === 'sports' ? '스포츠' :
                   team.templateType === 'study' ? '스터디' :
                   team.templateType === 'business' ? '비즈니스' :
                   team.templateType === 'hobby' ? '취미/창작' : '기타'}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-4 text-sm text-slate-500 font-medium">
              <span className="flex items-center gap-1.5"><Users className="w-4 h-4" /> {team.memberCount || 0}명</span>
              {team.region && <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4" /> {team.region}</span>}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[32px] border-none shadow-xl bg-white">
          <CardContent className="p-8 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="font-black text-slate-800 text-xl">가입 신청서</h2>
              {session?.user && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleLoadMyInfo}
                  disabled={loadingMyInfo}
                  className="rounded-full text-xs font-bold"
                >
                  {loadingMyInfo ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : null}
                  내 정보 불러오기
                </Button>
              )}
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 flex items-center gap-1">성명 <span className="text-rose-500">*</span></label>
                <Input value={name} onChange={e => setName(e.target.value)} placeholder="실명을 입력하세요" className="h-12 rounded-xl bg-slate-50 border-slate-200" />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 flex items-center gap-1">연락처 <span className="text-rose-500">*</span></label>
                <Input value={contact} onChange={e => setContact(e.target.value)} placeholder="010-0000-0000" className="h-12 rounded-xl bg-slate-50 border-slate-200" />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 flex items-center gap-1">성별</label>
                <div className="flex gap-2">
                  {['male', 'female', 'none'].map((g) => (
                    <Button
                      key={g}
                      variant={gender === g ? "default" : "outline"}
                      onClick={() => setGender(g as any)}
                      className={`flex-1 h-12 rounded-xl font-bold ${gender === g ? 'bg-emerald-500 text-white border-transparent' : 'text-slate-500 border-slate-200'}`}
                    >
                      {g === 'male' ? '남성' : g === 'female' ? '여성' : '선택안함'}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 flex items-center gap-1">연령대</label>
                <div className="px-2 pb-4">
                  <input
                    type="range"
                    min="10"
                    max="60"
                    step="10"
                    value={ageGroup}
                    onChange={(e) => setAgeGroup(e.target.value)}
                    className="w-full accent-emerald-500"
                  />
                  <div className="text-center mt-2 text-sm font-bold text-emerald-600">
                    {ageGroup === '60' ? '60대 이상' : `${ageGroup}대`}
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 flex items-center gap-1">소개자/추천인</label>
                <Input value={recommender} onChange={e => setRecommender(e.target.value)} placeholder="없을 경우 비워두세요" className="h-12 rounded-xl bg-slate-50 border-slate-200" />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 flex items-center gap-1">간단한 자기소개</label>
                <textarea 
                  value={introduction} 
                  onChange={e => setIntroduction(e.target.value)} 
                  placeholder="모임원들에게 간단한 자기소개를 남겨주세요" 
                  className="w-full min-h-[80px] p-4 text-sm rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 resize-none" 
                />
              </div>

              <div className="pt-2">
                <label className="flex items-start gap-3 p-4 bg-slate-50 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors">
                  <div className="flex items-center h-5">
                    <input
                      type="checkbox"
                      checked={consent}
                      onChange={(e) => setConsent(e.target.checked)}
                      className="w-5 h-5 rounded text-emerald-500 focus:ring-emerald-500 border-slate-300"
                    />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-slate-700">개인정보 제공 동의 <span className="text-rose-500">*</span></p>
                    <p className="text-[10px] text-slate-500 mt-0.5">입력하신 인적사항은 원활한 모임 운영을 위해 해당 모임의 관리자 및 글리마일 플랫폼에 제공됩니다.</p>
                  </div>
                </label>
              </div>
            </div>

            {error && (
              <p className="text-rose-500 text-sm font-bold bg-rose-50 p-3 rounded-xl">{error}</p>
            )}

            {!session ? (
              <div className="space-y-3 pt-4">
                <p className="text-sm text-slate-500 font-bold text-center">신청서를 제출하려면 로그인해주세요</p>
                <Button
                  asChild
                  className="w-full h-14 rounded-2xl font-black text-lg bg-slate-800 hover:bg-slate-900"
                >
                  <Link href={`/auth/signin?callbackUrl=/mile/join/${teamCode}`}>
                    로그인 및 가입 신청
                  </Link>
                </Button>
              </div>
            ) : (
              <Button
                onClick={handleJoin}
                disabled={joining || !consent}
                className="w-full h-14 rounded-2xl font-black text-lg bg-green-600 hover:bg-green-700 disabled:opacity-50 mt-4"
              >
                {joining ? (
                  <><Loader2 className="animate-spin mr-2 w-5 h-5" /> 제출 중...</>
                ) : (
                  '가입 신청서 제출'
                )}
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

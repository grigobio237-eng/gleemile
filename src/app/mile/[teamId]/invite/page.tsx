'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Loader2, ArrowLeft, Copy, CheckCircle2, UserPlus, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { QRCodeSVG } from 'qrcode.react';

export default function TeamInvitePage() {
  const { status } = useSession();
  const router = useRouter();
  const params = useParams();
  const teamId = params?.teamId as string;

  const [loading, setLoading] = useState(true);
  const [teamName, setTeamName] = useState('');
  const [teamCode, setTeamCode] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/');
    } else if (status === 'authenticated') {
      fetchTeamInfo();
    }
  }, [status, teamId]);

  const fetchTeamInfo = async () => {
    try {
      const teamRef = doc(db, 'teams', teamId);
      const teamSnap = await getDoc(teamRef);
      if (teamSnap.exists()) {
        const data = teamSnap.data();
        setTeamName(data.teamName || '알 수 없는 팀');
        
        // 고유 숫자 코드가 없는 구형 방인 경우 새로 생성해서 저장
        if (!data.teamCode) {
          const newCode = Math.floor(100000 + Math.random() * 900000).toString(); // 6자리 숫자
          await updateDoc(teamRef, { teamCode: newCode });
          setTeamCode(newCode);
        } else {
          setTeamCode(data.teamCode);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCode = () => {
    if (!teamCode) return;
    navigator.clipboard.writeText(teamCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleShareLink = async () => {
    if (!teamCode) return;
    const link = `${window.location.origin}/mile/join/${teamCode}`;
    
    // 모바일 기기 등 Web Share API 지원 환경 (카카오톡, 페이스북, 메시지 공유 등)
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${teamName} 팀 초대`,
          text: `${teamName} 팀에 새로운 멤버로 합류하세요!`,
          url: link,
        });
        return;
      } catch (err) {
        console.log('공유가 취소되었거나 실패했습니다.', err);
      }
    }
    
    // Web Share API 미지원 환경(데스크톱 브라우저 등)에서는 클립보드 복사로 대체
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  if (loading || status === 'loading') {
    return (
      <div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  const inviteUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/mile/join/${teamCode}`;

  return (
    <div className="min-h-screen bg-[#FAF9F6] p-4 font-sans selection:bg-emerald-200">
      <div className="max-w-md mx-auto space-y-6 pt-10 pb-20">
        
        {/* 헤더 */}
        <div className="flex items-center gap-2 mb-8">
          <Link href={`/mile/${teamId}/dashboard`} className="inline-flex items-center gap-1 text-slate-400 hover:text-emerald-600 transition-colors text-sm font-bold">
            <ArrowLeft className="w-4 h-4" /> 대시보드로 돌아가기
          </Link>
        </div>

        <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 text-center space-y-6">
          <div className="w-16 h-16 bg-blue-50 rounded-2xl mx-auto flex items-center justify-center mb-2">
            <UserPlus className="w-8 h-8 text-blue-500" />
          </div>
          
          <div>
            <h1 className="text-2xl font-black text-slate-800 mb-2">팀원 초대하기</h1>
            <p className="text-sm text-slate-500">
              <span className="font-bold text-emerald-600">{teamName}</span> 팀에 새로운 멤버를 초대하세요!
            </p>
          </div>

          <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 relative">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">초대 코드</p>
            <div className="text-4xl font-black text-slate-800 tracking-widest mb-4">
              {teamCode || '생성 중...'}
            </div>
            
            <div className="flex flex-col gap-3">
              <Button 
                onClick={handleCopyCode}
                className="w-full bg-slate-800 hover:bg-slate-900 text-white rounded-xl h-12 font-bold"
              >
                {copiedCode ? (
                  <><CheckCircle2 className="w-4 h-4 mr-2" /> 복사 완료!</>
                ) : (
                  <><Copy className="w-4 h-4 mr-2" /> 숫자 코드 복사하기</>
                )}
              </Button>
              
              <Button 
                onClick={handleShareLink}
                variant="outline"
                className="w-full rounded-xl h-12 font-bold border-slate-200 text-slate-600 hover:bg-slate-50"
              >
                {copiedLink ? (
                  <><CheckCircle2 className="w-4 h-4 mr-2 text-emerald-500" /> 링크 복사 완료!</>
                ) : (
                  <><Share2 className="w-4 h-4 mr-2" /> 앱으로 초대 링크 보내기</>
                )}
              </Button>
            </div>
          </div>

          {/* QR 코드 영역 */}
          {teamCode && (
            <div className="pt-6 border-t border-slate-100 flex flex-col items-center justify-center">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">초대 QR 코드</p>
              <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-100">
                <QRCodeSVG 
                  value={inviteUrl} 
                  size={140}
                  bgColor={"#ffffff"}
                  fgColor={"#1e293b"}
                  level={"Q"}
                  includeMargin={false}
                />
              </div>
              <p className="text-xs text-slate-400 font-medium mt-4">
                상대방이 카메라로 QR 코드를 스캔하면<br/>즉시 팀 가입 화면으로 이동합니다.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

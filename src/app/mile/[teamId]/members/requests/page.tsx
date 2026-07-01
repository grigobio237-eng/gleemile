'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, runTransaction, serverTimestamp, updateDoc } from 'firebase/firestore';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, ArrowLeft, Check, X, User, Activity, Smartphone, Users } from 'lucide-react';
import Link from 'next/link';
import { IJoinRequest } from '@/types/firebase';

export default function JoinRequestsPage() {
  const params = useParams();
  const router = useRouter();
  const teamId = params?.teamId as string;
  const { data: session } = useSession();

  const [requests, setRequests] = useState<IJoinRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    fetchRequests();
  }, [teamId]);

  const fetchRequests = async () => {
    try {
      const q = query(collection(db, `teams/${teamId}/join_requests`), where('status', '==', 'pending'));
      const snap = await getDocs(q);
      const reqs: IJoinRequest[] = snap.docs.map(d => ({
        ...d.data() as IJoinRequest,
        id: d.id
      }));
      setRequests(reqs);
    } catch (error) {
      console.error("Error fetching requests", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (req: IJoinRequest) => {
    if (!confirm(`${req.name}님의 가입을 수락하시겠습니까?`)) return;
    setProcessingId(req.id);
    try {
      await runTransaction(db, async (transaction) => {
        const teamRef = doc(db, 'teams', teamId);
        const reqRef = doc(db, `teams/${teamId}/join_requests`, req.id);
        const memberRef = doc(db, `teams/${teamId}/member_summaries`, req.id);
        const userTeamRef = doc(db, `users/${req.id}/teams`, teamId);

        const teamDoc = await transaction.get(teamRef);
        if (!teamDoc.exists()) throw new Error("Team not found");

        // 1. Delete request
        transaction.delete(reqRef);

        // 2. Add to member_summaries
        transaction.set(memberRef, {
          name: req.name,
          avatar: req.avatar || null,
          role: 'member',
          joinedAt: serverTimestamp()
        });

        // 3. Add to users/{uid}/teams
        transaction.set(userTeamRef, {
          teamName: teamDoc.data().teamName,
          role: 'member',
          joinedAt: serverTimestamp()
        });

        // 4. Increment memberCount
        transaction.update(teamRef, {
          memberCount: (teamDoc.data().memberCount || 0) + 1
        });
      });

      setRequests(prev => prev.filter(r => r.id !== req.id));
      alert('승인되었습니다.');
    } catch (e) {
      console.error(e);
      alert('승인 처리 중 오류가 발생했습니다.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (req: IJoinRequest) => {
    if (!confirm(`${req.name}님의 가입을 거절하시겠습니까?`)) return;
    setProcessingId(req.id);
    try {
      const reqRef = doc(db, `teams/${teamId}/join_requests`, req.id);
      await updateDoc(reqRef, {
        status: 'rejected',
        processedAt: serverTimestamp()
      });
      setRequests(prev => prev.filter(r => r.id !== req.id));
    } catch (e) {
      console.error(e);
      alert('거절 처리 중 오류가 발생했습니다.');
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF9F6] p-4 font-sans selection:bg-emerald-200">
      <div className="max-w-3xl mx-auto space-y-6 pt-4 md:pt-10">
        <div className="flex items-center gap-2 mb-6">
          <Link href={`/mile/${teamId}/dashboard`} className="inline-flex items-center gap-1 text-slate-400 hover:text-emerald-600 font-bold transition-colors">
            <ArrowLeft className="w-5 h-5" /> 대시보드
          </Link>
        </div>

        <div>
          <h1 className="text-2xl font-black text-slate-800">가입 승인 관리</h1>
          <p className="text-sm text-slate-500 mt-1 font-medium">대기 중인 신청 건을 확인하고 수락/거절을 진행하세요.</p>
        </div>

        {requests.length === 0 ? (
          <Card className="rounded-[32px] border-none shadow-sm text-center py-24 bg-white">
            <CardContent>
              <Users className="w-16 h-16 text-slate-200 mx-auto mb-4" />
              <h3 className="text-lg font-black text-slate-800 mb-1">대기 중인 신청이 없습니다</h3>
              <p className="text-sm text-slate-500 font-medium">새로운 가입 신청이 오면 이곳에 표시됩니다.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {requests.map(req => (
              <Card key={req.id} className="rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-6 flex flex-col sm:flex-row gap-6 items-start sm:items-center justify-between">
                  
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center flex-shrink-0 text-slate-400 overflow-hidden">
                      {req.avatar ? (
                        <img src={req.avatar} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-6 h-6" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-black text-slate-800 text-lg flex items-center gap-2">
                        {req.name}
                        {req.gender && req.gender !== 'none' && (
                          <Badge variant="outline" className="text-[10px] text-slate-500 border-slate-200 font-bold">
                            {req.gender === 'male' ? '남성' : '여성'}
                          </Badge>
                        )}
                      </h3>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs font-bold text-slate-500">
                        {req.phoneNumber && (
                          <span className="flex items-center gap-1"><Smartphone className="w-3.5 h-3.5" /> {req.phoneNumber}</span>
                        )}
                        {req.ageGroup && (
                          <span className="flex items-center gap-1"><Activity className="w-3.5 h-3.5" /> {req.ageGroup === '60' ? '60대 이상' : `${req.ageGroup}대`}</span>
                        )}
                        {req.recommender && (
                          <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> 소개자: <span className="text-emerald-600">{req.recommender}</span></span>
                        )}
                      </div>
                      {req.introduction && (
                        <div className="mt-3 p-3 bg-slate-50 rounded-xl text-sm text-slate-700 whitespace-pre-wrap">
                          {req.introduction}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto mt-4 sm:mt-0">
                    <Button 
                      onClick={() => handleReject(req)}
                      disabled={processingId === req.id}
                      variant="outline" 
                      className="flex-1 sm:flex-none rounded-xl h-11 border-rose-200 text-rose-600 hover:bg-rose-50 font-bold"
                    >
                      {processingId === req.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <><X className="w-4 h-4 mr-1" /> 거절</>}
                    </Button>
                    <Button 
                      onClick={() => handleAccept(req)}
                      disabled={processingId === req.id}
                      className="flex-1 sm:flex-none rounded-xl h-11 bg-emerald-500 hover:bg-emerald-600 text-white font-bold"
                    >
                      {processingId === req.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Check className="w-4 h-4 mr-1" /> 수락</>}
                    </Button>
                  </div>

                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

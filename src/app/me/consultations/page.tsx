'use client';

import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, FileText, ChevronRight, ArrowLeft } from 'lucide-react';
import ChapterWrapper from '@/components/layout/ChapterWrapper';

export default function MyConsultationsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [consultations, setConsultations] = useState<any[]>([]);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/auth/signin');
      return;
    }

    const fetchConsultations = async () => {
      try {
        const res = await fetch('/api/consultation?mode=navigator');
        if (res.ok) {
          const data = await res.json();
          setConsultations(data.consultations || []);
        } else {
          console.error('Failed to fetch consultations');
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchConsultations();
  }, [session, status, router]);

  if (loading || status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-mist">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <ChapterWrapper chapter="my-page">
      <div className="min-h-screen bg-[#F8FAFC] py-6 px-4 md:py-16">
        <div className="container mx-auto max-w-4xl px-0 md:px-4 space-y-8">
          
          <Button variant="ghost" onClick={() => router.push('/me')} className="text-slate hover:text-primary mb-4 p-0 md:px-4">
            <ArrowLeft className="w-5 h-5 mr-2" /> 마이페이지로 돌아가기
          </Button>

          <div>
            <h1 className="text-3xl font-black text-obsidian tracing-tight">고객 사전 문진 현황</h1>
            <p className="text-sm font-medium text-slate mt-2">나의 추천으로 가입한 고객들이 접수한 회복 설계 리포트입니다.</p>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {consultations.length === 0 ? (
              <Card className="border-none shadow-sm rounded-3xl bg-white flex flex-col items-center justify-center p-16 text-center">
                <FileText className="w-16 h-16 text-mist mb-4 border-2 border-dashed border-slate rounded-2xl p-4" />
                <h3 className="text-lg font-bold text-slate">아직 접수된 고객의 문진 내역이 없습니다.</h3>
              </Card>
            ) : (
              consultations.map((c: any) => (
                <Card 
                  key={c._id} 
                  className="border-none shadow-sm rounded-[24px] bg-white overflow-hidden hover:shadow-md transition-shadow cursor-pointer group"
                  onClick={() => router.push(`/event/consultation/report/${c._id}`)}
                >
                  <CardContent className="p-6 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                      <div className="flex flex-col items-center justify-center w-16 h-16 bg-mist rounded-2xl text-slate text-sm font-black border border-line">
                        <span>{new Date(c.createdAt).getMonth() + 1}월</span>
                        <span className="text-obsidian text-xl">{new Date(c.createdAt).getDate()}일</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-lg font-black text-obsidian">{c.user?.name || '이름 없음'} 고객님</h3>
                          <Badge variant="outline" className="text-[10px] font-bold bg-primary/5 text-primary border-primary/20">
                            {c.anxiety?.classifiedType || '맞춤 회복형'}
                          </Badge>
                        </div>
                        <p className="text-sm font-medium text-slate flex flex-col md:flex-row md:items-center gap-1 md:gap-3">
                          <span>이메일: {c.user?.email}</span>
                          <span className="hidden md:inline text-line">•</span>
                          <span>예상 다운타임: {c.expectation?.downtime}</span>
                        </p>
                      </div>
                    </div>
                    
                    <div className="w-10 h-10 rounded-full bg-mist flex items-center justify-center text-slate group-hover:bg-primary group-hover:text-white transition-colors">
                      <ChevronRight className="w-5 h-5" />
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>
    </ChapterWrapper>
  );
}

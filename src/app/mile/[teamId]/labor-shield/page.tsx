import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileSignature, FileText, Plus, Clock, CheckCircle2, ArrowLeft } from 'lucide-react';
import { getTeamLaborContracts } from '@/lib/labor-service';

interface PageProps {
  params: Promise<{ teamId: string }>;
}

export default async function LaborShieldDashboard({ params }: PageProps) {
  const resolvedParams = await params;
  const teamId = resolvedParams.teamId;

  // 서버 컴포넌트에서 직접 Server Action(DB) 호출
  const result = await getTeamLaborContracts(teamId);
  const contracts = result.success && result.contracts ? result.contracts : [];

  const pendingContracts = contracts.filter((c: any) => c.status === 'PENDING');
  const signedContracts = contracts.filter((c: any) => c.status === 'SIGNED');

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6 max-w-5xl">
      <Link href={`/mile/${teamId}/dashboard`} className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors">
        <ArrowLeft className="w-4 h-4 mr-1" />
        대시보드로 돌아가기
      </Link>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileSignature className="w-6 h-6 text-blue-600" />
            노무/규제 방어 모듈 (Labor-Shield)
          </h1>
          <p className="text-slate-500 mt-1">전자근로계약서 및 각종 노무 관련 문서를 안전하게 관리하세요.</p>
        </div>
        <Link href={`/mile/${teamId}/labor-shield/new`}>
          <Button className="gap-2 bg-blue-600 hover:bg-blue-700 text-white shadow-md">
            <Plus className="w-4 h-4" />
            새 근로계약서 작성
          </Button>
        </Link>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-white shadow-sm border-blue-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-blue-800 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              서명 대기중
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-900">{pendingContracts.length}건</div>
            <p className="text-xs text-blue-600/80 mt-1">근로자 서명 대기 중인 계약서</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-50 to-white shadow-sm border-emerald-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-emerald-800 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              체결 완료
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-900">{signedContracts.length}건</div>
            <p className="text-xs text-emerald-600/80 mt-1">안전하게 보관 중인 계약서</p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5 text-slate-600" />
          최근 작성된 근로계약서
        </h2>
        
        {contracts.length === 0 ? (
          <Card className="shadow-sm">
            <CardContent className="p-8 text-center text-slate-500 flex flex-col items-center justify-center min-h-[200px]">
              <FileSignature className="w-12 h-12 text-slate-300 mb-3" />
              <p>아직 작성된 근로계약서가 없습니다.</p>
              <Link href={`/mile/${teamId}/labor-shield/new`} className="mt-4">
                <Button variant="outline" size="sm">첫 계약서 작성하기</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3">
            {contracts.map((contract: any) => (
              <Card key={contract.contractId} className="shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-lg text-slate-800">{contract.contractData.employeeName}</span>
                      <span className="text-sm text-slate-500">근로계약서</span>
                      {contract.status === 'SIGNED' ? (
                        <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border-none">체결완료</Badge>
                      ) : (
                        <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50">대기중</Badge>
                      )}
                    </div>
                    <div className="text-sm text-slate-500">
                      작성일: {new Date(contract.createdAt).toLocaleDateString()} | 
                      급여: 시급 {contract.contractData.hourlyWage.toLocaleString()}원
                    </div>
                  </div>

                  <div className="flex gap-2 w-full sm:w-auto">
                    {contract.status === 'SIGNED' && contract.documentPdfUrl ? (
                      <Link href={contract.documentPdfUrl} target="_blank" className="w-full sm:w-auto">
                        <Button variant="outline" size="sm" className="w-full">
                          PDF 보기
                        </Button>
                      </Link>
                    ) : (
                      <Link href={`/mile/${teamId}/labor-shield/${contract.contractId}`} className="w-full sm:w-auto">
                        <Button variant="secondary" size="sm" className="w-full text-blue-700 bg-blue-50 hover:bg-blue-100 border-blue-200">
                          서명 페이지
                        </Button>
                      </Link>
                    )}
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

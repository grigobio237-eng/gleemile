import React from 'react';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import ContractForm from '@/components/labor-shield/contract-form';

interface PageProps {
  params: Promise<{ teamId: string }>;
}

export default async function NewLaborContractPage({ params }: PageProps) {
  const resolvedParams = await params;
  const teamId = resolvedParams.teamId;

  return (
    <div className="container mx-auto p-4 md:p-8 max-w-4xl space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <Link 
          href={`/mile/${teamId}/labor-shield`}
          className="p-2 hover:bg-slate-100 rounded-full transition-colors inline-flex items-center text-slate-500"
        >
          <ChevronLeft className="w-5 h-5" />
          <span className="sr-only">뒤로 가기</span>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">새 근로계약서 작성</h1>
          <p className="text-sm text-slate-500 mt-1">노무 규제를 준수하는 안전한 전자계약서를 생성합니다.</p>
        </div>
      </div>

      {/* 2단계에서 만든 폼 렌더링 */}
      <ContractForm />
    </div>
  );
}

"use client";

import React, { useState, useRef, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { FileSignature, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import SignaturePadModal from '@/components/labor-shield/signature-pad-modal';
import { ContractPdfTemplate, generateContractPdfBlob } from '@/components/labor-shield/contract-pdf-template';
import { getLaborContract, completeLaborContract } from '@/lib/labor-service';

export default function EmployeeSignaturePage() {
  const params = useParams();
  const contractId = params.contractId as string;

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [isSigned, setIsSigned] = useState(false);
  const [isSigning, setIsSigning] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [contractData, setContractData] = useState<any>(null);
  const [employeeSignatureUrl, setEmployeeSignatureUrl] = useState<string | undefined>();
  
  const pdfTemplateRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadContract() {
      try {
        setIsLoading(true);
        const result = await getLaborContract(contractId);
        if (result.success && result.data) {
          const doc = result.data;
          
          if (doc.status === 'SIGNED') {
            setIsSigned(true);
          }

          setContractData({
            ...doc.contractData,
            contractDate: new Date(doc.createdAt).toLocaleDateString('ko-KR', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            }),
            employerSignatureUrl: doc.signatures?.employerUrl,
            employeeSignatureUrl: doc.signatures?.employeeUrl,
          });
        } else {
          setError(result.error || '계약서를 불러오지 못했습니다.');
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    }

    if (contractId) {
      loadContract();
    }
  }, [contractId]);

  const handleSaveSignature = async (dataUrl: string) => {
    // 서명 임시 적용 (화면에 그리기 위함)
    setEmployeeSignatureUrl(dataUrl);
    setContractData((prev: any) => ({ ...prev, employeeSignatureUrl: dataUrl }));
    setIsSigning(true);
    setIsModalOpen(false);

    try {
      // PDF 렌더링 후 캡처를 위해 약간의 지연 시간 확보
      setTimeout(async () => {
        if (pdfTemplateRef.current) {
          try {
            // 1) PDF Blob 생성
            const pdfBlob = await generateContractPdfBlob(pdfTemplateRef.current);
            
            // Blob -> Base64 변환
            const reader = new FileReader();
            reader.readAsDataURL(pdfBlob);
            reader.onloadend = async () => {
              const pdfBase64 = reader.result as string;
              
              // 2) DB 상태 업데이트 및 파일 업로드 (Server Action)
              const result = await completeLaborContract(contractId, dataUrl, pdfBase64);
              
              if (result.success) {
                setIsSigned(true);
              } else {
                alert(`처리 실패: ${result.error}`);
                setEmployeeSignatureUrl(undefined);
                setContractData((prev: any) => ({ ...prev, employeeSignatureUrl: undefined }));
              }
              setIsSigning(false);
            };
            
          } catch (error) {
            console.error("PDF 생성 실패:", error);
            alert("처리 중 오류가 발생했습니다.");
            setIsSigning(false);
          }
        } else {
          setIsSigning(false);
        }
      }, 500);

    } catch (error) {
      console.error(error);
      setIsSigning(false);
      alert('서명 저장에 실패했습니다.');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <Loader2 className="w-10 h-10 animate-spin text-blue-500 mb-4" />
        <p className="text-slate-500 font-medium">계약서 정보를 불러오는 중...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <h1 className="text-xl font-bold text-slate-800 mb-2">오류 발생</h1>
        <p className="text-slate-500">{error}</p>
      </div>
    );
  }

  if (isSigned) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <Card className="max-w-md w-full shadow-lg border-emerald-100 text-center">
          <CardContent className="pt-10 pb-10 flex flex-col items-center">
            <CheckCircle2 className="w-16 h-16 text-emerald-500 mb-4" />
            <h1 className="text-2xl font-bold text-slate-800 mb-2">서명 완료</h1>
            <p className="text-slate-500">
              전자근로계약서 체결이 완료되었습니다.<br />
              계약서 원본(PDF)은 알림톡으로 송부됩니다.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 p-4 pb-24 md:py-8 relative">
      {/* 딤(Dim) 처리 및 로딩 오버레이 */}
      {isSigning && (
        <div className="fixed inset-0 bg-black/50 z-50 flex flex-col items-center justify-center backdrop-blur-sm">
          <div className="bg-white p-6 rounded-2xl shadow-2xl flex flex-col items-center max-w-sm w-full mx-4">
            <Loader2 className="w-12 h-12 animate-spin text-blue-600 mb-4" />
            <h3 className="text-lg font-bold text-slate-800">계약서 체결 중...</h3>
            <p className="text-sm text-slate-500 mt-2 text-center">
              PDF 문서를 생성하고 안전하게 저장하고 있습니다.<br/>잠시만 기다려주세요.
            </p>
          </div>
        </div>
      )}

      <div className="max-w-3xl mx-auto space-y-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border text-center mb-6">
          <FileSignature className="w-8 h-8 text-blue-500 mx-auto mb-2" />
          <h1 className="text-lg font-bold">전자근로계약서 확인 및 서명</h1>
          <p className="text-sm text-slate-500">내용을 꼼꼼히 확인하신 후 서명해 주세요.</p>
        </div>

        {/* 모바일 화면에서도 꽉 차게 보이도록 overflow 처리된 컨테이너 */}
        <div className="bg-white rounded-xl shadow-sm border overflow-x-auto">
          <div className="min-w-[794px] origin-top-left md:scale-100 transform scale-[0.4] sm:scale-75 md:mx-auto md:w-[794px]">
            {contractData && (
              <ContractPdfTemplate ref={pdfTemplateRef} data={contractData} />
            )}
          </div>
        </div>
      </div>

      {/* 하단 플로팅 바 (모바일 최적화) */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t shadow-[0_-10px_40px_rgba(0,0,0,0.1)] z-10 flex justify-center">
        <div className="max-w-3xl w-full">
          <Button 
            className="w-full bg-blue-600 hover:bg-blue-700 text-lg h-14" 
            onClick={() => setIsModalOpen(true)}
            disabled={isSigning}
          >
            확인 및 서명하기
          </Button>
        </div>
      </div>

      {contractData && (
        <SignaturePadModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSaveSignature}
          title={`${contractData.employeeName} 님 서명`}
        />
      )}
    </div>
  );
}

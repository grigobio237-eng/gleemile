"use client";

import React, { forwardRef } from 'react';
import Image from 'next/image';

interface ContractData {
  employerName: string;
  employerAddress: string;
  employeeName: string;
  employeePhone: string;
  startDate: string;
  endDate?: string;
  workPlace: string;
  workDescription: string;
  workDays: string; // e.g., "월, 수, 금"
  workHours: string; // e.g., "09:00 ~ 18:00"
  restHours: string; // e.g., "12:00 ~ 13:00"
  hourlyWage: number;
  employerSignatureUrl?: string;
  employeeSignatureUrl?: string;
  contractDate: string;
}

interface ContractPdfTemplateProps {
  data: ContractData;
}

/**
 * 근로기준법 표준 서식에 맞춘 근로계약서 HTML 템플릿
 * 화면에 보이진 않지만 PDF 캡처를 위해 DOM에 렌더링될 수 있게 구성
 */
export const ContractPdfTemplate = forwardRef<HTMLDivElement, ContractPdfTemplateProps>(
  ({ data }, ref) => {
    return (
      <div 
        ref={ref} 
        // A4 비율(210x297)을 위한 고정 크기 (보통 794x1123 픽셀 사용)
        className="bg-white text-black p-10 mx-auto box-border"
        style={{ width: '794px', minHeight: '1123px', fontFamily: 'sans-serif' }}
      >
        <h1 className="text-3xl font-bold text-center mb-10 tracking-widest">표준 근로계약서</h1>
        
        <div className="space-y-6 text-sm leading-relaxed">
          <p>
            <strong className="text-lg underline decoration-1 underline-offset-4">{data.employerName}</strong> (이하 "사업주"라 함)과(와) 
            <strong className="text-lg ml-2 underline decoration-1 underline-offset-4">{data.employeeName}</strong> (이하 "근로자"라 함)은(는) 다음과 같이 근로계약을 체결한다.
          </p>

          <div>
            <h2 className="font-bold text-base mb-1">1. 근로계약기간</h2>
            <p>
              {data.startDate} 부터 {data.endDate ? `${data.endDate} 까지` : '기한의 정함이 없음'}
            </p>
          </div>

          <div>
            <h2 className="font-bold text-base mb-1">2. 근무장소 및 업무내용</h2>
            <p>○ 근무장소: {data.workPlace}</p>
            <p>○ 업무내용: {data.workDescription}</p>
          </div>

          <div>
            <h2 className="font-bold text-base mb-1">3. 근로시간 및 휴게시간</h2>
            <p>○ 근로일: {data.workDays}</p>
            <p>○ 근로시간: {data.workHours}</p>
            <p>○ 휴게시간: {data.restHours}</p>
          </div>

          <div>
            <h2 className="font-bold text-base mb-1">4. 임금</h2>
            <p>○ 시급: {data.hourlyWage.toLocaleString()}원</p>
            <p>○ 주휴수당: 1주 15시간 이상 개근 시 관계법령에 따라 지급</p>
            <p>○ 임금지급일: 매월 정해진 기일에 지급 (휴일인 경우 전일 지급)</p>
          </div>

          <div className="pt-4 mt-8 border-t border-slate-300">
            <p className="mb-4">위 계약을 명백히 하기 위하여 본 계약서를 작성하고, 사업주와 근로자가 각각 서명 또는 날인한 후 1통씩 보관한다.</p>
            <p className="text-right font-bold text-base mb-12">{data.contractDate}</p>
            
            <div className="flex justify-between items-end">
              <div className="w-[45%]">
                <h3 className="font-bold mb-2 text-lg">사업주</h3>
                <p>사업체명: {data.employerName}</p>
                <p>주소: {data.employerAddress}</p>
                <div className="mt-4 flex items-center gap-4">
                  <span>대표자 서명:</span>
                  {data.employerSignatureUrl ? (
                    <div className="relative w-32 h-16 border-b border-slate-300">
                      <Image src={data.employerSignatureUrl} alt="사업주 서명" fill className="object-contain" crossOrigin="anonymous" />
                    </div>
                  ) : (
                    <div className="w-32 h-16 border-b border-slate-300"></div>
                  )}
                </div>
              </div>

              <div className="w-[45%]">
                <h3 className="font-bold mb-2 text-lg">근로자</h3>
                <p>성명: {data.employeeName}</p>
                <p>연락처: {data.employeePhone}</p>
                <div className="mt-4 flex items-center gap-4">
                  <span>근로자 서명:</span>
                  {data.employeeSignatureUrl ? (
                    <div className="relative w-32 h-16 border-b border-slate-300">
                      <Image src={data.employeeSignatureUrl} alt="근로자 서명" fill className="object-contain" crossOrigin="anonymous" />
                    </div>
                  ) : (
                    <div className="w-32 h-16 border-b border-slate-300"></div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
);
ContractPdfTemplate.displayName = 'ContractPdfTemplate';




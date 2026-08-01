"use server";

import { adminDb } from '@/lib/firebase-admin';
import { StorageService } from '@/lib/storage';
import { sendLaborContractLinkSMS } from '@/lib/sms';

export interface LaborContractData {
  employerName: string;
  employerAddress: string;
  employeeName: string;
  employeePhone: string;
  startDate: string;
  endDate?: string;
  workPlace: string;
  workDescription: string;
  workDays: string;
  workHours: string;
  restHours: string;
  hourlyWage: number;
  contractType: string;
  weeklyHours: number;
  weeklyHolidayAllowance: number;
}

/**
 * 1. 근로계약서 생성 및 사업주 서명 업로드
 */
export async function createLaborContract(
  teamId: string, 
  contractData: LaborContractData, 
  employerSignatureBase64: string
) {
  try {
    const db = adminDb();
    
    // 1) 사업주 서명 업로드
    const signatureUpload = await StorageService.uploadBase64Image(employerSignatureBase64, {
      folder: `labor-contracts/${teamId}/signatures`,
      filename: `employer_${Date.now()}.png`
    });

    const docRef = db.collection('labor_contracts').doc();
    const contractId = docRef.id;

    // 2) Firestore 문서 생성
    await docRef.set({
      contractId,
      teamId,
      status: 'PENDING',
      contractData,
      signatures: {
        employerUrl: signatureUpload.url,
        employeeUrl: null
      },
      documentPdfUrl: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    // 3) 근로자에게 알림톡/SMS 발송
    // 계약서 링크: /mile/{teamId}/labor-shield/{contractId}
    const contractUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/mile/${teamId}/labor-shield/${contractId}`;
    
    await sendLaborContractLinkSMS(
      contractData.employeePhone,
      contractData.employeeName,
      contractData.employerName,
      contractUrl
    );

    return { success: true, contractId };
  } catch (error: any) {
    console.error('createLaborContract Error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * 2. 근로계약서 단건 조회
 */
export async function getLaborContract(contractId: string) {
  try {
    const db = adminDb();
    const doc = await db.collection('labor_contracts').doc(contractId).get();
    
    if (!doc.exists) {
      return { success: false, error: '계약서를 찾을 수 없습니다.' };
    }

    return { success: true, data: doc.data() };
  } catch (error: any) {
    console.error('getLaborContract Error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * 3. 근로계약서 체결 완료 (근로자 서명 및 PDF 업로드)
 */
export async function completeLaborContract(
  contractId: string, 
  employeeSignatureBase64: string, 
  pdfBase64: string
) {
  try {
    const db = adminDb();
    const docRef = db.collection('labor_contracts').doc(contractId);
    const doc = await docRef.get();

    if (!doc.exists) {
      return { success: false, error: '계약서를 찾을 수 없습니다.' };
    }

    const data = doc.data();
    const teamId = data?.teamId || 'default';

    // 1) 근로자 서명 업로드
    const signatureUpload = await StorageService.uploadBase64Image(employeeSignatureBase64, {
      folder: `labor-contracts/${teamId}/signatures`,
      filename: `employee_${contractId}_${Date.now()}.png`
    });

    // 2) PDF 파일 업로드 (Base64 -> Buffer)
    const pdfData = pdfBase64.replace(/^data:application\/pdf;base64,/, '');
    const pdfBuffer = Buffer.from(pdfData, 'base64');
    
    const pdfUpload = await StorageService.uploadPdf(pdfBuffer, {
      folder: `labor-contracts/${teamId}/documents`,
      filename: `contract_${contractId}.pdf`
    });

    // 3) Firestore 문서 상태 업데이트
    await docRef.update({
      status: 'SIGNED',
      'signatures.employeeUrl': signatureUpload.url,
      documentPdfUrl: pdfUpload.url,
      updatedAt: new Date().toISOString()
    });

    return { success: true };
  } catch (error: any) {
    console.error('completeLaborContract Error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * 4. 팀의 근로계약서 목록 조회
 */
export async function getTeamLaborContracts(teamId: string) {
  try {
    const db = adminDb();
    const snapshot = await db.collection('labor_contracts')
      .where('teamId', '==', teamId)
      .get();

    // Firestore 복합 인덱스(Composite Index) 생성 에러를 방지하기 위해 
    // 데이터를 가져온 후 메모리상에서 최신순(내림차순)으로 정렬합니다.
    const contracts = snapshot.docs.map(doc => doc.data());
    contracts.sort((a: any, b: any) => {
      const dateA = new Date(a.createdAt || 0).getTime();
      const dateB = new Date(b.createdAt || 0).getTime();
      return dateB - dateA;
    });

    return { success: true, contracts };
  } catch (error: any) {
    console.error('getTeamLaborContracts Error:', error);
    return { success: false, error: error.message };
  }
}

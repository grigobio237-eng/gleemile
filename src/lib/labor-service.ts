"use server";
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

export async function createLaborContract(teamId: string, contractData: LaborContractData, employerSignatureBase64: string) {
  try {
    const signatureUpload = await StorageService.uploadBase64Image(employerSignatureBase64, {
      folder: `labor-contracts/${teamId}/signatures`,
      filename: `employer_${Date.now()}.png`
    });

    const res = await fetch(`${process.env.NEXT_PUBLIC_FIREBASE_FUNCTIONS_URL}/createLaborContract`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ teamId, contractData, signatureUrl: signatureUpload.url })
    });
    const data = await res.json();
    
    if (data.success) {
      const contractUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/mile/${teamId}/labor-shield/${data.contractId}`;
      await sendLaborContractLinkSMS(contractData.employeePhone, contractData.employeeName, contractData.employerName, contractUrl);
    }
    return data;
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getLaborContract(contractId: string) {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_FIREBASE_FUNCTIONS_URL}/getLaborContract?contractId=${contractId}`);
    return await res.json();
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function completeLaborContract(contractId: string, employeeSignatureBase64: string, pdfBase64: string) {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_FIREBASE_FUNCTIONS_URL}/completeLaborContract`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contractId, employeeSignatureBase64, pdfBase64 })
    });
    return await res.json();
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getTeamLaborContracts(teamId: string) {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_FIREBASE_FUNCTIONS_URL}/getTeamLaborContracts?teamId=${teamId}`);
    return await res.json();
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

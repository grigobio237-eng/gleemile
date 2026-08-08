"use server";

const FALLBACK_MINIMUM_WAGE = 10030;

export async function syncMinimumWage(year?: number) {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_FIREBASE_FUNCTIONS_URL}/cronSyncWage?year=${year || ''}`);
    return await res.json();
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getLatestMinimumWage(year?: number): Promise<number> {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_FIREBASE_FUNCTIONS_URL}/getLatestMinimumWage?year=${year || ''}`);
    if (res.ok) {
       const data = await res.json();
       return data.wage || FALLBACK_MINIMUM_WAGE;
    }
    return FALLBACK_MINIMUM_WAGE;
  } catch (error) {
    return FALLBACK_MINIMUM_WAGE;
  }
}

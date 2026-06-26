import { IUser } from '@/models/User';

/**
 * Integrated Score Engine
 * Calculates a composite score from diagnosis and scan results.
 */

export interface UnifiedScoreResult {
    totalScore: number;
    diagnosisScore: number;
    scanScore: number;
    composition: {
        diagnosisWeight: number;
        scanWeight: number;
    };
    latestScanType?: string;
}

export function calculateUnifiedScore(user: IUser): UnifiedScoreResult {
    const DIAGNOSIS_WEIGHT = 0.7;
    const SCAN_WEIGHT = 0.3;

    // 1. Get latest diagnosis score
    let diagnosisScore = 0;
    if (user.diagnosisResults && user.diagnosisResults.length > 0) {
        // Sort by date dsc
        const sortedDiagnosis = [...user.diagnosisResults].sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        diagnosisScore = sortedDiagnosis[0].totalScore || 0;
    }

    // 2. Get latest scan scores (average of different types if multiple in last 24h, or just latest)
    let scanScore = 0;
    let latestScanType = undefined;
    
    if (user.scanTimeline && user.scanTimeline.length > 0) {
        const sortedScans = [...user.scanTimeline].sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        
        // Use the latest score as representative for now, 
        // or we could average the last 3 scans if they are recent.
        scanScore = sortedScans[0].score || 0;
        latestScanType = sortedScans[0].type;
    }

    // 3. Composite Calculation
    // If no scans exist, use diagnosis as 100% or use default scan score (e.g. 50 or diagnosisScore)
    // Here we'll treat missing scan score as diagnosisScore to avoid pulling down the total unfairly
    const effectiveScanScore = scanScore > 0 ? scanScore : diagnosisScore;
    
    const totalScore = Math.round(
        (diagnosisScore * DIAGNOSIS_WEIGHT) + (effectiveScanScore * SCAN_WEIGHT)
    );

    return {
        totalScore,
        diagnosisScore,
        scanScore,
        composition: {
            diagnosisWeight: DIAGNOSIS_WEIGHT,
            scanWeight: SCAN_WEIGHT
        },
        latestScanType
    };
}

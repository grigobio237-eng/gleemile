/**
 * Asia/Seoul (KST) 기준 날짜 처리를 위한 공통 유틸리티
 */

/**
 * KST 기준 오늘 날짜 문자열 반환 (YYYY-MM-DD)
 */
export function getKSTDate(date: Date = new Date()): string {
    return date.toLocaleDateString('en-CA', { timeZone: 'Asia/Seoul' });
}

/**
 * KST 기준 이번 주 월요일 00:00:00 Date 객체 반환
 */
export function getKSTWeekStart(date: Date = new Date()): Date {
    // KST 시간으로 변환된 새로운 Date 객체 생성
    const kstNow = new Date(date.toLocaleString('en-US', { timeZone: 'Asia/Seoul' }));
    const day = kstNow.getDay() || 7; // 일요일(0)을 7로 변환
    
    const Monday = new Date(kstNow);
    Monday.setDate(kstNow.getDate() - (day - 1));
    Monday.setHours(0, 0, 0, 0);
    
    return Monday;
}

/**
 * KST 기준 현재 시간 (HH:mm) 반환
 */
export function getKSTTime(date: Date = new Date()): string {
    return date.toLocaleTimeString('ko-KR', { 
        timeZone: 'Asia/Seoul', 
        hour12: false, 
        hour: '2-digit', 
        minute: '2-digit' 
    });
}

import AdminLog from '@/models/AdminLog';
import { IUser } from '@/models/User';

type AdminActionType = 
  | 'USER_UPDATE' 
  | 'USER_DELETE' 
  | 'ROLE_CHANGE' 
  | 'POINT_ADJUST' 
  | 'NOTICE_CREATE' 
  | 'NOTICE_UPDATE' 
  | 'NOTICE_DELETE' 
  | 'PARTNER_APPROVE' 
  | 'CONSULTATION_MANAGE';

interface LogActionParams {
  admin: {
    id: any;
    email: string;
    name: string;
  };
  action: AdminActionType | string;
  targetId?: any;
  targetModel?: string;
  details: string;
  prevData?: any;
  newData?: any;
  ip?: string;
  userAgent?: string;
}

/**
 * 관리자 활동 로그를 기록하는 공통 함수
 */
export async function logAdminAction({
  admin,
  action,
  targetId,
  targetModel,
  details,
  prevData,
  newData,
  ip,
  userAgent
}: LogActionParams) {
  try {
    const log = new AdminLog({
      adminId: admin.id,
      adminEmail: admin.email,
      adminName: admin.name,
      action,
      targetId,
      targetModel,
      details,
      prevData,
      newData,
      ipAddress: ip,
      userAgent: userAgent
    });

    await log.save();
    console.log(`[AdminLog] Recorded: ${action} by ${admin.email}`);
    return true;
  } catch (error) {
    console.error('[AdminLog] Failed to record log:', error);
    return false;
  }
}

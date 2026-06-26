import mongoose, { Schema, Document } from 'mongoose';

export interface IAdminLog extends Document {
  adminId: mongoose.Types.ObjectId;
  adminEmail: string;
  adminName: string;
  action: string;      // 예: 'USER_UPDATE', 'POINT_GRANT', 'ROLE_CHANGE', 'NOTICE_DELETE'
  targetId?: mongoose.Types.ObjectId; // 작업 대상의 ID
  targetModel?: string; // 작업 대상 모델명 (User, Notice, etc.)
  details: string;      // 작업 상세 내용 (텍스트)
  prevData?: any;       // 변경 전 데이터 (JSON)
  newData?: any;        // 변경 후 데이터 (JSON)
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}

const AdminLogSchema: Schema = new Schema({
  adminId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  adminEmail: { type: String, required: true },
  adminName: { type: String, required: true },
  action: { type: String, required: true },
  targetId: { type: Schema.Types.ObjectId },
  targetModel: { type: String },
  details: { type: String, required: true },
  prevData: { type: Schema.Types.Mixed },
  newData: { type: Schema.Types.Mixed },
  ipAddress: { type: String },
  userAgent: { type: String },
}, {
  timestamps: { createdAt: true, updatedAt: false }
});

// 조회 최적화를 위한 인덱스
AdminLogSchema.index({ adminId: 1, createdAt: -1 });
AdminLogSchema.index({ action: 1 });
AdminLogSchema.index({ targetId: 1 });

export default mongoose.models.AdminLog || mongoose.model<IAdminLog>('AdminLog', AdminLogSchema);

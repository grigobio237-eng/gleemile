import mongoose, { Document, Schema } from 'mongoose';

export interface ITeamChatMessage extends Document {
  teamId: mongoose.Types.ObjectId;
  senderId: mongoose.Types.ObjectId;
  content: string;
  type: 'text' | 'image' | 'file' | 'system';
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  readBy: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const TeamChatMessageSchema = new Schema<ITeamChatMessage>({
  teamId: { type: Schema.Types.ObjectId, ref: 'MileTeam', required: true, index: true },
  senderId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true },
  type: { type: String, enum: ['text', 'image', 'file', 'system'], default: 'text' },
  fileUrl: { type: String },
  fileName: { type: String },
  fileSize: { type: Number },
  readBy: [{ type: Schema.Types.ObjectId, ref: 'User' }]
}, { timestamps: true });

// 복합 인덱스 (팀별로 최신 메시지를 빠르게 가져오기 위함)
TeamChatMessageSchema.index({ teamId: 1, createdAt: -1 });

export default mongoose.models.TeamChatMessage || mongoose.model<ITeamChatMessage>('TeamChatMessage', TeamChatMessageSchema);

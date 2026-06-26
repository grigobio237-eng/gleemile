import mongoose, { Document, Schema } from 'mongoose';

export interface ITeamAnnouncement extends Document {
  teamId: mongoose.Types.ObjectId;
  authorId: mongoose.Types.ObjectId;
  title: string;
  content: string;
  type: 'notice' | 'schedule' | 'urgent';
  isPinned: boolean;
  // 스케줄 관련 (type === 'schedule')
  eventDate?: Date;
  eventTime?: string;        // "15:00"
  eventLocation?: string;
  eventType?: 'training' | 'match' | 'meeting' | 'other';
  createdAt: Date;
  updatedAt: Date;
}

const TeamAnnouncementSchema = new Schema<ITeamAnnouncement>(
  {
    teamId: { type: Schema.Types.ObjectId, ref: 'MileTeam', required: true, index: true },
    authorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true, trim: true },
    content: { type: String, required: true },
    type: { type: String, enum: ['notice', 'schedule', 'urgent'], default: 'notice' },
    isPinned: { type: Boolean, default: false },
    eventDate: { type: Date },
    eventTime: { type: String },
    eventLocation: { type: String },
    eventType: { type: String, enum: ['training', 'match', 'meeting', 'other'] },
  },
  { timestamps: true }
);

TeamAnnouncementSchema.index({ teamId: 1, createdAt: -1 });
TeamAnnouncementSchema.index({ teamId: 1, type: 1, eventDate: 1 });

export default mongoose.models.TeamAnnouncement ||
  mongoose.model<ITeamAnnouncement>('TeamAnnouncement', TeamAnnouncementSchema);

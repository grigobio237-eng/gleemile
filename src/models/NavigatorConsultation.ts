import mongoose, { Document, Schema } from 'mongoose';

export interface INavigatorConsultation extends Document {
  ticketId: string;
  userId: mongoose.Types.ObjectId;
  userName: string;
  userEmail: string;
  navigatorId: string; // User.referralCode
  reportId?: string; // Related roadmap report ID
  question: string;
  answer?: string;
  status: 'pending' | 'answered' | 'completed' | 'admin_intervened';
  nudgeCount: number;
  lastNudgedAt?: Date;
  answeredBy?: 'navigator' | 'admin';
  answeredAt?: Date;
  isReadByUser: boolean;
  isReadByNavigator: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const NavigatorConsultationSchema = new Schema<INavigatorConsultation>({
  ticketId: {
    type: String,
    required: true,
    unique: true
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  userName: {
    type: String,
    required: true
  },
  userEmail: {
    type: String,
    required: true
  },
  navigatorId: {
    type: String,
    required: true,
    index: true
  },
  reportId: {
    type: String
  },
  question: {
    type: String,
    required: true
  },
  answer: {
    type: String
  },
  status: {
    type: String,
    enum: ['pending', 'answered', 'completed', 'admin_intervened'],
    default: 'pending'
  },
  nudgeCount: {
    type: Number,
    default: 0
  },
  lastNudgedAt: {
    type: Date
  },
  answeredBy: {
    type: String,
    enum: ['navigator', 'admin']
  },
  answeredAt: {
    type: Date
  },
  isReadByUser: {
    type: Boolean,
    default: false
  },
  isReadByNavigator: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Indexes for faster lookup
NavigatorConsultationSchema.index({ userId: 1 });
NavigatorConsultationSchema.index({ status: 1 });
NavigatorConsultationSchema.index({ createdAt: -1 });

export default mongoose.models.NavigatorConsultation || mongoose.model<INavigatorConsultation>('NavigatorConsultation', NavigatorConsultationSchema);


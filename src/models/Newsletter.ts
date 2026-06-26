import mongoose, { Document, Schema } from 'mongoose';

export interface INewsletter extends Document {
  email: string;
  name?: string;
  status: 'active' | 'unsubscribed' | 'bounced';
  subscribedAt: Date;
  unsubscribedAt?: Date;
  source: 'website' | 'signup' | 'admin' | 'import';
  tags: string[];
  preferences: {
    productUpdates: boolean;
    promotions: boolean;
    events: boolean;
    partnerNews: boolean;
  };
  lastEmailSent?: Date;
  emailCount: number;
  isVerified: boolean;
  verificationToken?: string;
  verificationExpires?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const NewsletterSchema = new Schema<INewsletter>({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  name: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['active', 'unsubscribed', 'bounced'],
    default: 'active'
  },
  subscribedAt: {
    type: Date,
    default: Date.now
  },
  unsubscribedAt: {
    type: Date
  },
  source: {
    type: String,
    enum: ['website', 'signup', 'admin', 'import'],
    default: 'website'
  },
  tags: [{
    type: String,
    trim: true
  }],
  preferences: {
    productUpdates: {
      type: Boolean,
      default: true
    },
    promotions: {
      type: Boolean,
      default: true
    },
    events: {
      type: Boolean,
      default: true
    },
    partnerNews: {
      type: Boolean,
      default: false
    }
  },
  lastEmailSent: {
    type: Date
  },
  emailCount: {
    type: Number,
    default: 0
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  verificationToken: {
    type: String
  },
  verificationExpires: {
    type: Date
  }
}, {
  timestamps: true
});

// 인덱스 설정
NewsletterSchema.index({ status: 1 });
NewsletterSchema.index({ subscribedAt: -1 });
NewsletterSchema.index({ tags: 1 });

// 이메일 중복 방지
NewsletterSchema.pre('save', async function (next) {
  if (this.isNew) {
    const existing = await mongoose.model('Newsletter').findOne({ email: this.email });
    if (existing) {
      const error = new Error('이미 구독된 이메일입니다.');
      return next(error);
    }
  }
  next();
});

export default mongoose.models.Newsletter || mongoose.model<INewsletter>('Newsletter', NewsletterSchema);
















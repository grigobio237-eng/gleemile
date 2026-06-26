import mongoose from 'mongoose';

export interface ICustomerSegment {
  _id?: string;
  name: string;
  description?: string;
  type: 'static' | 'dynamic' | 'behavioral' | 'rfm' | 'ltv' | 'advanced';
  status: 'active' | 'inactive' | 'draft';
  rules: {
    basic: Array<{
      field: string;
      operator: string;
      value: any;
      value2?: any;
      timeWindow?: number;
      weight?: number;
    }>;
    behavioral: Array<{
      id: string;
      name: string;
      description: string;
      conditions: Array<{
        eventType: string;
        frequency: number;
        timeWindow: number;
        conditions: Array<{
          field: string;
          operator: string;
          value: any;
        }>;
      }>;
      weight: number;
    }>;
  };
  tags: string[];
  stats: {
    totalUsers: number;
    lastUpdated: Date;
    updateCount: number;
  };
  createdBy: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const CustomerSegmentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  type: {
    type: String,
    enum: ['static', 'dynamic', 'behavioral', 'rfm', 'ltv', 'advanced'],
    default: 'static'
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'draft'],
    default: 'active'
  },
  rules: {
    basic: [{
      field: {
        type: String,
        required: true
      },
      operator: {
        type: String,
        enum: ['equals', 'not_equals', 'greater_than', 'less_than', 'between', 'contains', 'not_contains', 'in', 'not_in', 'regex', 'exists', 'not_exists'],
        required: true
      },
      value: {
        type: mongoose.Schema.Types.Mixed,
        required: true
      },
      value2: mongoose.Schema.Types.Mixed,
      timeWindow: Number,
      weight: Number
    }],
    behavioral: [{
      id: String,
      name: String,
      description: String,
      conditions: [{
        eventType: String,
        frequency: Number,
        timeWindow: Number,
        conditions: [{
          field: String,
          operator: String,
          value: mongoose.Schema.Types.Mixed
        }]
      }],
      weight: Number
    }]
  },
  tags: [{
    type: String
  }],
  stats: {
    totalUsers: {
      type: Number,
      default: 0
    },
    lastUpdated: {
      type: Date,
      default: Date.now
    },
    updateCount: {
      type: Number,
      default: 0
    }
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// 인덱스 생성
CustomerSegmentSchema.index({ name: 1 });
CustomerSegmentSchema.index({ type: 1 });
CustomerSegmentSchema.index({ status: 1 });
CustomerSegmentSchema.index({ createdBy: 1 });

export default mongoose.models.CustomerSegment || mongoose.model('CustomerSegment', CustomerSegmentSchema);
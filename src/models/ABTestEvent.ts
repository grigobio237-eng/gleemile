import mongoose from 'mongoose';

const ABTestEventSchema = new mongoose.Schema({
  testId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ABTest',
    required: true
  },
  userId: {
    type: String,
    required: true
  },
  variantId: {
    type: String
  },
  eventType: {
    type: String,
    required: true
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// 인덱스 생성
ABTestEventSchema.index({ testId: 1, userId: 1 });
ABTestEventSchema.index({ testId: 1, eventType: 1 });
ABTestEventSchema.index({ timestamp: 1 });

export default mongoose.models.ABTestEvent || mongoose.model('ABTestEvent', ABTestEventSchema);
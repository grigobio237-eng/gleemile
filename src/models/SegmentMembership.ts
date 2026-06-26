import mongoose from 'mongoose';

const SegmentMembershipSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  segmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CustomerSegment',
    required: true
  },
  joinedAt: {
    type: Date,
    default: Date.now
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

// 복합 인덱스 생성
SegmentMembershipSchema.index({ userId: 1, segmentId: 1 }, { unique: true });
SegmentMembershipSchema.index({ segmentId: 1 });
SegmentMembershipSchema.index({ joinedAt: 1 });

export default mongoose.models.SegmentMembership || mongoose.model('SegmentMembership', SegmentMembershipSchema);
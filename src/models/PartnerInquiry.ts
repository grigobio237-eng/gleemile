import mongoose, { Schema, Document } from 'mongoose';

export interface IPartnerInquiry extends Document {
  companyName: string;
  contactName: string;
  email: string;
  phoneNumber: string;
  content: string;
  status: 'pending' | 'reviewed' | 'completed';
  adminNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PartnerInquirySchema: Schema = new Schema({
  companyName: { type: String, required: true },
  contactName: { type: String, required: true },
  email: { type: String, required: true },
  phoneNumber: { type: String, required: true },
  content: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['pending', 'reviewed', 'completed'], 
    default: 'pending' 
  },
  adminNotes: { type: String },
}, {
  timestamps: true
});

export default mongoose.models.PartnerInquiry || mongoose.model<IPartnerInquiry>('PartnerInquiry', PartnerInquirySchema);

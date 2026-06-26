import mongoose, { Schema, Document } from 'mongoose';

export interface IPostCareSurvey extends Document {
  user: mongoose.Types.ObjectId;
  procedureInfo: {
    name: string;
    date: Date;
    daysSince: number;
  };
  symptoms: {
    pain: number; // 1-5
    swelling: number; // 1-5
    bruising: number; // 1-5
    fever: number; // 1-5
    otherDetails?: string;
  };
  concerns: string[];
  lifestyle: {
    smoking: boolean;
    drinking: boolean;
    activityLevel: string;
  };
  aiRoadmap?: {
    statusAnalysis: string;
    isEmergency: boolean;
    recoveryPhase: string;
    timeline: {
      period: string;
      goal: string;
      instructions: string[];
    }[];
    expertAdvice: string[];
  };
  createdAt: Date;
  updatedAt: Date;
}

const PostCareSurveySchema: Schema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    procedureInfo: {
      name: { type: String, required: true },
      date: { type: Date, required: true },
      daysSince: { type: Number },
    },
    symptoms: {
      pain: { type: Number, required: true, min: 1, max: 5 },
      swelling: { type: Number, required: true, min: 1, max: 5 },
      bruising: { type: Number, required: true, min: 1, max: 5 },
      fever: { type: Number, required: true, min: 1, max: 5 },
      otherDetails: { type: String },
    },
    concerns: [{ type: String }],
    lifestyle: {
      smoking: { type: Boolean, default: false },
      drinking: { type: Boolean, default: false },
      activityLevel: { type: String },
    },
    aiRoadmap: {
      statusAnalysis: { type: String },
      isEmergency: { type: Boolean, default: false },
      recoveryPhase: { type: String },
      timeline: [{
        period: { type: String },
        goal: { type: String },
        instructions: [{ type: String }]
      }],
      expertAdvice: [{ type: String }]
    },
  },
  { timestamps: true }
);

export default mongoose.models.PostCareSurvey || mongoose.model<IPostCareSurvey>('PostCareSurvey', PostCareSurveySchema);

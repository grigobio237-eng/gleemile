import mongoose, { Schema, Document } from 'mongoose';

export interface IRecoveryNote extends Document {
  userId: mongoose.Types.ObjectId;
  date: string; // YYYY-MM-DD
  content: string;
  mood?: string; // e.g., 'happy', 'tired', 'calm', etc.
  createdAt: Date;
}

const RecoveryNoteSchema: Schema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: String, required: true },
  content: { type: String, required: true },
  mood: { type: String },
  createdAt: { type: Date, default: Date.now }
});

// One user can have multiple notes per day (timeline style), or we can limit to one.
// Let's allow multiple to make it a real timeline.
RecoveryNoteSchema.index({ userId: 1, date: 1 });
RecoveryNoteSchema.index({ createdAt: -1 });

export default mongoose.models.RecoveryNote || mongoose.model<IRecoveryNote>('RecoveryNote', RecoveryNoteSchema);

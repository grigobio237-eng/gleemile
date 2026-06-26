import mongoose, { Document, Model, Schema } from 'mongoose';

export interface ICharacter extends Document {
    userId: mongoose.Types.ObjectId;
    name: string;
    imageUrl: string;       // Firebase Storage URL (WebP)
    prompt: string;
    visualStyle: string;
    createdAt: Date;
    isDefault: boolean;
}

const CharacterSchema = new Schema<ICharacter>({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true },
    imageUrl: { type: String, required: true },
    prompt: { type: String, default: '' },
    visualStyle: { type: String, default: 'premium' },
    createdAt: { type: Date, default: Date.now },
    isDefault: { type: Boolean, default: false }
});

// 사용자별 기본 캐릭터는 하나만 허용
CharacterSchema.index({ userId: 1, isDefault: 1 });

const Character: Model<ICharacter> = mongoose.models.Character || mongoose.model<ICharacter>('Character', CharacterSchema);

export default Character;

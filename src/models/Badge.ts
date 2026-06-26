import mongoose, { Schema, Document } from 'mongoose';

export interface IBadge extends Document {
    code: string; // unique identifier (e.g., 'streak_7')
    name: string;
    description: string;
    icon: string; // Lucide icon name or emoji
    category: 'streak' | 'achievement' | 'special' | 'community';
    rarity: 'common' | 'rare' | 'epic' | 'legendary';
    criteria: {
        type: 'checkin_count' | 'streak_days' | 'percentile' | 'time_of_day';
        value: number;
    };
}

const BadgeSchema = new Schema({
    code: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    description: { type: String, required: true },
    icon: { type: String, required: true },
    category: { type: String, enum: ['streak', 'achievement', 'special', 'community'], required: true },
    rarity: { type: String, enum: ['common', 'rare', 'epic', 'legendary'], default: 'common' },
    criteria: {
        type: { type: String, required: true },
        value: { type: Number, required: true }
    }
});

export const Badge = mongoose.models.Badge || mongoose.model<IBadge>('Badge', BadgeSchema);

export interface IUserBadge extends Document {
    userId: mongoose.Types.ObjectId;
    badgeId: mongoose.Types.ObjectId;
    earnedAt: Date;
}

const UserBadgeSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    badgeId: { type: Schema.Types.ObjectId, ref: 'Badge', required: true },
    earnedAt: { type: Date, default: Date.now }
});

// UserBadge compound index for unique earnings
UserBadgeSchema.index({ userId: 1, badgeId: 1 }, { unique: true });

export const UserBadge = mongoose.models.UserBadge || mongoose.model<IUserBadge>('UserBadge', UserBadgeSchema);

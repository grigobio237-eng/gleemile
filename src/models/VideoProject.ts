
import mongoose from 'mongoose';

const VideoProjectSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    topic: {
        type: String,
        required: true,
    },
    productName: {
        type: String,
    },
    projectType: {
        type: String,
        enum: ['shortform', 'product_promo', 'influencer_promo', 'influencer_vlog', 'influencer_long'],
        default: 'shortform',
    },
    status: {
        type: String,
        enum: ['pending', 'running', 'completed', 'failed'],
        default: 'pending',
    },
    // Workflow Engine State
    workflow: {
        nodes: [{ type: mongoose.Schema.Types.Mixed }], // Store WorkflowNode[]
        edges: [{ type: mongoose.Schema.Types.Mixed }], // Store WorkflowEdge[]
        results: { type: mongoose.Schema.Types.Mixed }, // Store Node Results
        currentStep: String,
        errors: [String],
        // Interactive Step Status
        stepStatus: {
            trend: { type: String, enum: ['idle', 'completed'], default: 'idle' },
            script: { type: String, enum: ['idle', 'completed'], default: 'idle' },
            image: { type: String, enum: ['idle', 'completed'], default: 'idle' },
            audio: { type: String, enum: ['idle', 'completed'], default: 'idle' },
            video: { type: String, enum: ['idle', 'completed'], default: 'idle' },
            synthesis: { type: String, enum: ['idle', 'completed'], default: 'idle' }
        },
        // Interactive Data Storage (User Edits)
        data: {
            trend: { type: mongoose.Schema.Types.Mixed }, // Edited Trend JSON
            script: { type: mongoose.Schema.Types.Mixed }, // Edited Script JSON
            assets: { type: mongoose.Schema.Types.Mixed }, // Selected Assets (Images/Audio)
            videoClips: { type: mongoose.Schema.Types.Mixed } // Approved Video Clips
        }
    },
    // Final Output
    finalVideoUrl: String,
    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },
});

// Middleware to update `updatedAt` on save
VideoProjectSchema.pre('save', function (next) {
    this.updatedAt = new Date();
    next();
});

export default mongoose.models.VideoProject || mongoose.model('VideoProject', VideoProjectSchema);

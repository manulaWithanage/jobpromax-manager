import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IActivityLog extends Document {
    _id: mongoose.Types.ObjectId;
    userId: mongoose.Types.ObjectId;
    userName: string;
    userRole: 'manager' | 'developer' | 'leadership';
    action: string;
    targetType?: 'feature' | 'report' | 'roadmap' | 'user' | 'task' | 'timesheet';
    targetId?: string;
    targetName?: string;
    details?: Record<string, any>;
    ipAddress?: string;
    userAgent?: string;
    timestamp: Date;
    createdAt: Date;
}

const ActivityLogSchema = new Schema<IActivityLog>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        userName: {
            type: String,
            required: true,
        },
        userRole: {
            type: String,
            required: true,
            enum: ['manager', 'developer', 'leadership'],
        },
        action: {
            type: String,
            required: true,
            index: true,
        },
        targetType: {
            type: String,
            enum: ['feature', 'report', 'roadmap', 'user', 'task', 'timesheet'],
        },
        targetId: {
            type: String,
        },
        targetName: {
            type: String,
        },
        details: {
            type: Schema.Types.Mixed,
        },
        ipAddress: {
            type: String,
        },
        userAgent: {
            type: String,
        },
        timestamp: {
            type: Date,
            default: Date.now,
            index: true,
            // TTL index - automatically delete documents older than 60 days (2 months)
            expires: 60 * 24 * 60 * 60, // 60 days in seconds
        },
    },
    {
        timestamps: true,
    }
);

// Compound index for efficient user-specific queries
ActivityLogSchema.index({ userId: 1, timestamp: -1 });

// Index for date range queries
ActivityLogSchema.index({ timestamp: -1 });

// Transform _id to id when converting to JSON
ActivityLogSchema.set('toJSON', {
    transform: function (doc, ret: any) {
        ret.id = ret._id?.toString();
        ret.userId = ret.userId?.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
    },
});

// Prevent model recompilation in development
const ActivityLog: Model<IActivityLog> =
    mongoose.models.ActivityLog || mongoose.model<IActivityLog>('ActivityLog', ActivityLogSchema);

export default ActivityLog;

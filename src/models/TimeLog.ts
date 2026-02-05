import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ITimeLog extends Document {
    _id: mongoose.Types.ObjectId;
    userId: string;
    userName: string;
    userRole: 'manager' | 'developer' | 'leadership';
    date: string; // ISO Date (YYYY-MM-DD)
    hours: number;
    summary: string;
    jiraTickets: string[];
    workType: 'feature' | 'bug' | 'refactor' | 'testing' | 'documentation' | 'planning' | 'review' | 'meeting' | 'content' | 'campaign' | 'analytics' | 'other';
    status: 'pending' | 'approved' | 'rejected';
    approvedBy?: string;
    managerComment?: string;
    createdAt: Date;
    updatedAt: Date;
}

const TimeLogSchema = new Schema<ITimeLog>(
    {
        userId: {
            type: String,
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
        date: {
            type: String,
            required: true,
            index: true,
        },
        hours: {
            type: Number,
            required: true,
            min: 0,
            max: 24,
        },
        summary: {
            type: String,
            required: true,
            trim: true,
        },
        jiraTickets: {
            type: [String],
            required: true,
            default: [],
        },
        workType: {
            type: String,
            required: true,
            enum: ['feature', 'bug', 'refactor', 'testing', 'documentation', 'planning', 'review', 'meeting', 'content', 'campaign', 'analytics', 'other'],
            default: 'feature',
            index: true, // For performance tracking queries
        },
        status: {
            type: String,
            required: true,
            enum: ['pending', 'approved', 'rejected'],
            default: 'pending',
            index: true,
        },
        approvedBy: {
            type: String,
        },
        managerComment: {
            type: String,
            trim: true,
        },
    },
    {
        timestamps: true,
    }
);

// Compound index for efficient queries
TimeLogSchema.index({ userId: 1, date: -1 });
TimeLogSchema.index({ status: 1, date: -1 });

// Transform _id to id when converting to JSON
TimeLogSchema.set('toJSON', {
    transform: function (doc, ret: any) {
        ret.id = ret._id.toString();

        // Ensure jiraTickets is always an array for the frontend
        if (ret.jiraTicket && !ret.jiraTickets) {
            ret.jiraTickets = [ret.jiraTicket];
        } else if (!ret.jiraTickets) {
            ret.jiraTickets = [];
        }

        delete ret.jiraTicket;
        delete ret._id;
        delete ret.__v;
        return ret;
    },
    virtuals: true,
});

// Prevent model recompilation in development
const TimeLog: Model<ITimeLog> = mongoose.models.TimeLog || mongoose.model<ITimeLog>('TimeLog', TimeLogSchema);

export default TimeLog;

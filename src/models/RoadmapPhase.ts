import mongoose, { Schema, Document, Model } from 'mongoose';

interface IDeliverable {
    text: string;
    status: 'done' | 'pending' | 'in-progress';
}

export interface IRoadmapPhase extends Document {
    phase: string;
    date: string;
    title: string;
    description: string;
    status: 'completed' | 'current' | 'upcoming';
    health?: 'on-track' | 'at-risk' | 'delayed';
    deliverables: IDeliverable[];
    createdAt: Date;
    updatedAt: Date;
}

const RoadmapPhaseSchema = new Schema<IRoadmapPhase>(
    {
        phase: {
            type: String,
            required: true,
            trim: true,
        },
        date: {
            type: String,
            required: true,
        },
        title: {
            type: String,
            required: true,
            trim: true,
        },
        description: {
            type: String,
            required: true,
        },
        status: {
            type: String,
            required: true,
            enum: ['completed', 'current', 'upcoming'],
            default: 'upcoming',
        },
        health: {
            type: String,
            enum: ['on-track', 'at-risk', 'delayed'],
            default: 'on-track',
        },
        deliverables: [
            {
                text: { type: String, required: true },
                status: {
                    type: String,
                    enum: ['done', 'pending', 'in-progress'],
                    default: 'pending',
                },
            },
        ],
    },
    {
        timestamps: true,
    }
);

// Transform _id to id when converting to JSON
RoadmapPhaseSchema.set('toJSON', {
    transform: function (doc, ret: any) {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
    },
});

const RoadmapPhase: Model<IRoadmapPhase> = mongoose.models.RoadmapPhase || mongoose.model<IRoadmapPhase>('RoadmapPhase', RoadmapPhaseSchema);

export default RoadmapPhase;

import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IFeatureStatus extends Document {
    name: string;
    status: 'operational' | 'degraded' | 'critical';
    publicNote: string;
    linkedTicket?: string;
    createdAt: Date;
    updatedAt: Date;
}

const FeatureStatusSchema = new Schema<IFeatureStatus>(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        status: {
            type: String,
            required: true,
            enum: ['operational', 'degraded', 'critical'],
            default: 'operational',
        },
        publicNote: {
            type: String,
            required: true,
        },
        linkedTicket: {
            type: String,
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

// Transform _id to id when converting to JSON
FeatureStatusSchema.set('toJSON', {
    transform: function (doc, ret: any) {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
    },
});

const FeatureStatus: Model<IFeatureStatus> = mongoose.models.FeatureStatus || mongoose.model<IFeatureStatus>('FeatureStatus', FeatureStatusSchema);

export default FeatureStatus;

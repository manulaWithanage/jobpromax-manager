import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ISharedLink extends Document {
    _id: mongoose.Types.ObjectId;
    token: string;
    type: 'invoice';
    month: number;          // 1-12
    year: number;           // e.g., 2026
    period: 'P1' | 'P2';
    createdBy: mongoose.Types.ObjectId;
    createdAt: Date;
    expiresAt?: Date;       // Optional: for future expiration feature
}

const SharedLinkSchema = new Schema<ISharedLink>(
    {
        token: {
            type: String,
            required: true,
            unique: true,
            index: true,
        },
        type: {
            type: String,
            enum: ['invoice'],
            default: 'invoice',
            required: true,
        },
        month: {
            type: Number,
            required: true,
            min: 1,
            max: 12,
        },
        year: {
            type: Number,
            required: true,
        },
        period: {
            type: String,
            enum: ['P1', 'P2'],
            required: true,
        },
        createdBy: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        expiresAt: {
            type: Date,
        },
    },
    {
        timestamps: true,
    }
);

// Compound index to ensure unique links per period
SharedLinkSchema.index({ month: 1, year: 1, period: 1 }, { unique: true });

// Transform for JSON output
SharedLinkSchema.set('toJSON', {
    transform: function (doc, ret: any) {
        ret.id = ret._id?.toString();
        if (ret.createdBy && typeof ret.createdBy !== 'string') {
            ret.createdBy = (ret.createdBy as any).toString();
        }
        delete (ret as any)._id;
        delete (ret as any).__v;
        return ret;
    },
});

const SharedLink: Model<ISharedLink> = mongoose.models.SharedLink || mongoose.model<ISharedLink>('SharedLink', SharedLinkSchema);

export default SharedLink;

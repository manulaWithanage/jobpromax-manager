import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IPayment extends Document {
    _id: mongoose.Types.ObjectId;
    userId: mongoose.Types.ObjectId;
    userName: string;
    period: 'P1' | 'P2';
    month: number;          // 1-12
    year: number;           // e.g., 2026
    hours: number;
    amount: number;
    status: 'pending' | 'paid';
    paidAt?: Date;
    paidBy?: string;        // Name of finance manager who marked it paid
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
}

const PaymentSchema = new Schema<IPayment>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        userName: {
            type: String,
            required: true,
        },
        period: {
            type: String,
            enum: ['P1', 'P2'],
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
        hours: {
            type: Number,
            required: true,
            default: 0,
        },
        amount: {
            type: Number,
            required: true,
            default: 0,
        },
        status: {
            type: String,
            enum: ['pending', 'paid'],
            default: 'pending',
        },
        paidAt: {
            type: Date,
        },
        paidBy: {
            type: String,
        },
        notes: {
            type: String,
        },
    },
    {
        timestamps: true,
    }
);

// Compound index to ensure unique payment records per user/period/month/year
PaymentSchema.index({ userId: 1, period: 1, month: 1, year: 1 }, { unique: true });

// Transform for JSON output
PaymentSchema.set('toJSON', {
    transform: function (doc, ret: any) {
        ret.id = ret._id.toString();
        ret.userId = ret.userId.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
    },
});

const Payment: Model<IPayment> = mongoose.models.Payment || mongoose.model<IPayment>('Payment', PaymentSchema);

export default Payment;

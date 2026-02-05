import mongoose, { Schema, Document, Model } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
    _id: mongoose.Types.ObjectId;
    name: string;
    email: string;
    passwordHash: string;
    role: 'manager' | 'developer' | 'leadership' | 'finance';
    isSuperAdmin?: boolean;
    hourlyRate?: number;
    department?: 'Frontend' | 'Backend' | 'Marketing' | 'Customer Success' | 'Management';
    dailyHoursTarget?: number;
    bankDetails?: {
        accountName: string;
        bankName: string;
        accountNumber: string;
        branchName?: string;
        branchCode?: string;
        country?: string;
        currency?: string;
        notes?: string;
    };
    createdAt: Date;
    updatedAt: Date;
    comparePassword(candidatePassword: string): Promise<boolean>;
}

const UserSchema = new Schema<IUser>(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },
        passwordHash: {
            type: String,
            required: true,
        },
        role: {
            type: String,
            required: true,
            enum: ['manager', 'developer', 'leadership', 'finance'],
            default: 'developer',
        },
        isSuperAdmin: {
            type: Boolean,
            default: false,
        },
        hourlyRate: {
            type: Number,
            default: 0,
        },
        department: {
            type: String,
            enum: ['Frontend', 'Backend', 'Marketing', 'Customer Success', 'Management'],
        },
        dailyHoursTarget: {
            type: Number,
            default: 8,
            min: 0,
            max: 24,
        },
        bankDetails: {
            accountName: { type: String },
            bankName: { type: String },
            accountNumber: { type: String },
            branchName: { type: String },
            branchCode: { type: String },
            country: { type: String },
            currency: { type: String },
            notes: { type: String },
        },
    },
    {
        timestamps: true,
    }
);

// Method to compare password
UserSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
    return bcrypt.compare(candidatePassword, this.passwordHash);
};

// Transform _id to id when converting to JSON
UserSchema.set('toJSON', {
    transform: function (doc, ret: any) {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        delete ret.passwordHash; // Never expose password hash
        return ret;
    },
});

// Prevent model recompilation in development
const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

export default User;

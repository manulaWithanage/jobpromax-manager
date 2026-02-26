import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config({ path: '.env' });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.error('❌ MONGODB_URI environment variable is not set');
    process.exit(1);
}

const UserSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true },
        email: { type: String, required: true, unique: true, lowercase: true, trim: true },
        passwordHash: { type: String, required: true },
        role: { type: String, required: true, enum: ['manager', 'developer', 'leadership', 'finance'], default: 'developer' },
        isSuperAdmin: { type: Boolean, default: false },
        hourlyRate: { type: Number, default: 0 },
        department: { type: String },
        departments: { type: [String], default: [] },
        dailyHoursTarget: { type: Number, default: 8, min: 0, max: 24 },
    },
    { timestamps: true }
);

const User = mongoose.models.User || mongoose.model('User', UserSchema);

async function createManagerUser() {
    try {
        console.log('🔗 Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI!);
        console.log('✅ Connected to MongoDB');

        const email = 'manula@jobpromax.com';
        const password = 'LmA665Zrws997';

        // Check if user already exists
        const existing = await User.findOne({ email });
        if (existing) {
            console.log(`⚠️  User with email "${email}" already exists (ID: ${existing._id}). Aborting.`);
            await mongoose.disconnect();
            process.exit(0);
        }

        const passwordHash = await bcrypt.hash(password, 10);

        const user = await User.create({
            name: 'Manula Withanage',
            email,
            passwordHash,
            role: 'manager',
            department: 'Management',
            departments: ['Management'],
            hourlyRate: 0,
            dailyHoursTarget: 8,
        });

        console.log('\n🎉 Manager user created successfully!');
        console.log(`   Name  : ${user.name}`);
        console.log(`   Email : ${user.email}`);
        console.log(`   Role  : ${user.role}`);
        console.log(`   ID    : ${user._id}`);

        await mongoose.disconnect();
        process.exit(0);
    } catch (error) {
        console.error('❌ Failed to create user:', error);
        await mongoose.disconnect();
        process.exit(1);
    }
}

createManagerUser();

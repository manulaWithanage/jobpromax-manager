import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

// MongoDB URI from environment
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.error('❌ MONGODB_URI environment variable is not set');
    process.exit(1);
}

// User Schema
const UserSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true },
        email: { type: String, required: true, unique: true, lowercase: true, trim: true },
        passwordHash: { type: String, required: true },
        role: { type: String, required: true, enum: ['manager', 'developer', 'leadership'], default: 'developer' },
        isSuperAdmin: { type: Boolean, default: false },
        hourlyRate: { type: Number, default: 0 },
        department: { type: String, enum: ['Frontend', 'Backend', 'Marketing', 'Customer Success', 'Management'] },
        dailyHoursTarget: { type: Number, default: 8, min: 0, max: 24 },
    },
    { timestamps: true }
);

// TimeLog Schema
const TimeLogSchema = new mongoose.Schema(
    {
        userId: { type: String, required: true, index: true },
        userName: { type: String, required: true },
        userRole: { type: String, required: true, enum: ['manager', 'developer', 'leadership'] },
        date: { type: String, required: true, index: true },
        hours: { type: Number, required: true, min: 0, max: 24 },
        summary: { type: String, required: true, trim: true },
        jiraTicket: { type: String, required: true, trim: true },
        status: { type: String, required: true, enum: ['pending', 'approved', 'rejected'], default: 'pending', index: true },
        approvedBy: { type: String },
        managerComment: { type: String, trim: true },
    },
    { timestamps: true }
);

const User = mongoose.models.User || mongoose.model('User', UserSchema);
const TimeLog = mongoose.models.TimeLog || mongoose.model('TimeLog', TimeLogSchema);

// Roadmap Schema
const RoadmapPhaseSchema = new mongoose.Schema({
    phase: String,
    date: String,
    title: String,
    description: String,
    status: { type: String, enum: ['completed', 'current', 'upcoming'] },
    health: { type: String, enum: ['on-track', 'at-risk', 'delayed'] },
    deliverables: [{ text: String, status: { type: String, enum: ['done', 'pending', 'in-progress'] } }]
}, { timestamps: true });

const RoadmapPhase = mongoose.models.RoadmapPhase || mongoose.model('RoadmapPhase', RoadmapPhaseSchema);

// Feature Status Schema
const FeatureStatusSchema = new mongoose.Schema({
    name: String,
    status: { type: String, enum: ['operational', 'degraded', 'critical'] },
    publicNote: String,
    linkedTicket: String
}, { timestamps: true });

const FeatureStatus = mongoose.models.FeatureStatus || mongoose.model('FeatureStatus', FeatureStatusSchema);

// Task Schema
const TaskSchema = new mongoose.Schema({
    name: String,
    assignee: String,
    status: { type: String, enum: ['In Progress', 'In Review', 'Blocked', 'Done'] },
    dueDate: String,
    priority: { type: String, enum: ['High', 'Medium', 'Low'] }
}, { timestamps: true });

const Task = mongoose.models.Task || mongoose.model('Task', TaskSchema);

async function seed() {
    try {
        console.log('🌱 Starting database seed...');

        // Connect to MongoDB
        await mongoose.connect(MONGODB_URI!);
        console.log('✅ Connected to MongoDB');

        // Clear existing data
        console.log('🗑️  Clearing existing data...');
        await User.deleteMany({});
        await TimeLog.deleteMany({});
        await Task.deleteMany({});
        await RoadmapPhase.deleteMany({});
        await FeatureStatus.deleteMany({});

        // Create users
        console.log('👥 Creating users...');

        const managerPassword = await bcrypt.hash('password123', 10);
        const devPassword = await bcrypt.hash('password123', 10);

        const manager = await User.create({
            name: 'Manager User',
            email: 'manager@example.com',
            passwordHash: managerPassword,
            role: 'manager',
            hourlyRate: 100,
            department: 'Management',
            dailyHoursTarget: 8,
        });

        const developer = await User.create({
            name: 'Developer User',
            email: 'dev@example.com',
            passwordHash: devPassword,
            role: 'developer',
            hourlyRate: 75,
            department: 'Frontend',
            dailyHoursTarget: 8,
        });

        console.log('✅ Users created:');
        console.log(`   - Manager: ${manager.email} (ID: ${manager._id})`);
        console.log(`   - Developer: ${developer.email} (ID: ${developer._id})`);

        // Create sample time logs
        console.log('📝 Creating sample time logs...');

        const logs = await TimeLog.create([
            {
                userId: developer._id.toString(),
                userName: developer.name,
                userRole: developer.role,
                date: '2026-01-26',
                hours: 4,
                summary: 'Implementing Auth Context and login page logic',
                jiraTicket: 'JPM-101',
                workType: 'feature',
                status: 'approved',
                approvedBy: manager._id.toString(),
            },
            {
                userId: developer._id.toString(),
                userName: developer.name,
                userRole: developer.role,
                date: '2026-01-27',
                hours: 2.5,
                summary: 'Fixing sidebar navigation bugs',
                jiraTicket: 'JPM-105',
                workType: 'bug',
                status: 'pending',
            },
            {
                userId: developer._id.toString(),
                userName: developer.name,
                userRole: developer.role,
                date: '2026-01-28',
                hours: 6,
                summary: 'Implementing MongoDB integration for timesheets',
                jiraTicket: 'JPM-110',
                workType: 'feature',
                status: 'pending',
            },
        ]);

        console.log(`✅ Created ${logs.length} time logs`);

        // Create sample roadmap
        console.log('🗺️  Creating sample roadmap...');
        await RoadmapPhase.create([
            {
                phase: 'Phase 1',
                date: 'Q1 2026',
                title: 'Infrastructure & Auth',
                description: 'Setting up the core platform and authentication systems.',
                status: 'completed',
                health: 'on-track',
                deliverables: [
                    { text: 'MongoDB Integration', status: 'done' },
                    { text: 'Role-based Access Control', status: 'done' }
                ]
            },
            {
                phase: 'Phase 2',
                date: 'Q2 2026',
                title: 'Project Management',
                description: 'Task tracking and team collaboration tools.',
                status: 'current',
                health: 'on-track',
                deliverables: [
                    { text: 'Kanban Board', status: 'in-progress' },
                    { text: 'Activity Feed', status: 'done' }
                ]
            }
        ]);

        // Create sample features
        console.log('✨ Creating sample feature statuses...');
        await FeatureStatus.create([
            { name: 'User Authentication', status: 'operational', publicNote: 'All systems normal.' },
            { name: 'Database API', status: 'operational', publicNote: 'All systems normal.' },
            { name: 'File Uploads', status: 'degraded', publicNote: 'Processing may be slower than usual.', linkedTicket: 'JPM-404' }
        ]);

        // Create sample tasks
        console.log('📋 Creating sample tasks...');
        await Task.create([
            { name: 'Fix Sidebar Layout', assignee: 'Developer User', status: 'In Progress', dueDate: '2026-02-05', priority: 'High' },
            { name: 'Update API Documentation', assignee: 'Manager User', status: 'In Review', dueDate: '2026-02-10', priority: 'Medium' }
        ]);

        console.log('\n🎉 Database seeded successfully!');
        console.log('\n📋 Login Credentials:');
        console.log('   Manager: manager@example.com / password123');
        console.log('   Developer: dev@example.com / password123');

        await mongoose.disconnect();
        process.exit(0);
    } catch (error) {
        console.error('❌ Seed failed:', error);
        await mongoose.disconnect();
        process.exit(1);
    }
}

seed();

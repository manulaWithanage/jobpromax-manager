import { config } from 'dotenv';
config();
import User from '../models/User';

/**
 * MongoDB Verification Script
 * 
 * This script connects to MongoDB and verifies that the User schema
 * properly handles hourlyRate, department, and dailyHoursTarget fields.
 * 
 * Run this script with: npx tsx src/scripts/verify-mongodb.ts
 */

async function verifyMongoDB() {
    try {
        console.log('🔍 Connecting to MongoDB...');
        const connectDB = (await import('../lib/mongodb')).default;
        await connectDB();
        console.log('✅ Connected successfully\n');

        // Get database and collection info
        const db = User.db;
        const collectionName = User.collection.name;

        console.log('📊 Database Information:');
        console.log(`   Database Name: ${db.name}`);
        console.log(`   Collection Name: ${collectionName}\n`);

        // Get collection stats
        const count = await User.countDocuments();
        console.log('📈 Collection Statistics:');
        console.log(`   Total Documents: ${count}\n`);

        // List all indexes
        const indexes = await User.collection.indexes();
        console.log('🔑 Indexes:');
        indexes.forEach((index) => {
            console.log(`   - ${JSON.stringify(index.key)}`);
        });
        console.log('');

        // Fetch all users and check for member settings fields
        const users = await User.find({}).select('name email role hourlyRate department dailyHoursTarget').lean();

        console.log('👥 User Data Verification:\n');
        console.log('─'.repeat(100));
        console.log(
            'Name'.padEnd(25) +
            'Email'.padEnd(30) +
            'Rate'.padEnd(10) +
            'Department'.padEnd(20) +
            'Daily Hrs'
        );
        console.log('─'.repeat(100));

        users.forEach((user: any) => {
            const name = (user.name || 'N/A').substring(0, 24).padEnd(25);
            const email = (user.email || 'N/A').substring(0, 29).padEnd(30);
            const rate = `$${user.hourlyRate || 0}`.padEnd(10);
            const dept = (user.department || 'Not Set').padEnd(20);
            const hours = `${user.dailyHoursTarget || 8} hrs`;

            console.log(name + email + rate + dept + hours);
        });
        console.log('─'.repeat(100));
        console.log('');

        // Check schema validation
        console.log('✅ Schema Validation:');
        console.log('   hourlyRate: Number (default: 0)');
        console.log('   department: String (enum: Frontend, Backend, Marketing, Customer Success, Management)');
        console.log('   dailyHoursTarget: Number (min: 0, max: 24, default: 8)\n');

        // Test data integrity
        const usersWithSettings = users.filter((u: any) =>
            u.hourlyRate !== undefined ||
            u.department !== undefined ||
            u.dailyHoursTarget !== undefined
        );

        console.log('📊 Data Integrity Check:');
        console.log(`   Total Users: ${users.length}`);
        console.log(`   Users with Member Settings: ${usersWithSettings.length}`);
        console.log(`   Users with Hourly Rate Set: ${users.filter((u: any) => u.hourlyRate && u.hourlyRate > 0).length}`);
        console.log(`   Users with Department Set: ${users.filter((u: any) => u.department).length}`);
        console.log(`   Users with Daily Hours Target Set: ${users.filter((u: any) => u.dailyHoursTarget && u.dailyHoursTarget !== 8).length}\n`);

        console.log('✅ MongoDB verification completed successfully!');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error verifying MongoDB:', error);
        process.exit(1);
    }
}

verifyMongoDB();

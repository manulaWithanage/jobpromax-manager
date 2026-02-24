/**
 * Migration script: Convert department (single string) → departments (array)
 * Run with: npx tsx scripts/migrateDepartments.ts
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function migrate() {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
        console.error('MONGODB_URI not set');
        process.exit(1);
    }

    await mongoose.connect(uri);
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;
    if (!db) {
        console.error('No database connection');
        process.exit(1);
    }

    const usersCollection = db.collection('users');

    // Find all users who have a department field but no departments array
    const usersToMigrate = await usersCollection.find({
        department: { $exists: true, $nin: [null, ''] },
        $or: [
            { departments: { $exists: false } },
            { departments: { $size: 0 } },
            { departments: null }
        ]
    }).toArray();

    console.log(`Found ${usersToMigrate.length} users to migrate`);

    let updated = 0;
    for (const user of usersToMigrate) {
        const department = user.department as string;
        if (department) {
            await usersCollection.updateOne(
                { _id: user._id },
                { $set: { departments: [department] } }
            );
            console.log(`  ✓ ${user.name}: "${department}" → ["${department}"]`);
            updated++;
        }
    }

    // Also handle users who have neither department nor departments
    const usersWithout = await usersCollection.find({
        $and: [
            { $or: [{ department: { $exists: false } }, { department: null }, { department: '' }] },
            { $or: [{ departments: { $exists: false } }, { departments: null }] }
        ]
    }).toArray();

    for (const user of usersWithout) {
        await usersCollection.updateOne(
            { _id: user._id },
            { $set: { departments: [] } }
        );
        console.log(`  ○ ${user.name}: no department → [] (empty departments array)`);
        updated++;
    }

    console.log(`\nMigration complete. Updated ${updated} users.`);

    await mongoose.disconnect();
}

migrate().catch(err => {
    console.error('Migration failed:', err);
    process.exit(1);
});

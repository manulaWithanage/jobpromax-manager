import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
dotenv.config();

// Define schemas manually for the script to avoid Next.js imports
const UserSchema = new mongoose.Schema({});
const TimeLogSchema = new mongoose.Schema({ userId: String });
const ActivityLogSchema = new mongoose.Schema({ userId: String, targetId: String });

const User = mongoose.models.User || mongoose.model('User', UserSchema);
const TimeLog = mongoose.models.TimeLog || mongoose.model('TimeLog', TimeLogSchema);
const ActivityLog = mongoose.models.ActivityLog || mongoose.model('ActivityLog', ActivityLogSchema);

async function cleanup() {
    try {
        await mongoose.connect(process.env.MONGODB_URI as string);
        console.log('Connected to DB');

        const users = await User.find({}, '_id');
        const userIds = users.map(u => u._id.toString());
        console.log(`Found ${userIds.length} active users.`);

        // Delete TimeLogs
        const timeLogResult = await TimeLog.deleteMany({ userId: { $nin: userIds } });
        console.log(`Deleted ${timeLogResult.deletedCount} orphaned TimeLogs.`);

        // Delete ActivityLogs
        const activityLogResult = await ActivityLog.deleteMany({
            $or: [
                { userId: { $nin: userIds } },
                { targetId: { $nin: userIds, $exists: true, $ne: null } }
            ]
        });
        console.log(`Deleted ${activityLogResult.deletedCount} orphaned ActivityLogs.`);

        console.log('Cleanup complete.');
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

cleanup();

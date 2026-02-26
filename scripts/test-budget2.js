const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/jobpromax-manager';

// Define schemas manually to avoid import issues
const userSchema = new mongoose.Schema({
    name: String,
    email: String,
    role: String,
    hourlyRate: Number,
}, { strict: false });
const User = mongoose.models.User || mongoose.model('User', userSchema);

const timeLogSchema = new mongoose.Schema({
    userId: String,
    userName: String,
    date: String,
    hours: Number,
    status: String,
}, { strict: false });
const TimeLog = mongoose.models.TimeLog || mongoose.model('TimeLog', timeLogSchema);

async function run() {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to DB');

    try {
        const users = await User.find({ role: { $in: ['developer', 'manager', 'leadership', 'finance'] } }).lean();
        console.log(`Found ${users.length} users with roles: developer, manager, leadership, finance`);

        users.forEach(u => console.log(`- ${u.name} | Role: ${u.role} | _id: ${u._id}`));

        const logs = await TimeLog.find({ status: 'approved' }).lean();
        console.log(`Found ${logs.length} total approved time logs in DB.`);

        if (logs.length > 0) {
            logs.forEach(l => console.log(`- ${l.userName}: ${l.hours}h on ${l.date}`));
        } else {
            const allLogs = await TimeLog.find({}).lean();
            console.log(`Total ANY status logs: ${allLogs.length}`);
        }

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected');
    }
}

run();

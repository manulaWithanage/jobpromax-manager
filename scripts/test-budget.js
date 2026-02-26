const mongoose = require('mongoose');
const User = require('../src/models/User').default;
const TimeLog = require('../src/models/TimeLog').default;

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/jobpromax-manager';

async function testBudget() {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to DB');

    try {
        const users = await User.find({ role: { $in: ['developer', 'manager', 'leadership', 'finance'] } }).lean();
        console.log(`Found ${users.length} users with roles: developer, manager, leadership, finance`);

        users.forEach(u => console.log(`- ${u.name} (${u.role})`));

        const month = 2; // Feb
        const year = 2026;
        const period = 'P2';

        const lastDayOfMonth = new Date(year, month, 0).getDate();
        const startDate = `${year}-02-16`;
        const endDate = `${year}-02-${lastDayOfMonth}`;

        console.log(`Checking time logs from ${startDate} to ${endDate} (P2)...`);

        const logs = await TimeLog.find({
            status: 'approved',
            date: { $gte: startDate, $lte: endDate }
        }).lean();

        console.log(`Found ${logs.length} approved time logs in P2 of Feb 2026.`);

        logs.forEach(l => console.log(`- ${l.userName}: ${l.hours}h on ${l.date}`));

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected');
    }
}

testBudget();

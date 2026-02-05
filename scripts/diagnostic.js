require('dotenv').config();
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.error('❌ MONGODB_URI not found in .env');
    process.exit(1);
}

async function run() {
    try {
        console.log('Connecting to:', MONGODB_URI);
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected\n');

        const db = mongoose.connection.db;
        const usersCol = db.collection('users');

        const users = await usersCol.find({}).toArray();

        console.log('--- USERS IN DATABASE ---');
        users.forEach(u => {
            console.log(`ID: ${u._id}`);
            console.log(`Name: ${u.name}`);
            console.log(`Email: ${u.email}`);
            console.log(`Role: ${u.role}`);
            console.log(`Hourly Rate: ${u.hourlyRate}`);
            console.log(`Department: ${u.department}`);
            console.log(`Daily Hours: ${u.dailyHoursTarget}`);
            console.log('-------------------------');
        });

        const logsCol = db.collection('timelogs');
        const logs = await logsCol.find({}).toArray();
        console.log(`\nFound ${logs.length} logs in 'timelogs' collection`);

        // Check if logs are in 'timelogs' or 'time_logs' or something else
        const collections = await db.listCollections().toArray();
        console.log('\nCollections found:', collections.map(c => c.name).join(', '));

        await mongoose.disconnect();
    } catch (err) {
        console.error('❌ Error:', err);
    }
}

run();

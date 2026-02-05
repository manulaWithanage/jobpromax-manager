require('dotenv').config();
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI;

async function run() {
    try {
        await mongoose.connect(MONGODB_URI);
        const db = mongoose.connection.db;

        const logs = await db.collection('timelogs').find({}).toArray();
        const users = await db.collection('users').find({}).toArray();

        console.log('--- DB SYNC CHECK ---');
        console.log(`Total Users: ${users.length}`);
        console.log(`Total Logs: ${logs.length}`);

        users.forEach(u => console.log(`User in DB: ${u.email} (ID: ${u._id})`));

        logs.forEach((l, i) => {
            const userExists = users.find(u => u._id.toString() === l.userId.toString());
            console.log(`Log ${i}: Date ${l.date}, UserID ${l.userId}, Exists in Users? ${!!userExists}`);
        });

        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
}
run();

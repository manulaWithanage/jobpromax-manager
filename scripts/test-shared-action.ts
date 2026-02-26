import mongoose from 'mongoose';
import SharedLink from '../src/models/SharedLink';
import User from '../src/models/User';
import connectDB from '../src/lib/mongodb';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function run() {
    await connectDB();
    console.log('Connected to DB');

    try {
        const month = 2;
        const year = 2026;
        const period = 'P2';

        // Find a valid manager user
        const manager = await User.findOne({ role: 'manager' });
        if (!manager) throw new Error('No manager found');

        console.log(`Checking existing link for ${month}/${year} ${period}`);
        let existingLink = await SharedLink.findOne({ month, year, period });

        if (existingLink) {
            console.log('Existing link found:', existingLink.token);
        } else {
            console.log('Creating new link...');
            const token = require('crypto').randomUUID();
            const newLink = await SharedLink.create({
                token,
                type: 'invoice',
                month,
                year,
                period,
                createdBy: manager._id,
            });
            console.log('New link created:', newLink.token);
        }

        const links = await SharedLink.find().lean();
        console.log(`Total shared links: ${links.length}`);

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected');
    }
}

run();

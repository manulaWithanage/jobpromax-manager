const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });
const crypto = require('crypto');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/jobpromax-manager';

// Define schemas manually to avoid import issues
const sharedLinkSchema = new mongoose.Schema({
    token: { type: String, required: true, unique: true },
    type: { type: String, required: true, enum: ['invoice'] },
    month: { type: Number, required: true },
    year: { type: Number, required: true },
    period: { type: String, required: true, enum: ['P1', 'P2'] },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    expiresAt: { type: Date },
}, { timestamps: true });

const SharedLink = mongoose.models.SharedLink || mongoose.model('SharedLink', sharedLinkSchema);

async function run() {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to DB');

    try {
        const month = 2;
        const year = 2026;
        const period = 'P2';
        const userId = new mongoose.Types.ObjectId('65d1c23f1b234567890abcde'); // Mock user ID

        console.log(`Checking existing link for ${month}/${year} ${period}`);
        let existingLink = await SharedLink.findOne({ month, year, period });

        if (existingLink) {
            console.log('Existing link found:', existingLink.token);
        } else {
            console.log('Creating new link...');
            const token = crypto.randomUUID();
            const newLink = await SharedLink.create({
                token,
                type: 'invoice',
                month,
                year,
                period,
                createdBy: userId,
            });
            console.log('New link created:', newLink.token);
        }

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected');
    }
}

run();

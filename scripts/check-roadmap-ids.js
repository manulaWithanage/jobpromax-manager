const mongoose = require('mongoose');
require('dotenv').config();

async function check() {
    await mongoose.connect(process.env.MONGODB_URI);
    const RoadmapPhase = mongoose.models.RoadmapPhase || mongoose.model('RoadmapPhase', new mongoose.Schema({}, { strict: false }));
    const phases = await RoadmapPhase.find({});
    console.log('Phases in DB:');
    phases.forEach(p => {
        console.log(`ID: ${p._id} | Title: ${p.title}`);
    });
    await mongoose.disconnect();
}

check();

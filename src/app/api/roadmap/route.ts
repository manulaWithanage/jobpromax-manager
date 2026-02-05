import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import RoadmapPhase from '@/models/RoadmapPhase';

export async function GET() {
    try {
        await connectDB();
        const phases = await RoadmapPhase.find({}).sort({ date: 1 });
        return NextResponse.json(phases);
    } catch (error: any) {
        console.error('[API Roadmap GET] Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        await connectDB();
        const data = await request.json();
        const phase = await RoadmapPhase.create(data);
        return NextResponse.json(phase, { status: 201 });
    } catch (error: any) {
        console.error('[API Roadmap POST] Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

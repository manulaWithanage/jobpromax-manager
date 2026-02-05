import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import FeatureStatus from '@/models/FeatureStatus';

export async function GET() {
    try {
        await connectDB();
        const features = await FeatureStatus.find({}).sort({ updatedAt: -1 });
        return NextResponse.json(features);
    } catch (error: any) {
        console.error('[API Features GET] Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        await connectDB();
        const data = await request.json();
        const feature = await FeatureStatus.create(data);
        return NextResponse.json(feature, { status: 201 });
    } catch (error: any) {
        console.error('[API Features POST] Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

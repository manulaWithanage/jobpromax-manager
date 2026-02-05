import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Task from '@/models/Task';

export async function GET() {
    try {
        await connectDB();
        const tasks = await Task.find({}).sort({ createdAt: -1 });
        return NextResponse.json(tasks);
    } catch (error: any) {
        console.error('[API Tasks GET] Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        await connectDB();
        const data = await request.json();
        const task = await Task.create(data);
        return NextResponse.json(task, { status: 201 });
    } catch (error: any) {
        console.error('[API Tasks POST] Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

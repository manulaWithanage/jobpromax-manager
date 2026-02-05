/**
 * API Route for Task [id]
 * Last Updated: 2026-01-29T23:40:00 (Enforcing 'await params' fix)
 */
import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Task from '@/models/Task';

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await connectDB();
        const { id } = await params;
        const data = await request.json();

        const task = await Task.findByIdAndUpdate(id, data, { new: true });

        if (!task) {
            return NextResponse.json({ error: 'Task not found' }, { status: 404 });
        }

        return NextResponse.json(task);
    } catch (error: any) {
        console.error('[API Task PATCH] Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await connectDB();
        const { id } = await params;

        const task = await Task.findByIdAndDelete(id);

        if (!task) {
            return NextResponse.json({ error: 'Task not found' }, { status: 404 });
        }

        return NextResponse.json({ message: 'Task deleted successfully' });
    } catch (error: any) {
        console.error('[API Task DELETE] Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

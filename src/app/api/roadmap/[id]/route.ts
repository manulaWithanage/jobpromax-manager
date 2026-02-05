/**
 * API Route for Roadmap Phase [id]
 * Last Updated: 2026-01-29T23:36:00 (Enforcing 'await params' fix)
 */
import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import RoadmapPhase from '@/models/RoadmapPhase';

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await connectDB();
        // Force await params for Next.js 15+
        const { id } = await params;
        const data = await request.json();

        console.log(`[API Roadmap PATCH] Updating phase: ${id}`);

        const phase = await RoadmapPhase.findByIdAndUpdate(id, data, { new: true });

        if (!phase) {
            return NextResponse.json({ error: 'Phase not found' }, { status: 404 });
        }

        return NextResponse.json(phase);
    } catch (error: any) {
        console.error('[API Roadmap PATCH] Error:', error);
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

        console.log(`[API Roadmap DELETE] Deleting phase: ${id}`);

        const phase = await RoadmapPhase.findByIdAndDelete(id);

        if (!phase) {
            return NextResponse.json({ error: 'Phase not found' }, { status: 404 });
        }

        return NextResponse.json({ message: 'Phase deleted successfully' });
    } catch (error: any) {
        console.error('[API Roadmap DELETE] Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

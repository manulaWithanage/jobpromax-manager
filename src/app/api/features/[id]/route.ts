import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import FeatureStatus from '@/models/FeatureStatus';

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await connectDB();
        const { id } = await params;
        const data = await request.json();

        const feature = await FeatureStatus.findByIdAndUpdate(id, data, { new: true });

        if (!feature) {
            return NextResponse.json({ error: 'Feature not found' }, { status: 404 });
        }

        return NextResponse.json(feature);
    } catch (error: any) {
        console.error('[API Feature PATCH] Error:', error);
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

        const feature = await FeatureStatus.findByIdAndDelete(id);

        if (!feature) {
            return NextResponse.json({ error: 'Feature not found' }, { status: 404 });
        }

        return NextResponse.json({ message: 'Feature deleted successfully' });
    } catch (error: any) {
        console.error('[API Feature DELETE] Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await connectDB();
        const { id } = await params;

        // Check if user is super admin - optional protection
        const user = await User.findById(id);
        if (user?.isSuperAdmin) {
            return NextResponse.json({ error: 'Cannot delete super admin' }, { status: 403 });
        }

        await User.findByIdAndDelete(id);

        return NextResponse.json({ message: 'User deleted successfully' });
    } catch (error: any) {
        console.error('[API User DELETE] Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await connectDB();
        const { id } = await params;
        const data = await request.json();

        const user = await User.findByIdAndUpdate(id, data, { new: true }).select('-passwordHash');

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        return NextResponse.json(user);
    } catch (error: any) {
        console.error('[API User PATCH] Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

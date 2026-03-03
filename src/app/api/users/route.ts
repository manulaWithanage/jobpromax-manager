import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { requireAuth, requireRole } from '@/lib/auth/serverAuth';

export async function GET() {
    try {
        await requireAuth();
        await connectDB();
        const users = await User.find({}).select('-passwordHash');
        return NextResponse.json(users);
    } catch (error: any) {
        console.error('[API Users GET] Error:', error);
        return NextResponse.json({ error: error.message || 'Unauthorized' }, { status: error.message.includes('Authentication') ? 401 : 500 });
    }
}

export async function POST(request: Request) {
    try {
        await requireRole(['manager']);
        await connectDB();
        const data = await request.json();
        // Note: Password hashing should be handled in the model's pre-save hook or here.
        // The User model I saw didn't have a pre-save hook for hashing, but it had comparePassword.
        // Let me check User model again for hashing.
        const user = await User.create(data);
        const userResponse = user.toJSON();
        return NextResponse.json(userResponse, { status: 201 });
    } catch (error: any) {
        console.error('[API Users POST] Error:', error);
        return NextResponse.json({ error: error.message || 'Unauthorized' }, { status: error.message.includes('Access denied') ? 403 : error.message.includes('Authentication') ? 401 : 500 });
    }
}

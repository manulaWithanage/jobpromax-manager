import { jwtVerify, SignJWT } from 'jose';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const secret = new TextEncoder().encode(JWT_SECRET);

export interface JWTPayload {
    userId: string;
    email: string;
    role: string;
    name: string;
}

/**
 * Create a JWT token for a user
 * @param user User data to encode in the token
 * @returns JWT token string
 */
export async function createToken(user: JWTPayload): Promise<string> {
    const token = await new SignJWT({
        userId: user.userId,
        email: user.email,
        role: user.role,
        name: user.name,
    })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('7d') // 7 days
        .sign(secret);

    return token;
}

/**
 * Verify and decode a JWT token
 * @param token JWT token string
 * @returns Decoded payload or null if invalid
 */
export async function verifyToken(token: string): Promise<JWTPayload | null> {
    try {
        if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
            console.error('CRITICAL: JWT_SECRET is not set in production! This will cause session issues after deployment.');
        }

        const { payload } = await jwtVerify(token, secret);
        return payload as unknown as JWTPayload;
    } catch (error: any) {
        if (error.code === 'ERR_JWT_EXPIRED') {
            console.log('JWT expired');
        } else {
            console.error('JWT verification failed:', error.message || error);
        }
        return null;
    }
}

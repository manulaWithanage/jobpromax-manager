"use server";

import { requireRole } from "@/lib/auth/serverAuth";
import connectDB from "@/lib/mongodb";
import SharedLink from "@/models/SharedLink";

/**
 * Create or retrieve a shared invoice link for a specific period
 */
export async function createSharedInvoiceLink(
    month: number,
    year: number,
    period: 'P1' | 'P2'
): Promise<{ success: boolean; url?: string; error?: string }> {
    try {
        console.log(`[createSharedInvoiceLink] Start. Month: ${month}, Year: ${year}, Period: ${period}`);
        const user = await requireRole(['manager', 'finance']);
        console.log(`[createSharedInvoiceLink] Authorized as ${user.email} (${user.role})`);

        await connectDB();
        console.log(`[createSharedInvoiceLink] DB Connected`);

        // Check if link already exists for this period
        let existingLink = await SharedLink.findOne({ month: Number(month), year: Number(year), period });

        if (existingLink) {
            console.log(`[createSharedInvoiceLink] Found existing link: ${existingLink.token}`);
            // Return existing link
            const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
            return {
                success: true,
                url: `${baseUrl}/p/invoice/${existingLink.token}`
            };
        }

        console.log(`[createSharedInvoiceLink] Creating new link...`);
        // Create new link
        const token = crypto.randomUUID();
        const newLink = await SharedLink.create({
            token,
            type: 'invoice',
            month: Number(month),
            year: Number(year),
            period,
            createdBy: (user as any)._id || (user as any).id,
        });

        console.log(`[createSharedInvoiceLink] Successfully created link: ${newLink.token}`);
        const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
        return {
            success: true,
            url: `${baseUrl}/p/invoice/${newLink.token}`
        };
    } catch (error: any) {
        console.error('Error creating shared link:', error);
        return { success: false, error: error.message || "Failed to create shared link" };
    }
}

/**
 * Get all shared links created by managers
 */
export async function getSharedLinks(): Promise<{
    success: boolean;
    links?: Array<{
        id: string;
        token: string;
        month: number;
        year: number;
        period: 'P1' | 'P2';
        createdAt: string;
    }>;
    error?: string;
}> {
    try {
        await requireRole(['manager', 'finance']);

        await connectDB();

        const links = await SharedLink.find()
            .sort({ createdAt: -1 })
            .lean();

        return {
            success: true,
            links: links.map(link => ({
                id: (link as any)._id.toString(),
                token: link.token,
                month: link.month,
                year: link.year,
                period: link.period,
                createdAt: (link as any).createdAt.toISOString(),
            }))
        };
    } catch (error: any) {
        console.error('Error fetching shared links:', error);
        return { success: false, error: error.message || "Failed to fetch shared links" };
    }
}

/**
 * Validate a shared link token and return metadata (PUBLIC - no auth required)
 */
export async function validateSharedLink(token: string): Promise<{
    valid: boolean;
    month?: number;
    year?: number;
    period?: 'P1' | 'P2';
    error?: string;
}> {
    try {
        await connectDB();

        const link = await SharedLink.findOne({ token }).lean();

        if (!link) {
            return { valid: false, error: "Invalid or expired link" };
        }

        // Check if link has expired (if expiresAt is set)
        if (link.expiresAt && new Date(link.expiresAt) < new Date()) {
            return { valid: false, error: "Link has expired" };
        }

        return {
            valid: true,
            month: link.month,
            year: link.year,
            period: link.period,
        };
    } catch (error: any) {
        console.error('Error validating shared link:', error);
        return { valid: false, error: "Failed to validate link" };
    }
}

/**
 * Delete a shared link
 */
export async function deleteSharedLink(token: string): Promise<{ success: boolean; error?: string }> {
    try {
        await requireRole(['manager', 'finance']);

        await connectDB();

        const result = await SharedLink.deleteOne({ token });

        if (result.deletedCount === 0) {
            return { success: false, error: "Link not found" };
        }

        return { success: true };
    } catch (error: any) {
        console.error('Error deleting shared link:', error);
        return { success: false, error: error.message || "Failed to delete shared link" };
    }
}

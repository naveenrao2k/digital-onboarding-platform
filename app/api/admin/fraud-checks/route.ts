import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAdminSession, requireAdmin } from '@/lib/admin-auth';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic'; // Ensure the route is dynamic

export async function GET(request: NextRequest) {
    try {
        // Require admin authentication
        let session;
        try {
            session = await requireAdmin();
        } catch (authError) {
            console.error('Authentication error:', authError);
            return NextResponse.json(
                { error: 'Unauthorized access' },
                { status: 401 }
            );
        }

        const admin = session.user;

        const searchParams = request.nextUrl.searchParams;
        const userId = searchParams.get('userId');
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '10');
        const skip = (page - 1) * limit;

        const where = userId ? { userId } : {};

        const [fraudDetections, total] = await Promise.all([
            prisma.fraudDetection.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
                include: {
                    user: {
                        select: {
                            id: true,
                            email: true,
                            firstName: true,
                            lastName: true
                        }
                    }
                }
            }),
            prisma.fraudDetection.count({ where })
        ]);

        return NextResponse.json({
            fraudDetections,
            pagination: {
                total,
                pages: Math.ceil(total / limit),
                page,
                limit
            }
        });
    } catch (error) {
        console.error('Admin fraud checks error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to retrieve fraud checks' },
            { status: 500 }
        );
    }
}

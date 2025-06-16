import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAdminSession } from '@/lib/admin-auth';
import bcrypt from 'bcryptjs';

// Mark this route as dynamic to allow cookies usage
export const dynamic = 'force-dynamic';

// GET handler - fetch current admin settings
export async function GET(req: NextRequest) {
    try {
        // Get current session to verify admin access
        const session = await getAdminSession();

        if (!session || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userId = session.user.id;

        // Get user data from DB
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                role: true,
            }
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        return NextResponse.json(user);

    } catch (error) {
        console.error('Error in GET /api/admin/settings:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// POST handler - update admin settings
export async function POST(req: NextRequest) {
    try {
        // Get current session to verify admin access
        const session = await getAdminSession();

        if (!session || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userId = session.user.id;
        const body = await req.json();
        const { updateType, ...data } = body;

        // Handle profile update
        if (updateType === 'profile') {
            const { firstName, lastName, email } = data;

            // Basic validation
            if (!firstName || !lastName || !email) {
                return NextResponse.json(
                    { error: 'Missing required fields' },
                    { status: 400 }
                );
            }

            // Check if email is already taken by another user
            const existingUser = await prisma.user.findFirst({
                where: {
                    email: email,
                    id: { not: userId }
                }
            });

            if (existingUser) {
                return NextResponse.json(
                    { error: 'Email is already in use' },
                    { status: 400 }
                );
            }

            // Update user profile
            const updatedUser = await prisma.user.update({
                where: { id: userId },
                data: {
                    firstName,
                    lastName,
                    email,
                },
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                    role: true,
                }
            });

            return NextResponse.json(updatedUser);
        }
        // Handle security update (password change)
        if (updateType === 'security') {
            console.log('Handling security update with data:', data);
            const { currentPassword, newPassword } = data;

            if (!currentPassword || !newPassword) {
                console.log('Missing password fields:', { currentPassword: !!currentPassword, newPassword: !!newPassword });
                return NextResponse.json(
                    { error: 'Missing required fields' },
                    { status: 400 }
                );
            }

            // Get user with password
            const user = await prisma.user.findUnique({
                where: { id: userId },
                select: {
                    id: true,
                    email: true,
                    password: true
                }
            });

            console.log('Found user:', { id: user?.id, hasPassword: !!user?.password });

            if (!user?.password) {
                return NextResponse.json(
                    { error: 'User not found or no password set' },
                    { status: 404 }
                );
            }
            // Verify current password
            // For now, using direct comparison as per the current auth system
            // TODO: Update this to use proper password hashing in production
            console.log('Verifying password for user:', user.email);
            const isPasswordValid = user.password === currentPassword;
            console.log('Password validation result:', isPasswordValid);

            if (!isPasswordValid) {
                return NextResponse.json(
                    { error: 'Current password is incorrect' },
                    { status: 400 }
                );
            }
            // Update password
            // TODO: Update this to use proper password hashing in production
            try {
                await prisma.user.update({
                    where: { id: userId },
                    data: {
                        password: newPassword,
                    }
                });

                // Return user data without sensitive information
                const updatedUser = await prisma.user.findUnique({
                    where: { id: userId },
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        role: true,
                    }
                });

                return NextResponse.json(updatedUser);
            } catch (error) {
                console.error('Password update error:', error);
                return NextResponse.json(
                    { error: 'Failed to update password' },
                    { status: 500 }
                );
            }
        }

        return NextResponse.json(
            { error: 'Invalid update type' },
            { status: 400 }
        );

    } catch (error) {
        console.error('Error in POST /api/admin/settings:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

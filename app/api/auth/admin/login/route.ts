// app/api/auth/admin/login/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';

// Mark this route as dynamic to handle cookies usage
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return new NextResponse(
        JSON.stringify({ error: 'Email and password are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Find user with admin role
    const user = await prisma.user.findFirst({
      where: {
        email: email,
        role: { in: ['ADMIN', 'SUPER_ADMIN'] }
      }
    });

    if (!user) {
      return new NextResponse(
        JSON.stringify({ error: 'Invalid credentials' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // In a real application, you would verify the password hash here
    // For demo purposes, we're using a simple check
    // WARNING: This is not secure for production!
    if (!user.password || user.password !== password) {
      return new NextResponse(
        JSON.stringify({ error: 'Invalid credentials' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }    // Set session cookie
    const sessionData = {
      userId: user.id,
      role: user.role,
      isAdmin: true
    };

    cookies().set({
      name: 'session',
      value: JSON.stringify(sessionData),
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      // Expire in 24 hours
      maxAge: 60 * 60 * 24
    });
      name: 'session',
      value: JSON.stringify(sessionData),
      httpOnly: true,
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 1 week
    });

    // Log admin login
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'ADMIN_LOGIN',
        details: JSON.stringify({
          timestamp: new Date().toISOString()
        })
      }
    });

    return NextResponse.json({
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role
    });

  } catch (error: any) {
    console.error('ADMIN_LOGIN_ERROR:', error);
    
    return new NextResponse(
      JSON.stringify({
        error: error.message || 'An error occurred during login',
      }),
      { status: 500 }
    );
  }
}
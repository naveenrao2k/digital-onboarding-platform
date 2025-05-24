// app/api/auth/signin/route.ts
import { NextResponse } from 'next/server';
import { SignInData, signIn } from '@/lib/auth-service';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    // Validate required fields
    if (!email || !password) {
      return new NextResponse(
        JSON.stringify({
          error: 'Missing required fields',
        }),
        { status: 400 }
      );
    }

    const signInData: SignInData = {
      email,
      password,
    };

    const user = await signIn(signInData);
    
    // Set a session cookie
    cookies().set({
      name: 'session',
      value: JSON.stringify({ userId: user.id, email: user.email }),
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: '/',
    });

    return NextResponse.json(user);
  } catch (error: any) {
    console.error('SIGNIN_ERROR', error);
    
    return new NextResponse(
      JSON.stringify({
        error: error.message || 'Invalid credentials',
      }),
      { status: 401 }
    );
  }
}

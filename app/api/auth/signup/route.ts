// app/api/auth/signup/route.ts
import { NextResponse } from 'next/server';
import { SignUpData, signUp } from '@/lib/auth-service';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, firstName, lastName, phone, accountType } = body;

    // Validate required fields
    if (!email || !password || !firstName || !lastName || !accountType) {
      return new NextResponse(
        JSON.stringify({
          error: 'Missing required fields',
        }),
        { status: 400 }
      );
    }

    const userData: SignUpData = {
      email,
      password,
      firstName,
      lastName,
      phone: phone || undefined,
      accountType,
    };

    const user = await signUp(userData);

    return NextResponse.json(user);
  } catch (error: any) {
    console.error('SIGNUP_ERROR', error);
    
    return new NextResponse(
      JSON.stringify({
        error: error.message || 'An error occurred during sign up',
      }),
      { status: 500 }
    );
  }
}

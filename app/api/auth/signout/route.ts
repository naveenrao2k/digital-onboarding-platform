// app/api/auth/signout/route.ts
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// Mark this route as dynamic to handle cookies usage
export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    // Clear the session cookie
    cookies().delete('session');

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('SIGNOUT_ERROR', error);
    
    return new NextResponse(
      JSON.stringify({
        error: error.message || 'An error occurred during sign out',
      }),
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { CibilScoringEngine } from '@/lib/cibil-scoring-engine';

// Helper function to get current user ID from session cookie
function getCurrentUserId(): string | null {
  const cookieStore = cookies();
  const sessionCookie = cookieStore.get('session');
  
  if (!sessionCookie?.value) {
    return null;
  }

  try {
    // Parse the session cookie to extract user ID
    const sessionData = JSON.parse(decodeURIComponent(sessionCookie.value));
    return sessionData.userId || null;
  } catch (error) {
    console.error('Error parsing session cookie:', error);
    return null;
  }
}

// GET - Fetch existing CIBIL score data
export async function GET() {
  try {
    const userId = getCurrentUserId();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get existing CIBIL score from database
    const existingScore = await prisma.creditScore.findUnique({
      where: { userId },
      include: {
        scoreHistory: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    });

    if (!existingScore) {
      return NextResponse.json({ 
        success: false, 
        message: 'No credit score data found' 
      });
    }

    // Get credit factors for this user
    const creditFactors = await prisma.creditFactor.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });

    // Convert credit factors to the expected format
    const factors = {
      paymentHistory: { score: 0 },
      creditUtilization: { score: 0 },
      creditHistoryLength: { score: 0 },
      creditMix: { score: 0 },
      newCredit: { score: 0 }
    };

    // Map the credit factors to the expected structure
    creditFactors.forEach(factor => {
      if (factor.factorType === 'paymentHistory') {
        factors.paymentHistory.score = factor.factorValue;
      } else if (factor.factorType === 'creditUtilization') {
        factors.creditUtilization.score = factor.factorValue;
      } else if (factor.factorType === 'creditHistoryLength') {
        factors.creditHistoryLength.score = factor.factorValue;
      } else if (factor.factorType === 'creditMix') {
        factors.creditMix.score = factor.factorValue;
      } else if (factor.factorType === 'newCredit') {
        factors.newCredit.score = factor.factorValue;
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        score: existingScore.currentScore,
        accountType: existingScore.accountType,
        lastUpdated: existingScore.lastUpdated,
        scoreChange: existingScore.scoreChange,
        factors: factors
      }
    });
  } catch (error) {
    console.error('Error fetching CIBIL score:', error);
    return NextResponse.json(
      { error: 'Failed to fetch credit score' },
      { status: 500 }
    );
  }
}

// POST - Calculate and save new CIBIL score
export async function POST(request: NextRequest) {
  try {
    const userId = getCurrentUserId();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { bvn, accountType = 'INDIVIDUAL' } = body;

    if (!bvn) {
      return NextResponse.json(
        { error: 'BVN is required' },
        { status: 400 }
      );
    }

    // Calculate CIBIL score using the new BVN method
    const result = await CibilScoringEngine.calculateCibilScoreFromBvn(userId, bvn, accountType);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to calculate CIBIL score' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        score: result.data!.score,
        accountType: accountType,
        bvn: bvn,
        lastUpdated: result.data!.lastUpdated,
        factors: result.data!.factors
      }
    });
  } catch (error) {
    console.error('Error calculating CIBIL score:', error);
    return NextResponse.json(
      { error: 'Failed to calculate credit score' },
      { status: 500 }
    );
  }
} 
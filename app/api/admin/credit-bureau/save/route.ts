import { NextRequest, NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/admin-auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    // Verify admin permissions
    const adminSession = await getAdminSession();
    const adminUser = adminSession?.user;

    if (!adminUser || (adminUser.role !== 'ADMIN' && adminUser.role !== 'SUPER_ADMIN')) {
      return new NextResponse(JSON.stringify({ error: 'Unauthorized: Admin access required' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Parse request body
    const body = await req.json();
    const { bvn, name, riskScore, isFraudSuspected, responseData } = body;

    if (!bvn || !riskScore) {
      return new NextResponse(JSON.stringify({ error: 'BVN and risk score are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Find if any user has this BVN in the system
    // Just get the first user for demo purposes
    let userId = null;
    const user = await prisma.user.findFirst();

    if (user) {
      userId = user.id;
    }    // Generate fraud detection reasons based on risk score components
    const fraudReasons = [];

    try {
      const { score: creditScore } = responseData.entity;

      // Check for specific fraud indicators and add reasons
      if (creditScore.totalNoOfActiveLoans?.[0]?.value > 5) {
        fraudReasons.push("Multiple active loans (high risk)");
      }

      if (creditScore.totalNoOfDelinquentFacilities?.[0]?.value > 0) {
        fraudReasons.push("Has delinquent facilities");
      }

      if (creditScore.totalNoOfOverdueAccounts?.[0]?.value > 0) {
        fraudReasons.push("Has overdue accounts");
      }

      const creditEnquiries = creditScore.creditEnquiriesSummary?.[0]?.value?.Last3MonthCount || "0";
      if (parseInt(creditEnquiries) > 5) {
        fraudReasons.push("Multiple recent credit enquiries");
      }
      // Check loan performance - if any non-performing
      let nonPerformingCount = 0;
      creditScore.loanPerformance?.forEach((item: any) => {
        item.value.forEach((loan: any) => {
          if (loan.noOfNonPerforming > 0) {
            nonPerformingCount += loan.noOfNonPerforming;
          }
        });
      });

      if (nonPerformingCount > 0) {
        fraudReasons.push(`${nonPerformingCount} non-performing loans detected`);
      }
    } catch (error) {
      console.error('Error generating fraud reasons:', error);
    }

    // Save the fraud detection record
    const fraudDetection = await prisma.fraudDetection.create({
      data: {
        userId: userId || adminUser.id, // If no user found, link to admin who performed the check
        verificationType: 'CREDIT_CHECK',
        riskScore: riskScore,
        isFraudSuspected: isFraudSuspected,
        requestData: { bvn },
        responseData: responseData,
        detectionDetails: {
          checkType: 'Credit Bureau Check',
          checkDate: new Date().toISOString(),
          fraudReasons: fraudReasons,
          name: name,
          checkPerformedBy: adminUser.email
        },
      },
    });

    // Log the action
    await prisma.auditLog.create({
      data: {
        userId: adminUser.id,
        action: 'SAVE_CREDIT_CHECK',
        details: JSON.stringify({
          fraudDetectionId: fraudDetection.id,
          bvn: bvn,
          riskScore: riskScore,
          isFraudSuspected: isFraudSuspected
        })
      }
    });

    return new NextResponse(JSON.stringify({
      success: true,
      message: 'Credit check saved successfully',
      fraudDetectionId: fraudDetection.id
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Save credit check error:', error);

    return new NextResponse(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

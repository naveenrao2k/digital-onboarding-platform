import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import dojahService from '@/lib/dojah-service';
import { prisma } from '@/lib/prisma';
import { FraudCheckType } from '@/app/generated/prisma';

export async function POST(request: NextRequest) {
    try {
        // Get user ID from cookies
        const sessionCookie = cookies().get('session')?.value;
        if (!sessionCookie) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        let userId;
        try {
            const session = JSON.parse(sessionCookie);
            userId = session.userId;
        } catch {
            return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
        }

        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const user = { id: userId };

        const body = await request.json();
        const { ipAddress, emailAddress, phoneNumber, bvn, checkType } = body;

        let result;

        switch (checkType) {
            case 'IP_CHECK':
                if (!ipAddress) {
                    return NextResponse.json({ error: 'IP address is required' }, { status: 400 });
                }
                result = await dojahService.checkIpAddress(ipAddress);

                // Save the result
                await prisma.fraudDetection.create({
                    data: {
                        userId: user.id,
                        verificationType: FraudCheckType.IP_CHECK,
                        ipAddress,
                        requestData: { ipAddress },
                        responseData: result,
                        riskScore: result?.entity?.report?.risk_score?.result || 0,
                        isFraudSuspected: (result?.entity?.report?.risk_score?.result || 0) > 70,
                        detectionDetails: result
                    }
                });
                break;

            case 'EMAIL_CHECK':
                if (!emailAddress) {
                    return NextResponse.json({ error: 'Email address is required' }, { status: 400 });
                }
                result = await dojahService.checkEmail(emailAddress);

                // Save the result
                await prisma.fraudDetection.create({
                    data: {
                        userId: user.id,
                        verificationType: FraudCheckType.EMAIL_CHECK,
                        emailAddress,
                        requestData: { emailAddress },
                        responseData: result,
                        riskScore: result?.entity?.suspicious ? 80 : 0,
                        isFraudSuspected: result?.entity?.suspicious,
                        detectionDetails: result
                    }
                });
                break;

            case 'PHONE_CHECK':
                if (!phoneNumber) {
                    return NextResponse.json({ error: 'Phone number is required' }, { status: 400 });
                }
                result = await dojahService.checkPhone(phoneNumber);

                // Save the result
                await prisma.fraudDetection.create({
                    data: {
                        userId: user.id,
                        verificationType: FraudCheckType.PHONE_CHECK,
                        phoneNumber,
                        requestData: { phoneNumber },
                        responseData: result,
                        riskScore: result?.entity?.score || 0,
                        isFraudSuspected: result?.entity?.disposable || false,
                        detectionDetails: result
                    }
                });
                break;

            case 'CREDIT_CHECK':
                if (!bvn) {
                    return NextResponse.json({ error: 'BVN is required' }, { status: 400 });
                }
                result = await dojahService.checkCreditBureau(bvn);

                // Credit risk calculation logic
                let creditRiskScore = 0;
                let isFraudSuspected = false;

                // Example logic - analyze unpaid loans or credit issues
                if (result?.entity?.score) {
                    const totalLoans = result.entity.score.totalNoOfLoans?.[0]?.value || 0;
                    const overdueLoans = result.entity.score.totalNoOfOverdueAccounts?.[0]?.value || 0;

                    if (overdueLoans > 0) {
                        creditRiskScore = (overdueLoans / totalLoans) * 100;
                        isFraudSuspected = creditRiskScore > 40;
                    }
                }

                // Save the result
                await prisma.fraudDetection.create({
                    data: {
                        userId: user.id,
                        verificationType: FraudCheckType.CREDIT_CHECK,
                        bvn,
                        requestData: { bvn },
                        responseData: result,
                        riskScore: creditRiskScore,
                        isFraudSuspected,
                        detectionDetails: result
                    }
                });
                break;

            case 'COMBINED_CHECK':
                result = await dojahService.performComprehensiveCheck({
                    userId: user.id,
                    ipAddress,
                    emailAddress,
                    phoneNumber,
                    bvn
                });
                break;

            default:
                return NextResponse.json({ error: 'Invalid check type' }, { status: 400 });
        }

        return NextResponse.json(result);
    } catch (error) {
        console.error('Fraud detection error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Fraud detection failed' },
            { status: 500 }
        );
    }
}

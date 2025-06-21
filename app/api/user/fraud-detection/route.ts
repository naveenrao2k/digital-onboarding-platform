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

        const user = { id: userId }; const body = await request.json();
        const { ipAddress, phoneNumber, checkType } = body;

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
                        detectionDetails: {
                            ...result,
                            summary: {
                                ipCheck: 'COMPLETED'
                            }
                        }
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
                        detectionDetails: {
                            ...result,
                            summary: {
                                phoneCheck: 'COMPLETED'
                            }
                        }
                    }
                });
                break; case 'COMBINED_CHECK':
                result = await dojahService.performComprehensiveCheck({
                    userId: user.id,
                    ipAddress,
                    phoneNumber
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

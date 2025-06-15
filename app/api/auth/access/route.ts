// app/api/auth/access/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import dojahService from '@/lib/dojah-service';

// Use types from our local schema
type UserRole = 'USER' | 'ADMIN' | 'SUPER_ADMIN';
type AccountType = 'INDIVIDUAL' | 'PARTNERSHIP' | 'ENTERPRISE' | 'LLC';

// Mark this route as dynamic to handle cookies usage
export const dynamic = 'force-dynamic';

// Define types for external portal data
interface ExternalPortalData {
  id: string;
  name?: string;
  phone_number?: string;
}

export async function GET(req: NextRequest) {
  try {
    // Extract data from URL query parameters - only supporting id, name, and phone_number fields
    const searchParams = req.nextUrl.searchParams;
    const id = searchParams.get('id');
    const name = searchParams.get('name') || undefined;
    const phone_number = searchParams.get('phone_number') || undefined;

    if (!id) {
      return new NextResponse(
        JSON.stringify({ error: 'ID is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Log incoming external portal request
    console.log(`Incoming access request`, { id });

    // Check if user exists
    let user = await prisma.user.findUnique({
      where: { id },
      include: {
        kycDocuments: true,
        verificationStatus: true,
        account: true
      }
    });

    let isNewUser = false;
    let hasSubmittedKyc = false;
    let portalData = {};

    // If user doesn't exist, create a profile with all available data
    if (!user) {
      isNewUser = true;

      // Generate a unique placeholder email using the ID
      const placeholderEmail = `user_${id}@placeholder.com`;

      // Create user with basic information
      user = await prisma.user.create({
        data: {
          id,
          firstName: name ? name.split(' ')[0] : '',
          lastName: name ? name.split(' ').slice(1).join(' ') : '',
          phone: phone_number || '',
          email: placeholderEmail, // Use placeholder email that's unique based on the ID
          role: 'USER' as UserRole,
          accountType: 'INDIVIDUAL' as AccountType,
          accountStatus: 'PENDING',
        },
        include: {
          kycDocuments: true,
          verificationStatus: true,
          account: true
        }
      });

      // Create verification status
      await prisma.verificationStatus.create({
        data: {
          userId: user.id,
          kycStatus: 'PENDING',
          selfieStatus: 'PENDING',
          overallStatus: 'PENDING',
          progress: 0,
        }
      });

      // Refresh user to get the related data
      user = await prisma.user.findUnique({
        where: { id: user.id },
        include: {
          kycDocuments: true,
          verificationStatus: true,
          account: true
        }
      });
      // Save audit log for user creation
      if (user) {
        await prisma.auditLog.create({
          data: {
            userId: user.id,
            action: 'USER_CREATED',
            details: JSON.stringify({
              timestamp: new Date().toISOString()
            })
          }
        });        // Run automated fraud check for new user
        try {
          console.log('Running automated fraud detection for new user');

          // Get IP address from request
          const ipAddress = req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
            req.headers.get('x-real-ip') ||
            '127.0.0.1';

          let fraudCheckResult;
          try {
            // Run combined fraud check
            fraudCheckResult = await dojahService.performComprehensiveCheck({
              userId: user.id,
              ipAddress: ipAddress,
              emailAddress: user.email,
              phoneNumber: user.phone || undefined,
            });
          } catch (apiError) {
            console.error('Dojah API error:', apiError);
            // Create a fallback/mock result when the API fails
            fraudCheckResult = {
              overallRisk: 30, // Default medium-low risk
              ipCheck: { status: 'FALLBACK', details: 'API unavailable' },
              emailCheck: { status: 'FALLBACK', details: 'API unavailable' },
              phoneCheck: { status: 'FALLBACK', details: 'API unavailable' },
              fallback: true
            };

            // Save fallback fraud detection record
            await prisma.fraudDetection.create({
              data: {
                userId: user.id,
                verificationType: 'COMBINED_CHECK',
                ipAddress: ipAddress,
                emailAddress: user.email,
                phoneNumber: user.phone || undefined,
                requestData: {
                  userId: user.id,
                  ipAddress: ipAddress,
                  emailAddress: user.email,
                  phoneNumber: user.phone || undefined
                },
                responseData: { error: 'API unavailable', fallback: true },
                riskScore: 30, // Default medium-low risk
                isFraudSuspected: false,
                detectionDetails: { status: 'FALLBACK', details: 'Dojah API unavailable, using fallback risk assessment' }
              }
            });
          }

          console.log('Fraud detection completed:',
            {
              userId: user.id,
              riskScore: fraudCheckResult.overallRisk,
              isFraudSuspected: fraudCheckResult.overallRisk > 70
            }
          );

          // Log the fraud check in audit logs
          await prisma.auditLog.create({
            data: {
              userId: user.id,
              action: 'FRAUD_CHECK_COMPLETED',
              details: JSON.stringify({
                timestamp: new Date().toISOString(), riskScore: fraudCheckResult.overallRisk,
                isFraudSuspected: fraudCheckResult.overallRisk > 70,
                isFallback: 'fallback' in fraudCheckResult
              })
            }
          });
        } catch (error) {
          console.error('Error in fraud detection flow:', error);
        }
      }
    } else {
      // Check if user has submitted KYC documents
      hasSubmittedKyc = user.kycDocuments.length > 0;

      // Update user with any new phone information if it's empty
      if (!user.phone && phone_number) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { phone: phone_number },
          include: {
            kycDocuments: true,
            verificationStatus: true,
            account: true
          }
        });
      }
      // Log portal access
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: 'PORTAL_ACCESS',
          details: JSON.stringify({
            timestamp: new Date().toISOString()
          })
        }
      });

      // Check if it's been at least 7 days since the last fraud check for this user
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

      const lastFraudCheck = await prisma.fraudDetection.findFirst({
        where: {
          userId: user.id,
          createdAt: {
            gte: oneWeekAgo
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });      // If no recent fraud check, run one
      if (!lastFraudCheck) {
        try {
          console.log('Running periodic fraud detection check for returning user');

          // Get IP address from request
          const ipAddress = req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
            req.headers.get('x-real-ip') ||
            '127.0.0.1';

          let fraudCheckResult;
          try {
            // Run IP fraud check for returning users (lighter check)
            fraudCheckResult = await dojahService.checkIpAddress(ipAddress);
          } catch (apiError) {
            console.error('Dojah API error for IP check:', apiError);

            // Create a fallback result for IP check
            fraudCheckResult = {
              entity: {
                report: {
                  ip: ipAddress,
                  risk_score: { result: 25 }
                },
                status: 'FALLBACK'
              },
              fallback: true
            };
          }

          // Save IP check to database
          await prisma.fraudDetection.create({
            data: {
              userId: user.id,
              verificationType: 'IP_CHECK',
              ipAddress: ipAddress,
              requestData: { ipAddress },
              responseData: fraudCheckResult,
              riskScore: fraudCheckResult.entity?.report?.risk_score?.result || 25,
              isFraudSuspected: (fraudCheckResult.entity?.report?.risk_score?.result || 25) > 70,
              detectionDetails: 'fallback' in fraudCheckResult
                ? { status: 'FALLBACK', details: 'Dojah API unavailable, using fallback risk assessment' }
                : fraudCheckResult
            }
          });

          console.log('IP fraud check completed for returning user:',
            {
              userId: user.id,
              riskScore: fraudCheckResult.entity?.report?.risk_score?.result || 25,
              isFallback: 'fallback' in fraudCheckResult
            }
          );
        } catch (error) {
          console.error('Error in fraud detection flow for returning user:', error);
        }
      }
    }

    // Check if user is still null after all operations
    if (!user) {
      throw new Error('Failed to create or retrieve user');
    }

    // Set session cookie
    const sessionData = {
      userId: user.id,
      role: user.role
    };

    cookies().set({
      name: 'session',
      value: JSON.stringify(sessionData),
      httpOnly: true,
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 1 week
    });

    // Determine the redirect URL based on user status
    const redirectUrl = isNewUser ? '/user/upload-kyc-documents' : '/user/dashboard';

    // Always set autoRedirect to true to enforce redirect behavior
    const autoRedirect = true;

    if (autoRedirect) {
      // Send a redirect response with the user data
      const response = NextResponse.redirect(new URL(redirectUrl, req.nextUrl.origin));

      // Add the user data as a header (encoded)
      const userData = {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        email: user.email,
        role: user.role,
        accountType: user.accountType,
        isNewUser,
        hasSubmittedKyc,
      };

      response.headers.set('X-User-Data', Buffer.from(JSON.stringify(userData)).toString('base64'));
      return response;
    }

    // Otherwise, return JSON response as before
    return NextResponse.json({
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      email: user.email,
      role: user.role,
      accountType: user.accountType,
      isNewUser,
      hasSubmittedKyc,
      redirectUrl
    });

  } catch (error: any) {
    console.error('ERROR_USER_ACCESS:', error);
    return new NextResponse(
      JSON.stringify({ error: error.message || 'Error accessing system' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

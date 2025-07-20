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
      });      // Refresh user to get the related data (only include essential fields for response)
      user = await prisma.user.findUnique({
        where: { id: user.id },
        include: {
          kycDocuments: true,
          verificationStatus: true,
          account: true
        }
      });

      // If user exists, schedule background tasks without blocking the response
      if (user) {
        // Get IP address from request for future fraud check
        const ipAddress = req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
          req.headers.get('x-real-ip') ||
          '127.0.0.1';

        // IMPORTANT: Use setTimeout to completely detach these operations from the request
        // This ensures they'll run after the response has been sent
        setTimeout(() => {
          // 1. Create audit log for user creation
          prisma.auditLog.create({
            data: {
              userId: user!.id, // Non-null assertion as we check above
              action: 'USER_CREATED',
              details: JSON.stringify({
                timestamp: new Date().toISOString()
              })
            }
          }).catch(err => console.error('Error creating audit log:', err));

          // 2. Schedule fraud check as a completely separate process
          setTimeout(async () => {
            try {
              console.log('Running background fraud detection for new user:', user!.id);

              // First, create an initial pending fraud check record
              await prisma.fraudDetection.create({
                data: {
                  userId: user!.id,
                  verificationType: 'COMBINED_CHECK',
                  ipAddress: ipAddress,
                  emailAddress: user!.email,
                  phoneNumber: user!.phone || undefined,
                  requestData: {
                    userId: user!.id,
                    ipAddress: ipAddress,
                    emailAddress: user!.email,
                    phoneNumber: user!.phone || undefined
                  },
                  responseData: { status: 'PENDING', message: 'Fraud check initiated' },
                  riskScore: 50, // Default medium risk until check completes
                  isFraudSuspected: false,
                  detectionDetails: { status: 'PENDING', details: 'Fraud check in progress' }
                }
              });              // Set a timeout for the API call to prevent hanging
              const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error('Fraud check API timeout')), 15000); // Increased timeout
              });
              // Define the type for fraudCheckResult to fix TypeScript errors
              type FraudCheckResult = {
                overallRisk: number;
                ipCheck?: any;
                phoneCheck?: any;
                phoneStatus?: string;
                fallback?: boolean;
              };

              let fraudCheckResult: FraudCheckResult;
              try {
                // Race the API call against the timeout
                const result = await Promise.race([
                  dojahService.performComprehensiveCheck({
                    userId: user!.id,
                    ipAddress: ipAddress,
                    phoneNumber: user!.phone || undefined,
                  }),
                  timeoutPromise
                ]) as FraudCheckResult;

                fraudCheckResult = result;
                console.log('Fraud detection (IP and Phone) completed for user:', user!.id);
              } catch (apiError) {
                console.error('Dojah API error or timeout:', apiError);

                // Use fallback result
                fraudCheckResult = {
                  overallRisk: 30, // Default medium-low risk
                  ipCheck: { status: 'FALLBACK', details: 'API unavailable or timed out' },
                  phoneCheck: { status: 'FALLBACK', details: 'API unavailable or timed out' },
                  phoneStatus: user!.phone ? 'ERROR' : 'NOT_PROVIDED',
                  fallback: true
                };
              }

              // Update the fraud detection record with results instead of creating a new one
              await prisma.fraudDetection.updateMany({
                where: {
                  userId: user!.id,
                  verificationType: 'COMBINED_CHECK',
                  responseData: { path: ['status'], equals: 'PENDING' }
                },
                data: {
                  responseData: fraudCheckResult as any,
                  riskScore: fraudCheckResult.overallRisk,
                  isFraudSuspected: fraudCheckResult.overallRisk > 70,
                  detectionDetails: ('fallback' in fraudCheckResult)
                    ? { status: 'FALLBACK', details: 'Using fallback assessment due to API timeout or error' }
                    : fraudCheckResult as any
                }
              });

              // Log the check completion in audit logs
              await prisma.auditLog.create({
                data: {
                  userId: user!.id,
                  action: 'FRAUD_CHECK_COMPLETED',
                  details: JSON.stringify({
                    timestamp: new Date().toISOString(),
                    riskScore: fraudCheckResult.overallRisk,
                    isFraudSuspected: fraudCheckResult.overallRisk > 70,
                    isFallback: 'fallback' in fraudCheckResult
                  })
                }
              });

            } catch (error) {
              console.error('Error in background fraud detection process:', error);
            }
          }, 100); // Slight delay to ensure primary response is sent first
        }, 100); // Slight delay to ensure primary response is sent first
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
      });      // If no recent fraud check, schedule one (but don't block the response)
      if (!lastFraudCheck && user) { // Add user null check
        // Capture user ID to ensure it's available in the closure
        const userId = user.id;

        // Get IP address from request
        const ipAddress = req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
          req.headers.get('x-real-ip') ||
          '127.0.0.1';

        // Schedule the check to run after the response is sent
        setTimeout(() => {
          (async () => {
            try {
              console.log('Running periodic fraud detection check for returning user');

              // Create an initial pending fraud detection record
              await prisma.fraudDetection.create({
                data: {
                  userId: userId,
                  verificationType: 'IP_CHECK',
                  ipAddress: ipAddress,
                  requestData: { ipAddress },
                  responseData: { status: 'PENDING', message: 'IP check initiated' },
                  riskScore: 50, // Default medium risk until check completes
                  isFraudSuspected: false,
                  detectionDetails: { status: 'PENDING', details: 'IP check in progress' }
                }
              });

              // Set a timeout for the API call
              const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error('IP check API timeout')), 15000);
              });

              // Define type for IP check result
              type IpCheckResult = {
                entity?: {
                  report?: {
                    ip?: string;
                    risk_score?: {
                      result?: number
                    }
                  };
                  status?: string;
                };
                fallback?: boolean;
              };

              let fraudCheckResult: IpCheckResult;
              try {
                // Run IP fraud check for returning users (lighter check)
                const result = await Promise.race([
                  dojahService.checkIpAddress(ipAddress),
                  timeoutPromise
                ]) as IpCheckResult;

                fraudCheckResult = result;
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

              // Update the existing fraud detection record
              await prisma.fraudDetection.updateMany({
                where: {
                  userId: userId,
                  verificationType: 'IP_CHECK',
                  responseData: { path: ['status'], equals: 'PENDING' }
                },
                data: {
                  responseData: fraudCheckResult as any,
                  riskScore: fraudCheckResult.entity?.report?.risk_score?.result || 25,
                  isFraudSuspected: (fraudCheckResult.entity?.report?.risk_score?.result || 25) > 70,
                  detectionDetails: 'fallback' in fraudCheckResult
                    ? { status: 'FALLBACK', details: 'Dojah API unavailable, using fallback risk assessment' }
                    : fraudCheckResult as any
                }
              });

              // Log the check completion without blocking
              await prisma.auditLog.create({
                data: {
                  userId: userId,
                  action: 'PERIODIC_FRAUD_CHECK_COMPLETED',
                  details: JSON.stringify({
                    timestamp: new Date().toISOString(),
                    riskScore: fraudCheckResult.entity?.report?.risk_score?.result || 25,
                    isFallback: 'fallback' in fraudCheckResult
                  })
                }
              });

              console.log('IP fraud check completed for returning user:',
                {
                  userId: userId,
                  riskScore: fraudCheckResult.entity?.report?.risk_score?.result || 25,
                  isFallback: 'fallback' in fraudCheckResult
                }
              );
            } catch (error) {
              console.error('Error in fraud detection flow for returning user:', error);
            }
          })().catch(err => console.error('Background periodic fraud check failed:', err));
        }, 100); // Slight delay to ensure primary response is sent first
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

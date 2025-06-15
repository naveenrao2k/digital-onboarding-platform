// scripts/seed-fraud-data.js
const path = require('path');
console.log('Working directory:', process.cwd());

// Use the same prisma instance as the app
const { PrismaClient } = require('../app/generated/prisma');
console.log('PrismaClient imported successfully');

const prisma = new PrismaClient({
    log: ['info', 'warn', 'error']
});
console.log('PrismaClient instance created');

async function seedFraudData() {
    console.log('Seeding fraud detection test data...');

    // First, get or create a test user
    let user;
    try {
        user = await prisma.user.findFirst({
            where: { email: 'testuser@example.com' }
        });

        if (!user) {
            console.log('Creating test user...');
            user = await prisma.user.create({
                data: {
                    email: 'testuser@example.com',
                    firstName: 'Test',
                    lastName: 'User',
                    password: '$2a$10$5eJ5DYpa/xIzrTqCjj7Y.e.1QNui.itcUXNkwUQmKtlTNX.vEgwEy', // password: test123
                    role: 'USER',
                    verificationStatus: {
                        create: {
                            kycStatus: 'PENDING',
                            selfieStatus: 'PENDING',
                            overallStatus: 'PENDING',
                            progress: 0
                        }
                    }
                }
            });
            console.log(`Created test user with ID: ${user.id}`);
        } else {
            console.log(`Using existing test user with ID: ${user.id}`);
        }

        // Create some test fraud detection entries
        const fraudData = [
            {
                userId: user.id,
                verificationType: 'IP_CHECK',
                ipAddress: '92.168.1.1',
                requestData: { ipAddress: '92.168.1.1' },
                responseData: {
                    entity: {
                        report: {
                            ip: '92.168.1.1',
                            blacklists: {
                                detections: 2,
                                engines_count: 85,
                                detection_rate: '2%',
                                scantime: '0.92'
                            },
                            risk_score: { result: 20 }
                        },
                        success: true
                    }
                },
                riskScore: 20,
                isFraudSuspected: false,
                detectionDetails: { status: 'CLEAN', details: 'Low risk IP address' }
            },
            {
                userId: user.id,
                verificationType: 'EMAIL_CHECK',
                emailAddress: 'suspicious@example.com',
                requestData: { emailAddress: 'suspicious@example.com' },
                responseData: {
                    entity: {
                        email: 'suspicious@example.com',
                        reputation: 'low',
                        suspicious: true,
                        references: 5,
                        details: {
                            blacklisted: true,
                            malicious_activity: true,
                            credentials_leaked: true
                        }
                    }
                },
                riskScore: 85,
                isFraudSuspected: true,
                detectionDetails: { status: 'SUSPICIOUS', details: 'Email associated with malicious activity' }
            },
            {
                userId: user.id,
                verificationType: 'COMBINED_CHECK',
                ipAddress: '92.168.1.1',
                emailAddress: 'test@example.com',
                phoneNumber: '+2348068810228',
                requestData: {
                    ipAddress: '92.168.1.1',
                    emailAddress: 'test@example.com',
                    phoneNumber: '+2348068810228'
                },
                responseData: {
                    overallRisk: 15,
                    ipCheck: { entity: { report: { risk_score: { result: 10 } } } },
                    emailCheck: { entity: { suspicious: false } },
                    phoneCheck: { entity: { valid: true, disposable: false } }
                },
                riskScore: 15,
                isFraudSuspected: false,
                detectionDetails: { status: 'HIGH_RISK', details: 'Combined checks show low risk' }
            }
        ];

        // Create the test data
        for (const data of fraudData) {
            // Check if record already exists
            const existing = await prisma.fraudDetection.findFirst({
                where: {
                    userId: data.userId,
                    verificationType: data.verificationType,
                    ...(data.ipAddress && { ipAddress: data.ipAddress }),
                    ...(data.emailAddress && { emailAddress: data.emailAddress })
                }
            });

            if (!existing) {
                await prisma.fraudDetection.create({ data });
                console.log(`Created ${data.verificationType} fraud detection record`);
            } else {
                console.log(`Skipped existing ${data.verificationType} fraud detection record`);
            }
        }

        console.log('Fraud detection test data seeded successfully!');

    } catch (error) {
        console.error('Error seeding fraud detection data:', error);
    } finally {
        await prisma.$disconnect();
    }
}

seedFraudData()
    .then(() => console.log('Done!'))
    .catch(e => console.error(e));

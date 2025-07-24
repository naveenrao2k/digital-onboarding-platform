import { PrismaClient } from '../app/generated/prisma';
import { UserRole, AccountStatus, AccountType } from '../app/generated/prisma';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('🌱 Starting admin seeder...');

    // Admin account to create
    const adminData = {
      email: 'ayush@admin.com',
      password: '1234',
      firstName: 'Ayush',
      lastName: 'Admin',
      role: UserRole.SUPER_ADMIN,
      phone: '+2348000000001',
    };

    // Check if admin already exists
    const existingAdmin = await prisma.user.findUnique({
      where: { email: adminData.email },
    });

    if (existingAdmin) {
      console.log(`⚠️  Admin ${adminData.email} already exists, skipping...`);
      return;
    }

    // Hash password
    const hashedPassword = await hash(adminData.password, 10);

    // Create admin user
    const admin = await prisma.user.create({
      data: {
        email: adminData.email,
        password: hashedPassword,
        firstName: adminData.firstName,
        lastName: adminData.lastName,
        phone: adminData.phone,
        role: adminData.role,
        accountType: AccountType.INDIVIDUAL,
        accountStatus: AccountStatus.ACTIVE,
        account: {
          create: {
            occupation: 'Platform Administrator',
            sourceOfIncome: 'Employment',
          },
        },
        verificationStatus: {
          create: {
            kycStatus: 'APPROVED',
            selfieStatus: 'APPROVED',
            overallStatus: 'APPROVED',
            progress: 100,
          },
        },
      },
      include: {
        account: true,
        verificationStatus: true,
      },
    });

    console.log(`✅ Created ${adminData.role} admin: ${admin.email}`);
    console.log(`   - Name: ${admin.firstName} ${admin.lastName}`);
    console.log(`   - Role: ${admin.role}`);
    console.log(`   - Status: ${admin.accountStatus}`);
    console.log();
    console.log('🎉 Admin seeder completed successfully!');
    console.log();
    console.log('📋 Admin Login Credentials:');
    console.log('==========================');
    console.log(`Email: ${adminData.email}`);
    console.log(`Password: ${adminData.password}`);

  } catch (error) {
    console.error('❌ Error running admin seeder:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

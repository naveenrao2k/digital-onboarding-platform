// scripts/create-admin.js
// Use the generated Prisma client with the correct path
const { PrismaClient } = require('../app/generated/prisma');
const prisma = new PrismaClient();

async function createAdminUser() {
    try {
        console.log('Creating admin user...');

        // Check if the admin already exists
        const existingAdmin = await prisma.user.findUnique({
            where: { email: 'admin@example.com' }
        });

        if (existingAdmin) {
            console.log('Admin user already exists, updating role to ADMIN');
            await prisma.user.update({
                where: { email: 'admin@example.com' },
                data: { role: 'ADMIN' }
            });
        } else {
            // Create new admin user
            const newAdmin = await prisma.user.create({
                data: {
                    email: 'admin@example.com',
                    firstName: 'Admin',
                    lastName: 'User',
                    password: 'admin123', // In a real app, this would be hashed
                    role: 'ADMIN',
                }
            });

            console.log(`Created admin user with ID: ${newAdmin.id}`);
        }

        console.log('Admin credentials:');
        console.log('Email: admin@example.com');
        console.log('Password: admin123');

    } catch (error) {
        console.error('Error creating admin user:', error);
    } finally {
        await prisma.$disconnect();
    }
}

createAdminUser()
    .then(() => console.log('Done!'))
    .catch(error => console.error(error));

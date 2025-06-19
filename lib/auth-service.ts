// lib/auth-service.ts
import { prisma } from './prisma';
import { compare, hash } from 'bcryptjs';

export type SignUpData = {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  accountType: 'INDIVIDUAL' | 'PARTNERSHIP' | 'ENTERPRISE' | 'LLC';
};

export type SignInData = {
  email: string;
  password: string;
};

export const signUp = async (data: SignUpData) => {
  try {
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new Error('Email already in use');
    }

    const hashedPassword = await hash(data.password, 10);

    const user = await prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        accountType: data.accountType,
        account: {
          create: {},
        },
        verificationStatus: {
          create: {
            kycStatus: 'PENDING',
            selfieStatus: 'PENDING',
            overallStatus: 'PENDING',
            progress: 0,
          },
        },
      },
    });

    // Don't return the password
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  } catch (error) {
    throw error;
  }
};

export const signIn = async (data: SignInData) => {
  try {
    const user = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!user || !user.password) {
      throw new Error('Invalid credentials');
    }

    const isPasswordValid = await compare(data.password, user.password);
    
    if (!isPasswordValid) {
      throw new Error('Invalid credentials');
    }

    // Don't return the password
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  } catch (error) {
    throw error;
  }
};

export const getUserProfile = async (userId: string) => {
  try {
    if (!userId) {
      throw new Error('User ID is required');
    }
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        account: true,
        verificationStatus: true,
        kycDocuments: {
          orderBy: { uploadedAt: 'desc' }
        },
        references: true
      }
    });

    if (!user) {
      throw new Error(`User not found with ID: ${userId}`);
    }

    // Format the response to include only necessary data
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      address: user.address,
      dateOfBirth: user.dateOfBirth,
      accountType: user.accountType,
      accountStatus: user.accountStatus,
      account: user.account ? {
        businessName: user.account.businessName,
        businessType: user.account.businessType,
        businessAddress: user.account.businessAddress,
        taxNumber: user.account.taxNumber,
        scumlNumber: user.account.scumlNumber,
        occupation: user.account.occupation,
        sourceOfIncome: user.account.sourceOfIncome
      } : null,
      verificationStatus: user.verificationStatus,
      documents: user.kycDocuments.map(doc => ({
        id: doc.id,
        type: doc.type,
        fileName: doc.fileName,
        uploadedAt: doc.uploadedAt,
        status: doc.status,
        verified: doc.verified
      })),
      references: user.references
    };
  } catch (error) {
    console.error(`Error fetching user profile for ID ${userId}:`, error);
    throw error;
  }
};

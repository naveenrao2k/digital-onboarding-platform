// lib/auth-service.ts
import { prisma } from './prisma';
import { compare, hash } from 'bcrypt';

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
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        account: true,
        verificationStatus: true,
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Don't return the password
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  } catch (error) {
    throw error;
  }
};

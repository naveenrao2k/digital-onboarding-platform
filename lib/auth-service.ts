// lib/auth-service.ts
import { prisma, withRetry, checkDatabaseConnection } from './prisma';
import { compare, hash } from 'bcryptjs';
import { 
  handlePrismaError, 
  DatabaseError, 
  ValidationError, 
  AuthenticationError,
  ServiceUnavailableError,
  validateRequired,
  validateEmail,
  databaseCircuitBreaker
} from './error-handler';

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
    // Validate required fields
    validateRequired(data.email, 'email');
    validateRequired(data.password, 'password');
    validateRequired(data.firstName, 'firstName');
    validateRequired(data.lastName, 'lastName');
    validateRequired(data.accountType, 'accountType');
    
    // Validate email format
    validateEmail(data.email);
    
    // Validate password strength
    if (data.password.length < 8) {
      throw new ValidationError('Password must be at least 8 characters long');
    }
    
    // Check database connection
    if (!(await checkDatabaseConnection())) {
      throw new ServiceUnavailableError('Database is currently unavailable. Please try again later.');
    }
    
    return await databaseCircuitBreaker.call(async () => {
      return await withRetry(async () => {
        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
          where: { email: data.email.toLowerCase() },
        });

        if (existingUser) {
          throw new ValidationError('Email already in use');
        }

        const hashedPassword = await hash(data.password, 12); // Increased salt rounds for better security

        const user = await prisma.user.create({
          data: {
            email: data.email.toLowerCase(),
            password: hashedPassword,
            firstName: data.firstName.trim(),
            lastName: data.lastName.trim(),
            phone: data.phone?.trim(),
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
        
        // Log successful registration
        console.log('USER_REGISTRATION_SUCCESS', {
          userId: user.id,
          email: data.email,
          accountType: data.accountType,
          timestamp: new Date().toISOString()
        });
        
        return userWithoutPassword;
      });
    });
  } catch (error: any) {
    // Enhanced error logging
    console.error('USER_REGISTRATION_ERROR', {
      email: data.email,
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    
    if (error instanceof ValidationError || 
        error instanceof DatabaseError || 
        error instanceof ServiceUnavailableError) {
      throw error;
    }
    
    if (error.code?.startsWith('P')) {
      throw handlePrismaError(error);
    }
    
    throw new DatabaseError(
      error.message || 'User registration failed',
      'USER_REGISTRATION_ERROR'
    );
  }
};

export const signIn = async (data: SignInData) => {
  try {
    // Validate required fields
    validateRequired(data.email, 'email');
    validateRequired(data.password, 'password');
    
    // Validate email format
    validateEmail(data.email);
    
    // Check database connection
    if (!(await checkDatabaseConnection())) {
      throw new ServiceUnavailableError('Database is currently unavailable. Please try again later.');
    }
    
    return await databaseCircuitBreaker.call(async () => {
      return await withRetry(async () => {
        const user = await prisma.user.findUnique({
          where: { email: data.email.toLowerCase() },
        });

        if (!user || !user.password) {
          throw new AuthenticationError('Invalid credentials');
        }

        const isPasswordValid = await compare(data.password, user.password);
        
        if (!isPasswordValid) {
          throw new AuthenticationError('Invalid credentials');
        }

        // Don't return the password
        const { password: _, ...userWithoutPassword } = user;
        
        // Log successful login
        console.log('USER_LOGIN_SUCCESS', {
          userId: user.id,
          email: data.email,
          timestamp: new Date().toISOString()
        });
        
        return userWithoutPassword;
      });
    });
  } catch (error: any) {
    // Enhanced error logging (don't log passwords)
    console.error('USER_LOGIN_ERROR', {
      email: data.email,
      error: error.message,
      timestamp: new Date().toISOString()
    });
    
    if (error instanceof ValidationError || 
        error instanceof AuthenticationError || 
        error instanceof DatabaseError || 
        error instanceof ServiceUnavailableError) {
      throw error;
    }
    
    if (error.code?.startsWith('P')) {
      throw handlePrismaError(error);
    }
    
    throw new DatabaseError(
      'Authentication failed',
      'USER_LOGIN_ERROR'
    );
  }
};

export const getUserProfile = async (userId: string) => {
  try {
    validateRequired(userId, 'userId');
    
    // Check database connection
    if (!(await checkDatabaseConnection())) {
      throw new ServiceUnavailableError('Database is currently unavailable. Please try again later.');
    }
    
    return await databaseCircuitBreaker.call(async () => {
      return await withRetry(async () => {
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
          throw new DatabaseError(`User not found with ID: ${userId}`, 'USER_NOT_FOUND', 404);
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
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
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
      });
    });
  } catch (error: any) {
    console.error('GET_USER_PROFILE_ERROR', {
      userId,
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    
    if (error instanceof ValidationError || 
        error instanceof DatabaseError || 
        error instanceof ServiceUnavailableError) {
      throw error;
    }
    
    if (error.code?.startsWith('P')) {
      throw handlePrismaError(error);
    }
    
    throw new DatabaseError(
      error.message || 'Failed to fetch user profile',
      'GET_USER_PROFILE_ERROR'
    );
  }
};

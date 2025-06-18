// lib/prisma.ts
import { PrismaClient } from '../app/generated/prisma';

// PrismaClient is attached to the `global` object in development to prevent
// exhausting your database connection limit.
// Learn more: https://pris.ly/d/help/next-js-best-practices

const globalForPrisma = global as unknown as {
  prisma: PrismaClient | undefined;
};

// Enhanced Prisma client with better error handling and logging
const createPrismaClient = () => {
  return new PrismaClient({
    log: [
      { emit: 'event', level: 'query' },
      { emit: 'event', level: 'error' },
      { emit: 'event', level: 'info' },
      { emit: 'event', level: 'warn' },
    ],
    errorFormat: 'pretty',
  });
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
  
  // Add event listeners for better debugging in development
  prisma.$on('error', (e) => {
    console.error('Prisma Error:', e);
  });
  
  prisma.$on('warn', (e) => {
    console.warn('Prisma Warning:', e);
  });
  
  if (process.env.DEBUG_QUERIES === 'true') {
    prisma.$on('query', (e) => {
      console.log('Query:', e.query);
      console.log('Duration:', e.duration + 'ms');
    });
  }
}

// Database connection health check function
export const checkDatabaseConnection = async (): Promise<boolean> => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    console.error('Database connection check failed:', error);
    return false;
  }
};

// Database retry wrapper with exponential backoff
export const withRetry = async <T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> => {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error: any) {
      lastError = error;
      
      // Don't retry for certain types of errors
      if (
        error.code === 'P2002' || // Unique constraint violation
        error.code === 'P2025' || // Record not found  
        error.code === 'P2003' || // Foreign key constraint failed
        error.message?.includes('Unauthorized') ||
        error.message?.includes('Invalid') ||
        error.message?.includes('Missing required')
      ) {
        throw error;
      }
      
      if (attempt === maxRetries) {
        console.error(`Operation failed after ${maxRetries} attempts:`, error);
        break;
      }
      
      const delay = baseDelay * Math.pow(2, attempt - 1);
      console.warn(`Database operation failed (attempt ${attempt}/${maxRetries}), retrying in ${delay}ms:`, error.message);
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
};

export default prisma;

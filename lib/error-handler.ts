// lib/error-handler.ts
import { NextResponse } from 'next/server';
import { Prisma } from '../app/generated/prisma';

export interface ApiError {
  message: string;
  code?: string;
  status: number;
  details?: any;
  timestamp: string;
  traceId?: string;
}

export class DatabaseError extends Error {
  public readonly code: string;
  public readonly status: number;
  public readonly details?: any;

  constructor(message: string, code: string = 'DATABASE_ERROR', status: number = 500, details?: any) {
    super(message);
    this.name = 'DatabaseError';
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

export class ValidationError extends Error {
  public readonly code: string;
  public readonly status: number;
  public readonly field?: string;

  constructor(message: string, field?: string) {
    super(message);
    this.name = 'ValidationError';
    this.code = 'VALIDATION_ERROR';
    this.status = 400;
    this.field = field;
  }
}

export class AuthenticationError extends Error {
  public readonly code: string;
  public readonly status: number;

  constructor(message: string = 'Authentication required') {
    super(message);
    this.name = 'AuthenticationError';
    this.code = 'AUTHENTICATION_ERROR';
    this.status = 401;
  }
}

export class AuthorizationError extends Error {
  public readonly code: string;
  public readonly status: number;

  constructor(message: string = 'Insufficient permissions') {
    super(message);
    this.name = 'AuthorizationError';
    this.code = 'AUTHORIZATION_ERROR';
    this.status = 403;
  }
}

export class ServiceUnavailableError extends Error {
  public readonly code: string;
  public readonly status: number;
  public readonly retryAfter?: number;

  constructor(message: string = 'Service temporarily unavailable', retryAfter?: number) {
    super(message);
    this.name = 'ServiceUnavailableError';
    this.code = 'SERVICE_UNAVAILABLE';
    this.status = 503;
    this.retryAfter = retryAfter;
  }
}

// Generate unique trace ID for error tracking
const generateTraceId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// Map Prisma errors to user-friendly messages
export const handlePrismaError = (error: any): DatabaseError => {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P2002':
        return new DatabaseError(
          'A record with this information already exists',
          'DUPLICATE_RECORD',
          409,
          { fields: error.meta?.target }
        );
      case 'P2025':
        return new DatabaseError(
          'The requested record was not found',
          'RECORD_NOT_FOUND',
          404
        );
      case 'P2003':
        return new DatabaseError(
          'Invalid reference to related data',
          'FOREIGN_KEY_CONSTRAINT',
          400,
          { field: error.meta?.field_name }
        );
      case 'P2014':
        return new DatabaseError(
          'Invalid data provided for the request',
          'INVALID_RELATION',
          400
        );
      case 'P2023':
        return new DatabaseError(
          'Inconsistent column data provided',
          'INCONSISTENT_DATA',
          400
        );
      default:
        console.error('Unhandled Prisma error:', error);
        return new DatabaseError(
          'Database operation failed',
          'DATABASE_ERROR',
          500,
          { prismaCode: error.code }
        );
    }
  }

  if (error instanceof Prisma.PrismaClientUnknownRequestError) {
    console.error('Prisma unknown error:', error);
    return new DatabaseError(
      'An unexpected database error occurred',
      'DATABASE_UNKNOWN_ERROR',
      500
    );
  }

  if (error instanceof Prisma.PrismaClientRustPanicError) {
    console.error('Prisma panic error:', error);
    return new DatabaseError(
      'Database service is temporarily unavailable',
      'DATABASE_PANIC',
      503
    );
  }

  if (error instanceof Prisma.PrismaClientInitializationError) {
    console.error('Prisma initialization error:', error);
    return new DatabaseError(
      'Database connection could not be established',
      'DATABASE_CONNECTION_ERROR',
      503
    );
  }

  if (error instanceof Prisma.PrismaClientValidationError) {
    console.error('Prisma validation error:', error);
    return new DatabaseError(
      'Invalid data provided for database operation',
      'DATABASE_VALIDATION_ERROR',
      400
    );
  }

  // Handle connection errors
  if (error.message?.includes('Connection') || error.code === 'ECONNREFUSED') {
    return new DatabaseError(
      'Database connection failed. Please try again later.',
      'DATABASE_CONNECTION_ERROR',
      503
    );
  }

  // Default case
  return new DatabaseError(
    error.message || 'An unexpected database error occurred',
    'DATABASE_ERROR',
    500
  );
};

// Main error handler function
export const handleApiError = (error: any): NextResponse => {
  const traceId = generateTraceId();
  let apiError: ApiError;

  // Handle custom errors
  if (error instanceof DatabaseError || 
      error instanceof ValidationError || 
      error instanceof AuthenticationError || 
      error instanceof AuthorizationError ||
      error instanceof ServiceUnavailableError) {
    apiError = {
      message: error.message,
      code: error.code,
      status: error.status,
      timestamp: new Date().toISOString(),
      traceId,
      ...(error instanceof DatabaseError && error.details && { details: error.details }),
      ...(error instanceof ValidationError && error.field && { field: error.field }),
      ...(error instanceof ServiceUnavailableError && error.retryAfter && { retryAfter: error.retryAfter })
    };
  }
  // Handle Prisma errors
  else if (error instanceof Prisma.PrismaClientKnownRequestError ||
           error instanceof Prisma.PrismaClientUnknownRequestError ||
           error instanceof Prisma.PrismaClientRustPanicError ||
           error instanceof Prisma.PrismaClientInitializationError ||
           error instanceof Prisma.PrismaClientValidationError) {
    const dbError = handlePrismaError(error);
    apiError = {
      message: dbError.message,
      code: dbError.code,
      status: dbError.status,
      details: dbError.details,
      timestamp: new Date().toISOString(),
      traceId
    };
  }
  // Handle generic errors
  else {
    console.error('Unhandled error:', error);
    apiError = {
      message: process.env.NODE_ENV === 'production' 
        ? 'An unexpected error occurred' 
        : error.message || 'Unknown error',
      code: 'INTERNAL_SERVER_ERROR',
      status: 500,
      timestamp: new Date().toISOString(),
      traceId
    };
  }

  // Log the error with trace ID for debugging
  console.error(`[${traceId}] API Error:`, {
    message: apiError.message,
    code: apiError.code,
    status: apiError.status,
    stack: error.stack,
    ...(apiError.details && { details: apiError.details })
  });

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    'X-Trace-ID': traceId
  };

  // Add retry-after header for service unavailable errors
  if (error instanceof ServiceUnavailableError && error.retryAfter) {
    headers['Retry-After'] = error.retryAfter.toString();
  }

  return new NextResponse(
    JSON.stringify(apiError),
    { 
      status: apiError.status,
      headers
    }
  );
};

// Validation helper functions
export const validateRequired = (value: any, fieldName: string): void => {
  if (value === null || value === undefined || value === '') {
    throw new ValidationError(`${fieldName} is required`, fieldName);
  }
};

export const validateEmail = (email: string): void => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new ValidationError('Invalid email format', 'email');
  }
};

export const validateFileSize = (file: File, maxSizeInMB: number = 10): void => {
  const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
  if (file.size > maxSizeInBytes) {
    throw new ValidationError(`File size must be less than ${maxSizeInMB}MB`, 'file');
  }
};

export const validateFileType = (file: File, allowedTypes: string[]): void => {
  if (!allowedTypes.includes(file.type)) {
    throw new ValidationError(
      `Invalid file type. Allowed types: ${allowedTypes.join(', ')}`,
      'file'
    );
  }
};

// Circuit breaker pattern for external services
class CircuitBreaker {
  private failureCount = 0;
  private lastFailureTime = 0;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';

  constructor(
    private failureThreshold: number = 5,
    private recoveryTimeout: number = 60000 // 1 minute
  ) {}

  async call<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime > this.recoveryTimeout) {
        this.state = 'HALF_OPEN';
      } else {
        throw new ServiceUnavailableError(
          'Service is currently unavailable due to previous failures',
          Math.ceil((this.recoveryTimeout - (Date.now() - this.lastFailureTime)) / 1000)
        );
      }
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    this.failureCount = 0;
    this.state = 'CLOSED';
  }

  private onFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    
    if (this.failureCount >= this.failureThreshold) {
      this.state = 'OPEN';
    }
  }

  getState(): string {
    return this.state;
  }
}

export const databaseCircuitBreaker = new CircuitBreaker(5, 60000);
export const externalServiceCircuitBreaker = new CircuitBreaker(3, 30000);

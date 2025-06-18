// app/api/health/route.ts
import { NextResponse } from 'next/server';
import { checkDatabaseConnection } from '@/lib/prisma';
import { healthCheck } from '@/lib/kyc-service';
import { databaseCircuitBreaker, externalServiceCircuitBreaker } from '@/lib/error-handler';

export const dynamic = 'force-dynamic';

export async function GET() {
  const startTime = Date.now();
  
  try {
    // Check database connection
    const databaseHealth = await checkDatabaseConnection();
    
    // Check KYC service health
    const kycServiceHealth = await healthCheck();
    
    // Check circuit breaker states
    const dbCircuitState = databaseCircuitBreaker.getState();
    const externalCircuitState = externalServiceCircuitBreaker.getState();
    
    const responseTime = Date.now() - startTime;
    
    const healthStatus = {
      status: databaseHealth ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      responseTime: `${responseTime}ms`,
      services: {
        database: {
          status: databaseHealth ? 'healthy' : 'unhealthy',
          circuitBreaker: dbCircuitState
        },
        kycService: kycServiceHealth,
        externalServices: {
          circuitBreaker: externalCircuitState
        }
      },
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '1.0.0'
    };
    
    // Return 503 if any critical service is down
    const statusCode = databaseHealth ? 200 : 503;
    
    return NextResponse.json(healthStatus, { status: statusCode });
    
  } catch (error: any) {
    const responseTime = Date.now() - startTime;
    
    console.error('HEALTH_CHECK_ERROR', {
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      responseTime: `${responseTime}ms`,
      error: error.message || 'Health check failed',
      services: {
        database: { status: 'unknown' },
        kycService: { status: 'unknown' },
        externalServices: { status: 'unknown' }
      }
    }, { status: 500 });
  }
}

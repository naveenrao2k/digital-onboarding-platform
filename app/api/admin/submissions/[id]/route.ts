import import { Prisma } from '@prisma/client';

type JsonValue = Prisma.JsonValue;
type JsonObject = { [Key: string]: JsonValue };
type JsonArray = JsonValue[];extRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { User, KYCDocument, DocumentAnalysis, DojahVerification, SelfieVerification, VerificationStatusEnum, UserRole } from '@/app/generated/prisma';

export const dynamic = 'force-dynamic';

type JsonValue = string | number | boolean | null | JsonObject | JsonArray;
interface JsonObject { [Key: string]: JsonValue }
interface JsonArray extends Array<JsonValue> {}

type DojahStatus = 'PENDING' | 'IN_PROGRESS' | 'SUCCESS' | 'FAILED' | 'INCOMPLETE_DATA' | 'RETRY_REQUIRED';

interface ValidationResult {
  isValid: boolean;
  confidence: number;
  details: JsonObject;
  timestamp: string;
}

interface VerificationStep {
  name: string;
  status: DojahStatus;
  completedAt?: string;
  confidence?: number | null;
  duration?: number;
  validationResults?: ValidationResult[];
  details?: {
    isReadable?: boolean;
    qualityScore?: number;
    documentType?: string;
    extractedFields?: number;
    fieldsExtracted?: number;
    fileName?: string;
    fileSize?: number;
    mimeType?: string;
    extractedDataSummary?: JsonObject;
    isMatch?: boolean;
    verificationTypes?: string[];
    verifications?: Array<{
      type: string;
      status: DojahStatus;
      isMatch: boolean;
      confidence: number | null;
      matchDetails?: {
        fieldsMatched: number;
        matchSummary: JsonObject;
      };
    }>;
    livenessScore?: number;
    facialMatchScore?: number;
    qualityMetrics?: {
      brightness: number;
      contrast: number;
      sharpness: number;
      resolution: number;
    };
  };
  errors?: Array<{
    code: string;
    message: string;
    field?: string;
  }>;
  matchResult?: JsonObject;
}

interface DojahGovernmentVerification {
  id: string;
  type: string;
  status: DojahStatus;
  isMatch: boolean;
  confidence: number | null;
  governmentData: JsonObject;
  matchDetails?: {
    fieldsMatched: string[];
    fieldsNotMatched: string[];
    confidenceByField: Record<string, number>;
  };
  createdAt: Date;
  validationErrors?: Array<{
    field: string;
    error: string;
  }>;
}

interface DocumentVerificationMetrics {
  totalChecks: number;
  passedChecks: number;
  failedChecks: number;
  overallConfidence: number;
  qualityScore: number;
  processingTime: number;
}

interface DojahVerificationResponse {
  id: string;
  status: string;
  confidence: number | null;
  matchResult: JsonValue;
  extractedData: JsonValue;
  governmentData: JsonValue;
  errorMessage: string | null;
  createdAt: string;
  steps: VerificationStep[];
  metrics?: DocumentVerificationMetrics;
  adminReviews?: Array<{
    id: string;
    status: string;
    notes?: string;
    reviewer: {
      name: string;
    };
    createdAt: string;
  }>;
}

interface DocumentAnalysisResult {
  extractedText: string | null;
  extractedData: any;
  documentType: string | null;
  confidence: number | null;
  isReadable: boolean;
  qualityScore: number | null;
  createdAt: string;
}

interface DocumentSubmission {
  id: string;
  type: string;
  fileName: string;
  url: string;
  status: string;
  documentAnalysis?: DocumentAnalysisResult;
  dojahVerification?: DojahVerificationResponse;
}

interface SubmissionResponse {
  id: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
  submittedAt: string;
  status: string;
  documents: DocumentSubmission[];
  governmentVerifications: Array<{
    type: string;
    status: string;
    isMatch: boolean;
    confidence: number | null;
    governmentData: any;
    createdAt: string;
    documentId: string;
    documentType: string;
  }>;
  selfieVerification: {
    id: string;
    status: string;
    capturedAt: string;
    dojahVerification?: {
      status: string;
      confidence: number | null;
      matchResult: any;
      errorMessage: string | null;
    };
  } | null;
  notes: string;
}

type UserWithIncludes = User & {
  kycDocuments: (KYCDocument & {
    documentAnalysis: DocumentAnalysis | null;
    dojahVerification: (DojahVerification & {
      governmentVerification: any[];
    }) | null;
  })[];
  selfieVerification: (SelfieVerification & {
    dojahVerification: DojahVerification | null;
  }) | null;
};

function formatUserData(user: UserWithIncludes): SubmissionResponse {
  return {
    id: user.id,
    user: {
      id: user.id,
      name: `${user.firstName} ${user.lastName}`,
      email: user.email,
    },
    submittedAt: user.createdAt.toISOString(),
    status: user.kycDocuments.length > 0 ? user.kycDocuments[0].status : VerificationStatusEnum.PENDING,
    documents: user.kycDocuments.map(doc => ({
      id: doc.id,
      type: doc.type,
      fileName: doc.fileName,
      url: `/api/admin/submissions/${doc.id}/download`,
      status: doc.status,
      documentAnalysis: doc.documentAnalysis ? {
        extractedText: doc.documentAnalysis.extractedText,
        extractedData: doc.documentAnalysis.extractedData,
        documentType: doc.documentAnalysis.documentType,
        confidence: doc.documentAnalysis.confidence,
        isReadable: doc.documentAnalysis.isReadable,
        qualityScore: doc.documentAnalysis.qualityScore,
        createdAt: doc.documentAnalysis.createdAt.toISOString()
      } : undefined,
      dojahVerification: doc.dojahVerification ? {
        id: doc.dojahVerification.id,
        status: doc.dojahVerification.status,
        confidence: doc.dojahVerification.confidence,
        matchResult: doc.dojahVerification.matchResult,
        extractedData: doc.dojahVerification.extractedData,
        governmentData: doc.dojahVerification.governmentData,
        errorMessage: doc.dojahVerification.errorMessage,
        createdAt: doc.dojahVerification.createdAt.toISOString(),
        steps: [
          {
            name: "Document Upload",
            status: "SUCCESS",
            completedAt: doc.uploadedAt.toISOString(),
            details: {
              fileName: doc.fileName,
              fileSize: doc.fileSize,
              mimeType: doc.mimeType
            }
          },
          {
            name: "Document Analysis",
            status: doc.documentAnalysis?.isReadable ? "SUCCESS" : doc.documentAnalysis ? "FAILED" : "PENDING",
            completedAt: doc.documentAnalysis?.createdAt?.toISOString(),
            confidence: doc.documentAnalysis?.confidence,
            details: doc.documentAnalysis ? {
              isReadable: doc.documentAnalysis.isReadable,
              qualityScore: doc.documentAnalysis.qualityScore,
              documentType: doc.documentAnalysis.documentType,
              extractedFields: Object.keys(doc.documentAnalysis.extractedData || {}).length
            } : undefined
          },
          {
            name: "Data Extraction",
            status: doc.documentAnalysis?.extractedData ? "SUCCESS" : doc.documentAnalysis ? "FAILED" : "PENDING",
            completedAt: doc.documentAnalysis?.createdAt?.toISOString(),
            confidence: doc.documentAnalysis?.confidence,
            details: doc.documentAnalysis?.extractedData ? {
              fieldsExtracted: Object.keys(doc.documentAnalysis.extractedData).length,
              documentType: doc.documentAnalysis.documentType,
              extractedDataSummary: doc.documentAnalysis.extractedData
            } : undefined
          },
          {
            name: "Government Verification",
            status: doc.dojahVerification ? doc.dojahVerification.status : "PENDING",
            completedAt: doc.dojahVerification?.updatedAt?.toISOString(),
            confidence: doc.dojahVerification?.confidence,
            matchResult: doc.dojahVerification?.matchResult,
            details: doc.dojahVerification?.governmentVerification ? {
              isMatch: doc.dojahVerification.governmentVerification.some(gv => gv.isMatch),
              verificationTypes: doc.dojahVerification.governmentVerification.map(gv => gv.type),
              verifications: doc.dojahVerification.governmentVerification.map(gv => ({
                type: gv.type,
                status: gv.status,
                isMatch: gv.isMatch,
                confidence: gv.confidence,
                matchDetails: gv.governmentData ? {
                  fieldsMatched: Object.keys(gv.governmentData).length,
                  matchSummary: gv.governmentData
                } : undefined
              }))
            } : undefined
          }
        ]
      } : undefined
    }),
    governmentVerifications: user.kycDocuments.flatMap(doc =>
      doc.dojahVerification?.governmentVerification?.map(gv => ({
        type: gv.type,
        status: gv.status,
        isMatch: gv.isMatch,
        confidence: gv.confidence,
        governmentData: gv.governmentData,
        createdAt: gv.createdAt.toISOString(),
        documentId: doc.id,
        documentType: doc.type
      })) || []
    ),
    selfieVerification: user.selfieVerification ? {
      id: user.selfieVerification.id,
      status: user.selfieVerification.status,
      capturedAt: user.selfieVerification.capturedAt.toISOString(),
      dojahVerification: user.selfieVerification.dojahVerification ? {
        status: user.selfieVerification.dojahVerification.status,
        confidence: user.selfieVerification.dojahVerification.confidence,
        matchResult: user.selfieVerification.dojahVerification.matchResult,
        errorMessage: user.selfieVerification.dojahVerification.errorMessage,
      } : undefined
    } : null,
    notes: user.kycDocuments[0]?.notes || '',
  };
}

const getCurrentUserId = (): string | null => {
  const sessionCookie = cookies().get('session')?.value;
  if (!sessionCookie) return null;
  
  try {
    const session = JSON.parse(sessionCookie);
    return session.userId || null;
  } catch {
    return null;
  }
};

type UserWithIncludes = User & {
  kycDocuments: (KYCDocument & {
    documentAnalysis: DocumentAnalysis | null;
    dojahVerification: (DojahVerification & {
      governmentVerification: any[];
    }) | null;
  })[];
  selfieVerification: (SelfieVerification & {
    dojahVerification: DojahVerification | null;
  }) | null;
};

interface VerificationStep {
  name: string;
  status: 'SUCCESS' | 'FAILED' | 'PENDING' | 'IN_PROGRESS';
  completedAt?: string;
  confidence?: number | null;
  details?: Record<string, any>;
  matchResult?: Record<string, any>;
}

function formatVerificationSteps(doc: KYCDocument & {
  documentAnalysis: DocumentAnalysis | null;
  dojahVerification: (DojahVerification & {
    governmentVerification: any[];
  }) | null;
}): VerificationStep[] {
  return [
    {
      name: "Document Upload",
      status: "SUCCESS",
      completedAt: doc.uploadedAt.toISOString(),
      details: {
        fileName: doc.fileName,
        fileSize: doc.fileSize,
        mimeType: doc.mimeType
      }
    },
    {
      name: "Document Analysis",
      status: doc.documentAnalysis?.isReadable ? "SUCCESS" : doc.documentAnalysis ? "FAILED" : "PENDING",
      completedAt: doc.documentAnalysis?.createdAt?.toISOString(),
      confidence: doc.documentAnalysis?.confidence,
      details: doc.documentAnalysis ? {
        isReadable: doc.documentAnalysis.isReadable,
        qualityScore: doc.documentAnalysis.qualityScore,
        documentType: doc.documentAnalysis.documentType,
        extractedFields: Object.keys(doc.documentAnalysis.extractedData || {}).length
      } : undefined
    },
    {
      name: "Data Extraction",
      status: doc.documentAnalysis?.extractedData ? "SUCCESS" : doc.documentAnalysis ? "FAILED" : "PENDING",
      completedAt: doc.documentAnalysis?.createdAt?.toISOString(),
      confidence: doc.documentAnalysis?.confidence,
      details: doc.documentAnalysis?.extractedData ? {
        fieldsExtracted: Object.keys(doc.documentAnalysis.extractedData).length,
        documentType: doc.documentAnalysis.documentType,
        extractedDataSummary: doc.documentAnalysis.extractedData
      } : undefined
    },
    {
      name: "Government Verification",
      status: doc.dojahVerification ? doc.dojahVerification.status : "PENDING",
      completedAt: doc.dojahVerification?.updatedAt?.toISOString(),
      confidence: doc.dojahVerification?.confidence,
      matchResult: doc.dojahVerification?.matchResult,
      details: doc.dojahVerification?.governmentVerification ? {
        isMatch: doc.dojahVerification.governmentVerification.some(gv => gv.isMatch),
        verificationTypes: doc.dojahVerification.governmentVerification.map(gv => gv.type),
        verifications: doc.dojahVerification.governmentVerification.map(gv => ({
          type: gv.type,
          status: gv.status,
          isMatch: gv.isMatch,
          confidence: gv.confidence,
          matchDetails: gv.governmentData ? {
            fieldsMatched: Object.keys(gv.governmentData).length,
            matchSummary: gv.governmentData
          } : undefined
        }))
      } : undefined
    }
  ];
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = getCurrentUserId();
    
    if (!userId) {
      return new NextResponse(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401 }
      );
    }

    // Check if user is admin
    const adminUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!adminUser || !['ADMIN', 'SUPER_ADMIN'].includes(adminUser.role)) {
      return new NextResponse(
        JSON.stringify({ error: 'Unauthorized - Admin access required' }),
        { status: 401 }
      );
    }    type UserWithVerifications = {
      id: string;
      email: string;
      firstName: string;
      lastName: string;
      createdAt: Date;
      kycDocuments: Array<{
        id: string;
        type: string;
        fileName: string;
        status: string;
        uploadedAt: Date;
        notes: string | null;
        documentAnalysis?: {
          id: string;
          extractedText: string | null;
          extractedData: any;
          documentType: string | null;
          confidence: number | null;
          isReadable: boolean;
          qualityScore: number | null;
          createdAt: Date;
        };
        dojahVerification?: {
          id: string;
          status: string;
          confidence: number | null;
          matchResult: any;
          extractedData: any;
          governmentData: any;
          errorMessage: string | null;
          createdAt: Date;
          updatedAt: Date;
          governmentVerification: Array<{
            type: string;
            status: string;
            isMatch: boolean;
            confidence: number | null;
            governmentData: any;
            createdAt: Date;
          }>;
        };
      }>;
      selfieVerification?: {
        id: string;
        status: string;
        capturedAt: Date;
        dojahVerification?: {
          status: string;
          confidence: number | null;
          matchResult: any;
          errorMessage: string | null;
        };
      };
    };

    // Get submission details from user and their documents
    const user = await prisma.user.findUnique({
      where: { id: params.id },
      include: {
        kycDocuments: {
          include: {
            documentAnalysis: true,
            dojahVerification: {
              include: {
                governmentVerification: true
              }
            }
          }
        },
        selfieVerification: {
          include: {
            dojahVerification: true
          }
        }
      }
    });

    if (!user) {
      return new NextResponse(
        JSON.stringify({ error: 'User not found' }),
        { status: 404 }
      );
    }

    // Format response    const submission = {
      id: user.id,
      user: {
        id: user.id,
        name: `${user.firstName} ${user.lastName}`,
        email: user.email,
      },
      submittedAt: user.createdAt.toISOString(),
      status: user.kycDocuments.length > 0 ? user.kycDocuments[0].status : VerificationStatusEnum.PENDING,
      documents: user.kycDocuments.map(doc => ({
        id: doc.id,
        type: doc.type,
        fileName: doc.fileName,
        url: `/api/admin/submissions/${doc.id}/download`,
        status: doc.status,
        documentAnalysis: doc.documentAnalysis ? {
          extractedText: doc.documentAnalysis.extractedText,
          extractedData: doc.documentAnalysis.extractedData,
          documentType: doc.documentAnalysis.documentType,
          confidence: doc.documentAnalysis.confidence,
          isReadable: doc.documentAnalysis.isReadable,
          qualityScore: doc.documentAnalysis.qualityScore,
          createdAt: doc.documentAnalysis.createdAt.toISOString()
        } : undefined,
        dojahVerification: doc.dojahVerification ? {
          id: doc.dojahVerification.id,
          status: doc.dojahVerification.status,
          confidence: doc.dojahVerification.confidence,
          matchResult: doc.dojahVerification.matchResult,
          extractedData: doc.dojahVerification.extractedData,
          governmentData: doc.dojahVerification.governmentData,
          errorMessage: doc.dojahVerification.errorMessage,
          createdAt: doc.dojahVerification.createdAt.toISOString(),
          steps: [
            {
              name: "Document Upload",
              status: "SUCCESS",
              completedAt: doc.uploadedAt.toISOString(),
              details: {
                fileName: doc.fileName,
                fileSize: doc.fileSize,
                mimeType: doc.mimeType
              }
            },
            {
              name: "Document Analysis",
              status: doc.documentAnalysis?.isReadable ? "SUCCESS" : doc.documentAnalysis ? "FAILED" : "PENDING",
              completedAt: doc.documentAnalysis?.createdAt?.toISOString(),
              confidence: doc.documentAnalysis?.confidence,
              details: doc.documentAnalysis ? {
                isReadable: doc.documentAnalysis.isReadable,
                qualityScore: doc.documentAnalysis.qualityScore,
                documentType: doc.documentAnalysis.documentType,
                extractedFields: Object.keys(doc.documentAnalysis.extractedData || {}).length
              } : undefined
            },
            {
              name: "Data Extraction",
              status: doc.documentAnalysis?.extractedData ? "SUCCESS" : doc.documentAnalysis ? "FAILED" : "PENDING",
              completedAt: doc.documentAnalysis?.createdAt?.toISOString(),
              confidence: doc.documentAnalysis?.confidence,
              details: doc.documentAnalysis?.extractedData ? {
                fieldsExtracted: Object.keys(doc.documentAnalysis.extractedData).length,
                documentType: doc.documentAnalysis.documentType,
                extractedDataSummary: doc.documentAnalysis.extractedData
              } : undefined
            },
            {
              name: "Government Verification",
              status: doc.dojahVerification ? doc.dojahVerification.status : "PENDING",
              completedAt: doc.dojahVerification?.updatedAt?.toISOString(),
              confidence: doc.dojahVerification?.confidence,
              matchResult: doc.dojahVerification?.matchResult,
              details: doc.dojahVerification?.governmentVerification ? {
                isMatch: doc.dojahVerification.governmentVerification.some(gv => gv.isMatch),
                verificationTypes: doc.dojahVerification.governmentVerification.map(gv => gv.type),
                verifications: doc.dojahVerification.governmentVerification.map(gv => ({
                  type: gv.type,
                  status: gv.status,
                  isMatch: gv.isMatch,
                  confidence: gv.confidence,
                  matchDetails: gv.governmentData ? {
                    fieldsMatched: Object.keys(gv.governmentData).length,
                    matchSummary: gv.governmentData
                  } : undefined
                }))
              } : undefined
            }
          ]
        } : undefined
      }),
      governmentVerifications: user.kycDocuments.flatMap(doc => 
        doc.dojahVerification?.governmentVerification?.map(gv => ({
          type: gv.type,
          status: gv.status,
          isMatch: gv.isMatch,
          confidence: gv.confidence,
          governmentData: gv.governmentData,
          createdAt: gv.createdAt.toISOString(),
          documentId: doc.id,
          documentType: doc.type
        })) || []
      ),
      selfieVerification: user.selfieVerification ? {
        id: user.selfieVerification.id,
        status: user.selfieVerification.status,
        capturedAt: user.selfieVerification.capturedAt.toISOString(),
        dojahVerification: user.selfieVerification.dojahVerification ? {
          status: user.selfieVerification.dojahVerification.status,
          confidence: user.selfieVerification.dojahVerification.confidence,
          matchResult: user.selfieVerification.dojahVerification.matchResult,
          errorMessage: user.selfieVerification.dojahVerification.errorMessage,
        } : undefined
      } : null,
      notes: user.kycDocuments[0]?.notes || '',
    };

    // Get audit logs
    const auditLogs = await prisma.auditLog.findMany({
      where: {
        OR: [
          { targetId: user.id },
          { targetId: { in: user.kycDocuments.map(doc => doc.id) } }
        ],
        targetType: {
          in: ['KYC_DOCUMENT', 'KYC_SUBMISSION', 'SELFIE_VERIFICATION']
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 50
    });

    // Log this access in audit trail
    await prisma.auditLog.create({
      data: {
        userId,
        action: 'SUBMISSION_VIEW',
        details: `Viewed submission details for ${user.firstName} ${user.lastName}`,
        targetId: user.id,
        targetType: 'KYC_SUBMISSION',
      },
    });

    return NextResponse.json({
      submission,
      auditLogs
    });
  } catch (error: any) {
    console.error('SUBMISSION_DETAILS_ERROR', error);
    
    return new NextResponse(
      JSON.stringify({
        error: error.message || 'An error occurred while fetching submission details',
      }),
      { status: 500 }
    );
  }
}

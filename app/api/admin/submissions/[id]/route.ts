import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { User, KYCDocument, DocumentAnalysis, DojahVerification, SelfieVerification, VerificationStatusEnum, UserRole } from '@/app/generated/prisma';

// Definition of JSON types
type JsonPrimitive = string | number | boolean | null;
type JsonValue = JsonPrimitive | { [key: string]: JsonValue } | JsonValue[];
interface JsonObject {
  [key: string]: JsonValue;
}
interface JsonArray extends Array<JsonValue> {}

interface ValidationResult {
  isValid: boolean;
  confidence: number;
  details: JsonObject;
  timestamp: string;
}

interface VerificationStep {
  name: string;
  status: string;
  completedAt?: string;
  confidence?: number | null;
  details?: JsonObject;
}

interface DojahVerificationResponse {
  id: string;
  status: string;
  confidence: number | null;
  matchResult: JsonObject;
  extractedData: JsonObject;
  governmentData: JsonObject;
  errorMessage: string | null;
  createdAt: string;
  steps: VerificationStep[];
}

interface DocumentSubmission {
  id: string;
  type: string;
  fileName: string;
  url: string;
  status: string;
  documentAnalysis?: {
    extractedText: string | null;
    extractedData: JsonObject;
    documentType: string | null;
    confidence: number | null;
    isReadable: boolean;
    qualityScore: number | null;
    createdAt: string;
  };
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
    governmentData: JsonObject;
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
      matchResult: JsonObject;
      errorMessage: string | null;
    };
  } | null;
  notes: string;
}

// Define a more flexible type structure for the user with includes
type UserWithIncludes = User & {
  kycDocuments: (KYCDocument & {
    documentAnalysis: DocumentAnalysis | null;
  })[];
  dojahVerifications: DojahVerification[];
  selfieVerification: SelfieVerification | null;
};

// Utility function to get current user ID from session cookie
const getCurrentUserId = (): string | null => {
  const sessionCookie = cookies().get('session')?.value;
  if (!sessionCookie) return null;

  try {
    const session = JSON.parse(sessionCookie);
    return typeof session.userId === 'string' ? session.userId : null;
  } catch {
    return null;
  }
};

// Function to format verification steps
const formatVerificationSteps = (
  doc: KYCDocument & {
    documentAnalysis: DocumentAnalysis | null;
  },
  dojahVerifications: DojahVerification[]
): VerificationStep[] => {
  // Find Dojah verifications related to this document
  const docVerification = dojahVerifications.find(v => 
    v.documentId === doc.id && v.verificationType === 'DOCUMENT_ANALYSIS'
  );
  
  const govVerifications = dojahVerifications.filter(v => 
    v.documentId === doc.id && 
    ['BVN_LOOKUP', 'NIN_LOOKUP', 'PASSPORT_LOOKUP', 'DRIVERS_LICENSE_LOOKUP'].includes(v.verificationType)
  );

  return [
    {
      name: 'Document Upload',
      status: 'SUCCESS',
      completedAt: doc.uploadedAt.toISOString(),
      details: {
        fileName: doc.fileName,
        fileSize: doc.fileSize,
        mimeType: doc.mimeType,
      },
    },
    {
      name: 'Document Analysis',
      status: doc.documentAnalysis?.isReadable ? 'SUCCESS' : doc.documentAnalysis ? 'FAILED' : 'PENDING',
      completedAt: doc.documentAnalysis?.createdAt?.toISOString(),
      confidence: doc.documentAnalysis?.confidence ?? null,
      details: doc.documentAnalysis
        ? {
            isReadable: doc.documentAnalysis.isReadable,
            qualityScore: doc.documentAnalysis.qualityScore,
            documentType: typeof doc.documentAnalysis.documentType === 'object' 
              ? JSON.stringify(doc.documentAnalysis.documentType)
              : String(doc.documentAnalysis.documentType || ''),
            extractedFields: doc.documentAnalysis.extractedData 
              ? Object.keys(doc.documentAnalysis.extractedData as object).length
              : 0,
          } as JsonObject
        : undefined,
    },
    {
      name: 'Data Extraction',
      status: doc.documentAnalysis?.extractedData ? 'SUCCESS' : doc.documentAnalysis ? 'FAILED' : 'PENDING',
      completedAt: doc.documentAnalysis?.createdAt?.toISOString(),
      confidence: doc.documentAnalysis?.confidence ?? null,
      details: doc.documentAnalysis?.extractedData
        ? {
            fieldsExtracted: Object.keys(doc.documentAnalysis.extractedData as object).length,
            documentType: typeof doc.documentAnalysis.documentType === 'object' 
              ? JSON.stringify(doc.documentAnalysis.documentType)
              : String(doc.documentAnalysis.documentType || ''),
            extractedDataSummary: JSON.stringify(doc.documentAnalysis.extractedData),
          } as JsonObject
        : undefined,
    },
    {
      name: 'Government Verification',
      status: govVerifications.length > 0 
        ? govVerifications.some(v => v.status === 'SUCCESS') ? 'SUCCESS' : 'FAILED'
        : 'PENDING',
      completedAt: govVerifications.length > 0 
        ? new Date(Math.max(...govVerifications.map(v => v.updatedAt.getTime()))).toISOString()
        : undefined,
      confidence: govVerifications.length > 0
        ? govVerifications.reduce((sum, v) => sum + (v.confidence || 0), 0) / govVerifications.length
        : null,
      details: govVerifications.length > 0
        ? {
            isMatch: govVerifications.some(v => v.matchResult && 
                (v.matchResult as any).isMatch === true),            verificationTypes: govVerifications.map(v => String(v.verificationType)) as unknown as JsonValue,
            verifications: govVerifications.map(v => ({
              type: String(v.verificationType),
              status: String(v.status),
              isMatch: (v.matchResult as any)?.isMatch || false,
              confidence: v.confidence,
              matchDetails: v.governmentData
                ? {
                    fieldsMatched: Object.keys(v.governmentData as object).length,
                    matchSummary: v.governmentData as unknown as JsonValue,
                  }
                : null,
            })) as unknown as JsonValue,
          } as JsonObject
        : undefined,
    },
  ];
};

// Function to format user data
const formatUserData = (user: any): SubmissionResponse => {
  // Get selfie verification related Dojah verification if exists
  const selfieVerificationId = user.selfieVerification?.id;
  const selfieDojahVerification = selfieVerificationId 
    ? user.dojahVerifications.find((v: DojahVerification) => 
        v.documentId === selfieVerificationId && 
        v.verificationType === 'SELFIE_PHOTO_ID_MATCH'
      )
    : null;

  return {
    id: user.id,
    user: {
      id: user.id,
      name: `${user.firstName} ${user.lastName}`,
      email: user.email,
    },
    submittedAt: user.createdAt.toISOString(),
    status: user.kycDocuments.length > 0 ? user.kycDocuments[0].status : VerificationStatusEnum.PENDING,
    documents: user.kycDocuments.map((doc: any) => {
      // Find document related Dojah verifications
      const docVerification = user.dojahVerifications.find((v: DojahVerification) => 
        v.documentId === doc.id && v.verificationType === 'DOCUMENT_ANALYSIS'
      );
      
      return {
        id: doc.id,
        type: doc.type,
        fileName: doc.fileName,
        url: `/api/admin/submissions/${user.id}/download?documentId=${doc.id}`,
        status: doc.status,
        documentAnalysis: doc.documentAnalysis
          ? {
              extractedText: doc.documentAnalysis.extractedText,
              extractedData: doc.documentAnalysis.extractedData as any as JsonObject,
              documentType: doc.documentAnalysis.documentType 
                ? (typeof doc.documentAnalysis.documentType === 'object' 
                  ? (doc.documentAnalysis.documentType as any).type || null 
                  : String(doc.documentAnalysis.documentType)
                  )
                : null,
              confidence: doc.documentAnalysis.confidence,
              isReadable: doc.documentAnalysis.isReadable,
              qualityScore: doc.documentAnalysis.qualityScore,
              createdAt: doc.documentAnalysis.createdAt.toISOString(),
            }
          : undefined,
        dojahVerification: docVerification
          ? {
              id: docVerification.id,
              status: docVerification.status,
              confidence: docVerification.confidence,
              matchResult: docVerification.matchResult as any as JsonObject,
              extractedData: docVerification.extractedData as any as JsonObject,
              governmentData: docVerification.governmentData as any as JsonObject,
              errorMessage: docVerification.errorMessage,
              createdAt: docVerification.createdAt.toISOString(),
              steps: formatVerificationSteps(doc, user.dojahVerifications),
            }
          : undefined,
      };
    }),
    governmentVerifications: user.dojahVerifications
      .filter((v: DojahVerification) => 
        ['BVN_LOOKUP', 'NIN_LOOKUP', 'PASSPORT_LOOKUP', 'DRIVERS_LICENSE_LOOKUP'].includes(v.verificationType) &&
        user.kycDocuments.some((doc: any) => doc.id === v.documentId)
      )
      .map((v: DojahVerification) => {
        const doc = user.kycDocuments.find((d: any) => d.id === v.documentId);
        return {
          type: v.verificationType,
          status: v.status,
          isMatch: (v.matchResult as any)?.isMatch || false,
          confidence: v.confidence,
          governmentData: v.governmentData as any as JsonObject,
          createdAt: v.createdAt.toISOString(),
          documentId: v.documentId || '',
          documentType: doc?.type || '',
        };
      }),
    selfieVerification: user.selfieVerification
      ? {
          id: user.selfieVerification.id,
          status: user.selfieVerification.status,
          capturedAt: user.selfieVerification.capturedAt.toISOString(),
          dojahVerification: selfieDojahVerification
            ? {
                status: selfieDojahVerification.status,
                confidence: selfieDojahVerification.confidence,
                matchResult: selfieDojahVerification.matchResult as any as JsonObject,
                errorMessage: selfieDojahVerification.errorMessage,
              }
            : undefined,
        }
      : null,
    notes: user.kycDocuments[0]?.notes || '',
  };
};

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Validate input
    if (!params.id || typeof params.id !== 'string') {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });
    }

    // Authenticate user
    const userId = getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized: No valid session' }, { status: 401 });
    }

    // Check admin privileges
    const adminUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });    if (!adminUser || !(adminUser.role === 'ADMIN' || adminUser.role === 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 403 });
    }
  // Fetch user data with necessary includes
    const user = await prisma.user.findUnique({
      where: { id: params.id },
      include: {
        kycDocuments: {
          include: {
            documentAnalysis: true,
          },
        },
        dojahVerifications: true,
        selfieVerification: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Format submission data
    const submission = formatUserData(user);

    // Fetch audit logs
    const auditLogs = await prisma.auditLog.findMany({
      where: {
        OR: [
          { targetId: user.id, targetType: 'KYC_SUBMISSION' },
          {
            targetId: { in: user.kycDocuments.map((doc) => doc.id) },
            targetType: 'KYC_DOCUMENT',
          },
          {
            targetId: user.selfieVerification?.id,
            targetType: 'SELFIE_VERIFICATION',
          },
        ],
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: {
        id: true,
        action: true,
        details: true,
        targetId: true,
        targetType: true,
        createdAt: true,
      },
    });

    // Log access in audit trail
    await prisma.auditLog.create({
      data: {
        userId,
        action: 'SUBMISSION_VIEW',
        details: `Viewed submission details for ${user.firstName} ${user.lastName}`,
        targetId: user.id,
        targetType: 'KYC_SUBMISSION',
      },
    });

    return NextResponse.json({ submission, auditLogs });
  } catch (error) {
    console.error('SUBMISSION_DETAILS_ERROR', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });

    return NextResponse.json(
      { error: 'Failed to fetch submission details' },
      { status: 500 }
    );
  }
}
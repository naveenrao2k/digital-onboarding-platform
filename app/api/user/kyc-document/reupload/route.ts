// app/api/user/kyc-document/reupload/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { VerificationStatusEnum } from '@/app/generated/prisma';


export const dynamic = 'force-dynamic'; // Ensure the route is dynamic

export async function POST(request: NextRequest) {
    try {
        // Get session
        const cookieStore = cookies();
        const sessionCookie = cookieStore.get('session')?.value;

        if (!sessionCookie) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        let sessionData;
        try {
            sessionData = JSON.parse(sessionCookie);
        } catch (e) {
            return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
        }

        const userId = sessionData.userId;

        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Parse request body
        const body = await request.json();
        const { documentId, newDocumentId } = body;

        if (!documentId || !newDocumentId) {
            return NextResponse.json(
                { error: 'Document ID and new document ID are required' },
                { status: 400 }
            );
        }

        // First verify the document exists and belongs to the current user
        const existingDocument = await prisma.kYCDocument.findFirst({
            where: {
                id: documentId,
                userId: userId
            }
        });

        if (!existingDocument) {
            return NextResponse.json(
                { error: 'Document not found or not authorized to update' },
                { status: 404 }
            );
        }

        // Verify the new document exists and belongs to the current user
        const newDocument = await prisma.kYCDocument.findFirst({
            where: {
                id: newDocumentId,
                userId: userId
            }
        });

        if (!newDocument) {
            return NextResponse.json(
                { error: 'New document not found' },
                { status: 404 }
            );
        }    // Update the status of the existing document to track it was replaced
        await prisma.kYCDocument.update({
            where: { id: documentId },
            data: {
                status: VerificationStatusEnum.REJECTED,
                notes: `Replaced by document ID: ${newDocumentId}`
            }
        });

        // Check if this is a passport or utility bill document which needs special handling
        const isSpecialDocType = existingDocument.type === 'PASSPORT' || existingDocument.type === 'UTILITY_BILL';
        
        // Update the new document to reference the old one and apply special status for passport/utility bill
        await prisma.kYCDocument.update({
            where: { id: newDocumentId },
            data: {
                notes: isSpecialDocType
                    ? `Replaces document ID: ${documentId}. Applied special validation bypass for ${existingDocument.type} document type.`
                    : `Replaces document ID: ${documentId}`,
                status: isSpecialDocType ? VerificationStatusEnum.IN_PROGRESS : VerificationStatusEnum.PENDING,
                verified: isSpecialDocType ? true : false,
                verifiedAt: isSpecialDocType ? new Date() : null
            }
        });
        
        // Find any existing document analysis for the old document
        const existingAnalysis = await prisma.documentAnalysis.findUnique({
            where: {
                kycDocumentId: documentId
            }
        });
        
        // If there is an existing analysis, ensure it's properly updated or removed
        if (existingAnalysis) {
            console.log(`Found existing analysis for document ${documentId}, handling during reupload`);
            
            // Delete the old analysis to ensure a fresh one will be created for the new document
            await prisma.documentAnalysis.delete({
                where: {
                    kycDocumentId: documentId
                }
            });
            
            console.log(`Deleted old analysis for document ${documentId} to prevent conflicts`);
        }

        // Update the verification status to reflect the change
        const userVerificationStatus = await prisma.verificationStatus.findUnique({
            where: { userId }
        });

        if (userVerificationStatus) {
            await prisma.verificationStatus.update({
                where: { userId },
                data: {
                    kycStatus: VerificationStatusEnum.PENDING,
                    overallStatus: VerificationStatusEnum.PENDING,
                }
            });
        }

        // Create an audit log entry
        await prisma.auditLog.create({
            data: {
                userId,
                action: 'DOCUMENT_REUPLOADED',
                details: JSON.stringify({
                    oldDocumentId: documentId,
                    newDocumentId: newDocumentId,
                    documentType: existingDocument.type,
                    timestamp: new Date().toISOString()
                })
            }
        });

        return NextResponse.json({
            success: true,
            message: 'Document reuploaded successfully'
        });
    } catch (error) {
        console.error('Document reupload error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to reupload document' },
            { status: 500 }
        );
    }
}

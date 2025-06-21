import { NextRequest, NextResponse } from 'next/server';
import { DocumentType } from '@/app/generated/prisma';


// Mock function to represent Dojah API call for business document validation
async function validateDocumentWithDojah(file: File, documentType: string) {
  // In a real implementation, this would call the Dojah API
  // Here we're mocking the response for demonstration purposes

  // Add a slight delay to simulate API call
  await new Promise(resolve => setTimeout(resolve, 1500));

  // Different validation logic based on document type
  switch (documentType) {
    case 'business_registration':
    case 'certificate_of_incorporation':
      return {
        isValid: true,
        extractedData: {
          businessName: "Sample Business Name",
          registrationNumber: "BN-123456",
          registrationDate: "2023-01-15",
          businessType: documentType === 'certificate_of_incorporation' ? 'Limited Liability Company' : 'Partnership',
          registrationStatus: "Active"
        },
        message: "Business registration document validated successfully"
      };

    case 'board_resolution':
      return {
        isValid: true,
        extractedData: {
          resolutionDate: "2023-05-20",
          resolutionNumber: "BR-789",
          authorizedSignatories: ["John Doe", "Jane Smith"]
        },
        message: "Board resolution document validated successfully"
      };

    case 'business_reg_form':
      return {
        isValid: true,
        extractedData: {
          formNumber: "CAC-123456",
          submissionDate: "2023-01-10",
          businessActivity: "Consulting Services"
        },
        message: "Business registration form validated successfully"
      };

    case 'memorandum_articles':
      return {
        isValid: true,
        extractedData: {
          companyObjectives: ["Software Development", "IT Consulting"],
          shareCapital: "1,000,000 NGN",
          numberOfDirectors: 3
        },
        message: "Memorandum and articles validated successfully"
      };

    default:
      return {
        isValid: true,
        extractedData: {
          documentType: documentType,
          validationTimestamp: new Date().toISOString()
        },
        message: "Document passed general validation"
      };
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const documentType = formData.get('document_type') as string;

    if (!file) {
      return NextResponse.json(
        { message: "No file provided" },
        { status: 400 }
      );
    }

    if (!documentType) {
      return NextResponse.json(
        { message: "Document type not specified" },
        { status: 400 }
      );
    }

    // Call the mock Dojah API for document validation
    const validationResult = await validateDocumentWithDojah(file, documentType);

    return NextResponse.json(validationResult);

  } catch (error) {
    console.error("Error validating document:", error);
    return NextResponse.json(
      { message: "Failed to validate document", error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
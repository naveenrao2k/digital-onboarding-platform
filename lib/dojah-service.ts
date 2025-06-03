// lib/dojah-service.ts
import { prisma } from './prisma';
import { DojahVerificationType, DojahStatus, VerificationStatusEnum } from '@/app/generated/prisma';

interface DojahConfig {
  appId: string;
  secretKey: string;
  baseUrl: string;
  environment: 'sandbox' | 'production';
}

interface DojahResponse {
  entity?: any;
  error?: string;
  status_code?: number;
  message?: string;
}

interface DocumentAnalysisResult {
  extractedText?: string;
  extractedData?: any;
  documentType?: {
    documentName?: string;
    documentCountryName?: string;
    documentCountryCode?: string;
  };
  confidence?: number;
  isReadable: boolean;
  qualityScore?: number;
  isValid: boolean;
  validationStatus: {
    overallStatus: number;
    reason: string;
    documentImages: string;
    text: string;
    documentType: string;
    expiry: string;
  };
  textData?: Array<{
    fieldName: string;
    fieldKey: string;
    status: number;
    value: string;
  }>;
  documentImages?: {
    portrait?: string;
    documentFrontSide?: string;
    documentBackSide?: string;
  };
}

interface GovernmentLookupResult {
  isMatch: boolean;
  matchScore?: number;
  governmentData?: any;
  extractedPersonalInfo?: {
    firstName?: string;
    lastName?: string;
    middleName?: string;
    dateOfBirth?: string;
    gender?: string;
    phoneNumber?: string;
    email?: string;
    address?: string;
    photo?: string;
  };
}

interface SelfieVerificationResult {
  isMatch: boolean;
  confidence: number;
  livenessScore?: number;
  qualityChecks?: {
    faceDetected: boolean;
    imageQuality: string;
    lighting: string;
  };
}

class DojahService {
  private config: DojahConfig;

  constructor() {
    const environment = (process.env.DOJAH_ENVIRONMENT as 'sandbox' | 'production') || 'sandbox';

    let baseUrl = process.env.DOJAH_BASE_URL;
    if (!baseUrl) {
      baseUrl = environment === 'production'
        ? 'https://api.dojah.io'
        : 'https://sandbox.dojah.io';
    }

    this.config = {
      appId: process.env.DOJAH_APP_ID || '',
      secretKey: process.env.DOJAH_SECRET_KEY || '',
      baseUrl,
      environment
    };

    if (!this.config.appId || !this.config.secretKey) {
      throw new Error('Dojah API credentials not configured');
    }
  }

  private async makeRequest(endpoint: string, params: Record<string, any> = {}): Promise<DojahResponse> {
    const url = new URL(endpoint, this.config.baseUrl);
    
    // Add query parameters
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null) {
        url.searchParams.append(key, params[key].toString());
      }
    });

    try {
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'AppId': this.config.appId,
          'Authorization': this.config.secretKey,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      return data;
    } catch (error) {
      console.error('Dojah API request failed:', error);
      throw error;
    }
  }

  private async makePostRequest(endpoint: string, body: any): Promise<DojahResponse> {
    const url = new URL(endpoint, this.config.baseUrl);

    try {
      const response = await fetch(url.toString(), {
        method: 'POST',
        headers: {
          'AppId': this.config.appId,
          'Authorization': this.config.secretKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      return data;
    } catch (error) {
      console.error('Dojah API POST request failed:', error);
      throw error;
    }
  }

  // BVN Lookup
  async lookupBVN(bvn: string, advanced: boolean = false): Promise<GovernmentLookupResult> {
    const endpoint = advanced ? '/api/v1/kyc/bvn/advance' : '/api/v1/kyc/bvn/full';
    
    // Always use real BVN regardless of environment
    const response = await this.makeRequest(endpoint, { bvn });
    
    if (!response.entity) {
      return { isMatch: false };
    }

    return {
      isMatch: true,
      matchScore: 100,
      governmentData: response.entity,
      extractedPersonalInfo: {
        firstName: response.entity.first_name,
        lastName: response.entity.last_name,
        middleName: response.entity.middle_name,
        dateOfBirth: response.entity.date_of_birth,
        gender: response.entity.gender,
        phoneNumber: response.entity.phone_number1,
        email: response.entity.email,
        photo: response.entity.image
      }
    };
  }

  // NIN Lookup
  async lookupNIN(nin: string): Promise<GovernmentLookupResult> {
    const endpoint = '/api/v1/kyc/nin';
    
    // Always use real NIN regardless of environment
    const response = await this.makeRequest(endpoint, { nin });
    
    if (!response.entity) {
      return { isMatch: false };
    }

    return {
      isMatch: true,
      matchScore: 100,
      governmentData: response.entity,
      extractedPersonalInfo: {
        firstName: response.entity.first_name,
        lastName: response.entity.last_name,
        middleName: response.entity.middle_name,
        dateOfBirth: response.entity.date_of_birth,
        gender: response.entity.gender,
        phoneNumber: response.entity.phone_number,
        email: response.entity.email,
        photo: response.entity.photo
      }
    };
  }

  // Passport Lookup
  async lookupPassport(passportNumber: string, surname: string): Promise<GovernmentLookupResult> {
    const endpoint = '/api/v1/kyc/passport';
    
    // Always use real passport number regardless of environment
    const response = await this.makeRequest(endpoint, { 
      passport_number: passportNumber, 
      surname: surname 
    });
    
    if (!response.entity) {
      return { isMatch: false };
    }

    return {
      isMatch: true,
      matchScore: 100,
      governmentData: response.entity,
      extractedPersonalInfo: {
        firstName: response.entity.first_name,
        lastName: response.entity.surname,
        middleName: response.entity.other_names,
        dateOfBirth: response.entity.date_of_birth,
        gender: response.entity.gender,
        photo: response.entity.photo
      }
    };
  }

  // Driver's License Lookup
  async lookupDriversLicense(licenseNumber: string): Promise<GovernmentLookupResult> {
    const endpoint = '/api/v1/kyc/dl';
    
    // Always use real license number regardless of environment
    const response = await this.makeRequest(endpoint, { license_number: licenseNumber });
    
    if (!response.entity) {
      return { isMatch: false };
    }

    return {
      isMatch: true,
      matchScore: 100,
      governmentData: response.entity,
      extractedPersonalInfo: {
        firstName: response.entity.firstName,
        lastName: response.entity.lastName,
        middleName: response.entity.middleName,
        dateOfBirth: response.entity.birthDate,
        gender: response.entity.gender,
        photo: response.entity.photo
      }
    };
  }

  // Document Analysis
  async analyzeDocument(
    imageFrontSide: string,
    imageBackSide?: string,
    additionalImages?: string[],
    inputType: 'url' | 'base64' = 'base64'
  ): Promise<DocumentAnalysisResult> {
    const endpoint = '/api/v1/document/analysis';
    
    const requestBody = {
      input_type: inputType,
      imagefrontside: imageFrontSide,
      imagebackside: imageBackSide,
      images: additionalImages
    };

    const response = await this.makePostRequest(endpoint, requestBody);

    if (!response.entity) {
      return {
        isReadable: false,
        confidence: 0,
        isValid: false,
        validationStatus: {
          overallStatus: 0,
          reason: 'NO_RESPONSE',
          documentImages: 'No',
          text: 'No',
          documentType: 'No',
          expiry: 'No'
        }
      };
    }

    return {
      documentType: {
        documentName: response.entity.document_type?.document_name,
        documentCountryName: response.entity.document_type?.document_country_name,
        documentCountryCode: response.entity.document_type?.document_country_code
      },
      isValid: response.entity.status?.overall_status === 1,
      validationStatus: {
        overallStatus: response.entity.status?.overall_status || 0,
        reason: response.entity.status?.reason || 'UNKNOWN',
        documentImages: response.entity.status?.document_images || 'No',
        text: response.entity.status?.text || 'No',
        documentType: response.entity.status?.document_type || 'No',
        expiry: response.entity.status?.expiry || 'No'
      },
      textData: response.entity.text_data?.map((field: any) => ({
        fieldName: field.field_name,
        fieldKey: field.field_key,
        status: field.status,
        value: field.value
      })),
      documentImages: {
        portrait: response.entity.document_images?.portrait,
        documentFrontSide: response.entity.document_images?.document_front_side,
        documentBackSide: response.entity.document_images?.document_back_side
      },
      confidence: response.entity.confidence || 0,
      isReadable: true
    };
  }

  // Selfie Photo ID Match
  async verifySelfieWithPhotoId(selfieBase64: string, idPhotoBase64: string): Promise<SelfieVerificationResult> {
    const endpoint = '/api/v1/kyc/selfie_photo_id';
    
    const response = await this.makePostRequest(endpoint, {
      selfie_image: selfieBase64,
      photo_id_image: idPhotoBase64
    });

    if (!response.entity) {
      return {
        isMatch: false,
        confidence: 0
      };
    }

    return {
      isMatch: response.entity.face_match || false,
      confidence: response.entity.confidence || 0,
      livenessScore: response.entity.liveness_score,
      qualityChecks: {
        faceDetected: response.entity.face_detected || false,
        imageQuality: response.entity.image_quality || 'unknown',
        lighting: response.entity.lighting || 'unknown'
      }
    };
  }

  // AML Screening
  async performAMLScreening(personalInfo: {
    firstName: string;
    lastName: string;
    dateOfBirth?: string;
    nationality?: string;
  }): Promise<any> {
    const endpoint = '/api/v1/aml/individual';
    
    const response = await this.makePostRequest(endpoint, {
      first_name: personalInfo.firstName,
      last_name: personalInfo.lastName,
      date_of_birth: personalInfo.dateOfBirth,
      nationality: personalInfo.nationality || 'NG'
    });

    return response.entity || {};
  }

  // Comprehensive Document Verification
  async verifyDocument(userId: string, documentId: string, documentBase64?: string | null, documentType?: string): Promise<string> {
    try {
      // Get document from database if not provided
      if (!documentBase64 || !documentType) {
        const document = await prisma.kYCDocument.findUnique({
          where: { id: documentId }
        });
        
        if (!document) {
          throw new Error(`Document with ID ${documentId} not found`);
        }
        
        // Get document type if not provided
        if (!documentType) {
          documentType = document.type.toString();
        }
        
        // Get base64 if not provided
        if (!documentBase64) {
          const base64Content = await this.getBase64FromS3OrFallback(document);
          
          if (!base64Content) {
            throw new Error('Could not retrieve document content');
          }
          
          documentBase64 = base64Content;
        }
      }

      // Create initial verification record
      const verification = await prisma.dojahVerification.create({
        data: {
          userId,
          verificationType: DojahVerificationType.DOCUMENT_ANALYSIS,
          documentId,
          status: DojahStatus.IN_PROGRESS,
          requestData: { documentType }
        }
      });

      // Step 1: Analyze document
      const analysisResult = await this.analyzeDocument(documentBase64, documentType);
      
      // Store document analysis
      await prisma.documentAnalysis.create({
        data: {
          kycDocumentId: documentId,
          extractedText: analysisResult.extractedText,
          extractedData: analysisResult.extractedData as any,
          documentType: analysisResult.documentType,
          confidence: analysisResult.confidence,
          isReadable: analysisResult.isReadable,
          qualityScore: analysisResult.qualityScore,
          analysisProvider: 'DOJAH'
        }
      });

      // Step 2: Government lookup if we have extracted data
      let governmentResult: GovernmentLookupResult | null = null;
      
      if (analysisResult.extractedData) {
        governmentResult = await this.performGovernmentLookup(
          analysisResult.extractedData, 
          documentType
        );
      }

      // Update verification with results
      await prisma.dojahVerification.update({
        where: { id: verification.id },
        data: {
          status: DojahStatus.SUCCESS,
          confidence: analysisResult.confidence,
          extractedData: analysisResult.extractedData as any,
          governmentData: governmentResult?.governmentData as any,
          matchResult: governmentResult ? {
            isMatch: governmentResult.isMatch,
            matchScore: governmentResult.matchScore
          } as any : null,
          responseData: {
            documentAnalysis: analysisResult,
            governmentLookup: governmentResult
          } as any
        }
      });

      return verification.id;
    } catch (error) {
      console.error('Document verification failed:', error);
      throw error;
    }
  }

  // Comprehensive Selfie Verification
  async verifySelfie(userId: string, selfieId: string, selfieBase64?: string, idDocumentBase64?: string): Promise<string> {
    try {
      // Get selfie from database if not provided
      if (!selfieBase64) {
        const selfie = await prisma.selfieVerification.findUnique({
          where: { id: selfieId }
        });
        
        if (!selfie) {
          throw new Error(`Selfie with ID ${selfieId} not found`);
        }
        
        // Get base64 from S3
        const base64Content = await this.getBase64FromS3OrFallback(selfie);
        
        if (!base64Content) {
          throw new Error('Could not retrieve selfie content');
        }
        
        selfieBase64 = base64Content;
      }

      // If idDocumentBase64 is not provided but userId is, try to find a suitable ID document
      if (!idDocumentBase64 && userId) {
        const idDocument = await prisma.kYCDocument.findFirst({
          where: { 
            userId, 
            type: { in: ['ID_CARD', 'PASSPORT', 'DRIVERS_LICENSE'] },
            status: VerificationStatusEnum.APPROVED
          }
        });

        if (idDocument) {
          idDocumentBase64 = await this.getBase64FromS3OrFallback(idDocument);
        }
      }

      // Create initial verification record
      const verification = await prisma.dojahVerification.create({
        data: {
          userId,
          verificationType: DojahVerificationType.SELFIE_PHOTO_ID_MATCH,
          documentId: selfieId,
          status: DojahStatus.IN_PROGRESS,
          requestData: { hasIdDocument: !!idDocumentBase64 } as any
        }
      });

      // Always perform actual verification with Dojah API
      if (!idDocumentBase64) {
        throw new Error('ID document is required for selfie verification');
      }
      
      const verificationResult = await this.verifySelfieWithPhotoId(selfieBase64, idDocumentBase64);

      // Update verification with results
      await prisma.dojahVerification.update({
        where: { id: verification.id },
        data: {
          status: DojahStatus.SUCCESS,
          confidence: verificationResult.confidence,
          matchResult: {
            isMatch: verificationResult.isMatch,
            confidence: verificationResult.confidence,
            livenessScore: verificationResult.livenessScore,
            qualityChecks: verificationResult.qualityChecks
          } as any,
          responseData: verificationResult as any
        }
      });

      return verification.id;
    } catch (error) {
      console.error('Selfie verification failed:', error);
      throw error;
    }
  }

  private async performGovernmentLookup(extractedData: any, documentType: string): Promise<GovernmentLookupResult | null> {
    try {
      // Determine which government API to use based on document type and extracted data
      if (extractedData.bvn && documentType.includes('BVN')) {
        return await this.lookupBVN(extractedData.bvn);
      }
      
      if (extractedData.nin && documentType.includes('NIN')) {
        return await this.lookupNIN(extractedData.nin);
      }
      
      if (extractedData.passport_number && extractedData.surname) {
        return await this.lookupPassport(extractedData.passport_number, extractedData.surname);
      }
      
      if (extractedData.license_number && documentType.includes('DRIVERS')) {
        return await this.lookupDriversLicense(extractedData.license_number);
      }

      return null;
    } catch (error) {
      console.error('Government lookup failed:', error);
      return null;
    }
  }

  // Get verification status
  async getVerificationStatus(verificationId: string) {
    return await prisma.dojahVerification.findUnique({
      where: { id: verificationId },
      include: {
        adminReviews: {
          include: {
            reviewer: {
              select: {
                firstName: true,
                lastName: true
              }
            }
          }
        }
      }
    });
  }

  // Get all verifications for a user
  async getUserVerifications(userId: string) {
    return await prisma.dojahVerification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        adminReviews: {
          include: {
            reviewer: {
              select: {
                firstName: true,
                lastName: true
              }
            }
          }
        }
      }
    });
  }

  // Helper method to get base64 from S3 or fallback to existing file
  async getBase64FromS3OrFallback(document: any): Promise<string | undefined> {
    try {
      if (document.s3Key) {
        // Get the file content from S3 using our helper function
        const { getFileBase64FromS3 } = await import('./s3-service');
        return await getFileBase64FromS3(document.s3Key);
      }
      // No fallback to legacy methods anymore
      return undefined;
    } catch (error) {
      console.error('Error getting base64 from S3:', error);
      return undefined;
    }
  }
}

export const dojahService = new DojahService();
export default dojahService;
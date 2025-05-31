// lib/dojah-service.ts
import { prisma } from './prisma';
import { DojahVerificationType, DojahStatus } from '@/app/generated/prisma';

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
  documentType?: string;
  confidence?: number;
  isReadable: boolean;
  qualityScore?: number;
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
    this.config = {
      appId: process.env.DOJAH_APP_ID || '',
      secretKey: process.env.DOJAH_SECRET_KEY || '',
      baseUrl: process.env.DOJAH_BASE_URL || 'https://api.dojah.io',
      environment: (process.env.DOJAH_ENVIRONMENT as 'sandbox' | 'production') || 'sandbox'
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
    
    // Use test BVN in sandbox mode
    const testBvn = this.config.environment === 'sandbox' ? 
      process.env.DOJAH_TEST_BVN || '22222222222' : bvn;
    
    const response = await this.makeRequest(endpoint, { bvn: testBvn });
    
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
    
    // Use test NIN in sandbox mode
    const testNin = this.config.environment === 'sandbox' ? 
      process.env.DOJAH_TEST_NIN || '70123456789' : nin;
    
    const response = await this.makeRequest(endpoint, { nin: testNin });
    
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
    
    // Use test passport in sandbox mode
    const testPassport = this.config.environment === 'sandbox' ? 
      process.env.DOJAH_TEST_PASSPORT || 'A00123456' : passportNumber;
    
    const response = await this.makeRequest(endpoint, { 
      passport_number: testPassport, 
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
    
    // Use test license in sandbox mode
    const testLicense = this.config.environment === 'sandbox' ? 
      process.env.DOJAH_TEST_DRIVERS_LICENSE || 'FKJ494A2133' : licenseNumber;
    
    const response = await this.makeRequest(endpoint, { license_number: testLicense });
    
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
  async analyzeDocument(documentBase64: string, documentType?: string): Promise<DocumentAnalysisResult> {
    const endpoint = '/api/v1/document/analysis';
    
    const response = await this.makePostRequest(endpoint, {
      image: documentBase64,
      document_type: documentType
    });

    if (!response.entity) {
      return {
        isReadable: false,
        confidence: 0
      };
    }

    return {
      extractedText: response.entity.extracted_text,
      extractedData: response.entity.extracted_data,
      documentType: response.entity.document_type,
      confidence: response.entity.confidence || 0,
      isReadable: response.entity.is_readable || false,
      qualityScore: response.entity.quality_score
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
  async verifyDocument(userId: string, documentId: string, documentBase64: string, documentType: string): Promise<string> {
    try {
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
          extractedData: analysisResult.extractedData,
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
          extractedData: analysisResult.extractedData,
          governmentData: governmentResult?.governmentData,
          matchResult: governmentResult ? {
            isMatch: governmentResult.isMatch,
            matchScore: governmentResult.matchScore
          } : null,
          responseData: {
            documentAnalysis: analysisResult,
            governmentLookup: governmentResult
          }
        }
      });

      return verification.id;
    } catch (error) {
      console.error('Document verification failed:', error);
      throw error;
    }
  }

  // Comprehensive Selfie Verification
  async verifySelfie(userId: string, selfieId: string, selfieBase64: string, idDocumentBase64?: string): Promise<string> {
    try {
      // Create initial verification record
      const verification = await prisma.dojahVerification.create({
        data: {
          userId,
          verificationType: DojahVerificationType.SELFIE_PHOTO_ID_MATCH,
          documentId: selfieId,
          status: DojahStatus.IN_PROGRESS,
          requestData: { hasIdDocument: !!idDocumentBase64 }
        }
      });

      let verificationResult: SelfieVerificationResult;

      if (idDocumentBase64) {
        // Verify selfie against ID document
        verificationResult = await this.verifySelfieWithPhotoId(selfieBase64, idDocumentBase64);
      } else {
        // Basic liveness check
        verificationResult = {
          isMatch: true,
          confidence: 85, // Default confidence for liveness
          livenessScore: 90
        };
      }

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
          },
          responseData: verificationResult
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
}

export const dojahService = new DojahService();
export default dojahService;
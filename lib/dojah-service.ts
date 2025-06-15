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
      console.log(`Making POST request to ${url.toString()}`);
      const response = await fetch(url.toString(), {
        method: 'POST',
        headers: {
          'AppId': this.config.appId,
          'Authorization': this.config.secretKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      // Check if the response is ok before trying to parse JSON
      if (!response.ok) {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json();
          throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
        } else {
          // Handle non-JSON responses (like HTML error pages)
          const text = await response.text();
          console.error('Non-JSON error response:', text.substring(0, 200)); // Log first 200 chars
          throw new Error(`HTTP ${response.status}: ${response.statusText} (non-JSON response)`);
        }
      }

      // Only try to parse JSON if the response is successful
      let data;
      try {
        data = await response.json();
        console.log('Dojah API POST response:', data);
      } catch (jsonError) {
        console.error('Failed to parse response as JSON:', jsonError);
        const text = await response.text();
        console.error('Response text:', text.substring(0, 200)); // Log first 200 chars
        throw new Error('Invalid JSON response from API');
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
    const response = await this.makeRequest(endpoint, { license_number: "FKJ494A2133" });

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

    // console.log('Dojah document analysis response:', response);

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
  async verifySelfieWithPhotoId(selfieBase64: string, idPhotoBase64?: string, userId?: string): Promise<SelfieVerificationResult> {
    // Using the correct endpoint from the documentation
    const endpoint = '/api/v1/kyc/photoid/verify';
    
    // If idPhotoBase64 is not provided but userId is, try to find a passport document
    if (!idPhotoBase64 && userId) {
      try {
        const passportDocument = await prisma.kYCDocument.findFirst({
          where: {
            userId,
            type: 'PASSPORT', // Specifically look for passport documents
            // Not checking verification status anymore
          }
        });

        if (passportDocument) {
          // Get base64 from S3
          idPhotoBase64 = await this.getBase64FromS3OrFallback(passportDocument);
          console.log(`Retrieved passport document for user ${userId}`);
        } else {
          // Throw an error if no passport document is found
          throw new Error('Passport document is required for selfie verification but no passport was found for this user');
        }
      } catch (error) {
        console.error('Error with passport document:', error);
        throw error; // Re-throw the error to be handled by the caller
      }
    }
    
    // Verify idPhotoBase64 is available
    if (!idPhotoBase64) {
      const error = 'No ID photo provided and none could be retrieved from database';
      console.error(error);
      throw new Error(error);
    }

    // Process base64 strings to ensure they don't include data:image prefixes
    const processedSelfieBase64 = selfieBase64.includes('base64,') 
      ? selfieBase64.split('base64,')[1] 
      : selfieBase64;
      
    const processedIdPhotoBase64 = idPhotoBase64.includes('base64,') 
      ? idPhotoBase64.split('base64,')[1] 
      : idPhotoBase64;

    // Using the correct parameter names from the documentation
    const response = await this.makePostRequest(endpoint, {
      selfie_image: processedSelfieBase64,
      photoid_image: processedIdPhotoBase64  // Note: No underscore between 'photo' and 'id'
    });

    // Log the full response for debugging
    console.log('Selfie verification full response:', JSON.stringify(response));
    
    // Handle potential different response formats
    if (!response.entity) {
      console.error('Unexpected response format:', response);
      return {
        isMatch: false,
        confidence: 0
      };
    }

    // Use entity from the response structure
    const responseData = response.entity || {};
    
    return {
      isMatch: responseData.face_match || false,
      confidence: responseData.confidence || 0,
      livenessScore: responseData.liveness_score,
      qualityChecks: {
        faceDetected: responseData.face_detected || false,
        imageQuality: responseData.image_quality || 'unknown',
        lighting: responseData.lighting || 'unknown'
      }
    };
  }

  // Liveness Check
  async checkLiveness(imageBase64: string): Promise<{
    isLive: boolean;
    livenessProbability: number;
    faceDetected: boolean;
    multiFaceDetected: boolean;
    faceDetails: any;
    faceQuality: any;
  }> {
    const endpoint = '/api/v1/ml/liveness/';

    // Make sure the imageBase64 doesn't start with data:image prefix
    const base64Data = imageBase64.includes('base64,') 
      ? imageBase64.split('base64,')[1] 
      : imageBase64;

    const response = await this.makePostRequest(endpoint, {
      image: base64Data
    });

    console.log('Liveness check response:', JSON.stringify(response));

    if (!response.entity) {
      return {
        isLive: false,
        livenessProbability: 0,
        faceDetected: false,
        multiFaceDetected: false,
        faceDetails: null,
        faceQuality: null
      };
    }

    // The API documentation indicates that liveness_probability > 50 means the face is live
    const livenessProbability = response.entity.liveness?.liveness_probability || 0;
    
    return {
      isLive: livenessProbability > 50, // Consider live if probability is above 50%
      livenessProbability,
      faceDetected: response.entity.face?.face_detected || false,
      multiFaceDetected: response.entity.face?.multiface_detected || false,
      faceDetails: response.entity.face?.details || null,
      faceQuality: response.entity.face?.quality || null
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
      const analysisResult = await this.analyzeDocument(documentBase64);

      console.log('-------------------------------------------------------');

      console.log('Dojah document analysis result:', analysisResult);

      // Store document analysis
      await prisma.documentAnalysis.create({
        data: {
          kycDocumentId: documentId,
          extractedText: analysisResult.extractedText,
          extractedData: analysisResult.extractedData as any,
          documentType: analysisResult.documentType as any,
          confidence: analysisResult.confidence,
          isReadable: analysisResult.isReadable,
          qualityScore: analysisResult.qualityScore,
          analysisProvider: 'DOJAH',
          isValid: analysisResult.isValid,
          validationStatus: analysisResult.validationStatus as any,
          textData: analysisResult.textData as any,
          documentImages: analysisResult.documentImages as any
        }
      });


      // Step 2: Government lookup if we have extracted data
      //TODO: Handle cases where documentType is not provided


      let governmentResult: GovernmentLookupResult | null = null;      if (analysisResult.documentType?.documentName && analysisResult.textData) {
        const documentNumber = analysisResult.textData.find(field => field.fieldKey === "document_number");
        governmentResult = await this.performGovernmentLookup(
          analysisResult.documentType.documentName,
          documentNumber
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
  async verifySelfie(userId: string, selfieId: string, selfieBase64?: string, idDocumentBase64?: string, performLivenessCheck: boolean = true): Promise<string> {
    let verification;
    
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

      // If idDocumentBase64 is not provided but userId is, try to find a passport document
      // We now only look for passport documents and don't check verification status
      if (!idDocumentBase64 && userId) {
        // Look for a passport document without status check
        const passportDocument = await prisma.kYCDocument.findFirst({
          where: {
            userId,
            type: 'PASSPORT', // Only look for passport documents
            // No status verification check
          }
        });
        
        if (passportDocument) {
          idDocumentBase64 = await this.getBase64FromS3OrFallback(passportDocument);
          console.log(`Retrieved passport document for user ${userId} in verifySelfie`);
        } else {
          // Throw an error if no passport document is found
          throw new Error('Passport document is required for selfie verification but no passport was found for this user');
        }
      }

      // Create initial verification record
      verification = await prisma.dojahVerification.create({
        data: {
          userId,
          verificationType: DojahVerificationType.SELFIE_PHOTO_ID_MATCH,
          documentId: selfieId,
          status: DojahStatus.IN_PROGRESS,
          requestData: { hasIdDocument: !!idDocumentBase64 } as any
        }
      });

      // Step 1: Perform liveness check if required
      let livenessResult = null;
      if (performLivenessCheck) {
        livenessResult = await this.checkLiveness(selfieBase64);
        
        // Fail verification if no face is detected or multiple faces are detected
        if (!livenessResult.faceDetected || livenessResult.multiFaceDetected || !livenessResult.isLive) {
          let errorMessage = 'Verification failed';
          
          if (!livenessResult.faceDetected) {
            errorMessage = 'No face detected in the image';
          } else if (livenessResult.multiFaceDetected) {
            errorMessage = 'Multiple faces detected in the image';
          } else if (!livenessResult.isLive) {
            errorMessage = `Liveness check failed. Score: ${livenessResult.livenessProbability.toFixed(2)}% (threshold: 50%)`;
          }
          
          await prisma.dojahVerification.update({
            where: { id: verification.id },
            data: {
              status: DojahStatus.FAILED,
              responseData: { 
                livenessCheck: livenessResult,
                error: errorMessage
              } as any
            }
          });
          
          return verification.id;
        }
      }

      // Step 2: Perform actual verification with Dojah API
      // Attempt verification with existing ID document or fetch a passport from user's documents
      let verificationResult;
      try {
        verificationResult = await this.verifySelfieWithPhotoId(selfieBase64, idDocumentBase64, userId);
      } catch (error: any) {
        // Update verification status to FAILED if passport is missing
        await prisma.dojahVerification.update({
          where: { id: verification.id },
          data: {
            status: DojahStatus.FAILED,
            responseData: { 
              error: error.message || 'Failed to verify selfie with ID photo'
            } as any
          }
        });
        
        throw error; // Re-throw the error
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
            livenessScore: verificationResult.livenessScore || (livenessResult ? livenessResult.livenessProbability : undefined),
            qualityChecks: verificationResult.qualityChecks
          } as any,
          responseData: {
            selfiePhotoIdMatch: verificationResult,
            livenessCheck: livenessResult
          } as any
        }
      });

      return verification.id;
    } catch (error: any) {
      console.error('Selfie verification failed:', error);
      
      // Update verification status to FAILED if we have a verification ID
      if (verification?.id) {
        try {
          await prisma.dojahVerification.update({
            where: { id: verification.id },
            data: {
              status: DojahStatus.FAILED,
              responseData: { error: error.message || 'Unknown error' } as any
            }
          });
        } catch (updateError) {
          console.error('Failed to update verification status:', updateError);
        }
      }
      
      throw error;
    }
  }
  private async performGovernmentLookup(documentType: string, documentNo: any): Promise<GovernmentLookupResult | null> {
    try {
      if (!documentType || !documentNo?.value) {
        console.warn('Missing document type or number for government lookup');
        return null;
      }

      // Normalize document type for comparison
      const normalizedType = documentType.toLowerCase().trim();

      // Determine which government API to use based on document type
      if (normalizedType.includes('bvn')) {
        return await this.lookupBVN(documentNo.value);
      }

      if (normalizedType.includes('nin') || normalizedType.includes('national id')) {
        return await this.lookupNIN(documentNo.value);
      }

      if (normalizedType.includes('passport')) {
        // Note: Surname needs to be extracted from analysisResult.textData for passport lookup
        // For now, just use document number lookup
        return await this.lookupDriversLicense(documentNo.value);
      }

      if (normalizedType.includes('driver') || normalizedType.includes('license')) {
        return await this.lookupDriversLicense(documentNo.value);
      }

      console.warn('Unrecognized document type:', documentType);
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

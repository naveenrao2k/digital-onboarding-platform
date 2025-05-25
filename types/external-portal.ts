// types/external-portal.ts

/**
 * External Portal Data Interface
 * Defines the structure of data expected from external portals
 */
export interface ExternalPortalData {
  /**
   * Unique identifier for the user from the external system
   * This is required and must be unique
   */
  id: string;
  
  /**
   * User's full name (optional)
   * Will be split into first and last name
   */
  name?: string;
  
  /**
   * User's contact phone number (optional)
   * International format recommended
   */
  phoneNumber?: string;
  
  /**
   * User's email address (optional)
   * If not provided, a placeholder will be created
   */
  email?: string;
  
  /**
   * Identifier for the source portal/system (optional)
   * Used for tracking and analytics
   */
  portalSource?: string;
  
  /**
   * Additional user information (optional)
   * Provides more detailed user information
   */
  additionalData?: {
    /**
     * Type of account
     * One of: 'INDIVIDUAL', 'PARTNERSHIP', 'ENTERPRISE', 'LLC'
     */
    accountType?: 'INDIVIDUAL' | 'PARTNERSHIP' | 'ENTERPRISE' | 'LLC';
    
    /**
     * Business name (for business accounts)
     */
    businessName?: string;
    
    /**
     * Type of business
     */
    businessType?: string;
    
    /**
     * User's occupation
     */
    occupation?: string;
    
    /**
     * User's source of income
     */
    sourceOfIncome?: string;
    
    /**
     * User's physical address
     */
    address?: string;
    
    /**
     * User's date of birth in YYYY-MM-DD format
     */
    dateOfBirth?: string;
    
    /**
     * Any additional fields (extensible)
     */
    [key: string]: any;
  };
  
  /**
   * Token for tracking the source portal (optional)
   * Can be used for referral tracking, campaign IDs, etc.
   */
  referenceToken?: string;
}

/**
 * Response from the access API endpoint
 */
export interface AccessApiResponse {
  /**
   * User ID in our system
   */
  id: string;
  
  /**
   * User's first name
   */
  firstName: string;
  
  /**
   * User's last name
   */
  lastName: string;
  
  /**
   * User's phone number
   */
  phone: string | null;
  
  /**
   * User's email
   */
  email: string;
  
  /**
   * User's role in the system
   */
  role: string;
  
  /**
   * Type of account
   */
  accountType: string;
  
  /**
   * Whether this is a new user
   */
  isNewUser: boolean;
  
  /**
   * Whether the user has already submitted KYC documents
   */
  hasSubmittedKyc: boolean;
  
  /**
   * Portal tracking data
   */
  portalData: {
    portalSource?: string;
    referenceToken?: string;
  };
  
  /**
   * URL to redirect the user to after successful access
   */
  redirectUrl: string;
}

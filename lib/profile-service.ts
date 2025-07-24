// lib/profile-service.ts
import { AccountType, AccountStatus, BusinessType } from '@/app/generated/prisma';

export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  address: string | null;
  dateOfBirth: Date | null;
  accountType: AccountType;
  accountStatus: AccountStatus;
  account: {
    businessName?: string | null;
    businessType?: BusinessType | null;
    businessAddress?: string | null;
    taxNumber?: string | null;
    rcNumber?: string | null;
    scumlNumber?: string | null;
    occupation?: string | null;
    sourceOfIncome?: string | null;
  } | null;
  verificationStatus: any;
  documents: Array<{
    id: string;
    type: string;
    fileName: string;
    uploadedAt: Date;
    status: string;
    verified: boolean;
  }>;
  references: Array<any>;
}

export const fetchUserProfile = async (): Promise<UserProfile> => {
  try {
    const response = await fetch('/api/user/profile');

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch user profile');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching user profile:', error);
    throw error;
  }
};

export const formatAccountType = (type: AccountType): string => {
  return type.toLowerCase().replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
};

export const getStatusBadgeColor = (status: string, darkMode: boolean = false) => {
  switch (status.toUpperCase()) {
    case 'APPROVED':
      return darkMode ? 'bg-green-900 text-green-100' : 'bg-green-100 text-green-800';
    case 'REJECTED':
      return darkMode ? 'bg-red-900 text-red-100' : 'bg-red-100 text-red-800';
    case 'PENDING':
      return darkMode ? 'bg-amber-900 text-amber-100' : 'bg-amber-100 text-amber-800';
    default:
      return darkMode ? 'bg-gray-800 text-gray-100' : 'bg-gray-100 text-gray-800';
  }
};

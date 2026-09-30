export interface PortfolioImage {
  id: string;
  localUri: string;
  remoteUrl?: string;
  uploadStatus: 'pending' | 'uploading' | 'success' | 'error';
}

export interface MuaServiceDraft {
  id: string;
  name: string;
  durationMinutes: number;
  price: number;
  isPopular: boolean;
}

export interface MuaDraft {
  personalInfo: {
    fullName: string;
    phone: string;
    address: string;
    experienceYears: string;
  };
  specialties: string[];
  portfolio: PortfolioImage[];
  services: MuaServiceDraft[];
  professionalBio: {
    bio: string;
    instagramUrl: string;
    facebookUrl: string;
    websiteUrl: string;
  };
}

export interface MuaApplicationRequestDto {
  displayName: string;
  phoneNumber?: string;
  city: string;
  bio: string;
  experienceYears?: number;
  specialization?: string;
  socialLinks?: string;
  avatarUrl: string;
  styleIds: number[];
  address?: string;
  district?: string;
  provinceCode?: number;
  districtCode?: number;
  experienceLevel?: 'BEGINNER' | 'UNDER_ONE' | 'ONE_TO_THREE' | 'THREE_TO_FIVE' | 'OVER_FIVE';
  latitude?: number;
  longitude?: number;
}

export interface MuaIdentityVerificationRequestDto {
  identityFrontUrl: string;
  identityBackUrl: string;
  portraitUrl: string;
  certificateUrls: string[];
}

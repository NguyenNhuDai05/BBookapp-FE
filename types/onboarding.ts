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
}

export interface MuaApplicationResponseDto {
  profile: any;
  status: string;
}

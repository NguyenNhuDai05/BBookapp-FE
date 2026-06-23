import { create } from 'zustand';
import type { MuaDraft, PortfolioImage, MuaServiceDraft } from '../types/onboarding';

interface OnboardingState {
  draft: MuaDraft;
  
  // Actions
  updatePersonalInfo: (data: Partial<MuaDraft['personalInfo']>) => void;
  toggleSpecialty: (specialtyId: string) => void;
  
  addPortfolioImages: (images: PortfolioImage[]) => void;
  removePortfolioImage: (imageId: string) => void;
  updatePortfolioImageStatus: (imageId: string, updates: Partial<PortfolioImage>) => void;
  
  addService: (service: MuaServiceDraft) => void;
  removeService: (serviceId: string) => void;
  
  updateProfessionalBio: (data: Partial<MuaDraft['professionalBio']>) => void;
  
  resetDraft: () => void;
  setDraft: (draft: MuaDraft) => void;
}

const initialDraft: MuaDraft = {
  personalInfo: {
    fullName: '',
    phone: '',
    address: '',
    experienceYears: '1-3 năm',
  },
  specialties: [],
  portfolio: [],
  services: [],
  professionalBio: {
    bio: '',
    instagramUrl: '',
    facebookUrl: '',
    websiteUrl: '',
  },
};

export const useOnboardingStore = create<OnboardingState>((set) => ({
  draft: initialDraft,

  updatePersonalInfo: (data) =>
    set((state) => ({
      draft: {
        ...state.draft,
        personalInfo: { ...state.draft.personalInfo, ...data },
      },
    })),

  toggleSpecialty: (specialtyId) =>
    set((state) => {
      const exists = state.draft.specialties.includes(specialtyId);
      return {
        draft: {
          ...state.draft,
          specialties: exists
            ? state.draft.specialties.filter((id) => id !== specialtyId)
            : [...state.draft.specialties, specialtyId],
        },
      };
    }),

  addPortfolioImages: (images) =>
    set((state) => ({
      draft: {
        ...state.draft,
        portfolio: [...state.draft.portfolio, ...images],
      },
    })),

  removePortfolioImage: (imageId) =>
    set((state) => ({
      draft: {
        ...state.draft,
        portfolio: state.draft.portfolio.filter((img) => img.id !== imageId),
      },
    })),

  updatePortfolioImageStatus: (imageId, updates) =>
    set((state) => ({
      draft: {
        ...state.draft,
        portfolio: state.draft.portfolio.map((img) =>
          img.id === imageId ? { ...img, ...updates } : img
        ),
      },
    })),

  addService: (service) =>
    set((state) => ({
      draft: {
        ...state.draft,
        services: [...state.draft.services, service],
      },
    })),

  removeService: (serviceId) =>
    set((state) => ({
      draft: {
        ...state.draft,
        services: state.draft.services.filter((s) => s.id !== serviceId),
      },
    })),

  updateProfessionalBio: (data) =>
    set((state) => ({
      draft: {
        ...state.draft,
        professionalBio: { ...state.draft.professionalBio, ...data },
      },
    })),

  resetDraft: () => set({ draft: initialDraft }),
  
  setDraft: (draft) => set({ draft }),
}));

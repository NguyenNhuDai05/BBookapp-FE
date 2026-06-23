import { create } from 'zustand';
import type { SelectedServiceDto, MuaMinimalDto } from '../types/booking';

interface BookingDraft {
  mua: MuaMinimalDto | null;
  services: SelectedServiceDto[];
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  address: string;
  note: string;
  paymentMethod: string;
}

interface BookingStore {
  draft: BookingDraft;
  lastViewedPortfolioId: string | null;
  
  // Actions
  setLastViewedPortfolioId: (id: string | null) => void;
  setMua: (mua: MuaMinimalDto) => void;
  addService: (service: SelectedServiceDto) => void;
  updateServiceParticipantsCount: (serviceId: string, participantsCount: number) => void;
  removeService: (serviceId: string) => void;
  setDate: (date: string) => void;
  setTime: (time: string) => void;
  setAddress: (address: string) => void;
  setNote: (note: string) => void;
  setPaymentMethod: (method: string) => void;
  resetDraft: () => void;
  
  // Selectors/Computed
  getTotalDuration: () => number;
  getServiceTotal: () => number;
}

const initialDraft: BookingDraft = {
  mua: null,
  services: [],
  date: '',
  time: '',
  address: '',
  note: '',
  paymentMethod: 'Ví BeautyBook',
};

export const useBookingStore = create<BookingStore>((set, get) => ({
  draft: initialDraft,
  lastViewedPortfolioId: null,

  setLastViewedPortfolioId: (id) => set({ lastViewedPortfolioId: id }),

  setMua: (mua) => set((state) => ({ draft: { ...state.draft, mua } })),
  
  addService: (service) => set((state) => {
    const existing = state.draft.services.find(s => s.id === service.id);
    if (existing) {
      return {
        draft: {
          ...state.draft,
          services: state.draft.services.map(s => 
            s.id === service.id ? { ...s, participantsCount: s.participantsCount + service.participantsCount } : s
          )
        }
      };
    }
    return {
      draft: { ...state.draft, services: [...state.draft.services, service] }
    };
  }),

  updateServiceParticipantsCount: (serviceId, participantsCount) => set((state) => {
    if (participantsCount <= 0) {
      return {
        draft: {
          ...state.draft,
          services: state.draft.services.filter(s => s.id !== serviceId)
        }
      };
    }
    return {
      draft: {
        ...state.draft,
        services: state.draft.services.map(s =>
          s.id === serviceId ? { ...s, participantsCount } : s
        )
      }
    };
  }),

  removeService: (serviceId) => set((state) => ({
    draft: {
      ...state.draft,
      services: state.draft.services.filter(s => s.id !== serviceId)
    }
  })),

  setDate: (date) => set((state) => ({ draft: { ...state.draft, date } })),
  setTime: (time) => set((state) => ({ draft: { ...state.draft, time } })),
  setAddress: (address) => set((state) => ({ draft: { ...state.draft, address } })),
  setNote: (note) => set((state) => ({ draft: { ...state.draft, note } })),
  setPaymentMethod: (paymentMethod) => set((state) => ({ draft: { ...state.draft, paymentMethod } })),
  
  resetDraft: () => set({ draft: initialDraft }),

  getTotalDuration: () => {
    return get().draft.services.reduce((total, s) => total + (s.durationMinutes * s.participantsCount), 0);
  },

  getServiceTotal: () => {
    return get().draft.services.reduce((total, s) => total + (s.price * s.participantsCount), 0);
  }
}));

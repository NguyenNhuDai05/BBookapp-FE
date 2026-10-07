import { create } from 'zustand';
import type { Coordinate } from '../types/location';
import type { BookingDto, SelectedServiceDto, MuaMinimalDto } from '../types/booking';

interface BookingDraft {
  location: { mode: 'CUSTOMER_ADDRESS' } | { mode: 'MUA_WORK_LOCATION'; sourceMuaId: string; name?: string; address: string };
  mua: MuaMinimalDto | null;
  services: SelectedServiceDto[];
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  address: string;
  addressCoordinates?: Coordinate;
  addressDetails: string;
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
  setAddress: (address: string, coordinates?: Coordinate, details?: string) => void;
  setWorkLocation: (sourceMuaId: string, address: string, name?: string) => void;
  useCustomerAddress: () => void;
  setNote: (note: string) => void;
  setPaymentMethod: (method: string) => void;
  startRebooking: (booking: Pick<BookingDto, 'mua' | 'services'>) => void;
  resetDraft: () => void;
  
  // Selectors/Computed
  getTotalDuration: () => number;
  getServiceTotal: () => number;
}

const initialDraft: BookingDraft = {
  location: { mode: 'CUSTOMER_ADDRESS' },
  mua: null,
  services: [],
  date: '',
  time: '',
  address: '',
  addressDetails: '',
  note: '',
  paymentMethod: 'payOS',
};

export const useBookingStore = create<BookingStore>((set, get) => ({
  draft: initialDraft,
  lastViewedPortfolioId: null,

  setLastViewedPortfolioId: (id) => set({ lastViewedPortfolioId: id }),

  setMua: (mua) => set((state) => ({ draft: { ...state.draft, mua, time: '', ...(state.draft.location.mode === 'MUA_WORK_LOCATION' && state.draft.location.sourceMuaId !== mua.id ? { location: { mode: 'CUSTOMER_ADDRESS' as const } } : {}) } })),
  
  addService: (service) => set((state) => {
    const existing = state.draft.services.find(s => s.id === service.id);
    if (existing) {
      return {
        draft: {
          ...state.draft,
          time: '',
          services: state.draft.services.map(s => 
            s.id === service.id ? { ...s, participantsCount: s.participantsCount + service.participantsCount } : s
          )
        }
      };
    }
    return {
      draft: { ...state.draft, services: [...state.draft.services, service], time: '' }
    };
  }),

  updateServiceParticipantsCount: (serviceId, participantsCount) => set((state) => {
    if (participantsCount <= 0) {
      return {
        draft: {
          ...state.draft,
          time: '',
          services: state.draft.services.filter(s => s.id !== serviceId)
        }
      };
    }
    return {
      draft: {
        ...state.draft,
        time: '',
        services: state.draft.services.map(s =>
          s.id === serviceId ? { ...s, participantsCount } : s
        )
      }
    };
  }),

  removeService: (serviceId) => set((state) => ({
    draft: {
      ...state.draft,
      services: state.draft.services.filter(s => s.id !== serviceId),
      time: '',
    }
  })),

  setDate: (date) => set((state) => ({ draft: { ...state.draft, date } })),
  setTime: (time) => set((state) => ({ draft: { ...state.draft, time } })),
  setAddress: (address, addressCoordinates, addressDetails = '') => set((state) => ({ draft: { ...state.draft, address, addressCoordinates, addressDetails, location: { mode: 'CUSTOMER_ADDRESS' } } })),
  setWorkLocation: (sourceMuaId, address, name) => set((state) => state.draft.mua?.id !== sourceMuaId || !address.trim() ? {} : ({ draft: { ...state.draft, location: { mode: 'MUA_WORK_LOCATION', sourceMuaId, address: address.trim(), name } } })),
  useCustomerAddress: () => set((state) => ({ draft: { ...state.draft, location: { mode: 'CUSTOMER_ADDRESS' } } })),
  setNote: (note) => set((state) => ({ draft: { ...state.draft, note } })),
  setPaymentMethod: (paymentMethod) => set((state) => ({ draft: { ...state.draft, paymentMethod } })),

  startRebooking: (booking) => set({
    draft: {
      ...initialDraft,
      mua: { ...booking.mua },
      services: booking.services.map(service => ({ ...service })),
    },
  }),
  
  resetDraft: () => set({ draft: initialDraft }),

  getTotalDuration: () => {
    return get().draft.services.reduce((total, s) => total + (s.durationMinutes * s.participantsCount), 0);
  },

  getServiceTotal: () => {
    return get().draft.services.reduce((total, s) => total + (s.price * s.participantsCount), 0);
  }
}));

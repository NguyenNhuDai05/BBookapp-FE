import { create } from 'zustand';

interface RegistrationDraft {
  fullName: string;
  email: string;
  password: string;
}

// Keep credentials only in memory, never in route parameters or persisted storage.
export const useRegistrationStore = create<{
  draft: RegistrationDraft | null;
  resendAt: number;
  begin: (draft: RegistrationDraft) => void;
  markSent: () => void;
  clear: () => void;
}>((set) => ({
  draft: null,
  resendAt: 0,
  begin: (draft) => set({ draft, resendAt: Date.now() + 45_000 }),
  markSent: () => set({ resendAt: Date.now() + 45_000 }),
  clear: () => set({ draft: null, resendAt: 0 }),
}));

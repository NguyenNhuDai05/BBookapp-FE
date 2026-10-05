import { useBookingStore } from '../useBookingStore';
const mua = (id: string) => ({ id, name: id, avatarUrl: '', rating: 0, reviewCount: 0, location: '', yearsOfExp: 0 });
beforeEach(() => useBookingStore.getState().resetDraft());
it('clears workplace A when switching to B, while preserving separately entered customer address', () => {
  const store = useBookingStore.getState(); store.setMua(mua('A')); store.setAddress('Customer address', { latitude: 10, longitude: 106 }); store.setWorkLocation('A', 'Studio A', 'A'); store.setMua(mua('B'));
  expect(useBookingStore.getState().draft.location).toEqual({ mode: 'CUSTOMER_ADDRESS' });
  expect(useBookingStore.getState().draft.address).toBe('Customer address');
});
it('keeps same MUA workplace while changing services and prevents assigning another MUA workplace', () => {
  const store = useBookingStore.getState(); store.setMua(mua('A')); store.setWorkLocation('A', 'Studio A'); store.setMua(mua('A')); store.addService({ id: 'S', name: 'S', durationMinutes: 60, price: 100, participantsCount: 1 });
  expect(useBookingStore.getState().draft.location).toEqual({ mode: 'MUA_WORK_LOCATION', sourceMuaId: 'A', address: 'Studio A' });
  store.setWorkLocation('B', 'Spoofed'); expect(useBookingStore.getState().draft.location).toMatchObject({ sourceMuaId: 'A' });
});
it('manual address selection replaces workplace mode and reset clears all destinations', () => {
  const store = useBookingStore.getState(); store.setMua(mua('A')); store.setWorkLocation('A', 'Studio A'); store.setAddress('Customer address');
  expect(useBookingStore.getState().draft.location.mode).toBe('CUSTOMER_ADDRESS'); store.resetDraft();
  expect(useBookingStore.getState().draft.address).toBe(''); expect(useBookingStore.getState().draft.addressCoordinates).toBeUndefined(); expect(useBookingStore.getState().draft.mua).toBeNull();
});

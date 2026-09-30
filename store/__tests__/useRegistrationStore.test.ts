import { useRegistrationStore } from '../useRegistrationStore';

describe('registration draft', () => {
  afterEach(() => { useRegistrationStore.getState().clear(); jest.restoreAllMocks(); });

  it('keeps the draft for verification and starts the resend cooldown', () => {
    jest.spyOn(Date, 'now').mockReturnValue(1000);
    const draft = { fullName: 'Nguyen An', email: 'an@example.com', password: 'secret123' };
    useRegistrationStore.getState().begin(draft);
    expect(useRegistrationStore.getState().draft).toEqual(draft);
    expect(useRegistrationStore.getState().resendAt).toBe(46000);
  });

  it('restarts the cooldown after resending and clears credentials on completion', () => {
    useRegistrationStore.getState().begin({ fullName: 'An', email: 'an@example.com', password: 'secret123' });
    jest.spyOn(Date, 'now').mockReturnValue(50000);
    useRegistrationStore.getState().markSent();
    expect(useRegistrationStore.getState().resendAt).toBe(95000);
    useRegistrationStore.getState().clear();
    expect(useRegistrationStore.getState().draft).toBeNull();
    expect(useRegistrationStore.getState().resendAt).toBe(0);
  });
});

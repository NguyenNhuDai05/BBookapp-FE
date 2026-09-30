import { describe, expect, it, jest } from '@jest/globals';
import { BANK_ACCOUNTS_QUERY_KEY, invalidateBankAccountState, MUA_BANK_ELIGIBILITY_QUERY_KEY, MUA_EARNINGS_QUERY_KEY } from '../../utils/bankAccountCache';

describe('MUA bank account cache invalidation', () => {
  it('refetches only bank-account and eligibility state after a successful default change', async () => {
    const invalidateQueries = jest.fn(async () => undefined);

    await invalidateBankAccountState({ invalidateQueries } as never);

    expect(invalidateQueries).toHaveBeenCalledTimes(3);
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: BANK_ACCOUNTS_QUERY_KEY });
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: MUA_BANK_ELIGIBILITY_QUERY_KEY });
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: MUA_EARNINGS_QUERY_KEY });
  });
});

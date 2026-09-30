export const BANK_ACCOUNTS_QUERY_KEY = ['bank-accounts'] as const;
export const MUA_BANK_ELIGIBILITY_QUERY_KEY = ['mua','eligibility'] as const;
export const MUA_EARNINGS_QUERY_KEY = ['mua-earnings'] as const;

interface QueryInvalidator {
  invalidateQueries: (filters: { queryKey: readonly string[] }) => Promise<unknown>;
}

export const invalidateBankAccountState = (client: QueryInvalidator) => Promise.all([
  client.invalidateQueries({queryKey:BANK_ACCOUNTS_QUERY_KEY}),
  client.invalidateQueries({queryKey:MUA_BANK_ELIGIBILITY_QUERY_KEY}),
  client.invalidateQueries({queryKey:MUA_EARNINGS_QUERY_KEY}),
]);

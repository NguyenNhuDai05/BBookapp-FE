import { QueryClient } from '@tanstack/react-query';
import { getApiError } from '../services/api';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        const apiError = getApiError(error);
        if (apiError.status && [401, 403, 404].includes(apiError.status)) return false;
        return failureCount < 2 && (apiError.isNetworkError || (apiError.status !== undefined && apiError.status >= 500));
      },
      refetchOnReconnect: true,
    },
    mutations: {
      retry: false,
    },
  },
});

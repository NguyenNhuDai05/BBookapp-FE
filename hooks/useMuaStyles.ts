import { useQuery } from '@tanstack/react-query';
import { muaStyleService } from '../services/muaStyleService';

export const MUA_STYLES_QUERY_KEY = ['mua-styles'] as const;

export function useMuaStyles() {
  return useQuery({
    queryKey: MUA_STYLES_QUERY_KEY,
    queryFn: muaStyleService.getActiveStyles,
    staleTime: 30 * 60 * 1000,
  });
}

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { muaServicesService } from '../services/muaServicesService';
import { CreateServiceRequest, UpdateServiceRequest } from '../types/ServiceDto';
import { MUA_ELIGIBILITY_QUERY_KEY } from './useMuaEligibility';
import { getApiError } from '../services/api';

const refreshStyleConflict = async (queryClient: ReturnType<typeof useQueryClient>, error: unknown) => {
  if (getApiError(error).status !== 409) return;
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: ['mua-profile'] }),
    queryClient.invalidateQueries({ queryKey: ['advisor'] }),
    queryClient.invalidateQueries({ queryKey: ['mua-styles'] }),
  ]);
};

const refreshServicesAndEligibility = async (queryClient: ReturnType<typeof useQueryClient>, muaId: string) => {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: ['mua-profile'] }),
    queryClient.invalidateQueries({ queryKey: ['advisor'] }),
    queryClient.invalidateQueries({ queryKey: ['mua-styles'] }),
    queryClient.invalidateQueries({ queryKey: ['mua-services', muaId] }),
    queryClient.invalidateQueries({ queryKey: MUA_ELIGIBILITY_QUERY_KEY }),
    queryClient.invalidateQueries({ queryKey: ['customer-explore'] }),
    queryClient.invalidateQueries({ queryKey: ['feed'] }),
  ]);
};

export const useMuaServices = (muaId: string) => {
  return useQuery({
    queryKey: ['mua-services', muaId],
    queryFn: () => muaServicesService.getServices(muaId),
    staleTime: 10 * 60 * 1000, // 10 min
  });
};

export const useCreateService = (muaId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (service: CreateServiceRequest) => muaServicesService.createService(muaId, service),
    onError: error => refreshStyleConflict(queryClient, error),
    onSuccess: () => refreshServicesAndEligibility(queryClient, muaId),
  });
};

export const useUpdateService = (muaId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ serviceId, updates }: { serviceId: string; updates: UpdateServiceRequest }) => 
      muaServicesService.updateService(serviceId, updates),
    onError: error => refreshStyleConflict(queryClient, error),
    onSuccess: () => refreshServicesAndEligibility(queryClient, muaId),
  });
};

export const useDeleteService = (muaId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (serviceId: string) => muaServicesService.deleteService(serviceId),
    onSuccess: () => refreshServicesAndEligibility(queryClient, muaId),
  });
};

export const useSetServiceActive = (muaId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ serviceId, isActive }: { serviceId: string; isActive: boolean }) =>
      muaServicesService.setActive(serviceId, isActive),
    onSuccess: () => refreshServicesAndEligibility(queryClient, muaId),
  });
};

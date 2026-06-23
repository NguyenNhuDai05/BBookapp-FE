import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { muaServicesService } from '../services/muaServicesService';
import { CreateServiceRequest, UpdateServiceRequest } from '../types/ServiceDto';

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
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['mua-services', muaId] }),
  });
};

export const useUpdateService = (muaId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ serviceId, updates }: { serviceId: string; updates: UpdateServiceRequest }) => 
      muaServicesService.updateService(serviceId, updates),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['mua-services', muaId] }),
  });
};

export const useDeleteService = (muaId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (serviceId: string) => muaServicesService.deleteService(serviceId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['mua-services', muaId] }),
  });
};

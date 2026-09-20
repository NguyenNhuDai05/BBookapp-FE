import { ApiAdminPayoutRepository } from '../repositories/ApiAdminPayoutRepository';
import type { CompleteAdminPayoutRequest, FailAdminPayoutRequest, StartAdminPayoutRequest } from '../types/adminPayout';

const repository = new ApiAdminPayoutRepository();

export const adminPayoutService = {
  getQueue: () => repository.getQueue(),
  getById: (id: string) => repository.getById(id),
  startProcessing: (id: string, request: StartAdminPayoutRequest) => repository.startProcessing(id, request),
  complete: (id: string, request: CompleteAdminPayoutRequest) => repository.complete(id, request),
  fail: (id: string, request: FailAdminPayoutRequest) => repository.fail(id, request),
};

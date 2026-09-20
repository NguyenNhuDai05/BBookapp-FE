import { api } from '../services/api';
import type {
  AdminPayoutDto,
  AdminPayoutProvider,
  AdminPayoutStatus,
  CompleteAdminPayoutRequest,
  FailAdminPayoutRequest,
  StartAdminPayoutRequest,
} from '../types/adminPayout';

const mapStatus = (value: unknown): AdminPayoutStatus => {
  const values: Record<string, AdminPayoutStatus> = {
    '0': 'PENDING', Pending: 'PENDING',
    '1': 'MANUAL_ACTION_REQUIRED', ManualActionRequired: 'MANUAL_ACTION_REQUIRED',
    '2': 'PROCESSING', Processing: 'PROCESSING',
    '3': 'PAID', Paid: 'PAID',
    '4': 'FAILED', Failed: 'FAILED',
  };
  return values[String(value)] ?? 'UNKNOWN';
};

const mapProvider = (value: unknown): AdminPayoutProvider => {
  const values: Record<string, AdminPayoutProvider> = {
    '0': 'MANUAL', Manual: 'MANUAL',
    '1': 'PAYOS', PayOS: 'PAYOS',
  };
  return values[String(value)] ?? 'UNKNOWN';
};

const mapPayout = (value: any, includeSensitive = false): AdminPayoutDto => ({
  id: String(value.id ?? ''),
  amount: Number(value.amount ?? 0),
  status: mapStatus(value.status),
  provider: mapProvider(value.provider),
  bankCode: String(value.bankCode ?? ''),
  bankName: value.bankName || undefined,
  maskedAccountNumber: String(value.maskedAccountNumber ?? ''),
  accountNumber: includeSensitive && value.accountNumber ? String(value.accountNumber) : undefined,
  accountHolderName: String(value.accountHolderName ?? ''),
  providerReference: value.providerReference || undefined,
  idempotencyKey: String(value.idempotencyKey ?? ''),
  receivableIds: Array.isArray(value.receivableIds) ? value.receivableIds.map(String) : [],
  createdAt: String(value.createdAt ?? ''),
  processingAt: value.processingAt || undefined,
  paidAt: value.paidAt || undefined,
  failedAt: value.failedAt || undefined,
  reconciledAt: value.reconciledAt || undefined,
  failureCode: value.failureCode || undefined,
  failureMessage: value.failureMessage || undefined,
});

export class ApiAdminPayoutRepository {
  async getQueue(): Promise<AdminPayoutDto[]> {
    const { data } = await api.get('/admin/payouts');
    if (!Array.isArray(data)) throw new Error('Dữ liệu payout không hợp lệ.');
    return data.map(value => mapPayout(value));
  }

  async getById(id: string): Promise<AdminPayoutDto> {
    const { data } = await api.get(`/admin/payouts/${id}`);
    return mapPayout(data, true);
  }

  async startProcessing(id: string, request: StartAdminPayoutRequest): Promise<AdminPayoutDto> {
    const { data } = await api.post(`/admin/payouts/${id}/start-processing`, request);
    return mapPayout(data);
  }

  async complete(id: string, request: CompleteAdminPayoutRequest): Promise<AdminPayoutDto> {
    const { data } = await api.post(`/admin/payouts/${id}/complete`, request);
    return mapPayout(data);
  }

  async fail(id: string, request: FailAdminPayoutRequest): Promise<AdminPayoutDto> {
    const { data } = await api.post(`/admin/payouts/${id}/fail`, request);
    return mapPayout(data);
  }
}

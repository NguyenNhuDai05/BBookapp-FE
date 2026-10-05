import type { VerificationStatus } from '../types/muaProfile';

export function getMuaStatusLabel(status?: VerificationStatus): string {
  switch (status) {
    case 'APPROVED': return 'Đã xác minh';
    case 'PENDING':
    case 'PENDINGREVIEW': return 'Đang chờ duyệt';
    case 'REJECTED': return 'Cần bổ sung hồ sơ';
    case 'DRAFT':
    case 'UNVERIFIED': return 'Chưa gửi xét duyệt';
    default: return 'Chưa có thông tin xác minh';
  }
}

export function getMuaListingLabel(status?: string): string | undefined {
  switch (status) {
    case 'LISTED': return 'Đang hiển thị trên BBook';
    case 'DRAFT': return 'Hồ sơ chưa công khai';
    case 'SUSPENDED': return 'Hồ sơ đang tạm ngưng';
    default: return undefined;
  }
}

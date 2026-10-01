export type ComplaintSummary = { id: string; bookingId: string; category: string; status: string; isOpen: boolean; createdAt: string; resolvedAt?: string };
export type ComplaintEligibility = { canCreateComplaint: boolean; complaintDeadline?: string; unavailableReason?: string; activeComplaintId?: string; paidAmount: number; complaintWindowHours: number };
export type ComplaintMessage = { id: string; authorRole: string; kind: string; body: string; imageUrls: string[]; createdAt: string; internal: boolean };
export type ComplaintDetail = ComplaintSummary & {
  description: string; requestedOutcome: string; requestedAmount?: number; responseDeadline?: string;
  decisionReason?: string; approvedRefundAmount?: number; paidAmount: number; needsFinancialReconciliation: boolean;
  viewerRole: 'Customer' | 'MUA' | 'Admin'; messages: ComplaintMessage[];
  refund?: { refundId: string; amount: number; status: number | string; completedAt?: string };
  booking: { customerName?: string; muaName?: string; totalAmount: number; depositAmount: number };
};
export const complaintLabels: Record<string, string> = { Submitted: 'Đã tiếp nhận', AwaitingCustomer: 'Chờ khách bổ sung', AwaitingMua: 'Chờ MUA phản hồi', UnderReview: 'Admin đang xử lý', ResolvedRejected: 'Đã có quyết định', ResolvedRefund: 'Đã chấp nhận hoàn tiền' };
export const complaintCategories: Record<string, string> = { NoShow: 'MUA không đến', Late: 'Sai giờ hẹn / đến trễ', Quality: 'Chất lượng dịch vụ', ExtraFee: 'Phát sinh chi phí', Conduct: 'Hành vi không phù hợp', Other: 'Vấn đề khác' };

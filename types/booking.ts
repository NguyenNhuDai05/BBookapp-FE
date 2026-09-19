import { ServiceDto } from './ServiceDto';

export { ServiceDto };
export interface SelectedServiceDto {
  id: string;
  name: string;
  durationMinutes: number;
  price: number;
  participantsCount: number;
  imageUrl?: string;
  description?: string;
}

export interface MuaMinimalDto {
  id: string;
  name: string;
  avatarUrl: string;
  rating: number;
  reviewCount: number;
  location: string;
  yearsOfExp: number;
}

export interface TimeSlotDto {
  time: string; // e.g. "08:00"
  available: boolean;
}

export type BookingStatus =
  | 'PENDING_PAYMENT'
  | 'PENDING_CONFIRMATION'
  | 'CONFIRMED'
  | 'REJECTED'
  | 'IN_PROGRESS'
  | 'WAITING_CUSTOMER'
  | 'COMPLETED'
  | 'DISPUTED'
  | 'AUTO_COMPLETED'
  | 'CANCELLED';

export enum PaymentStatus {
  UNPAID = 0,
  PAID_LEGACY = 1,
  REFUNDED = 2,
  FAILED = 3,
  DEPOSIT_HELD = 4,
  RELEASED = 5,
  FROZEN = 6,
  REFUND_PENDING = 7,
}

export type BookingPaymentStatus = 'CREATED' | 'PENDING' | 'PAID' | 'FAILED' | 'EXPIRED' | 'REFUND_PENDING' | 'REFUNDED';

export interface BookingPaymentDto {
  paymentId: string;
  bookingId: string;
  orderCode: number;
  amount: number;
  status: BookingPaymentStatus;
  checkoutUrl: string;
  qrCode?: string;
  expiresAt: string;
  paidAt?: string;
}

export interface CustomerMinimalDto {
  id: string;
  name: string;
  avatarUrl?: string;
  phone: string;
}

export interface BookingDto {
  id: string;
  mua: MuaMinimalDto;
  customer: CustomerMinimalDto;
  services: SelectedServiceDto[];
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  address: string;
  locationType: 'AT_STUDIO' | 'HOME_SERVICE';
  note?: string;
  status: BookingStatus;
  paymentStatus: PaymentStatus;
  rejectReason?: string;
  
  serviceTotal: number;
  travelFee: number;
  totalAmount: number;
  depositRate: number;
  depositAmount: number;
  platformFeeAmount: number;
  muaPayoutAmount: number;
  remainingAmount: number;
  
  paymentMethod: string;
  createdAt: string;
  updatedAt: string;
  
  // For cancelled bookings
  cancelReason?: string;
  cancelNote?: string;
  cancelledAt?: string;
  isReviewed?: boolean;
  
  // Status timestamps
  confirmedAt?: string;
  depositPaidAt?: string;
  startedAt?: string;
  waitingCustomerAt?: string;
  customerConfirmationDeadline?: string;
  completedAt?: string;
  rejectedAt?: string;
  disputedAt?: string;
  disputeReason?: string;
  paymentExpiresAt?: string;
}

export interface CreateBookingRequest {
  muaId: string;
  services: { serviceId: string; participantsCount: number }[];
  date: string;
  time: string;
  address: string;
  note?: string;
  paymentMethod: string;
}

export interface CancelBookingRequest {
  bookingId: string;
  reason: string;
  note?: string;
}

export interface ReviewCreateRequest {
  bookingId: string;
  rating: number;
  comment?: string;
  imageUrl?: string;
}

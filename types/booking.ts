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

export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'IN_PROGRESS' | 'WAITING_CUSTOMER' | 'COMPLETED' | 'CANCELLED' | 'REJECTED';

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
  rejectReason?: string;
  
  serviceTotal: number;
  travelFee: number;
  totalAmount: number;
  depositAmount: number;
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
  startedAt?: string;
  completedAt?: string;
}

export interface CreateBookingRequest {
  muaId: string;
  services: Array<{ serviceId: string; participantsCount: number }>;
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

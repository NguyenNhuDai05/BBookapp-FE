import { api } from "./api";

export type BookingStatus = "Pending" | "Approved" | "Completed" | "Cancelled";

export interface BookingCreateInput {
  muaId: string;
  serviceId: string;
  bookingDate: string;
  address: string;
  note?: string;
}

export interface BookingItem {
  id: string;
  customerId: string;
  customerName?: string;
  muaId: string;
  muaName: string;
  serviceId: string;
  serviceName: string;
  bookingDate: string;
  address: string;
  note?: string;
  totalPrice: number;
  status: BookingStatus;
  hasReview: boolean;
  createdAt: string;
}

interface BackendBooking {
  bookingId: string;
  customerId: string;
  customerName?: string;
  muaId: string;
  muaName?: string;
  serviceId: string;
  serviceName?: string;
  bookingDate: string;
  address?: string;
  note?: string;
  totalPrice?: number;
  status: number | string;
  hasReview?: boolean;
  createdAt: string;
}

const STATUS_LABELS: Record<number, BookingStatus> = {
  0: "Pending",
  1: "Approved",
  2: "Completed",
  3: "Cancelled",
};

export const formatMoney = (value: number) =>
  `${new Intl.NumberFormat("vi-VN").format(value)}đ`;

export const formatBookingDate = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

const toBookingItem = (booking: BackendBooking): BookingItem => ({
  id: booking.bookingId,
  customerId: booking.customerId,
  customerName: booking.customerName,
  muaId: booking.muaId,
  muaName: booking.muaName || "Makeup Artist",
  serviceId: booking.serviceId,
  serviceName: booking.serviceName || "Dịch vụ trang điểm",
  bookingDate: booking.bookingDate,
  address: booking.address || "",
  note: booking.note,
  totalPrice: Number(booking.totalPrice || 0),
  status:
    typeof booking.status === "number"
      ? STATUS_LABELS[booking.status] || "Pending"
      : (booking.status as BookingStatus),
  hasReview: Boolean(booking.hasReview),
  createdAt: booking.createdAt,
});

export const bookingService = {
  createBooking: async (input: BookingCreateInput): Promise<BookingItem> => {
    const response = await api.post("/Booking", {
      muaId: input.muaId,
      serviceId: input.serviceId,
      bookingDate: input.bookingDate,
      address: input.address,
      note: input.note,
    });

    return toBookingItem(response.data.booking || response.data.Booking);
  },

  getBookings: async (): Promise<BookingItem[]> => {
    const response = await api.get("/Booking");
    const bookings: BackendBooking[] = response.data;
    return bookings.map(toBookingItem);
  },

  updateStatus: async (
    bookingId: string,
    status: BookingStatus,
  ): Promise<void> => {
    await api.put(`/Booking/${bookingId}/status`, { status });
  },
};

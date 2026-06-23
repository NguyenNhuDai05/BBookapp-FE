export interface DailyAvailabilityDto {
  date: string; // YYYY-MM-DD
  isOffDay: boolean;
  timeSlots: {
    time: string; // HH:mm
    available: boolean;
    bookingId?: string; // Link to confirmed booking if unavailable
  }[];
}

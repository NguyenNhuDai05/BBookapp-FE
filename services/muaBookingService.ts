import type { IMuaBookingRepository } from '../repositories/IMuaBookingRepository';
import { ApiMuaBookingRepository } from '../repositories/ApiMuaBookingRepository';

// Inject real API repository
export const muaBookingService: IMuaBookingRepository = new ApiMuaBookingRepository();

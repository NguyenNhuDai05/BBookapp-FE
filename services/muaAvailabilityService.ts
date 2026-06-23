import type { IMuaAvailabilityRepository } from '../repositories/IMuaAvailabilityRepository';
import { ApiMuaAvailabilityRepository } from '../repositories/ApiMuaAvailabilityRepository';

export const muaAvailabilityService: IMuaAvailabilityRepository = new ApiMuaAvailabilityRepository();

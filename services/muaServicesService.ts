import type { IMuaServicesRepository } from '../repositories/IMuaServicesRepository';
import { ApiMuaServicesRepository } from '../repositories/ApiMuaServicesRepository';

export const muaServicesService: IMuaServicesRepository = new ApiMuaServicesRepository();

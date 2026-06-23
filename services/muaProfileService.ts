import type { IMuaProfileRepository } from '../repositories/IMuaProfileRepository';
import { ApiMuaProfileRepository } from '../repositories/ApiMuaProfileRepository';

export const muaProfileService: IMuaProfileRepository = new ApiMuaProfileRepository();

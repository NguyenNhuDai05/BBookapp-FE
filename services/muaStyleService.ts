import { ApiMuaStyleRepository } from '../repositories/ApiMuaStyleRepository';
import type { IMuaStyleRepository } from '../repositories/IMuaStyleRepository';
export type { MakeupStyle as MuaStyle } from '../utils/makeupStyles';
export const muaStyleService: IMuaStyleRepository = new ApiMuaStyleRepository();

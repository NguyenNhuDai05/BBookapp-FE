import { UserRole, type UserDto } from '../types/auth';

export type AppMode = 'CUSTOMER' | 'MUA';

export function hasMuaAccess(user: UserDto | null): boolean {
  // Explicit server capability overrides a legacy role left on the account.
  return !!user && user.role !== UserRole.Admin &&
    (user.hasMuaProfile ?? (user.role === UserRole.MUA));
}

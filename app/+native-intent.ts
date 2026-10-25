import { redirectProfileLink } from '../utils/profileLinks';
export function redirectSystemPath({ path }: { path: string; initial: boolean }) { return redirectProfileLink(path); }

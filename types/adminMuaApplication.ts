import type { MuaEligibility } from './muaEligibility';
export interface AdminMuaApplicationListItem { muaId:string; fullName:string; avatarUrl?:string|null; city?:string|null; experienceYears:number; verificationStatus:string; submittedAt?:string|null; reviewedAt?:string|null; rejectionReason?:string|null; activeServiceCount:number; publicPortfolioImageCount:number; completionPercentage:number; }
export interface AdminMuaApplicationDetail { profile:any; schedule:any; eligibility:MuaEligibility; }

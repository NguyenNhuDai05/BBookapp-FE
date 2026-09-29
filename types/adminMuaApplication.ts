import type { MuaEligibility } from './muaEligibility';
export interface AdminMuaApplicationListItem { muaId:string; fullName:string; avatarUrl?:string|null; city?:string|null; experienceYears:number; verificationStatus:string; submittedAt?:string|null; reviewedAt?:string|null; rejectionReason?:string|null; activeServiceCount:number; publicPortfolioImageCount:number; completionPercentage:number; }
export interface AdminMuaService { serviceId:string; serviceName?:string|null; price:number; durationMinutes:number; }
export interface AdminMuaPortfolio { portfolioId:string; imageUrls:string[]; title?:string|null; }
export interface AdminMuaProfile { fullName?:string|null; email?:string|null; phoneNumber?:string|null; avatarUrl?:string|null; city?:string|null; bio?:string|null; experienceYears:number; specialization?:string|null; styles:string[]; services:AdminMuaService[]; portfolio:AdminMuaPortfolio[]; }
export interface AdminMuaVerificationDocuments { address?:string|null; identityFrontUrl?:string|null; identityBackUrl?:string|null; portraitUrl?:string|null; certificateUrls:string[]; }
export interface AdminMuaBankAccount { bankCode:string; bankName?:string|null; accountNumber:string; accountHolderName:string; verificationStatus:string; }
export interface AdminMuaApplicationDetail { profile:AdminMuaProfile; verificationDocuments:AdminMuaVerificationDocuments; bankAccount?:AdminMuaBankAccount|null; schedule:unknown; eligibility:MuaEligibility; }
export interface RejectMuaApplicationRequest { reason:string; reasonCodes:string[]; items:Array<{section:string;field:string;message:string}>; }

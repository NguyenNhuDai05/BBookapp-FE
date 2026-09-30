export type BankMethod='BANK'|'MOMO';
export interface BankAccount {id:string;bankCode:string;bankBin:string;bankName:string;maskedAccountNumber:string;accountHolderName:string;method:BankMethod;qrCodeUrl?:string;verificationStatus:'PENDING_ADMIN'|'APPROVED'|'REJECTED';activatedAt:string|null;isDefault:boolean;isActive:boolean;isUsable:boolean;canReceiveMoney:boolean;isCoolingDown:boolean;unavailableReason?:string|null}
export interface BankAccountDraft {bankCode:string;bankBin:string;bankName:string;accountNumber:string;accountHolderName:string;method:BankMethod;qrCodeUrl?:string}
export interface UpsertBankAccountRequest extends BankAccountDraft {otp:string}
export interface BankAccountOtpResponse {maskedEmail:string;expiresInSeconds:number;resendAfterSeconds:number}

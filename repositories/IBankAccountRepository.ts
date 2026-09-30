import type {BankAccount,UpsertBankAccountRequest} from '../types/bankAccount';
export interface IBankAccountRepository {getAll():Promise<BankAccount[]>;add(request:UpsertBankAccountRequest):Promise<BankAccount>;update(id:string,request:UpsertBankAccountRequest):Promise<BankAccount>;setDefault(id:string,currentPassword:string):Promise<BankAccount>;remove(id:string):Promise<void>}

import {describe,expect,it} from '@jest/globals';
import {readFileSync} from 'node:fs';
import {join} from 'node:path';

const source=(...parts:string[])=>readFileSync(join(process.cwd(),...parts),'utf8');

describe('bank-flow screen contracts',()=>{
  it('routes Withdraw & Payments and transaction history to earnings',()=>{
    const value=source('app','(mua)','settings.tsx');
    expect(value).toMatch(/Lịch sử giao dịch[\s\S]*?\(mua\)\/earnings/);
    expect(value).toMatch(/Rút tiền & Thanh toán[\s\S]*?\(mua\)\/earnings/);
  });

  it('admin approval uses a cross-platform confirmation and owner-type-free service calls',()=>{
    const screen=source('app','(admin)','bank-accounts','index.tsx');
    const service=source('services','adminBankAccountService.ts');
    expect(screen).toContain('<AppModal');
    expect(screen).not.toContain('Alert.alert');
    expect(screen).not.toContain('window.confirm');
    expect(service).toContain('/admin/bank-accounts/${item.id}/approve');
    expect(service).toContain('/admin/bank-accounts/${item.id}/reject');
    expect(service).not.toContain('ownerType');
  });

  it('successful bank saves use the cross-platform feedback dialog rather than Alert callbacks',()=>{
    for(const parts of [['app','(mua)','bank-account-form.tsx'],['app','refund-bank-account-form.tsx']]){
      const value=source(...parts);
      expect(value).toContain('<FeedbackDialog');
      expect(value).not.toContain('Alert.alert');
    }
  });
});

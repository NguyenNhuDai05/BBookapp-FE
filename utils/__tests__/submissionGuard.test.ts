import { describe,expect,it,jest } from '@jest/globals';
import { createSubmissionGuard } from '../submissionGuard';

describe('submission guard',()=>{
  it('blocks a second submit while the first is in flight',async()=>{
    let finish!:()=>void;
    const pending=new Promise<void>(resolve=>{finish=resolve;});
    const task=jest.fn(()=>pending);
    const run=createSubmissionGuard();
    const first=run(task);const second=await run(task);
    expect(second).toBe(false);expect(task).toHaveBeenCalledTimes(1);
    finish();expect(await first).toBe(true);
  });
});

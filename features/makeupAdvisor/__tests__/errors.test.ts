import {advisorFailure} from '../errors';
let warn: jest.SpyInstance;
beforeEach(()=>{warn=jest.spyOn(console,'warn').mockImplementation(()=>undefined);});
afterEach(()=>warn.mockRestore());
test.each(['E_ADVISOR_LIMIT','E_BUSY','E_INPUT','E_DETECTION','E_NATIVE_UNAVAILABLE'])('classifies %s without leaking native message',code=>{
 const message=advisorFailure({code,message:'file:///private/selfie.jpg'},'scan');
 expect(message).toBeTruthy();expect(message).not.toContain('selfie');
 expect(warn).toHaveBeenCalledWith('BBookAdvisorFailure',JSON.stringify({stage:'scan',code}));
});
test('unknown code and message are never echoed',()=>{
 advisorFailure({code:'file:///selfie.jpg',message:'sensitive'},'pick');
 expect(warn).toHaveBeenCalledWith('BBookAdvisorFailure','{"stage":"pick","code":"E_UNKNOWN"}');
});

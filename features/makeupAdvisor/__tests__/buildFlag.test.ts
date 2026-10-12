import config from '../../../app.config';
const old={...process.env};
afterEach(()=>{process.env={...old};});
const context={config:{name:'BBook',slug:'BBook-app',android:{package:'com.bbook.app',googleServicesFile:'./google-services.json'},scheme:'bbookapp',plugins:['expo-notifications']}} as Parameters<typeof config>[0];
test('default and production remain off without altering identity/push',()=>{delete process.env.BBOOK_ADVISOR_ENABLED;process.env.EAS_BUILD_PROFILE='production';const c=config(context);expect(c.extra?.advisorEnabled).toBe(false);expect(c.android).toEqual(context.config.android);expect(c.scheme).toBe('bbookapp');expect(c.plugins).toContain('expo-notifications');});
test('production cannot enable advisor by environment mistake',()=>{process.env.BBOOK_ADVISOR_ENABLED='1';process.env.EAS_BUILD_PROFILE='production';expect(()=>config(context)).toThrow('not approved');});
test('explicit candidate profile enables only new feature',()=>{process.env.BBOOK_ADVISOR_ENABLED='1';process.env.EAS_BUILD_PROFILE='advisor-development';expect(config(context).extra?.advisorEnabled).toBe(true);});

let mockManifest:any,mockGradle:any;
jest.mock('expo/config-plugins',()=>({withAndroidManifest:(_:any,cb:any)=>{mockManifest=cb;return _;},withProjectBuildGradle:(_:any,cb:any)=>{mockGradle=cb;return _;}}));
test('native Advisor and source linker flags follow feature gate without duplicating or changing production',()=>{
 const plugin=require('../../../plugins/withAdvisor');plugin({},{enabled:true});
 const manifest=mockManifest({modResults:{manifest:{application:[{$:{}}]}}});expect(manifest.modResults.manifest.application[0]['meta-data'][0].$['android:value']).toBe('true');
 const first=mockGradle({modResults:{contents:'original gradle\n'}});const twice=mockGradle(first);expect(twice.modResults.contents.match(/BBOOK_ADVISOR_16K_START/g)).toHaveLength(1);expect(twice.modResults.contents).toContain('common-page-size=16384');
 plugin({},{enabled:false});const off=mockGradle(twice);expect(off.modResults.contents).not.toContain('BBOOK_ADVISOR_16K');expect(off.modResults.contents).toContain('original gradle');
});
test('native diagnostic metadata requires explicit opt-in and enabled Advisor',()=>{
 const plugin=jest.requireActual('../../../plugins/withAdvisor');
 for(const enabled of [true,false]){
  plugin({},{enabled,diagnostic:true});
  const value=mockManifest({modResults:{manifest:{application:[{$:{}}]}}});
  const rows=value.modResults.manifest.application[0]['meta-data'];
  expect(rows.find((r:any)=>r.$['android:name']==='com.bbook.advisor.diagnostics').$['android:value']).toBe(String(enabled));
 }
});

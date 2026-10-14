import React from 'react';
import {render,screen,fireEvent} from '@testing-library/react-native';
import Constants from 'expo-constants';
import {RecommendationDebug} from '../RecommendationDebug';
import {recommendFromLibrary} from '../../../scripts/advisorRegression/legacyEngine12';
jest.mock('@react-native-async-storage/async-storage',()=>jest.requireActual('@react-native-async-storage/async-storage/jest/async-storage-mock'));
jest.mock('expo-constants',()=>({__esModule:true,default:{expoConfig:{extra:{}}}}));
test('local trace is hidden outside preview and reveals no coordinates or values',async()=>{
 const trace=recommendFromLibrary().rankingTrace!;
 Constants.expoConfig!.extra={advisorDiagnosticMode:true,advisorReleaseEnvironment:'production'};
 const v=await render(<RecommendationDebug trace={trace}/>);expect(screen.queryByText('Kiểm tra ranking · chỉ trên thiết bị')).toBeNull();
 Constants.expoConfig!.extra={advisorDiagnosticMode:true,advisorReleaseEnvironment:'manual-test'};await v.rerender(<RecommendationDebug trace={trace}/>);
 await fireEvent.press(screen.getByText('Kiểm tra ranking · chỉ trên thiết bị'));
 expect(screen.getByText(JSON.stringify(trace,null,2))).toBeTruthy();expect(JSON.stringify(trace)).not.toMatch(/"(?:uri|points|JWT|value|image|meshRelativeZSpan)":/);
});



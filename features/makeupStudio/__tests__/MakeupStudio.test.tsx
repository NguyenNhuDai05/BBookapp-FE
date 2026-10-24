import React from 'react';
import {fireEvent,render,screen} from '@testing-library/react-native';
import {Platform,processColor} from 'react-native';
import {MakeupStudio} from '../MakeupStudio';
import {photo,sample} from '../testSupport/fixtures';
import {lipstickPresets} from '../lipstickPresets';
const originalPlatform=Platform.OS;
beforeAll(()=>Object.defineProperty(Platform,'OS',{value:'android'}));
afterAll(()=>Object.defineProperty(Platform,'OS',{value:originalPlatform}));

test('swatches, opacity and original toggle update overlay only; back does not own or delete files',async()=>{
 const back=jest.fn(),retry=jest.fn();await render(<MakeupStudio photo={photo} analysis={sample()} onBack={back} onNewPhoto={retry}/>);
 await fireEvent(screen.getByTestId('studio-photo'),'layout',{nativeEvent:{layout:{width:360,height:380}}});
 expect(screen.queryByTestId('lipstick-overlay')).toBeNull();
 await fireEvent(screen.getByLabelText('Selfie đã quét của bạn'),'load',{nativeEvent:{source:{width:photo.width,height:photo.height}}});
 const mask=()=>screen.getByTestId('lipstick-mask').props;
 // react-native-svg maps evenodd to native enum 0 and colors to brushes.
 expect(mask().fillRule).toBe(0);
 for(const preset of lipstickPresets){await fireEvent.press(screen.getByLabelText(`Màu son ${preset.name}`));expect(mask().fill).toEqual({type:0,payload:processColor(preset.color)});}
 await fireEvent.press(screen.getByLabelText('Màu son Đỏ trầm'));expect(mask().fill).toEqual({type:0,payload:processColor('#941F43')});
 const slider=screen.getByLabelText('Độ đậm màu son');await fireEvent(slider,'accessibilityAction',{nativeEvent:{actionName:'increment'}});expect(mask().fillOpacity).toBe(.5);
 await fireEvent(slider,'layout',{nativeEvent:{layout:{width:300}}});await fireEvent(slider,'responderGrant',{nativeEvent:{locationX:0}});expect(mask().fillOpacity).toBe(0);
 await fireEvent(slider,'responderMove',{nativeEvent:{locationX:300}});expect(mask().fillOpacity).toBe(1);
 await fireEvent.press(screen.getByRole('button',{name:'Ảnh gốc'}));expect(screen.queryByTestId('lipstick-overlay')).toBeNull();
 await fireEvent.press(screen.getByRole('button',{name:'Đã makeup'}));expect(mask().fill).toEqual({type:0,payload:processColor('#941F43')});
 await fireEvent.press(screen.getByText('Quay lại'));expect(back).toHaveBeenCalledTimes(1);expect(retry).not.toHaveBeenCalled();
 await fireEvent.press(screen.getByText('Thử lại ảnh khác'));expect(retry).toHaveBeenCalledTimes(1);
});
test('decoded dimensions must match the analyzed JPEG before overlay appears',async()=>{
 await render(<MakeupStudio photo={photo} analysis={sample()} onBack={jest.fn()} onNewPhoto={jest.fn()}/>);
 await fireEvent(screen.getByTestId('studio-photo'),'layout',{nativeEvent:{layout:{width:360,height:380}}});
 await fireEvent(screen.getByLabelText('Selfie đã quét của bạn'),'load',{nativeEvent:{source:{width:photo.height,height:photo.width}}});
 expect(screen.queryByTestId('lipstick-overlay')).toBeNull();expect(screen.getByText(/Ảnh tạm không còn khả dụng/)).toBeTruthy();
});
test('missing geometry or unavailable image hides controls and offers recovery',async()=>{
 const h=await render(<MakeupStudio photo={photo} analysis={sample()} onBack={jest.fn()} onNewPhoto={jest.fn()}/>);
 await fireEvent(screen.getByTestId('studio-photo'),'layout',{nativeEvent:{layout:{width:360,height:380}}});
 await fireEvent(screen.getByLabelText('Selfie đã quét của bạn'),'error');expect(screen.queryByTestId('lipstick-overlay')).toBeNull();expect(screen.getByText(/Ảnh tạm không còn khả dụng/)).toBeTruthy();
 await h.unmount();await render(<MakeupStudio onBack={jest.fn()} onNewPhoto={jest.fn()}/>);expect(screen.getByText('Chưa thể thử son trên ảnh này')).toBeTruthy();expect(screen.queryByLabelText('Độ đậm màu son')).toBeNull();
});

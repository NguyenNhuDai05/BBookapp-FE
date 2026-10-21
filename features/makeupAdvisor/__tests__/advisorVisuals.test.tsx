import React from 'react';
import {Image,StyleSheet,View} from 'react-native';
import {fireEvent,render,screen} from '@testing-library/react-native';
import {AdvisorImage,MakeupStyleImage} from '../ResultVisuals';
import {presentationCatalog} from '../presentationCatalog';
import {MakeupRecommendationCard} from '../AdvisorResults';
import type {MakeupRecommendation} from '../advisorRecommendation';
jest.mock('react-native-safe-area-context',()=>jest.requireActual('react-native-safe-area-context/jest/mock').default);
jest.mock('@react-native-async-storage/async-storage',()=>jest.requireActual('@react-native-async-storage/async-storage/jest/async-storage-mock'));

test('all 20 supplied style images preserve their complete content inside a bounded image frame',async()=>{
 await render(<View>{presentationCatalog.map(style=><MakeupStyleImage key={style.key} styleKey={style.key}/>)}</View>);
 expect(presentationCatalog).toHaveLength(20);
 for(const style of presentationCatalog){
  const image=screen.getByLabelText(`Minh họa ${style.displayName}`);
  expect(image.props.resizeMode).toBe('contain');
  expect(image.props.resizeMethod).toBe('resize');
  expect(StyleSheet.flatten(image.parent?.props.style)?.overflow).toBe('hidden');
  expect(StyleSheet.flatten(image.props.style)).toMatchObject({width:'100%',height:'100%'});
 }
});

test('failed remote image has a fallback and changing URI recovers without retaining the error',async()=>{
 const h=await render(<AdvisorImage source={{uri:'https://example.test/missing.jpg'}} label="Dịch vụ" style={{width:160,height:120}}/>);
 await fireEvent(screen.getByLabelText('Dịch vụ'),'error',{nativeEvent:{error:'offline'}});
 expect(screen.getByText('Ảnh đang được bổ sung')).toBeTruthy();
 await h.rerender(<AdvisorImage source={{uri:'https://example.test/available.jpg'}} label="Dịch vụ" style={{width:160,height:120}}/>);
 expect(screen.queryByText('Ảnh đang được bổ sung')).toBeNull();
 expect(screen.getByLabelText('Dịch vụ').props.resizeMode).toBe('contain');
});

test('a landscape source keeps its native ratio in detail and fits completely inside a compact thumbnail',async()=>{
 const dimensions=jest.spyOn(Image,'resolveAssetSource').mockReturnValue({uri:'fixture',width:597,height:335,scale:1});
 try{
  const h=await render(<MakeupStyleImage styleKey="latte"/>);
  expect(StyleSheet.flatten(screen.getByLabelText(/Minh họa/).parent?.props.style).aspectRatio).toBeCloseTo(597/335);
  await h.rerender(<MakeupStyleImage styleKey="latte" style={{width:84,height:112,aspectRatio:undefined}}/>);
  expect(screen.getByLabelText(/Minh họa/).props.resizeMode).toBe('contain');
 }finally{dimensions.mockRestore();}
});

test('overview exposes only two unique tags and opens detail without showing palettes or scoring metadata',async()=>{
 const detail=jest.fn();
 const row={styleKey:'natural',title:'Natural',shortDescription:'Description',colorSuggestions:['Hồng nhạt','Đào nude'],occasionFit:['Đi làm','Đi làm','Đi học','Dự tiệc'],scoringMetadataVersion:'1.2',suggestionSource:'face-aware'} as MakeupRecommendation;
 await render(<MakeupRecommendationCard row={row} index={2} onDetail={detail}/>);
 expect(screen.getByText('03')).toBeTruthy();
 expect(screen.getAllByText('Đi làm')).toHaveLength(1);
 expect(screen.getByText('Đi học')).toBeTruthy();
 expect(screen.queryByText('Dự tiệc')).toBeNull();
 expect(screen.queryByText('Hồng nhạt')).toBeNull();
 expect(screen.queryByText('Theo đường nét')).toBeNull();
 await fireEvent.press(screen.getByText('Khám phá'));
 expect(detail).toHaveBeenCalledTimes(1);
});

import React from 'react';
import {render,screen} from '@testing-library/react-native';
import {ScanPhoto,overlayGeometry} from '../ScanPhoto';
import type {Analysis} from '../faceAnalysis';
const photo={uri:'file:///cache/fixture.jpg',width:720,height:960};
const analysis={width:720,height:960,faceCount:1,contours:[{type:1,points:[{x:100,y:200}]}]} as Analysis;
test('shows detection overlay only from a real single-face result',async()=>{
 await render(<ScanPhoto photo={photo} analysis={analysis} scanning={false}/>);
 expect(screen.getByLabelText('Các điểm đường nét khuôn mặt được nhận diện')).toBeTruthy();
});
test('does not invent face points while waiting or for multiple faces',async()=>{
 await render(<ScanPhoto photo={photo} analysis={{...analysis,faceCount:2}} scanning={false}/>);
 expect(screen.queryByLabelText('Các điểm đường nét khuôn mặt được nhận diện')).toBeNull();
});
test('uses triangle indices from the SDK, removes duplicate edges and rejects invalid topology',()=>{const points=Array.from({length:468},(_,index)=>({index,x:100+index%20,y:200+Math.floor(index/20),z:0}));const result=overlayGeometry({...analysis,mesh:{points,triangles:[[0,1,2],[2,1,0],[0,1,999]]}});expect(result.points).toHaveLength(468);expect(result.path.match(/M/g)).toHaveLength(3);expect(overlayGeometry({...analysis,mesh:{points:points.slice(0,467),triangles:[]}}).points).toHaveLength(1);});
test.each(['index','z'])('invalid mesh %s falls back to supplied contours, never synthetic points',field=>{const points=Array.from({length:468},(_,index)=>({index,x:100,y:200,z:0}));if(field==='index')points[0].index=-1;else points[0].z=NaN;expect(overlayGeometry({...analysis,mesh:{points,triangles:[[0,1,2]]}}).points).toEqual(analysis.contours[0].points);});

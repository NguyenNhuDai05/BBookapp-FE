import React from 'react';
import {render,screen} from '@testing-library/react-native';
import {DynamicScanStatus,ScanSuccessTransition} from '../DynamicScanStatus';
import {phaseCopy,validationFailure} from '../scanState';
jest.mock('../useReducedMotion',()=>({useReducedMotion:()=>true}));
test('validation copy describes supported count/pose checks, not darkness or blur',async()=>{await render(<DynamicScanStatus phase="validating"/>);expect(screen.getByText('Đang kiểm tra ảnh...')).toBeTruthy();expect(screen.getByText('Kiểm tra số khuôn mặt và góc đầu')).toBeTruthy();expect(JSON.stringify(phaseCopy)).not.toMatch(/độ rõ nét|ảnh hơi tối/i);});
test('persistent error has its real message and no success or loading text',async()=>{await render(<DynamicScanStatus phase="validation_error" failure={validationFailure('FACE_NOT_FRONTAL')}/>);expect(screen.getByText('Hãy nhìn thẳng vào camera')).toBeTruthy();expect(screen.queryByText('Đã có gợi ý makeup cho bạn!')).toBeNull();expect(screen.queryByText('Đang phân tích đường nét...')).toBeNull();});
test('success layer skips motion entirely under reduced motion, results need no animation callback',async()=>{await render(<ScanSuccessTransition photo={{uri:'file:///cache/fixture.jpg',width:720,height:960}}/>);expect(screen.queryByText('Đã có gợi ý makeup cho bạn!')).toBeNull();});

import React,{useState} from 'react';
import {fireEvent,render,screen} from '@testing-library/react-native';
import {AdvisorEffects} from '../AdvisorEffects';
import type {MakeupEffect} from '../effects';
const updates=jest.fn();function Demo(){const [value,setValue]=useState<MakeupEffect[]>([]);return <AdvisorEffects value={value} onChange={v=>{updates(v);setValue(v);}} conflict={value.length>1}/>;}
beforeEach(()=>updates.mockClear());
test('effect choices start empty, are optional, support AND selection and clear',async()=>{await render(<Demo/>);expect(updates).not.toHaveBeenCalled();await fireEvent.press(screen.getByText('Hiệu ứng bronzer/ánh đồng'));expect(updates).toHaveBeenLastCalledWith(['bronzed-glow']);await fireEvent.press(screen.getByText('Má hồng ửng nổi bật'));expect(updates).toHaveBeenLastCalledWith(['bronzed-glow','flushed-blush']);expect(screen.getByText(/Chưa có phong cách khớp đầy đủ/)).toBeTruthy();await fireEvent.press(screen.getByLabelText('Xóa lựa chọn hiệu ứng'));expect(updates).toHaveBeenLastCalledWith([]);expect(screen.queryByText(/Chưa có phong cách khớp đầy đủ/)).toBeNull();});

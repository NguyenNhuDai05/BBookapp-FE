import React,{useState} from 'react';
import {fireEvent,render,screen} from '@testing-library/react-native';
import {AdvisorPreferences} from '../AdvisorPreferences';
import type {LibraryPreferences} from '../styleLibrary';
jest.mock('@react-native-async-storage/async-storage',()=>jest.requireActual('@react-native-async-storage/async-storage/jest/async-storage-mock'));
test('controls are collapsed, optional, support independent selection and clearing',async()=>{
 const change=jest.fn();await render(<AdvisorPreferences value={{occasion:null,intensity:null}} onChange={change}/>);
 expect(screen.queryByText('Dịp trang điểm')).toBeNull();expect(change).not.toHaveBeenCalled();
 await fireEvent.press(screen.getByText('Tinh chỉnh gợi ý · tùy chọn'));
 await fireEvent.press(screen.getByText('Đi làm'));expect(change).toHaveBeenLastCalledWith({occasion:'work',intensity:null});
 await fireEvent.press(screen.getByText('Đậm nét'));expect(change).toHaveBeenLastCalledWith({occasion:null,intensity:'bold'});
 await fireEvent.press(screen.getByText('Xóa lựa chọn'));expect(change).toHaveBeenLastCalledWith({occasion:null,intensity:null});
});
test('both choices and independent removal remain explicit rather than fabricated defaults',async()=>{
 const change=jest.fn();
 function Harness(){const [p,setP]=useState<LibraryPreferences>({occasion:null,intensity:null});return <AdvisorPreferences value={p} onChange={next=>{change(next);setP(next);}}/>;}
 await render(<Harness/>);await fireEvent.press(screen.getByText('Tinh chỉnh gợi ý · tùy chọn'));
 await fireEvent.press(screen.getByText('Đi làm'));await fireEvent.press(screen.getByText('Nhẹ nhàng'));
 expect(change).toHaveBeenLastCalledWith({occasion:'work',intensity:'light'});
 await fireEvent.press(screen.getByText('Không chọn dịp'));expect(change).toHaveBeenLastCalledWith({occasion:null,intensity:'light'});
 await fireEvent.press(screen.getByText('Không chọn độ đậm'));expect(change).toHaveBeenLastCalledWith({occasion:null,intensity:null});
});



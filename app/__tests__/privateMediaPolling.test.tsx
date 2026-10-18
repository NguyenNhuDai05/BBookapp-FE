import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import PrivateMediaMaintenance from '../(admin)/private-media';
import { api } from '../../services/api';
jest.mock('expo-router',()=>({useRouter:()=>({back:jest.fn()})}));
jest.mock('../../services/api',()=>({api:{get:jest.fn(),post:jest.fn()}}));
beforeEach(()=>{jest.useFakeTimers();jest.clearAllMocks();jest.mocked(api.get).mockResolvedValue({data:[]});});
afterEach(()=>jest.useRealTimers());
it('loads on mount, polls every 15 seconds and stops polling after unmount',async()=>{
 const view=await render(<PrivateMediaMaintenance/>);
 expect(api.get).toHaveBeenCalledTimes(1);
 await act(async()=>{jest.advanceTimersByTime(15000);});
 expect(api.get).toHaveBeenCalledTimes(2);
 await fireEvent.press(screen.getByText('Làm mới trạng thái'));
 expect(api.get).toHaveBeenCalledTimes(3);
 await view.unmount();await act(async()=>{jest.advanceTimersByTime(30000);});
 expect(api.get).toHaveBeenCalledTimes(3);expect(api.post).not.toHaveBeenCalled();
});
it('keeps existing active jobs on refresh failure and recovers on manual reload',async()=>{
 jest.mocked(api.get).mockResolvedValueOnce({data:[{id:'job-1',action:'audit',status:'Running',attempts:1,createdAt:'2026-10-18T00:00:00Z',isActive:true}]});
 await render(<PrivateMediaMaintenance/>);expect(screen.getByText('audit — Running')).toBeTruthy();
 jest.mocked(api.get).mockRejectedValueOnce(new Error('offline'));
 await fireEvent.press(screen.getByText('Làm mới trạng thái'));
 expect(screen.getByRole('alert')).toBeTruthy();expect(screen.getByText('audit — Running')).toBeTruthy();
 await fireEvent.press(screen.getByText('Làm mới trạng thái'));
 expect(screen.queryByRole('alert')).toBeNull();expect(api.post).not.toHaveBeenCalled();
});

import React from 'react';
import {render,screen,fireEvent} from '@testing-library/react-native';
import * as Clipboard from 'expo-clipboard';
import {MemoryDiagnostics} from '../MemoryDiagnostics';
jest.mock('@react-native-async-storage/async-storage',()=>jest.requireActual('@react-native-async-storage/async-storage/jest/async-storage-mock'));
jest.mock('expo-clipboard',()=>({setStringAsync:jest.fn().mockResolvedValue(true)}));
jest.mock('../faceAnalysis',()=>({memoryTrace:()=>[{checkpoint:'frontend_admission',pssKB:788350,limitKB:786432,session:'s2'}]}));
test('diagnostic copy exports scalar checkpoints without a selfie or URI',async()=>{await render(<MemoryDiagnostics code="E_MEMORY_BUDGET" snapshot={{checkpoint:'frontend_admission',pssKB:788350,limitKB:786432}}/>);await fireEvent.press(screen.getByText('Sao chép log chẩn đoán'));const data=JSON.parse(jest.mocked(Clipboard.setStringAsync).mock.calls[0][0]);expect(data.code).toBe('E_MEMORY_BUDGET');expect(data.checkpoints[0].pssKB).toBe(788350);expect(screen.getByText('Đã sao chép log chẩn đoán')).toBeTruthy();});


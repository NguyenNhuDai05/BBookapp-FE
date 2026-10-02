import React from 'react';
import { render, screen, waitFor } from '@testing-library/react-native';
import Detail from '../(admin)/payouts/[id]';
const mockQr = jest.fn(); let mockId = 'payout-a';
let mockPayout: any;
jest.mock('expo-router', () => ({ useRouter: () => ({ back: jest.fn(), replace: jest.fn() }), useLocalSearchParams: () => ({ id: mockId }) }));
jest.mock('../../hooks/useAdminPayouts', () => ({ useAdminPayout: () => ({ data: mockPayout }), useStartAdminPayout: () => ({}), useCompleteAdminPayout: () => ({}), useFailAdminPayout: () => ({}) }));
jest.mock('../../services/adminPayoutService', () => ({ adminPayoutService: { getTransferQr: (id: string) => mockQr(id) } }));
jest.mock('../../services/api', () => ({ getApiError: (error: any) => ({ message: error.message }) }));
jest.mock('../../components/admin/AdminConfirmDialog', () => ({ AdminConfirmDialog: () => null }));

it('shows authorized on-demand QR with manual details and replaces it when opening another payout', async () => {
  mockPayout = { id: mockId, status: 'PROCESSING', provider: 'MANUAL', amount: 12345, bankCode: 'VCB', accountNumber: '1234567890', accountHolderName: 'TEST USER', receivableIds: [] };
  mockQr.mockImplementation(async (id: string) => ({ payoutId: id, amount: id === 'payout-a' ? 12345 : 67890, imageDataUrl: `data:image/png;base64,${id}` }));
  const result = await render(<Detail />);
  await waitFor(() => expect(screen.getByLabelText('QR chuyển khoản payout').props.source.uri).toBe('data:image/png;base64,payout-a'));
  expect(screen.getByText('TEST USER')).toBeTruthy(); expect(screen.getByText('1234567890')).toBeTruthy(); expect(screen.getByText('12.345đ')).toBeTruthy();
  mockId = 'payout-b'; mockPayout = { ...mockPayout, id: mockId, amount: 67890 };
  await result.rerender(<Detail />);
  await waitFor(() => expect(screen.getByLabelText('QR chuyển khoản payout').props.source.uri).toBe('data:image/png;base64,payout-b'));
  expect(mockQr).toHaveBeenLastCalledWith('payout-b');
});

it('shows original private MoMo QR with amount warning and preserves manual fallback',async()=>{
 mockId='payout-momo';mockPayout={id:mockId,status:'PROCESSING',provider:'MANUAL',amount:23456,bankCode:'MOMO',accountNumber:'0000000000',accountHolderName:'TEST ONLY',receivableIds:[]};mockQr.mockResolvedValue({payoutId:mockId,amount:23456,imageDataUrl:'data:image/jpeg;base64,TEST',kind:'MOMO_ORIGINAL',containsPayoutAmount:false});
 const result=await render(<Detail/>);await waitFor(()=>expect(screen.getByLabelText('QR chuyển khoản payout').props.source.uri).toBe('data:image/jpeg;base64,TEST'));expect(screen.getByText(/BBook không nhúng số tiền payout/)).toBeTruthy();expect(screen.getByText('23.456đ')).toBeTruthy();expect(screen.getByText('0000000000')).toBeTruthy();
 mockId='payout-no-qr';mockPayout={...mockPayout,id:mockId};mockQr.mockRejectedValue(new Error('Chuyển thủ công'));await result.rerender(<Detail/>);await screen.findByText('Chuyển thủ công');expect(screen.queryByLabelText('QR chuyển khoản payout')).toBeNull();expect(screen.getByText('TEST ONLY')).toBeTruthy();
});

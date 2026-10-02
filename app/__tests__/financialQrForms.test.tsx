import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import MuaForm from '../(mua)/bank-account-form';
import RefundForm from '../refund-bank-account-form';
const mockPrivateUpload = jest.fn(); const mockPreview = jest.fn();
const mockDecode = jest.fn(); const mockOtp = jest.fn(); const mockAdd = jest.fn();
let mockParams: Record<string, string> = {};
jest.mock('expo-router', () => ({ useRouter: () => ({ back: jest.fn(), replace: jest.fn() }), useLocalSearchParams: () => mockParams }));
jest.mock('react-native-safe-area-context', () => { const { View } = require('react-native'); return { SafeAreaView: View, useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }) }; });
jest.mock('expo-image-picker', () => ({ requestMediaLibraryPermissionsAsync: async () => ({ granted: true }), launchImageLibraryAsync: async () => ({ canceled: false, assets: [{ uri: 'file:///test-qr.png' }] }) }));
jest.mock('../../services/financialMediaService', () => ({ financialMediaService: { uploadMomo: (...args: unknown[]) => mockPrivateUpload(...args), preview: (...args: unknown[]) => mockPreview(...args) } }));
jest.mock('../../services/supabase', () => ({ uploadBankQr: (...args: unknown[]) => mockDecode(...args) }));
jest.mock('../../services/api', () => ({ getApiError: (error: any) => ({ message: 'test error', code: error?.code }) }));
jest.mock('@tanstack/react-query', () => ({ useQueryClient: () => ({ invalidateQueries: jest.fn() }) }));
jest.mock('../../services/refundService', () => ({ refundService: { setDestination: jest.fn() } }));
jest.mock('../../hooks/useBankAccounts', () => ({ useRequestBankAccountOtp: () => ({ mutateAsync: mockOtp }), useAddBankAccount: () => ({ mutateAsync: mockAdd }), useUpdateBankAccount: () => ({ mutateAsync: jest.fn() }) }));
jest.mock('../../components/ui/AppBottomSheet', () => { const { View } = require('react-native'); return { AppBottomSheet: ({ visible, children }: any) => visible ? <View>{children}</View> : null }; });
jest.mock('../../components/common/FeedbackDialog', () => { const { Text } = require('react-native'); return { FeedbackDialog: ({ visible, message }: any) => visible ? <Text>{message}</Text> : null }; });
jest.mock('../../components/bank/BankAccountOtpDialog', () => { const { Text, TouchableOpacity } = require('react-native'); return { BankAccountOtpDialog: ({ onConfirm }: any) => <TouchableOpacity onPress={() => onConfirm('123456')}><Text>Xác nhận OTP thử nghiệm</Text></TouchableOpacity> }; });

describe.each([['MUA', MuaForm], ['refund', RefundForm]] as const)('%s receive account form', (_, Form) => {
  beforeEach(() => {
    jest.clearAllMocks();mockPrivateUpload.mockResolvedValue({financialQrMediaId:'00000000-0000-4000-8000-000000000001'});mockPreview.mockResolvedValue('data:image/jpeg;base64,AAAA'); mockParams = { bankCode: 'VCB', bankBin: '970436' };
    mockOtp.mockResolvedValue({ maskedEmail: 'test@example.test' }); mockAdd.mockResolvedValue({ id: 'test-bank', isUsable: false });
    mockDecode.mockResolvedValue({ method: 'BANK', bankBin: '970436', accountNumber: '1234567890', accountName: 'TEST USER' });
  });
  it('prefills QR fields without saving; edits are sent only after user confirmation', async () => {
    await render(<Form />);
    await fireEvent.press(screen.getByText('Đọc ảnh QR'));
    await fireEvent.press(screen.getByText('Chọn ảnh QR ngân hàng hoặc MoMo'));
    await waitFor(() => expect(screen.getByLabelText('Số tài khoản nhận tiền').props.value).toBe('1234567890'));
    expect(mockAdd).not.toHaveBeenCalled(); expect(mockOtp).not.toHaveBeenCalled();
    await fireEvent.changeText(screen.getByLabelText('Số tài khoản nhận tiền'), '9876543210');
    await fireEvent.changeText(screen.getByLabelText('Tên chủ tài khoản nhận tiền'), 'EDITED USER');
    await fireEvent.press(screen.getByText('Tiếp tục'));
    await fireEvent.press(await screen.findByText('Xác nhận OTP thử nghiệm'));
    await waitFor(() => expect(mockAdd).toHaveBeenCalledWith(expect.objectContaining({ accountNumber: '9876543210', accountHolderName: 'EDITED USER', otp: '123456' })));
    expect(mockAdd.mock.calls[0][0]).not.toHaveProperty('qrCodeUrl');
  });
  it.each([['BANK', 'VCB', '970436', '1234567890'], ['MOMO', 'MOMO', 'MOMO', '0912345678']])('keeps manual %s entry working without an image', async (method, bankCode, bankBin, accountNumber) => {
    mockParams = { bankCode, bankBin, method };
    await render(<Form />);
    await fireEvent.changeText(screen.getByLabelText('Số tài khoản nhận tiền'), accountNumber);
    await fireEvent.changeText(screen.getByLabelText('Tên chủ tài khoản nhận tiền'), 'TEST USER');
    await fireEvent.press(screen.getByText('Tiếp tục'));
    await waitFor(() => expect(mockOtp).toHaveBeenCalledWith(expect.objectContaining({ request: expect.objectContaining({ method, accountNumber }) })));
    expect(mockDecode).not.toHaveBeenCalled(); expect(mockAdd).not.toHaveBeenCalled();
  });
  it('prefills only the phone from MoMo and leaves the holder for the user to enter', async () => {
    mockDecode.mockResolvedValue({ method: 'MOMO', bankBin: 'MOMO', accountNumber: '0912345678', accountName: null });
    await render(<Form />);
    await fireEvent.press(screen.getByText('Đọc ảnh QR'));
    await fireEvent.press(screen.getByText('Chọn ảnh QR ngân hàng hoặc MoMo'));
    await waitFor(() => expect(screen.getByLabelText('Số tài khoản nhận tiền').props.value).toBe('0912345678'));
    expect(screen.getByLabelText('Tên chủ tài khoản nhận tiền').props.value).toBe('');
    await fireEvent.press(screen.getByText('Tiếp tục')); expect(mockOtp).not.toHaveBeenCalled();
  });
  it('handles MoMo multi-app without treating its opaque identifier as a phone', async () => {
    mockDecode.mockResolvedValue({ method: 'MOMO', bankBin: '971025', accountNumber: null, accountName: null });
    await render(<Form />);
    await fireEvent.changeText(screen.getByLabelText('Số tài khoản nhận tiền'), '0000000000');
    await fireEvent.changeText(screen.getByLabelText('Tên chủ tài khoản nhận tiền'), 'TEST USER');
    await fireEvent.press(screen.getByText('Đọc ảnh QR'));
    await fireEvent.press(screen.getByText('Chọn ảnh QR ngân hàng hoặc MoMo'));
    await screen.findByText('Đã đọc QR MoMo đa năng. Mã nhận tiền trong QR không phải số điện thoại; hãy nhập số MoMo và tên người nhận để Admin đối chiếu.');
    expect(screen.getByLabelText('Số tài khoản nhận tiền').props.value).toBe('0000000000');
    expect(screen.getByLabelText('Tên chủ tài khoản nhận tiền').props.value).toBe('TEST USER');
    expect(mockOtp).not.toHaveBeenCalled(); expect(mockAdd).not.toHaveBeenCalled();
    if (_ === 'MUA') expect(mockPrivateUpload).toHaveBeenCalledTimes(1);
    else expect(mockPrivateUpload).not.toHaveBeenCalled();
  });
  it('places the QR picker before the bank, account and holder fields', async () => {
    const result = await render(<Form />);
    await fireEvent.press(screen.getByText('Đọc ảnh QR'));
    const tree = JSON.stringify(result.toJSON());
    const picker = tree.indexOf('Chọn ảnh QR ngân hàng hoặc MoMo');
    expect(picker).toBeGreaterThan(-1);
    expect(picker).toBeLessThan(tree.indexOf('Số tài khoản nhận tiền'));
    expect(picker).toBeLessThan(tree.indexOf('Tên chủ tài khoản nhận tiền'));
  });
  it('a failed decode preserves previously entered fields and offers manual entry', async () => {
    mockDecode.mockRejectedValue(new Error('invalid QR'));
    await render(<Form />);
    await fireEvent.changeText(screen.getByLabelText('Số tài khoản nhận tiền'), '123456');
    await fireEvent.changeText(screen.getByLabelText('Tên chủ tài khoản nhận tiền'), 'TEST USER');
    await fireEvent.press(screen.getByText('Đọc ảnh QR'));
    await fireEvent.press(screen.getByText('Chọn ảnh QR ngân hàng hoặc MoMo'));
    await screen.findByText('Không đọc được thông tin từ mã QR. Bạn có thể thử ảnh khác hoặc nhập thủ công.');
    expect(screen.getByLabelText('Số tài khoản nhận tiền').props.value).toBe('123456');
    expect(screen.getByLabelText('Tên chủ tài khoản nhận tiền').props.value).toBe('TEST USER');
    expect(mockAdd).not.toHaveBeenCalled();
  });
  it('does not silently turn an unsupported alphanumeric QR account into a different numeric account', async () => {
    mockDecode.mockResolvedValue({ method: 'BANK', bankBin: '970436', accountNumber: 'AB123456', accountName: 'OTHER USER' });
    await render(<Form />);
    await fireEvent.changeText(screen.getByLabelText('Số tài khoản nhận tiền'), '987654');
    await fireEvent.changeText(screen.getByLabelText('Tên chủ tài khoản nhận tiền'), 'TEST USER');
    await fireEvent.press(screen.getByText('Đọc ảnh QR'));
    await fireEvent.press(screen.getByText('Chọn ảnh QR ngân hàng hoặc MoMo'));
    await screen.findByText('Không đọc được thông tin từ mã QR. Bạn có thể thử ảnh khác hoặc nhập thủ công.');
    expect(screen.getByLabelText('Số tài khoản nhận tiền').props.value).toBe('987654');
    expect(screen.getByLabelText('Tên chủ tài khoản nhận tiền').props.value).toBe('TEST USER');
    expect(mockOtp).not.toHaveBeenCalled();
  });
});

describe('MUA private MoMo QR',()=>{
 beforeEach(()=>{jest.clearAllMocks();mockParams={bankCode:'MOMO'};mockDecode.mockResolvedValue({method:'MOMO',accountNumber:'0000000000'});mockPrivateUpload.mockResolvedValue({financialQrMediaId:'00000000-0000-4000-8000-000000000001'});mockPreview.mockResolvedValue('data:image/jpeg;base64,AAAA');mockOtp.mockResolvedValue({maskedEmail:'test@example.test'});mockAdd.mockResolvedValue({id:'test-bank'});});
 it('uploads privately, previews through auth, and binds reference to explicit OTP/save',async()=>{
  await render(<MuaForm/>);await fireEvent.press(screen.getByText('Chọn ảnh QR ngân hàng hoặc MoMo'));
  await waitFor(()=>expect(mockPreview).toHaveBeenCalled());expect(mockPrivateUpload).toHaveBeenCalledWith('file:///test-qr.png');expect(mockAdd).not.toHaveBeenCalled();
  await fireEvent.changeText(screen.getByLabelText('Tên chủ tài khoản nhận tiền'),'TEST ONLY');await fireEvent.press(screen.getByText('Tiếp tục'));await fireEvent.press(await screen.findByText('Xác nhận OTP thử nghiệm'));
  await waitFor(()=>expect(mockAdd).toHaveBeenCalledWith(expect.objectContaining({financialQrMediaId:'00000000-0000-4000-8000-000000000001',method:'MOMO'})));
 });
 it('distinguishes private storage failure from unreadable QR',async()=>{
  mockPrivateUpload.mockRejectedValue({code:'FINANCIAL_QR_UNAVAILABLE'});
  await render(<MuaForm/>);await fireEvent.press(screen.getByText('Chọn ảnh QR ngân hàng hoặc MoMo'));
  await screen.findByText('Ảnh QR đã được đọc nhưng máy chủ chưa thể lưu riêng tư. Vui lòng thử lại; thông tin đang nhập được giữ lại.');
  expect(mockOtp).not.toHaveBeenCalled();expect(mockAdd).not.toHaveBeenCalled();
 });
 it('private upload failure preserves fields and old reference',async()=>{
  mockParams={bankCode:'MOMO',financialQrMediaId:'00000000-0000-4000-8000-000000000001'};mockPrivateUpload.mockRejectedValue(new Error('provider unavailable'));await render(<MuaForm/>);await fireEvent.changeText(screen.getByLabelText('Số tài khoản nhận tiền'),'0000000000');await fireEvent.changeText(screen.getByLabelText('Tên chủ tài khoản nhận tiền'),'TEST ONLY');
  await waitFor(()=>expect(mockPreview).toHaveBeenCalled());await fireEvent.press(screen.getByLabelText('QR MoMo riêng tư'));
  await screen.findByText('Không đọc được thông tin từ mã QR. Bạn có thể thử ảnh khác hoặc nhập thủ công.');expect(screen.getByLabelText('Tên chủ tài khoản nhận tiền').props.value).toBe('TEST ONLY');await fireEvent.press(screen.getByText('Tiếp tục'));await waitFor(()=>expect(mockOtp).toHaveBeenCalledWith(expect.objectContaining({request:expect.objectContaining({financialQrMediaId:'00000000-0000-4000-8000-000000000001'})})));
 });
});

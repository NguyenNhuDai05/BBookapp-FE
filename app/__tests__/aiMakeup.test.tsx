import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import AiMakeupScreen from '../ai-makeup';

const mockPush = jest.fn(); const mockAnalyze = jest.fn(); const mockChoose = jest.fn(); const mockConsent = jest.fn(); const mockReset = jest.fn();
let mockAi: Record<string, unknown>;
const mockService = { id: 'service-1', muaId: 'real-mua', name: 'Dịch vụ thật', price: 500000, durationMinutes: 60, authorName: 'MUA thật', tags: [], imageUrls: [] };
jest.mock('expo-router', () => ({ useRouter: () => ({ push: mockPush, back: jest.fn(), replace: jest.fn() }), useFocusEffect: jest.fn(), useIsFocused: () => true }));
jest.mock('../../hooks/useAiMakeup', () => ({ useAiMakeup: () => mockAi }));
jest.mock('../../services/exploreService', () => ({ exploreService: { home: jest.fn(), search: jest.fn() } }));
jest.mock('../../components/aiMakeup/AiMakeupCamera', () => ({ AiMakeupCamera: () => null }));
jest.mock('../../components/explore/ExploreFilterSheet', () => ({ ExploreFilterSheet: () => null }));
jest.mock('@tanstack/react-query', () => ({ useQuery: (options: { queryKey: string[]; enabled?: boolean }) => options.queryKey[0] === 'ai-makeup-catalog' ?
  { data: { styles: [{ id: 11, name: 'Natural' }], provinces: [] } } : { data: options.enabled ? { items: [mockService], nextCursor: null } : undefined } }));
beforeEach(() => { jest.clearAllMocks(); mockAi = { capabilities: { data: { enabled: true }, refetch: jest.fn() }, photo: null, result: null, consent: false, setConsent: mockConsent, busy: false, error: '', preferences: '', setPreferences: jest.fn(), occasion: '', setOccasion: jest.fn(), choosePhoto: mockChoose, acceptCapture: jest.fn(), analyze: mockAnalyze, reset: mockReset }; });
it('entry does not open camera or analyze automatically', async () => { await render(<AiMakeupScreen />); expect(screen.getByText('Chụp selfie')).toBeTruthy(); expect(mockAnalyze).not.toHaveBeenCalled(); expect(mockChoose).not.toHaveBeenCalled(); await fireEvent.press(screen.getByText('Chọn ảnh từ thư viện')); expect(mockChoose).toHaveBeenCalledWith(false); });
it('preview requires consent and can be declined', async () => { mockAi.photo = { uri: 'file:///cache/preview.jpg' }; await render(<AiMakeupScreen />); await fireEvent.press(screen.getByText('Đồng ý và phân tích')); expect(mockAnalyze).not.toHaveBeenCalled(); await fireEvent.press(screen.getByText(/Tôi đủ 18 tuổi/)); expect(mockConsent).toHaveBeenCalledWith(true); await fireEvent.press(screen.getByText('Hủy và xóa ảnh tạm')); expect(mockReset).toHaveBeenCalled(); });
it('results select real services and reuse MUA detail booking entry without another analysis', async () => { mockAi.result = { imageStatus: 'valid', observations: [], notice: 'Tham khảo', recommendations: [{ styleId: 11, styleName: 'Natural', reason: 'Nhẹ nhàng.', makeupTips: ['Nền mỏng.'] }] }; await render(<AiMakeupScreen />); await fireEvent.press(screen.getByText('Tìm MUA theo phong cách này')); expect(screen.getByText('Dịch vụ thật')).toBeTruthy(); await fireEvent.press(screen.getByText('Dịch vụ thật')); expect(mockPush).toHaveBeenCalledWith({ pathname: '/mua-detail', params: { id: 'real-mua', tab: 'Dịch vụ', serviceId: 'service-1' } }); expect(mockAnalyze).not.toHaveBeenCalled(); });
it.each(['no_face', 'multiple_faces', 'blurry', 'occluded', 'insufficient'])('allows retake for invalid status %s', async imageStatus => { mockAi.result = { imageStatus }; await render(<AiMakeupScreen />); expect(screen.getByText('Chọn ảnh khác')).toBeTruthy(); await fireEvent.press(screen.getByText('Chọn ảnh khác')); expect(mockReset).toHaveBeenCalled(); });
it('disabled backend shows browse route without upload controls', async () => { mockAi.capabilities = { data: { enabled: false }, refetch: jest.fn() }; await render(<AiMakeupScreen />); expect(screen.getByText('Tư vấn AI chưa sẵn sàng')).toBeTruthy(); expect(screen.queryByText('Chụp selfie')).toBeNull(); });
it('loading and quota errors are visible without progress percentage', async () => { mockAi.busy = true; mockAi.error = 'Đã hết lượt hôm nay'; await render(<AiMakeupScreen />); expect(screen.getByText('Đang xử lý yêu cầu của bạn…')).toBeTruthy(); expect(screen.getByText('Đã hết lượt hôm nay')).toBeTruthy(); });
it('reports unsuitable advice inside the existing app feedback flow without resending a selfie', async () => {
  mockAi.result = { imageStatus: 'valid', observations: [], notice: 'Tham khảo', recommendations: [] };
  await render(<AiMakeupScreen />); await fireEvent.press(screen.getByText('Báo cáo gợi ý không phù hợp'));
  expect(mockPush).toHaveBeenCalledWith('/feedback'); expect(mockAnalyze).not.toHaveBeenCalled(); expect(mockChoose).not.toHaveBeenCalled();
});

import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { OverlayProvider } from '../../../ui/OverlayProvider';
import { PortfolioFormModal } from '../PortfolioFormModal';
import { portfolioService } from '../../../../services/portfolioService';
import { uploadImage } from '../../../../services/supabase';
import { useMuaStyles } from '../../../../hooks/useMuaStyles';
import { PortfolioSavedRefreshError } from '../../../../utils/portfolioWrite';
import { catalogFixture, portfolioFixture } from '../../../../test-utils/portfolioFixture';
// Native modal setup can exceed five seconds in a cold, full-suite worker.
jest.setTimeout(15_000);
jest.mock('expo-image-picker', () => ({ requestMediaLibraryPermissionsAsync: async () => ({ granted: true }), launchImageLibraryAsync: async () => ({ canceled: false, assets: [{ uri: 'file:///new.jpg' }] }) }));
jest.mock('../../../../services/supabase', () => ({ uploadImage: jest.fn() }));
jest.mock('../../../../services/portfolioService', () => ({ portfolioService: { getPortfolio: jest.fn() } }));
jest.mock('../../../../hooks/useMuaServices', () => ({ useMuaServices: () => ({ data: [
  { id: 's1', name: 'Dịch vụ một', styleIds: [73], tags: ['Natural', 'Not in database'] },
  { id: 's2', name: 'Dịch vụ hai', tags: ['Classic'] },
] }) }));
jest.mock('../../../../hooks/useMuaStyles', () => ({ useMuaStyles: jest.fn() }));
jest.mock('../../../../services/api', () => ({ getApiError: (e: any) => ({ message: e.message || 'Không thể lưu', status: e.status, code: e.code, isNetworkError: e.network }) }));
const metrics = { frame: { x: 0, y: 0, width: 360, height: 740 }, insets: { top: 24, bottom: 24, left: 0, right: 0 } };
function wrapper(client = new QueryClient({ defaultOptions: { queries: { gcTime: Infinity, retry: false } } })) {
  return function Wrapper({ children }: React.PropsWithChildren) { return <QueryClientProvider client={client}><SafeAreaProvider initialMetrics={metrics}><OverlayProvider>{children}</OverlayProvider></SafeAreaProvider></QueryClientProvider>; };
}
async function selectServiceOption(label: string) {
  const selector = screen.getByLabelText('Gắn dịch vụ vào bài viết');
  if (!selector.props.accessibilityState.expanded) await fireEvent.press(selector);
  await fireEvent.press(screen.getByRole('button', { name: label }));
}
beforeEach(() => {
  jest.clearAllMocks(); jest.mocked(uploadImage).mockReset().mockImplementation(async uri => `https://media.test/${uri.split('/').pop()}`);
  jest.mocked(portfolioService.getPortfolio).mockResolvedValue([portfolioFixture()]);
  jest.mocked(useMuaStyles).mockReturnValue({ catalog: catalogFixture(), data: catalogFixture().styles, refetch: jest.fn() } as unknown as ReturnType<typeof useMuaStyles>);
});
it('preserves legacy and structured history when editing with an unsupported catalog', async () => {
  jest.mocked(useMuaStyles).mockReturnValue({ data: [], refetch: jest.fn() } as unknown as ReturnType<typeof useMuaStyles>);
  const save = jest.fn();
  await render(<PortfolioFormModal visible onClose={jest.fn()} onSubmit={save} initialData={{ id: 'p1' }} />, { wrapper: wrapper() });
  await waitFor(() => expect(screen.getByLabelText('Mô tả tác phẩm')).toBeTruthy());
  await fireEvent.changeText(screen.getByLabelText('Mô tả tác phẩm'), 'Chỉ sửa mô tả');
  await fireEvent.press(screen.getByRole('button', { name: /^(Đăng bài|Lưu thay đổi)$/ }));
  expect(save).toHaveBeenCalledWith({ expectedVersion: 7, description: 'Chỉ sửa mô tả' });
});
it('locks controls and duplicate submits while uploading a captured snapshot', async () => {
  let finish!: (url: string) => void;
  jest.mocked(uploadImage).mockImplementationOnce(() => new Promise(resolve => { finish = resolve; }));
  const save = jest.fn(), close = jest.fn();
  await render(<PortfolioFormModal visible onClose={close} onSubmit={save} />, { wrapper: wrapper() });
  await fireEvent.press(screen.getByLabelText('Thêm ảnh tác phẩm'));
  await fireEvent.changeText(screen.getByLabelText('Mô tả tác phẩm'), 'Snapshot');
  // Keep the async event pending while checking controls during the upload.
  const submit = fireEvent.press(screen.getByRole('button', { name: /^(Đăng bài|Lưu thay đổi)$/ }));
  await waitFor(() => expect(screen.getByLabelText('Mô tả tác phẩm').props.editable).toBe(false));
  await fireEvent.press(screen.getByLabelText('Xóa ảnh 1'));
  await fireEvent.press(screen.getByText('Hủy'));
  await fireEvent.press(screen.getByText('Đang xử lý…'));
  expect(close).not.toHaveBeenCalled(); expect(save).not.toHaveBeenCalled();
  finish('https://media.test/snapshot.jpg');
  await submit;
  await waitFor(() => expect(save).toHaveBeenCalledTimes(1));
  expect(save).toHaveBeenCalledWith({ description: 'Snapshot', imageUrls: ['https://media.test/snapshot.jpg'], serviceId: null });
});
it('creates without tags when the database list is unavailable', async () => {
  jest.mocked(useMuaStyles).mockReturnValue({ data: [], refetch: jest.fn() } as unknown as ReturnType<typeof useMuaStyles>);
  const save = jest.fn(); await render(<PortfolioFormModal visible onClose={jest.fn()} onSubmit={save} />, { wrapper: wrapper() });
  await fireEvent.press(screen.getByLabelText('Thêm ảnh tác phẩm')); await fireEvent.press(screen.getByRole('button', { name: /^(Đăng bài|Lưu thay đổi)$/ }));
  await waitFor(() => expect(save).toHaveBeenCalled());
  expect(save.mock.calls[0][0]).toEqual({ description: '', imageUrls: ['https://media.test/new.jpg'], serviceId: null });
  expect(screen.queryByLabelText('Tên tác phẩm')).toBeNull();
});
it('keeps selected tags on a failed refresh and requires retry or explicit discard', async () => {
  const save = jest.fn(), close = jest.fn();
  const view = await render(<PortfolioFormModal visible onClose={close} onSubmit={save} />, { wrapper: wrapper() });
  await fireEvent.press(screen.getByLabelText('Thêm ảnh tác phẩm'));
  await fireEvent.press(screen.getByRole('checkbox', { name: 'Natural' }));
  jest.mocked(useMuaStyles).mockReturnValue({ isError: true, refetch: jest.fn() } as unknown as ReturnType<typeof useMuaStyles>);
  await view.rerender(<PortfolioFormModal visible onClose={close} onSubmit={save} />);
  expect(screen.getByLabelText('Bỏ Natural')).toBeTruthy();
  await fireEvent.press(screen.getByRole('button', { name: /^(Đăng bài|Lưu thay đổi)$/ })); expect(save).not.toHaveBeenCalled();
  await fireEvent.press(screen.getByText('Bỏ thay đổi tag, giữ nội dung'));
  await fireEvent.press(screen.getByRole('button', { name: /^(Đăng bài|Lưu thay đổi)$/ }));
  expect(save.mock.calls[0][0].tags).toBeUndefined();
});
it('selects database tags on a legacy server without structured tagging capability', async () => {
  jest.mocked(useMuaStyles).mockReturnValue({ data: catalogFixture().styles, catalog: { source: 'legacy', styles: catalogFixture().styles }, refetch: jest.fn() } as unknown as ReturnType<typeof useMuaStyles>);
  const save = jest.fn(); await render(<PortfolioFormModal visible onClose={jest.fn()} onSubmit={save} />, { wrapper: wrapper() });
  await fireEvent.press(screen.getByLabelText('Thêm ảnh tác phẩm'));
  await fireEvent.press(screen.getByRole('checkbox', { name: 'Natural' }));
  await fireEvent.press(screen.getByRole('checkbox', { name: 'Classic' }));
  await fireEvent.press(screen.getByRole('button', { name: /^(Đăng bài|Lưu thay đổi)$/ }));
  expect(save.mock.calls[0][0].tags).toEqual(['Natural', 'Classic']);
  expect(save.mock.calls[0][0].tagging).toBeUndefined();
  for (const label of ['Thông tin makeup', 'Dịp phù hợp', 'Phong cách makeup', 'Mức độ trang điểm', 'Tông màu', 'Hiệu ứng makeup']) expect(screen.queryByText(label)).toBeNull();
});
it('loads fresh owner tags and sends an explicit empty array to remove all portfolio tags', async () => {
  const save = jest.fn(); await render(<PortfolioFormModal visible onClose={jest.fn()} onSubmit={save} initialData={{ id: 'p1', description: 'Stale', version: 1 }} />, { wrapper: wrapper() });
  await waitFor(() => expect(screen.getByLabelText('Mô tả tác phẩm').props.defaultValue).toBe('Mô tả mới từ server'));
  expect(portfolioService.getPortfolio).toHaveBeenCalledWith('me');
  await fireEvent.press(screen.getByLabelText('Bỏ legacy')); await fireEvent.press(screen.getByRole('button', { name: /^(Đăng bài|Lưu thay đổi)$/ }));
  expect(save).toHaveBeenCalledWith({ expectedVersion: 7, tags: [] }); expect(uploadImage).not.toHaveBeenCalled();
});
it('prefills service tags and saves portfolio additions/removals independently', async () => {
  const save = jest.fn(); await render(<PortfolioFormModal visible onClose={jest.fn()} onSubmit={save} />, { wrapper: wrapper() });
  await fireEvent.press(screen.getByLabelText('Thêm ảnh tác phẩm'));
  await selectServiceOption('Dịch vụ một');
  expect(screen.getByLabelText('Bỏ Natural')).toBeTruthy();
  expect(screen.queryByLabelText('Bỏ Not in database')).toBeNull();
  await fireEvent.press(screen.getByLabelText('Bỏ Natural'));
  await fireEvent.press(screen.getByRole('checkbox', { name: 'Classic' }));
  // Reselecting the attached service does not reset edits.
  await selectServiceOption('Dịch vụ một');
  await fireEvent.press(screen.getByRole('button', { name: /^(Đăng bài|Lưu thay đổi)$/ }));
  expect(save.mock.calls[0][0]).toEqual(expect.objectContaining({ serviceId: 's1', tags: ['Classic'] }));
});
it('uses the newly chosen service defaults and retains editable tags when detaching', async () => {
  const save = jest.fn(); await render(<PortfolioFormModal visible onClose={jest.fn()} onSubmit={save} />, { wrapper: wrapper() });
  await fireEvent.press(screen.getByLabelText('Thêm ảnh tác phẩm'));
  await selectServiceOption('Dịch vụ một');
  await selectServiceOption('Dịch vụ hai');
  expect(screen.queryByLabelText('Bỏ Natural')).toBeNull();
  expect(screen.getByLabelText('Bỏ Classic')).toBeTruthy();
  await selectServiceOption('Không gắn');
  await fireEvent.press(screen.getByRole('button', { name: /^(Đăng bài|Lưu thay đổi)$/ }));
  expect(save.mock.calls[0][0]).toEqual(expect.objectContaining({ serviceId: null, tags: ['Classic'] }));
});
it('waits for the database list before applying service defaults, then preserves edits on refresh', async () => {
  jest.mocked(useMuaStyles).mockReturnValue({ isLoading: true, refetch: jest.fn() } as unknown as ReturnType<typeof useMuaStyles>);
  const save = jest.fn(), close = jest.fn();
  const view = await render(<PortfolioFormModal visible onClose={close} onSubmit={save} />, { wrapper: wrapper() });
  await fireEvent.press(screen.getByLabelText('Thêm ảnh tác phẩm'));
  await selectServiceOption('Dịch vụ một');
  await fireEvent.press(screen.getByRole('button', { name: /^(Đăng bài|Lưu thay đổi)$/ })); expect(save).not.toHaveBeenCalled();
  jest.mocked(useMuaStyles).mockReturnValue({ data: catalogFixture().styles, refetch: jest.fn() } as unknown as ReturnType<typeof useMuaStyles>);
  await view.rerender(<PortfolioFormModal visible onClose={close} onSubmit={save} />);
  expect(screen.getByLabelText('Bỏ Natural')).toBeTruthy();
  await fireEvent.press(screen.getByLabelText('Bỏ Natural'));
  await fireEvent.press(screen.getByRole('checkbox', { name: 'Classic' }));
  jest.mocked(useMuaStyles).mockReturnValue({ data: [...catalogFixture().styles], refetch: jest.fn() } as unknown as ReturnType<typeof useMuaStyles>);
  await view.rerender(<PortfolioFormModal visible onClose={close} onSubmit={save} />);
  expect(screen.queryByLabelText('Bỏ Natural')).toBeNull();
  expect(screen.getByLabelText('Bỏ Classic')).toBeTruthy();
});
it('reopens saved portfolio tags without reapplying the linked service defaults', async () => {
  jest.mocked(portfolioService.getPortfolio).mockResolvedValue([{ ...portfolioFixture(), tags: ['Classic'] }]);
  const save = jest.fn(); await render(<PortfolioFormModal visible onClose={jest.fn()} onSubmit={save} initialData={{ id: 'p1' }} />, { wrapper: wrapper() });
  await waitFor(() => expect(screen.getByLabelText('Bỏ Classic')).toBeTruthy());
  expect(screen.queryByLabelText('Bỏ Natural')).toBeNull();
  await fireEvent.press(screen.getByLabelText('Bỏ Classic'));
  await fireEvent.press(screen.getByRole('button', { name: /^(Đăng bài|Lưu thay đổi)$/ }));
  expect(save).toHaveBeenCalledWith({ expectedVersion: 7, tags: [] });
});
it('retains the album and other content when updating tags on an unversioned legacy server', async () => {
  const item = { ...portfolioFixture(), version: undefined, tagging: undefined, tags: ['Natural'] };
  jest.mocked(portfolioService.getPortfolio).mockResolvedValue([item]);
  const save = jest.fn(); await render(<PortfolioFormModal visible onClose={jest.fn()} onSubmit={save} initialData={{ id: 'p1' }} />, { wrapper: wrapper() });
  await waitFor(() => expect(screen.getByLabelText('Bỏ Natural')).toBeTruthy());
  await fireEvent.press(screen.getByLabelText('Bỏ Natural'));
  await fireEvent.press(screen.getByRole('button', { name: /^(Đăng bài|Lưu thay đổi)$/ }));
  expect(save).toHaveBeenCalledWith({ title: item.title, description: item.description, imageUrls: item.imageUrls, serviceId: item.serviceId, tags: [] });
});
it('does not reset a typed draft or version when background cache/caller props refresh', async () => {
  const client = new QueryClient({ defaultOptions: { queries: { gcTime: Infinity } } }); const save = jest.fn(); const close = jest.fn();
  const view = await render(<PortfolioFormModal visible onClose={close} onSubmit={save} initialData={{ id: 'p1' }} />, { wrapper: wrapper(client) });
  await waitFor(() => expect(screen.getByLabelText('Mô tả tác phẩm')).toBeTruthy()); await fireEvent.changeText(screen.getByLabelText('Mô tả tác phẩm'), 'Bản nháp của tôi');
  await act(async () => client.setQueryData(['mua-portfolio', 'me'], [{ ...portfolioFixture(), version: 9, description: 'Background' }]));
  await view.rerender(<PortfolioFormModal visible onClose={close} onSubmit={save} initialData={{ ...portfolioFixture(), version: 9 }} />);
  await fireEvent.press(screen.getByRole('button', { name: /^(Đăng bài|Lưu thay đổi)$/ })); expect(save).toHaveBeenCalledWith({ expectedVersion: 7, description: 'Bản nháp của tôi' });
});
it('retains uploads on validation error and resubmits without uploading the album again', async () => {
  const save = jest.fn().mockRejectedValueOnce({ status: 400, code: 'PORTFOLIO_TAG_LIMIT' }).mockResolvedValueOnce(undefined);
  await render(<PortfolioFormModal visible onClose={jest.fn()} onSubmit={save} />, { wrapper: wrapper() });
  await fireEvent.press(screen.getByLabelText('Thêm ảnh tác phẩm')); await fireEvent.press(screen.getByRole('button', { name: /^(Đăng bài|Lưu thay đổi)$/ }));
  expect(screen.getByText(/Số lựa chọn vượt giới hạn/)).toBeTruthy(); await fireEvent.press(screen.getByRole('button', { name: /^(Đăng bài|Lưu thay đổi)$/ }));
  expect(save).toHaveBeenCalledTimes(2); expect(uploadImage).toHaveBeenCalledTimes(1);
});
it('blocks resend after ambiguous POST and performs GET only when the user checks the list', async () => {
  const save = jest.fn().mockRejectedValue({ network: true }); await render(<PortfolioFormModal visible onClose={jest.fn()} onSubmit={save} />, { wrapper: wrapper() });
  await fireEvent.press(screen.getByLabelText('Thêm ảnh tác phẩm')); await fireEvent.press(screen.getByRole('button', { name: /^(Đăng bài|Lưu thay đổi)$/ }));
  expect(screen.getByText(/Chưa xác định được máy chủ/)).toBeTruthy(); await fireEvent.press(screen.getByRole('button', { name: /^(Đăng bài|Lưu thay đổi)$/ })); expect(save).toHaveBeenCalledTimes(1);
  await fireEvent.press(screen.getByText('Kiểm tra danh sách đã lưu')); expect(portfolioService.getPortfolio).toHaveBeenCalledTimes(1); expect(save).toHaveBeenCalledTimes(1);
});
it('after acknowledged write and failed refetch, retries GET only and never retries the mutation', async () => {
  const reload = jest.fn().mockResolvedValue([]); const close = jest.fn(); const save = jest.fn().mockRejectedValue(new PortfolioSavedRefreshError(reload));
  await render(<PortfolioFormModal visible onClose={close} onSubmit={save} />, { wrapper: wrapper() });
  await fireEvent.press(screen.getByLabelText('Thêm ảnh tác phẩm')); await fireEvent.press(screen.getByRole('button', { name: /^(Đăng bài|Lưu thay đổi)$/ }));
  expect(screen.getByText('Đã lưu portfolio, nhưng chưa tải lại được dữ liệu mới.')).toBeTruthy(); await fireEvent.press(screen.getByText('Tải lại dữ liệu'));
  expect(reload).toHaveBeenCalledTimes(1); expect(save).toHaveBeenCalledTimes(1); expect(uploadImage).toHaveBeenCalledTimes(1); expect(close).toHaveBeenCalledTimes(1);
});
it('keeps draft on version conflict and only replaces it after explicit use-new action', async () => {
  const save = jest.fn().mockRejectedValue({ status: 409, code: 'PORTFOLIO_VERSION_CONFLICT' });
  await render(<PortfolioFormModal visible onClose={jest.fn()} onSubmit={save} initialData={{ id: 'p1' }} />, { wrapper: wrapper() });
  await waitFor(() => expect(screen.getByLabelText('Mô tả tác phẩm')).toBeTruthy()); await fireEvent.changeText(screen.getByLabelText('Mô tả tác phẩm'), 'Bản nháp'); await fireEvent.press(screen.getByRole('button', { name: /^(Đăng bài|Lưu thay đổi)$/ }));
  jest.mocked(portfolioService.getPortfolio).mockResolvedValue([{ ...portfolioFixture(), description: 'Từ người sửa khác', version: 8 }]);
  await fireEvent.press(screen.getByText('Tải bản mới để đối chiếu')); expect(screen.getByLabelText('Mô tả tác phẩm').props.defaultValue).toBe('Mô tả mới từ server'); expect(save).toHaveBeenCalledTimes(1);
  await fireEvent.press(screen.getByText('Dùng bản mới (bỏ bản nháp)')); expect(screen.getByLabelText('Mô tả tác phẩm').props.defaultValue).toBe('Từ người sửa khác');
});

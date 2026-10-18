import React, { useState } from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { MakeupStylePicker } from '../MakeupStylePicker';
import type { StyleSelection } from '../../../utils/makeupStyles';
jest.mock('../../../services/api', () => ({ getApiError: jest.fn() }));
function Picker({ limit = 5, initial = { styleIds: [], newStyleNames: [] } }: { limit?: number; initial?: StyleSelection }) {
  const [value, setValue] = useState(initial);
  return <MakeupStylePicker limit={limit} value={value} onChange={setValue} styles={[
    ...Array.from({ length: 21 }, (_, index) => ({ styleId: index + 1, name: `Style ${index + 1}`, isActive: true })),
    { styleId: 30, name: 'Phong cách cũ', isActive: false },
  ]} />;
}
it.each([5, 20])('enforces %s selected styles including draft names', async limit => {
  await render(<Picker limit={limit} />);
  for (let id = 1; id <= limit - 1; id++) await fireEvent.press(screen.getByLabelText(`Chọn Style ${id}`));
  await fireEvent.changeText(screen.getByLabelText('Tìm hoặc thêm phong cách'), 'Phong cách mới');
  await fireEvent.press(screen.getByText('Thêm “Phong cách mới”'));
  await fireEvent.changeText(screen.getByLabelText('Tìm hoặc thêm phong cách'), '');
  expect(screen.getByLabelText(`Chọn Style ${limit}`).props.accessibilityState.disabled).toBe(true);
  expect(screen.getByText(`Đã chọn ${limit}/${limit} phong cách`)).toBeTruthy();
});
it('deduplicates normalized names without stripping Vietnamese accents', async () => {
  await render(<Picker />);
  for (const name of ['  Tự   nhiên ', 'TỰ NHIÊN']) {
    await fireEvent.changeText(screen.getByLabelText('Tìm hoặc thêm phong cách'), name);
    await fireEvent.press(screen.getByText('Thêm “' + name.normalize('NFKC').trim().replace(/\s+/g, ' ') + '”'));
  }
  expect(screen.getByText('Đã chọn 1/5 phong cách')).toBeTruthy();
  await fireEvent.changeText(screen.getByLabelText('Tìm hoặc thêm phong cách'), 'Tu nhien');
  await fireEvent.press(screen.getByText('Thêm “Tu nhien”'));
  expect(screen.getByText('Đã chọn 2/5 phong cách')).toBeTruthy();
});
it('shows inactive history for removal and blocks re-adding it', async () => {
  await render(<Picker initial={{ styleIds: [30], newStyleNames: [] }} />);
  expect(screen.getByText('Phong cách cũ · Ngừng sử dụng ×')).toBeTruthy();
  await fireEvent.press(screen.getByLabelText('Bỏ Phong cách cũ'));
  expect(screen.queryByLabelText('Chọn Phong cách cũ')).toBeNull();
  await fireEvent.changeText(screen.getByLabelText('Tìm hoặc thêm phong cách'), 'Phong cách cũ');
  await fireEvent.press(screen.getByText('Thêm “Phong cách cũ”'));
  expect(screen.getByText('Phong cách này đã ngừng sử dụng.')).toBeTruthy();
  expect(screen.getByText('Đã chọn 0/5 phong cách')).toBeTruthy();
});
it('retains a nullable legacy display name by ID without crashing search or offering it as a new selection', async () => {
  const change = jest.fn();
  await render(<MakeupStylePicker limit={5} value={{styleIds:[31],newStyleNames:[]}} onChange={change} styles={[{styleId:31,name:null,isActive:true}]} />);
  expect(screen.getByLabelText('Bỏ Phong cách #31')).toBeTruthy();
  await fireEvent.changeText(screen.getByLabelText('Tìm hoặc thêm phong cách'),'Tự nhiên');
  await fireEvent.press(screen.getByLabelText('Bỏ Phong cách #31'));
  expect(change).toHaveBeenCalledWith({styleIds:[],newStyleNames:[]});
});

it('shows specialties before discovery and deduplicates by ID across groups', async () => {
  const rows = [ { styleId: 2, name: 'Khám phá', isActive: true }, { styleId: 1, name: 'Chuyên môn', isActive: true }, { styleId: 1, name: 'Chuyên môn', isActive: true } ];
  await render(<MakeupStylePicker styles={rows} historicalStyles={[rows[1]]} preferredStyleIds={[1]} value={{ styleIds: [], newStyleNames: [] }} onChange={jest.fn()} limit={5} />);
  const choices = screen.getAllByRole('button').filter(item => item.props.accessibilityLabel?.startsWith('Chọn '));
  expect(choices.map(item => item.props.accessibilityLabel)).toEqual(['Chọn Chuyên môn', 'Chọn Khám phá']);
});
it('does not guess identity for two distinct IDs with equal display names', async () => {
  const change = jest.fn();
  await render(<MakeupStylePicker styles={[{ styleId: 1, name: 'Glam', isActive: true }, { styleId: 2, name: 'Glam', isActive: true }]} value={{ styleIds: [], newStyleNames: [] }} onChange={change} limit={5} />);
  expect(screen.getAllByLabelText('Chọn Glam')).toHaveLength(2);
  await fireEvent.changeText(screen.getByLabelText('Tìm hoặc thêm phong cách'), 'Glam'); await fireEvent.press(screen.getByText('Thêm “Glam”'));
  expect(change).not.toHaveBeenCalled(); expect(screen.getByText(/Tên này trùng nhiều phong cách/)).toBeTruthy();
});
it('retains inactive history missing from active catalog without offering it for selection', async () => {
  await render(<MakeupStylePicker styles={[]} historicalStyles={[{ styleId: 99, name: 'Cũ', isActive: true }]} value={{ styleIds: [99], newStyleNames: [] }} onChange={jest.fn()} limit={5} />);
  expect(screen.getByText('Cũ · Ngừng sử dụng ×')).toBeTruthy(); expect(screen.queryByLabelText('Chọn Cũ')).toBeNull();
});
it('keeps legacy overflow visible and permits removal while blocking additions', async () => {
  await render(<Picker initial={{ styleIds: Array.from({ length: 21 }, (_, i) => i + 1), newStyleNames: [] }} limit={20} />);
  expect(screen.getByText('Đã chọn 21/20 phong cách')).toBeTruthy();
  await fireEvent.press(screen.getByLabelText('Bỏ Style 21')); expect(screen.getByLabelText('Chọn Style 21').props.accessibilityState.disabled).toBe(true);
});
it('shows loading/error/retry and permits retaining selections without new choices', async () => {
  const reload = jest.fn();
  await render(<MakeupStylePicker styles={[]} historicalStyles={[{ styleId: 1, name: 'Giữ', isActive: true }]} catalogLoaded={false} value={{ styleIds: [1], newStyleNames: [] }} onChange={jest.fn()} limit={5} loadError onReload={reload} />);
  expect(screen.getByText('Giữ · Chưa xác minh trạng thái ×')).toBeTruthy();
  await fireEvent.press(screen.getByText('Thử lại phong cách')); expect(reload).toHaveBeenCalledTimes(1);
});

it('offers an explicit new-style action while keeping the draft local until confirmation', async () => {
  const change = jest.fn();
  await render(<MakeupStylePicker styles={[]} value={{ styleIds: [], newStyleNames: [] }} onChange={change} limit={5} />);
  await fireEvent.press(screen.getByLabelText('Thêm phong cách mới'));
  expect(screen.getByPlaceholderText('Nhập tên phong cách mới...')).toBeTruthy();
  expect(change).not.toHaveBeenCalled();
  await fireEvent.changeText(screen.getByLabelText('Tìm hoặc thêm phong cách'), 'Glam mới');
  await fireEvent.press(screen.getByText('Thêm “Glam mới”'));
  expect(change).toHaveBeenCalledWith({ styleIds: [], newStyleNames: ['Glam mới'] });
});

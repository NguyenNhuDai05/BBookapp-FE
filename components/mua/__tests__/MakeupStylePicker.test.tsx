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

import React, { useState } from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { PortfolioTaggingFields } from '../PortfolioTaggingFields';
import type { MakeupStyle } from '../../../../utils/makeupStyles';
jest.mock('../../../../services/api', () => ({ getApiError: jest.fn() }));
const options: MakeupStyle[] = [
  { styleId: 73, name: 'Kỷ yếu', isActive: true },
  { styleId: 94, name: 'Cô dâu', isActive: true },
  { styleId: 105, name: 'Korean', isActive: true },
  { styleId: 106, name: 'Thái', isActive: true },
  { styleId: 107, name: 'Ngừng dùng', isActive: false },
  { styleId: 108, name: 'Lưu trữ', isActive: true, archivedAt: '2026-10-01' },
];
it('lists only active database tags, searches them and allows adding/removing without groups', async () => {
  const changed = jest.fn();
  function Fields() { const [value, set] = useState<string[]>([]); return <PortfolioTaggingFields value={value} onChange={v => { changed(v); set(v); }} options={options} onReload={jest.fn()} />; }
  await render(<Fields />);
  expect(screen.getAllByRole('checkbox')).toHaveLength(4);
  expect(screen.queryByText('Phong cách makeup')).toBeNull();
  await fireEvent.press(screen.getByRole('checkbox', { name: 'Kỷ yếu' }));
  await fireEvent.press(screen.getByRole('checkbox', { name: 'Korean' }));
  await fireEvent.press(screen.getByLabelText('Bỏ Kỷ yếu'));
  expect(changed).toHaveBeenLastCalledWith(['Korean']);
  await fireEvent.changeText(screen.getByLabelText('Tìm tag portfolio'), 'THÁI');
  expect(screen.getAllByRole('checkbox')).toHaveLength(1);
  await fireEvent.press(screen.getByRole('checkbox', { name: 'Thái' }));
  expect(changed).toHaveBeenLastCalledWith(['Korean', 'Thái']);
});
it('does not turn a search into a custom tag and can retry a failed list', async () => {
  const reload = jest.fn();
  const view = await render(<PortfolioTaggingFields value={[]} onChange={jest.fn()} options={options} onReload={reload} />);
  await fireEvent.changeText(screen.getByLabelText('Tìm tag portfolio'), 'Không có trong database');
  expect(screen.queryAllByRole('checkbox')).toHaveLength(0);
  expect(screen.getByText('Không có tag phù hợp.')).toBeTruthy();
  await view.rerender(<PortfolioTaggingFields value={['Korean']} onChange={jest.fn()} error onReload={reload} />);
  expect(screen.getByLabelText('Bỏ Korean')).toBeTruthy();
  await fireEvent.press(screen.getByText('Tải lại tag'));
  expect(reload).toHaveBeenCalledTimes(1);
});
it('locks tag changes while saving', async () => {
  const changed = jest.fn();
  await render(<PortfolioTaggingFields value={['Korean']} onChange={changed} options={options} disabled onReload={jest.fn()} />);
  await fireEvent.press(screen.getByLabelText('Bỏ Korean'));
  await fireEvent.press(screen.getByRole('checkbox', { name: 'Thái' }));
  expect(changed).not.toHaveBeenCalled();
});

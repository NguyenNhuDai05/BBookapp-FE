import React, { useState } from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { PortfolioTaggingFields } from '../PortfolioTaggingFields';
import { catalogFixture, tagsFixture } from '../../../../test-utils/portfolioFixture';
import { emptyPortfolioTags, portfolioTagDraft } from '../../../../utils/portfolioTagging';

it('selects/removes terms and blocks a fourth occasion without offering group records as tags', async () => {
  const changed = jest.fn();
  function Fields() { const [value, set] = useState(emptyPortfolioTags()); return <PortfolioTaggingFields value={value} onChange={v => { changed(v); set(v); }} catalog={catalogFixture()} supported onReload={jest.fn()} />; }
  await render(<Fields />); await fireEvent.press(screen.getByLabelText('Chọn dịp phù hợp'));
  for (const key of ['date', 'work', 'daily']) await fireEvent.press(screen.getByRole('checkbox', { name: `occasion:${key}` }));
  expect(screen.getByRole('checkbox', { name: 'occasion:photoshoot' }).props.accessibilityState.disabled).toBe(true);
  expect(screen.queryByRole('checkbox', { name: 'Dịp phù hợp' })).toBeNull();
  await fireEvent.press(screen.getByLabelText('Bỏ occasion:date'));
  expect(changed.mock.calls.at(-1)[0].occasionKeys).toEqual(['work', 'daily']);
});
it('uses custom StyleId, requires primary first, limits secondary and clears secondary on primary removal', async () => {
  const changed = jest.fn();
  function Fields() { const [value, set] = useState(emptyPortfolioTags()); return <PortfolioTaggingFields value={value} onChange={v => { changed(v); set(v); }} catalog={catalogFixture()} supported onReload={jest.fn()} />; }
  await render(<Fields />);
  expect(screen.getByLabelText('Chọn phong cách phụ').props.accessibilityState.disabled).toBe(true);
  await fireEvent.press(screen.getByLabelText('Chọn phong cách chính'));
  await fireEvent.changeText(screen.getByLabelText('Tìm phong cách portfolio'), 'Custom');
  expect(screen.queryByRole('radio', { name: 'Natural' })).toBeNull();
  await fireEvent.press(screen.getByRole('radio', { name: 'MUA Custom' }));
  expect(changed.mock.calls.at(-1)[0].primaryStyleId).toBe(94);
  await fireEvent.press(screen.getByLabelText('Chọn phong cách phụ'));
  for (const name of ['Natural', 'Classic']) await fireEvent.press(screen.getByRole('checkbox', { name }));
  expect(screen.getByRole('checkbox', { name: 'Soft' }).props.accessibilityState.disabled).toBe(true);
  expect(screen.getByRole('checkbox', { name: 'MUA Custom' }).props.accessibilityState.disabled).toBe(true);
  await fireEvent.press(screen.getByLabelText('Bỏ MUA Custom'));
  expect(changed.mock.calls.at(-1)[0]).toEqual(expect.objectContaining({ primaryStyleId: null, secondaryStyleIds: [] }));
});
it('keeps advanced effects collapsed, supports optional intensity and renders inactive history for removal', async () => {
  const catalog = catalogFixture(); catalog.styles = catalog.styles.filter(s => s.styleId !== 73);
  const changed = jest.fn(); const value = portfolioTagDraft(tagsFixture());
  await render(<PortfolioTaggingFields value={value} onChange={changed} history={tagsFixture()} catalog={catalog} supported onReload={jest.fn()} />);
  expect(screen.getByText(/Natural · Ngừng dùng/)).toBeTruthy(); expect(screen.queryByLabelText('Chọn hiệu ứng makeup')).toBeNull();
  await fireEvent.press(screen.getByLabelText('Bỏ Natural')); expect(changed).toHaveBeenLastCalledWith(expect.objectContaining({ primaryStyleId: null }));
  await fireEvent.press(screen.getByLabelText('Bỏ intensity:light')); expect(changed).toHaveBeenLastCalledWith(expect.objectContaining({ intensityKey: null }));
  await fireEvent.press(screen.getByText('Thêm tông màu và hiệu ứng')); expect(screen.getByLabelText('Chọn hiệu ứng makeup')).toBeTruthy();
});

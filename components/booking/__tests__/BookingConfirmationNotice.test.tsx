import React from 'react';
import { render } from '@testing-library/react-native';
import { BookingConfirmationNotice } from '../BookingConfirmationNotice';
import type { BookingDto } from '../../../types/booking';

const booking = { status: 'PENDING_CONFIRMATION', date: '2026-10-25', time: '11:00' } as BookingDto;

it('shows appointment as the response deadline for old API data without promising 24 hours', async () => {
  const screen = await render(<BookingConfirmationNotice booking={booking} />);
  expect(screen.getByText(/MUA cần xác nhận trước 11:00 ngày 25\/10\/2026/)).toBeTruthy();
  expect(screen.getByText(/hoàn toàn bộ tiền cọc/)).toBeTruthy();
  expect(screen.queryByText(/24h/)).toBeNull();
}, 15_000);

it('formats the server deadline in Vietnam time for the MUA', async () => {
  const screen = await render(<BookingConfirmationNotice booking={{ ...booking, muaConfirmationDeadline: '2026-10-25T04:00:00Z' }} viewAs="mua" />);
  expect(screen.getByText(/Bạn cần nhận hoặc từ chối trước/)).toBeTruthy();
  expect(screen.getByText(/11:00/)).toBeTruthy();
  expect(screen.getByText(/giờ Việt Nam/)).toBeTruthy();
});

it('explains a system timeout and directs to refund progress without claiming money was returned', async () => {
  const screen = await render(<BookingConfirmationNotice booking={{ ...booking, status: 'CANCELLED', cancellationPolicyRule: 'MUA_CONFIRMATION_TIMEOUT_FULL' }} />);
  expect(screen.getByText('Tự hủy do MUA chưa xác nhận')).toBeTruthy();
  expect(screen.getByText(/Xem tiến trình hoàn/)).toBeTruthy();
  expect(screen.queryByText(/Đã hoàn tiền/)).toBeNull();
});

it('does not show an acceptance deadline for a confirmed booking or an unrelated cancellation', async () => {
  const screen = await render(<BookingConfirmationNotice booking={{ ...booking, status: 'CONFIRMED' }} />);
  expect(screen.queryByText('Hạn MUA xác nhận lịch')).toBeNull();
  await screen.rerender(<BookingConfirmationNotice booking={{ ...booking, status: 'CANCELLED' }} />);
  expect(screen.queryByText('Tự hủy do MUA chưa xác nhận')).toBeNull();
});

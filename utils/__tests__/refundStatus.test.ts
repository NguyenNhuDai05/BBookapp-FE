/// <reference types="jest" />

import { buildRefundTimeline, isRefundPollingStatus, REFUND_STATUS_LABELS } from '../bookingStatus';
import type { RefundStatus, RefundSummaryDto } from '../../types/booking';

describe('customer refund presentation', () => {
  it('maps every backend status to a customer-friendly label', () => {
    const statuses: RefundStatus[] = ['AWAITING_DESTINATION','PENDING','MANUAL_ACTION_REQUIRED','PROCESSING','COMPLETED','FAILED','UNKNOWN'];
    statuses.forEach(status => expect(REFUND_STATUS_LABELS[status]).toBeTruthy());
    expect(REFUND_STATUS_LABELS.MANUAL_ACTION_REQUIRED).not.toContain('ManualActionRequired');
  });

  it('does not invent timestamps for incomplete timeline steps', () => {
    const refund: RefundSummaryDto = { refundId:'r', bookingId:'b', amount:100, status:'PENDING', createdAt:'2026-10-01T00:00:00Z' };
    const steps = buildRefundTimeline(refund);
    expect(steps[1]).toMatchObject({ completed:true, timestamp:refund.createdAt });
    expect(steps[2]).toMatchObject({ completed:false });
    expect(steps[2].timestamp).toBeUndefined();
    expect(steps[4]).toMatchObject({ completed:false });
  });

  it('polls only active server-side processing states', () => {
    expect(isRefundPollingStatus('PENDING')).toBe(true);
    expect(isRefundPollingStatus('MANUAL_ACTION_REQUIRED')).toBe(true);
    expect(isRefundPollingStatus('PROCESSING')).toBe(true);
    expect(isRefundPollingStatus('COMPLETED')).toBe(false);
    expect(isRefundPollingStatus('FAILED')).toBe(false);
    expect(isRefundPollingStatus('AWAITING_DESTINATION')).toBe(false);
  });
});

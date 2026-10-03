import React, { useEffect, useState } from 'react';
import { Image, Text, View } from 'react-native';
import { api } from '../../services/api';

// Private bytes remain in this mounted view, outside query and persistent caches.
export function AdminFinancialQr({ id, context, amount }: { id: string; context: 'bank' | 'refund'; amount?: number }) {
  const key = context + ':' + id + ':' + (amount ?? '');
  const [result, setResult] = useState<{ key: string; image?: string; original?: boolean; error?: boolean }>();
  useEffect(() => {
    const controller = new AbortController();
    const path = context === 'bank' ? '/admin/bank-accounts/' + id + '/financial-qr' : '/admin/refunds/' + id + '/transfer-qr';
    api.get(path, { signal: controller.signal }).then(({ data }) => {
      const matches = context === 'bank' ? data.accountId === id : data.refundId === id && data.amount === amount;
      if (!matches || !/^data:image\/(png|jpeg);base64,/.test(data.imageDataUrl)) throw Error('QR context mismatch');
      if (!controller.signal.aborted) setResult({ key, image: data.imageDataUrl, original: data.kind === 'MOMO_ORIGINAL' });
    }).catch(() => { if (!controller.signal.aborted) setResult({ key, error: true }); });
    return () => controller.abort();
  }, [id, context, amount, key]);
  const current = result?.key === key ? result : undefined;
  return <View style={{ marginTop: 12 }}><Text>{context === 'bank' ? 'QR do người dùng cung cấp' : 'QR chuyển tiền'}</Text>
    {current?.image ? <Image source={{ uri: current.image }} style={{ width: 220, height: 220, alignSelf: 'center', marginVertical: 12 }} resizeMode="contain" /> : <Text>{current?.error ? 'QR chưa khả dụng. Hãy đối chiếu thông tin thủ công.' : 'Đang tải QR riêng tư…'}</Text>}
    {current?.original ? <Text>QR MoMo có thể không chứa số tiền. Hãy nhập và kiểm tra đúng số tiền hoàn đang hiển thị.</Text> : null}
  </View>;
}

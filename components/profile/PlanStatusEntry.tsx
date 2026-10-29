import React from 'react';
import { Text, TouchableOpacity } from 'react-native';
export function PlanStatusEntry({ onPress }: { onPress: () => void }) {
  return <TouchableOpacity accessibilityRole="button" accessibilityLabel="Gói và quyền lợi" onPress={onPress}
    style={{ marginHorizontal: 16, marginVertical: 12, borderRadius: 14, padding: 16, backgroundColor: '#FFF4F8', borderWidth: 1, borderColor: '#EED4DF' }}>
    <Text style={{ color: '#A82E62', fontWeight: '700', fontSize: 16 }}>Gói và quyền lợi ›</Text>
    <Text style={{ color: '#75646d', marginTop: 6, fontSize: 13 }}>Xem quyền sử dụng và lịch sử giao dịch</Text>
  </TouchableOpacity>;
}

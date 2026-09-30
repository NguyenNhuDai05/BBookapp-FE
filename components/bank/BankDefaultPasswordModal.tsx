import React, { useState } from 'react';
import { StyleSheet, TextInput } from 'react-native';
import { BrandColors, Radius, Spacing, Typography } from '../../constants/theme';
import { AppModal } from '../ui/AppModal';

interface Props { visible: boolean; loading: boolean; onCancel: () => void; onSubmit: (password: string) => Promise<void> | void }
export function BankDefaultPasswordModal({ visible, loading, onCancel, onSubmit }: Props) {
  const [password, setPassword] = useState('');
  return <AppModal visible={visible} variant="confirm" title="Đặt làm mặc định"
    description="Nhập mật khẩu để xác nhận thay đổi tài khoản nhận tiền mặc định."
    onClose={onCancel} loading={loading} onShow={() => setPassword('')}
    primaryAction={{ label: 'Xác nhận', disabled: password.length < 6, loading, onPress: () => onSubmit(password) }}
    secondaryAction={{ label: 'Hủy', onPress: onCancel }}>
    <TextInput accessibilityLabel="Mật khẩu hiện tại" value={password} onChangeText={setPassword} secureTextEntry
      autoCapitalize="none" autoCorrect={false} placeholder="Mật khẩu hiện tại" style={styles.input} editable={!loading} />
  </AppModal>;
}
const styles = StyleSheet.create({ input: { minHeight: 54, borderWidth: 1, borderColor: BrandColors.borderLight, borderRadius: Radius.base, paddingHorizontal: Spacing.md, fontFamily: Typography.regular, color: BrandColors.textDark, marginTop: Spacing.md } });

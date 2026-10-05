import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

export function PasswordField({ label, value, onChangeText, editable = true }: { label: string; value: string; onChangeText: (value: string) => void; editable?: boolean }) {
  const [visible, setVisible] = useState(false);
  const Icon = visible ? EyeOff : Eye;
  return <View style={s.field}><Text style={s.label}>{label}</Text><View style={s.row}>
    <TextInput accessibilityLabel={label} placeholder={label} value={value} onChangeText={onChangeText} editable={editable}
      secureTextEntry={!visible} autoCapitalize="none" autoCorrect={false} maxLength={100} style={s.input} placeholderTextColor="#B08E9A" />
    <Pressable accessibilityRole="button" accessibilityLabel={`${visible ? 'Ẩn' : 'Hiện'} ${label.toLowerCase()}`} hitSlop={8} onPress={() => setVisible(v => !v)} style={s.eye}><Icon size={21} color="#9B6479" /></Pressable>
  </View></View>;
}
const s = StyleSheet.create({ field: { marginBottom: 16 }, label: { fontSize: 13, fontWeight: '700', color: '#654353', marginBottom: 8 }, row: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#EED6DF', borderRadius: 16, backgroundColor: '#FFFCFD', minHeight: 56 }, input: { flex: 1, paddingHorizontal: 15, paddingVertical: 16, color: '#301726', fontSize: 15 }, eye: { padding: 15 } });

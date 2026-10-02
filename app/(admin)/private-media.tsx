import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Button, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { api } from '../../services/api';

type Job = { id: string; action: string; status: string; attempts: number; result?: string; createdAt: string; isActive: boolean };
export default function PrivateMediaMaintenance() {
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const refresh = useCallback(async () => {
    try { const response = await api.get<Job[]>('/admin/private-media/jobs'); setJobs(response.data); setError(''); }
    catch { setError('Không tải được trạng thái. Render có thể đang khởi động; hãy thử lại.'); }
  }, []);
  useEffect(() => { void refresh(); const timer = setInterval(() => { void refresh(); }, 15000); return () => clearInterval(timer); }, [refresh]);
  const start = async (action: string) => {
    setBusy(true);
    try { await api.post('/admin/private-media/jobs', { action, confirmPrivateBackup: action === 'migrate', confirmLegacyDeletion: action === 'cleanup-legacy' }); await refresh(); }
    catch (e: any) { Alert.alert('Chưa chạy được', e.response?.data?.message || 'Kiểm tra trạng thái trước khi thử lại để tránh tạo tác vụ trùng.'); await refresh(); }
    finally { setBusy(false); }
  };
  const confirm = (action: string) => {
    const message = action === 'migrate' ? 'Chỉ tiếp tục khi đã sao lưu database và ảnh vào nơi riêng tư. Tác vụ chuyển ảnh và giữ bản public cũ.' : 'Thao tác này xóa ảnh public cũ. Chỉ tiếp tục khi đã kiểm tra ảnh private, quyền truy cập và backup. Cần kiểm tra CDN sau khi hoàn tất.';
    Alert.alert('Xác nhận thao tác', message, [{ text: 'Hủy', style: 'cancel' }, { text: 'Đã kiểm tra, tiếp tục', style: action === 'cleanup-legacy' ? 'destructive' : 'default', onPress: () => void start(action) }]);
  };
  const disabled = busy || jobs.some(job => job.isActive);
  return <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}><ScrollView contentContainerStyle={{ padding: 20, gap: 16 }}>
    <Button title="Quay lại" onPress={() => router.back()} />
    <Text style={{ fontSize: 24, fontWeight: 'bold' }}>Bảo vệ ảnh riêng tư</Text>
    <Text>Chạy audit trước khi chuyển dữ liệu. Tác vụ lưu trạng thái trong database và tiếp tục khi backend khởi động lại. Giữ màn hình mở để theo dõi trên Render Free.</Text>
    {!!error && <Text accessibilityRole="alert" style={{ color: '#b00020' }}>{error}</Text>}
    <Button title="Làm mới trạng thái" onPress={() => void refresh()} />
    <Button title="1. Kiểm tra dữ liệu (audit)" disabled={disabled} onPress={() => void start('audit')} />
    <Button title="2. Chuyển ảnh sang private" disabled={disabled} onPress={() => confirm('migrate')} />
    <Button title="3. Xóa bản public cũ đã kiểm chứng" color="#b00020" disabled={disabled} onPress={() => confirm('cleanup-legacy')} />
    <Button title="Dọn upload bỏ dở quá 24 giờ" disabled={disabled} onPress={() => void start('cleanup-orphans')} />
    {jobs.map(job => <View key={job.id} style={{ padding: 14, borderWidth: 1, borderColor: '#ddd', borderRadius: 12, gap: 6 }}>
      <Text style={{ fontWeight: 'bold' }}>{job.action} — {job.status}</Text>
      <Text>{new Date(job.createdAt).toLocaleString()} · Lần chạy: {job.attempts}</Text>
      {!!job.result && <Text>{job.result}</Text>}
    </View>)}
  </ScrollView></SafeAreaView>;
}

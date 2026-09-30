import { LinearGradient } from 'expo-linear-gradient';
import { Redirect, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { authService } from '../../services/authService';
import { useAuthStore } from '../../store/useAuthStore';
import { useRegistrationStore } from '../../store/useRegistrationStore';
import { UserRole } from '../../types/auth';
import { sanitizeUiMessage } from '../../utils/uiMessage';

export default function VerifyEmailScreen() {
  const router = useRouter();
  const { draft, resendAt, markSent, clear } = useRegistrationStore();
  const login = useAuthStore((state) => state.login);
  const [otp, setOtp] = useState('');
  const [now, setNow] = useState(() => Date.now());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [created, setCreated] = useState(false);
  const input = useRef<TextInput>(null);
  const inFlight = useRef(false);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  if (!draft) return <Redirect href="/(auth)/register" />;

  const seconds = Math.max(0, Math.ceil((resendAt - now) / 1000));
  const [local, domain] = draft.email.split('@');
  const maskedEmail = `${local.slice(0, Math.min(2, Math.max(1, local.length - 1)))}***@${domain}`;

  const verify = async () => {
    if (inFlight.current) return;
    if (!created && !/^\d{6}$/.test(otp)) {
      setError('Vui lòng nhập đủ mã gồm 6 chữ số.');
      return;
    }
    inFlight.current = true;
    setBusy(true);
    setError('');
    setNotice('');
    let accountCreated = created;
    try {
      if (!accountCreated) {
        await authService.register({ ...draft, role: UserRole.Customer, otp });
        accountCreated = true;
        setCreated(true);
      }
      if (await login(draft.email, draft.password)) {
        clear();
        router.replace('/(tabs)/home' as any);
      } else {
        setError('Tài khoản đã được tạo. Chưa thể đăng nhập, vui lòng thử lại.');
      }
    } catch (err: any) {
      setError(sanitizeUiMessage(err?.response?.data?.message || err?.response?.data?.Message || err?.message,
        accountCreated ? 'Tài khoản đã được tạo. Vui lòng thử đăng nhập lại.' : 'Không thể xác minh mã. Vui lòng thử lại.'));
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  };

  const resend = async () => {
    if (inFlight.current || Date.now() < resendAt || created) return;
    inFlight.current = true;
    setBusy(true);
    setError('');
    setNotice('');
    try {
      await authService.requestRegistrationOtp(draft.email);
      markSent();
      setNow(Date.now());
      setOtp('');
      setNotice('Đã gửi mã mới. Vui lòng kiểm tra email.');
      input.current?.focus();
    } catch (err: any) {
      if (err?.response?.status === 429) { markSent(); setNow(Date.now()); }
      setError(sanitizeUiMessage(err?.response?.data?.message || err?.response?.data?.Message || err?.message,
        'Chưa thể gửi lại mã. Vui lòng thử lại.'));
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  };

  return (
    <LinearGradient colors={['#FFE2D7', '#F799A5', '#F55389']} style={styles.flex}>
      <SafeAreaView style={styles.flex}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.container}>
            <View style={styles.card}>
              <Pressable disabled={busy} onPress={() => { clear(); router.replace('/(auth)/register'); }}>
                <Text style={styles.link}>← Nhập lại thông tin</Text>
              </Pressable>
              <Text style={styles.title}>Xác minh email</Text>
              <Text style={styles.description}>Chúng tôi đã gửi mã gồm 6 chữ số đến</Text>
              <Text style={styles.email}>{maskedEmail}</Text>
              {!created && <>
                <Pressable style={styles.otpWrap} onPress={() => input.current?.focus()} accessibilityLabel="Nhập mã xác minh email">
                  <View style={styles.digits} pointerEvents="none">
                    {Array.from({ length: 6 }, (_, index) => (
                      <View key={index} style={[styles.digit, index === otp.length && styles.activeDigit]}>
                        <Text style={styles.digitText}>{otp[index] || ''}</Text>
                      </View>
                    ))}
                  </View>
                  <TextInput ref={input} value={otp} onChangeText={(value) => { setOtp(value.replace(/\D/g, '').slice(0, 6)); setError(''); }}
                    accessibilityLabel="Mã OTP gồm 6 chữ số" keyboardType="number-pad" textContentType="oneTimeCode"
                    autoComplete="one-time-code" maxLength={6} autoFocus editable={!busy} caretHidden
                    style={styles.otpInput} onSubmitEditing={verify} />
                </Pressable>
                <Text style={styles.description}>Mã có hiệu lực trong 5 phút</Text>
              </>}
              {!!error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
              {!!notice && <Text style={styles.notice}>{notice}</Text>}
              <Pressable disabled={busy || (!created && otp.length !== 6)} onPress={verify}
                style={[styles.button, (busy || (!created && otp.length !== 6)) && styles.disabled]}>
                {busy ? <ActivityIndicator color="#FFF" /> : <Text style={styles.buttonText}>{created ? 'Thử đăng nhập lại' : 'Xác minh'}</Text>}
              </Pressable>
              {!created && <>
                <Text style={styles.description}>Không nhận được mã?</Text>
                <Pressable onPress={resend} disabled={busy || seconds > 0} style={styles.resend}>
                  <Text style={[styles.link, (busy || seconds > 0) && styles.disabled]}>
                    Gửi lại mã{seconds > 0 ? ` (00:${String(seconds).padStart(2, '0')})` : ''}
                  </Text>
                </Pressable>
              </>}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flexGrow: 1, justifyContent: 'center', padding: 22 },
  card: { padding: 22, borderRadius: 28, backgroundColor: 'rgba(255,255,255,0.96)' },
  title: { marginTop: 28, marginBottom: 16, fontSize: 28, fontWeight: '900', color: '#301726', textAlign: 'center' },
  description: { color: '#8D6674', textAlign: 'center', lineHeight: 22, marginTop: 12 },
  email: { color: '#301726', fontWeight: '800', textAlign: 'center', marginTop: 6 },
  otpWrap: { marginTop: 28, height: 54 },
  digits: { flexDirection: 'row', gap: 8, height: 54 },
  digit: { flex: 1, borderWidth: 1, borderColor: '#F3C9D2', borderRadius: 10, backgroundColor: '#FFF9FA', alignItems: 'center', justifyContent: 'center' },
  activeDigit: { borderColor: '#F55389', borderWidth: 2 },
  digitText: { fontSize: 24, fontWeight: '800', color: '#301726' },
  otpInput: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, opacity: 0.02, color: 'transparent' },
  button: { marginTop: 24, marginBottom: 12, height: 56, borderRadius: 18, backgroundColor: '#F55389', alignItems: 'center', justifyContent: 'center' },
  buttonText: { color: '#FFF', fontWeight: '900', fontSize: 16 },
  disabled: { opacity: 0.45 },
  link: { color: '#D93D72', fontWeight: '800' },
  resend: { padding: 14, alignItems: 'center' },
  error: { color: '#D63E5B', marginTop: 16, textAlign: 'center', lineHeight: 20 },
  notice: { color: '#397453', marginTop: 16, textAlign: 'center' },
});

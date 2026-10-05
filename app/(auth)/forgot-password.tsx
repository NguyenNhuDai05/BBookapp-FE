import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, KeyRound, Mail, ShieldCheck } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, AppState, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PasswordField } from '../../components/auth/PasswordField';
import { authService } from '../../services/authService';
import { getApiError } from '../../services/api';
import { useAuthStore } from '../../store/useAuthStore';

type Step = 'email' | 'otp' | 'password';
export default function ForgotPasswordScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ mode?: string; sentAt?: string; cooldown?: string }>();
  const accountEmail = useAuthStore(state => state.user?.email);
  const fromAccount = params.mode === 'account' && !!accountEmail;
  const [step, setStep] = useState<Step>(fromAccount ? 'otp' : 'email');
  const [email, setEmail] = useState(fromAccount ? accountEmail! : '');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [resendAt, setResendAt] = useState(() => fromAccount ? (Number(params.sentAt) || Date.now()) + (Number(params.cooldown) || 60) * 1000 : 0);
  const [now, setNow] = useState(() => Date.now());
  const grant = useRef<{ token: string; expiresAt: number } | null>(null);
  const inFlight = useRef(false);
  const otpInput = useRef<TextInput>(null);
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    const subscription = AppState.addEventListener('change', state => { if (state === 'active') setNow(Date.now()); });
    return () => { clearInterval(timer); subscription.remove(); };
  }, []);
  const remaining = Math.max(0, Math.ceil((resendAt - now) / 1000));
  const maskedEmail = email.replace(/^(.{1,2}).*(@.*)$/, '$1***$2');
  const startRequest = () => { if (inFlight.current) return false; inFlight.current = true; setBusy(true); setError(''); setNotice(''); return true; };
  const finishRequest = () => { inFlight.current = false; setBusy(false); };
  const send = async () => {
    if (step !== 'email' && Date.now() < resendAt) return;
    const address = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address)) { setError('Vui lòng nhập email hợp lệ.'); return; }
    if (!startRequest()) return;
    try {
      const result = await authService.requestPasswordReset(address);
      setEmail(address); setOtp(''); grant.current = null;
      setResendAt(Date.now() + (result?.resendAfterSeconds ?? 60) * 1000); setNow(Date.now());
      setStep('otp'); setNotice('Nếu email có tài khoản phù hợp, mã xác minh đã được gửi. Mã có hiệu lực trong 5 phút.');
      otpInput.current?.focus();
    } catch (e) { setError(getApiError(e).message); }
    finally { finishRequest(); }
  };
  const verify = async () => {
    if (!/^\d{6}$/.test(otp) || !startRequest()) return;
    try {
      const result = await authService.verifyPasswordResetOtp(email, otp);
      grant.current = { token: result.resetToken, expiresAt: Date.now() + result.expiresInSeconds * 1000 };
      setOtp(''); setStep('password');
    } catch (e) { setError(getApiError(e).message); }
    finally { finishRequest(); }
  };
  const save = async () => {
    if (password.length < 6 || password.length > 100) { setError('Mật khẩu phải có từ 6 đến 100 ký tự.'); return; }
    if (password !== confirm) { setError('Mật khẩu xác nhận không khớp.'); return; }
    if (!grant.current || grant.current.expiresAt <= Date.now()) {
      grant.current = null; setPassword(''); setConfirm(''); setStep('otp'); setError('Phiên xác minh đã hết hạn. Vui lòng gửi mã mới.'); return;
    }
    if (!startRequest()) return;
    try {
      await authService.completePasswordReset(email, grant.current.token, password);
      grant.current = null; setPassword(''); setConfirm('');
      if (useAuthStore.getState().isAuthenticated) {
        try { await useAuthStore.getState().logout(); }
        catch { await useAuthStore.getState().expireSession(); }
      }
      router.dismissAll();
      router.replace({ pathname: '/(auth)/login', params: { email, passwordReset: '1' } });
    } catch (e) {
      const failure = getApiError(e);
      if (failure.code === 'RESET_EXPIRED') { grant.current = null; setPassword(''); setConfirm(''); setStep('otp'); }
      setError(failure.message);
    } finally { finishRequest(); }
  };
  const back = () => {
    if (busy) return;
    if (step === 'password') { grant.current = null; setPassword(''); setConfirm(''); setStep('otp'); }
    else if (step === 'otp' && !fromAccount) { setStep('email'); setOtp(''); setError(''); setNotice(''); }
    else router.back();
  };
  const number = step === 'email' ? 1 : step === 'otp' ? 2 : 3;
  const Icon = step === 'email' ? Mail : step === 'otp' ? ShieldCheck : KeyRound;
  return <LinearGradient colors={['#FFF3F5', '#FDE5ED', '#FFF9FB']} style={s.flex}>
    <SafeAreaView style={s.flex}><KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={s.flex}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={s.page}>
        <Pressable onPress={back} disabled={busy} accessibilityLabel="Quay lại" style={s.back}><ArrowLeft size={23} color="#6E3549" /></Pressable>
        <View style={s.card}>
          <View style={s.icon}><Icon size={29} color="#E7477B" /></View>
          <Text style={s.progress}>BƯỚC {number}/3</Text>
          <View style={s.progressRow}>{[1, 2, 3].map(n => <View key={n} style={[s.progressBar, n <= number && s.progressActive]} />)}</View>
          <Text style={s.title}>{step === 'email' ? 'Quên mật khẩu' : step === 'otp' ? 'Xác minh email' : 'Mật khẩu mới'}</Text>
          <Text style={s.description}>{step === 'email' ? 'Nhập email tài khoản để nhận mã xác minh.' : step === 'otp' ? 'Nhập mã gồm 6 số được gửi đến ' + maskedEmail + '.' : 'Tạo mật khẩu mới để đăng nhập lại vào BBook.'}</Text>
          {step === 'email' && <View style={s.field}><Text style={s.label}>Email tài khoản</Text><TextInput accessibilityLabel="Email tài khoản" placeholder="Nhập email tài khoản" value={email} onChangeText={setEmail} editable={!busy} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} textContentType="emailAddress" style={s.email} /></View>}
          {step === 'otp' && <>
            <Pressable onPress={() => otpInput.current?.focus()} style={s.otpWrap}>
              <View pointerEvents="none" style={s.digits}>{Array.from({ length: 6 }, (_, i) => <View key={i} style={[s.digit, i === otp.length && s.digitActive]}><Text style={s.digitText}>{otp[i] || ''}</Text></View>)}</View>
              <TextInput ref={otpInput} accessibilityLabel="Mã OTP gồm 6 chữ số" value={otp} onChangeText={v => setOtp(v.replace(/\D/g, '').slice(0, 6))} editable={!busy} keyboardType="number-pad" textContentType="oneTimeCode" autoComplete="sms-otp" maxLength={6} caretHidden style={s.otpInput} />
            </Pressable>
            <View style={s.resendRow}><Text style={s.small}>Chưa nhận được mã?</Text><Pressable disabled={busy || remaining > 0} onPress={send} accessibilityRole="button"><Text style={[s.link, (busy || remaining > 0) && s.muted]}>{remaining > 0 ? 'Gửi lại sau ' + remaining + 's' : 'Gửi lại mã'}</Text></Pressable></View>
          </>}
          {step === 'password' && <><PasswordField label="Mật khẩu mới" value={password} onChangeText={setPassword} editable={!busy} /><PasswordField label="Xác nhận mật khẩu mới" value={confirm} onChangeText={setConfirm} editable={!busy} /><Text style={s.rule}>Sử dụng từ 6 đến 100 ký tự.</Text></>}
          {!!notice && <Text style={s.notice}>{notice}</Text>}
          {!!error && <Text accessibilityRole="alert" style={s.error}>{error}</Text>}
          <Pressable accessibilityRole="button" disabled={busy || (step === 'otp' && otp.length !== 6)} onPress={step === 'email' ? send : step === 'otp' ? verify : save} style={[s.button, (busy || (step === 'otp' && otp.length !== 6)) && s.disabled]}>
            {busy ? <ActivityIndicator color="#FFF" /> : <Text style={s.buttonText}>{step === 'email' ? 'Gửi mã xác minh' : step === 'otp' ? 'Xác minh' : 'Lưu mật khẩu mới'}</Text>}
          </Pressable>
          {step === 'otp' && !fromAccount && <Pressable onPress={back} disabled={busy}><Text style={s.changeEmail}>Đổi email</Text></Pressable>}
        </View>
        <Text style={s.footer}>BBook · An tâm trong từng trải nghiệm</Text>
      </ScrollView>
    </KeyboardAvoidingView></SafeAreaView>
  </LinearGradient>;
}
const s = StyleSheet.create({ flex: { flex: 1 }, page: { flexGrow: 1, justifyContent: 'center', padding: 24, paddingVertical: 30, maxWidth: 520, width: '100%', alignSelf: 'center' }, back: { alignSelf: 'flex-start', padding: 12, marginBottom: 20, borderRadius: 18, backgroundColor: '#FFFFFFBB' }, card: { backgroundColor: '#FFF', borderRadius: 28, padding: 24, shadowColor: '#8F4160', shadowOpacity: .08, shadowRadius: 20, shadowOffset: { width: 0, height: 8 }, elevation: 3 }, icon: { width: 64, height: 64, backgroundColor: '#FFF0F5', borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginBottom: 20 }, progress: { color: '#B1728B', fontWeight: '800', fontSize: 11, letterSpacing: 1.4 }, progressRow: { flexDirection: 'row', gap: 6, marginTop: 9, marginBottom: 24 }, progressBar: { flex: 1, height: 4, borderRadius: 4, backgroundColor: '#F5E8ED' }, progressActive: { backgroundColor: '#EF5488' }, title: { fontSize: 27, fontWeight: '800', color: '#301726' }, description: { color: '#886879', lineHeight: 23, marginTop: 10, marginBottom: 25 }, field: { marginBottom: 15 }, label: { fontSize: 13, color: '#654353', fontWeight: '700', marginBottom: 8 }, email: { borderWidth: 1, borderColor: '#EED6DF', borderRadius: 16, minHeight: 56, padding: 15, backgroundColor: '#FFFCFD', color: '#301726' }, otpWrap: { position: 'relative', height: 58 }, digits: { flexDirection: 'row', gap: 7, height: 58 }, digit: { flex: 1, borderWidth: 1, borderColor: '#EED6DF', borderRadius: 12, backgroundColor: '#FFFCFD', justifyContent: 'center', alignItems: 'center' }, digitActive: { borderColor: '#EF5488', backgroundColor: '#FFF3F7' }, digitText: { fontSize: 23, fontWeight: '700', color: '#301726' }, otpInput: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, opacity: .02, color: 'transparent', fontSize: 1 }, resendRow: { alignItems: 'center', gap: 7, marginVertical: 20 }, small: { color: '#967486', fontSize: 13 }, link: { color: '#D93D72', fontWeight: '700', fontSize: 13 }, muted: { color: '#AA91A0' }, rule: { color: '#967486', fontSize: 12, marginBottom: 12 }, notice: { fontSize: 12, color: '#886879', lineHeight: 19, marginBottom: 14 }, error: { color: '#C93453', backgroundColor: '#FFF1F4', padding: 12, borderRadius: 12, marginBottom: 15, lineHeight: 20 }, button: { minHeight: 55, justifyContent: 'center', alignItems: 'center', backgroundColor: '#EF5488', borderRadius: 17, marginTop: 6 }, disabled: { opacity: .5 }, buttonText: { color: '#FFF', fontWeight: '800', fontSize: 15 }, changeEmail: { textAlign: 'center', color: '#D93D72', fontWeight: '700', paddingTop: 20 }, footer: { textAlign: 'center', color: '#B58D9F', fontSize: 11, marginTop: 26 } });

import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { Check, Eye, EyeOff, LockKeyhole, Mail, Phone, Sparkles, UserRound } from "lucide-react-native";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useGoogleOAuth } from "../../hooks/useGoogleOAuth";
import { useAuthStore } from "../../store/useAuthStore";
import { UserRole } from "../../types/auth";

const authLogo = require("../../assets/images/B.png");

const getRegisterErrorMessage = (err: any) => {
  const data = err?.response?.data;

  if (typeof data === "string") return data;
  if (data?.message) return data.message;
  if (data?.Message) return data.Message;

  if (data?.errors && typeof data.errors === "object") {
    const firstError = Object.values(data.errors)
      .flat()
      .find((item) => typeof item === "string");

    if (firstError) return firstError as string;
  }

  if (data?.title) return data.title;
  if (err?.message) return err.message;

  return "Đăng ký thất bại. Vui lòng thử lại.";
};

export default function RegisterScreen() {
  const router = useRouter();
  const registerStore = useAuthStore((state) => state.register);
  const loginWithGoogleToken = useAuthStore((state) => state.loginWithGoogleToken);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [acceptedPolicy, setAcceptedPolicy] = useState(false);

  const handleGoogleToken = useCallback(
    async (idToken: string) => {
      const success = await loginWithGoogleToken(idToken);

      if (success) {
        router.replace("/(tabs)/home" as any);
        return true;
      }

      Alert.alert(
        "Đăng ký Google thất bại",
        "Không thể xác thực tài khoản Google. Vui lòng thử lại hoặc đăng ký bằng email.",
      );

      return false;
    },
    [loginWithGoogleToken, router],
  );

  const { googleLoading, googleReady, signInWithGoogle } =
    useGoogleOAuth(handleGoogleToken);

  const handleRegister = async () => {
    setError("");

    if (!acceptedPolicy) {
      setError("Vui lòng đọc và đồng ý với chính sách trước khi đăng ký.");
      return;
    }

    if (
      !fullName.trim() ||
      !email.trim() ||
      !phoneNumber.trim() ||
      !password.trim() ||
      !confirmPassword.trim()
    ) {
      setError("Vui lòng nhập đầy đủ thông tin.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Email không hợp lệ.");
      return;
    }

    if (password.length < 6) {
      setError("Mật khẩu phải có ít nhất 6 ký tự.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp.");
      return;
    }

    try {
      setLoading(true);
      const trimmedEmail = email.trim();

      const success = await registerStore(
        fullName.trim(),
        trimmedEmail,
        password,
        phoneNumber.trim(),
        UserRole.Customer,
      );

      if (success) {
        router.replace({
          pathname: "/(auth)/login",
          params: { registered: "1", email: trimmedEmail },
        } as any);
      } else {
        Alert.alert("Đăng ký thất bại", "Có lỗi xảy ra. Vui lòng thử lại.");
      }
    } catch (err: any) {
      console.error("Register error:", err?.response?.data || err?.message || err);
      setError(getRegisterErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleGooglePress = async () => {
    if (!acceptedPolicy) {
      setError("Vui lòng đọc và đồng ý với chính sách trước khi đăng ký.");
      return;
    }

    try {
      await signInWithGoogle();
    } catch (err: any) {
      Alert.alert("Google OAuth", err?.message || "Không thể mở Google OAuth.");
    }
  };

  return (
    <LinearGradient colors={["#FFE2D7", "#F799A5", "#F55389"]} style={styles.bg}>
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.flex}
        >
          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            <View style={styles.brandBlock}>
              <Image source={authLogo} style={styles.authLogo} resizeMode="contain" />
            </View>

            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.badge}>
                  <Sparkles size={15} color="#F55389" />
                  <Text style={styles.badgeText}>Thành viên mới</Text>
                </View>
                <Text style={styles.title}>Đăng ký</Text>
                <Text style={styles.subtitle}>
                  Hoàn tất thông tin để tạo ví và hồ sơ khách hàng.
                </Text>
              </View>

              {error ? (
                <View style={styles.errorBox}>
                  <Text style={styles.errorBoxText}>{error}</Text>
                </View>
              ) : null}

              <AuthInput
                icon={<UserRound size={18} color="#E46B87" />}
                label="Họ và tên"
                placeholder="Nhập họ và tên"
                value={fullName}
                onChangeText={setFullName}
              />

              <AuthInput
                icon={<Mail size={18} color="#E46B87" />}
                label="Email"
                placeholder="Nhập email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
              />

              <AuthInput
                icon={<Phone size={18} color="#E46B87" />}
                label="Số điện thoại"
                placeholder="Nhập số điện thoại"
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                keyboardType="phone-pad"
              />

              <AuthInput
                icon={<LockKeyhole size={18} color="#E46B87" />}
                label="Mật khẩu"
                placeholder="Tạo mật khẩu"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />

              <AuthInput
                icon={<LockKeyhole size={18} color="#E46B87" />}
                label="Xác nhận mật khẩu"
                placeholder="Nhập lại mật khẩu"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
              />

              <View style={styles.policyRow}>
                <Pressable
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: acceptedPolicy }}
                  accessibilityLabel="Đồng ý với chính sách và điều khoản"
                  hitSlop={8}
                  onPress={() => {
                    setAcceptedPolicy((accepted) => !accepted);
                    setError("");
                  }}
                  style={[styles.checkbox, acceptedPolicy && styles.checkboxChecked]}
                >
                  {acceptedPolicy ? <Check size={16} strokeWidth={3} color="#FFF" /> : null}
                </Pressable>
                <Text style={styles.policyText}>
                  Tôi đã đọc và đồng ý với{" "}
                  <Text style={styles.policyLink} onPress={() => router.push("/policy" as any)}>
                    Chính sách & Điều khoản của B-Book
                  </Text>
                </Text>
              </View>

              <TouchableOpacity
                activeOpacity={0.85}
                onPress={handleRegister}
                disabled={loading || !acceptedPolicy}
                style={[styles.primaryButton, (loading || !acceptedPolicy) && styles.disabledButton]}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.primaryButtonText}>Tạo tài khoản</Text>
                )}
              </TouchableOpacity>

              <View style={styles.dividerRow}>
                <View style={styles.divider} />
                <Text style={styles.dividerText}>hoặc</Text>
                <View style={styles.divider} />
              </View>

              <TouchableOpacity
                activeOpacity={0.85}
                onPress={handleGooglePress}
                disabled={googleLoading || !googleReady || !acceptedPolicy}
                style={[
                  styles.googleButton,
                  (googleLoading || !googleReady || !acceptedPolicy) && styles.disabledButton,
                ]}
              >
                {googleLoading ? (
                  <ActivityIndicator color="#F55389" />
                ) : (
                  <>
                    <View style={styles.googleMark}>
                      <Text style={styles.googleMarkText}>G</Text>
                    </View>
                    <Text style={styles.googleText}>Đăng ký với Google</Text>
                  </>
                )}
              </TouchableOpacity>

              <Pressable onPress={() => router.replace("/login" as any)} style={styles.switchRow}>
                <Text style={styles.switchText}>Đã có tài khoản?</Text>
                <Text style={styles.switchAction}> Đăng nhập</Text>
              </Pressable>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

type AuthInputProps = {
  icon: React.ReactNode;
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  secureTextEntry?: boolean;
  keyboardType?: "default" | "email-address" | "phone-pad";
};

function AuthInput({
  icon,
  label,
  placeholder,
  value,
  onChangeText,
  secureTextEntry,
  keyboardType = "default",
}: AuthInputProps) {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  return (
    <View style={styles.inputWrap}>
      <Text style={styles.inputLabel}>{label}</Text>
      <View style={styles.inputShell}>
        {icon}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#C99DA7"
          secureTextEntry={secureTextEntry && !isPasswordVisible}
          keyboardType={keyboardType}
          autoCapitalize="none"
          style={styles.input}
        />
        {secureTextEntry ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={isPasswordVisible ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
            hitSlop={10}
            onPress={() => setIsPasswordVisible((visible) => !visible)}
            style={styles.passwordToggle}
          >
            {isPasswordVisible ? (
              <EyeOff size={20} color="#A66D7E" />
            ) : (
              <Eye size={20} color="#A66D7E" />
            )}
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1 },
  safeArea: { flex: 1 },
  flex: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 22,
    paddingVertical: 24,
    justifyContent: "center",
  },
  brandBlock: {
    alignItems: "center",
    justifyContent: "center",
    height: 138,
    marginBottom: 12,
    overflow: "hidden",
  },
  authLogo: {
    width: 390,
    height: 390,
    opacity: 0.9,
    transform: [{ translateY: -2 }],
  },
  card: {
    borderRadius: 28,
    backgroundColor: "rgba(255,255,255,0.94)",
    padding: 22,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.72)",
    shadowColor: "#BB3A66",
    shadowOpacity: 0.18,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 6,
  },
  cardHeader: { marginBottom: 16 },
  badge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: "#FFF0F4",
  },
  badgeText: { color: "#C94473", fontSize: 12, fontWeight: "800" },
  title: { marginTop: 14, fontSize: 28, color: "#301726", fontWeight: "900" },
  subtitle: { marginTop: 5, color: "#8D6674", fontSize: 14, lineHeight: 20 },
  errorBox: {
    borderRadius: 16,
    padding: 12,
    backgroundColor: "#FFF2F4",
    borderWidth: 1,
    borderColor: "#F0BBC7",
    marginBottom: 14,
  },
  errorBoxText: { color: "#D63E5B", fontSize: 13, fontWeight: "800" },
  inputWrap: { marginBottom: 13 },
  inputLabel: {
    marginBottom: 7,
    color: "#6E3549",
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  inputShell: {
    minHeight: 54,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: "#F3C9D2",
    backgroundColor: "#FFF9FA",
    paddingHorizontal: 15,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  input: { flex: 1, color: "#301726", fontSize: 15, fontWeight: "600" },
  passwordToggle: {
    padding: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButton: {
    height: 56,
    borderRadius: 18,
    backgroundColor: "#F55389",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  disabledButton: { opacity: 0.45 },
  primaryButtonText: { color: "#fff", fontSize: 15, fontWeight: "900" },
  policyRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    marginTop: 2,
    marginBottom: 14,
  },
  checkbox: {
    width: 23,
    height: 23,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: "#D88DA0",
    backgroundColor: "#FFF",
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxChecked: { backgroundColor: "#F55389", borderColor: "#F55389" },
  policyText: { flex: 1, color: "#795565", fontSize: 13, lineHeight: 19, fontWeight: "600" },
  policyLink: { color: "#D93D72", fontWeight: "900", textDecorationLine: "underline" },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginVertical: 18,
  },
  divider: { flex: 1, height: 1, backgroundColor: "#F2CAD2" },
  dividerText: { color: "#B57F8D", fontWeight: "800", fontSize: 12 },
  googleButton: {
    height: 54,
    borderRadius: 18,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#F0C4CD",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  googleMark: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFF0F4",
  },
  googleMarkText: { color: "#F55389", fontSize: 16, fontWeight: "900" },
  googleText: { color: "#4D2636", fontWeight: "900", fontSize: 14 },
  switchRow: { flexDirection: "row", justifyContent: "center", marginTop: 18 },
  switchText: { color: "#8D6674", fontWeight: "700" },
  switchAction: { color: "#F55389", fontWeight: "900" },
});

import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { LockKeyhole, Mail, Phone, Sparkles, UserRound } from "lucide-react-native";
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
import { authService } from "../../services/authService";
import { useAuthStore } from "../../store/useAuthStore";

const authLogo = require("../../assets/images/logo-bbook.png");

export default function RegisterScreen() {
  const router = useRouter();
  const loginWithGoogleToken = useAuthStore((state) => state.loginWithGoogleToken);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleGoogleToken = useCallback(
    async (idToken: string) => {
      const success = await loginWithGoogleToken(idToken);

      if (success) {
        router.replace("/(tabs)/home" as any);
        return true;
      }

      Alert.alert(
        "Chua ket noi Google OAuth",
        "Frontend da lay duoc Google token, nhung backend can them endpoint /api/Auth/google de cap JWT cho app.",
      );

      return false;
    },
    [loginWithGoogleToken, router],
  );

  const { googleLoading, signInWithGoogle } = useGoogleOAuth(handleGoogleToken);

  const handleRegister = async () => {
    setError("");

    if (
      !fullName.trim() ||
      !email.trim() ||
      !phoneNumber.trim() ||
      !password.trim() ||
      !confirmPassword.trim()
    ) {
      setError("Vui long nhap day du thong tin.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Email khong hop le.");
      return;
    }

    if (password.length < 6) {
      setError("Mat khau phai co it nhat 6 ky tu.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Mat khau xac nhan khong khop.");
      return;
    }

    try {
      setLoading(true);
      await authService.register(
        fullName.trim(),
        email.trim(),
        password,
        phoneNumber.trim(),
      );

      Alert.alert(
        "Dang ky thanh cong",
        "Tai khoan cua ban da duoc tao. Hay dang nhap de tiep tuc.",
        [{ text: "Dang nhap", onPress: () => router.replace("/login" as any) }],
      );
    } catch (err: any) {
      const message =
        err?.response?.data?.message ||
        err?.response?.data?.Message ||
        "Dang ky that bai. Vui long thu lai.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleGooglePress = async () => {
    try {
      await signInWithGoogle();
    } catch (err: any) {
      Alert.alert("Google OAuth", err?.message || "Khong the mo Google OAuth.");
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
              <Image source={authLogo} style={styles.authLogo} resizeMode="cover" />
            </View>

            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.badge}>
                  <Sparkles size={15} color="#F55389" />
                  <Text style={styles.badgeText}>New member</Text>
                </View>
                <Text style={styles.title}>Dang ky</Text>
                <Text style={styles.subtitle}>
                  Hoan tat thong tin de tao vi va ho so khach hang.
                </Text>
              </View>

              {error ? (
                <View style={styles.errorBox}>
                  <Text style={styles.errorBoxText}>{error}</Text>
                </View>
              ) : null}

              <AuthInput
                icon={<UserRound size={18} color="#E46B87" />}
                label="Ho va ten"
                placeholder="Nguyen Van A"
                value={fullName}
                onChangeText={setFullName}
              />

              <AuthInput
                icon={<Mail size={18} color="#E46B87" />}
                label="Email"
                placeholder="you@example.com"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
              />

              <AuthInput
                icon={<Phone size={18} color="#E46B87" />}
                label="So dien thoai"
                placeholder="09xxxxxxxx"
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                keyboardType="phone-pad"
              />

              <AuthInput
                icon={<LockKeyhole size={18} color="#E46B87" />}
                label="Mat khau"
                placeholder="Toi thieu 6 ky tu"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />

              <AuthInput
                icon={<LockKeyhole size={18} color="#E46B87" />}
                label="Xac nhan mat khau"
                placeholder="Nhap lai mat khau"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
              />

              <TouchableOpacity
                activeOpacity={0.85}
                onPress={handleRegister}
                disabled={loading}
                style={[styles.primaryButton, loading && styles.disabled]}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.primaryButtonText}>Tao tai khoan</Text>
                )}
              </TouchableOpacity>

              <View style={styles.dividerRow}>
                <View style={styles.divider} />
                <Text style={styles.dividerText}>hoac</Text>
                <View style={styles.divider} />
              </View>

              <TouchableOpacity
                activeOpacity={0.85}
                onPress={handleGooglePress}
                disabled={googleLoading}
                style={[styles.googleButton, googleLoading && styles.disabled]}
              >
                {googleLoading ? (
                  <ActivityIndicator color="#F55389" />
                ) : (
                  <>
                    <View style={styles.googleMark}>
                      <Text style={styles.googleMarkText}>G</Text>
                    </View>
                    <Text style={styles.googleText}>Dang ky voi Google</Text>
                  </>
                )}
              </TouchableOpacity>

              <Pressable onPress={() => router.back()} style={styles.switchRow}>
                <Text style={styles.switchText}>Da co tai khoan?</Text>
                <Text style={styles.switchAction}> Dang nhap</Text>
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
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          autoCapitalize="none"
          style={styles.input}
        />
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
    marginBottom: 22,
  },
  authLogo: {
    width: "100%",
    height: 210,
    opacity: 0.9,
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
  primaryButton: {
    height: 56,
    borderRadius: 18,
    backgroundColor: "#F55389",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  disabled: { opacity: 0.72 },
  primaryButtonText: { color: "#fff", fontSize: 15, fontWeight: "900" },
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

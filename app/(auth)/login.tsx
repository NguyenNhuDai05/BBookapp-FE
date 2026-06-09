import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { LockKeyhole, Mail, Sparkles } from "lucide-react-native";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useGoogleOAuth } from "../../hooks/useGoogleOAuth";
import { useAuthStore } from "../../store/useAuthStore";

const authLogo = require("../../assets/images/logo-bbook.png");

export default function LoginScreen() {
  const router = useRouter();
  const login = useAuthStore((state) => state.login);
  const loginWithGoogleToken = useAuthStore((state) => state.loginWithGoogleToken);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>(
    {},
  );

  const goHome = useCallback(() => {
    router.replace("/(tabs)/home" as any);
  }, [router]);

  const handleGoogleToken = useCallback(
    async (idToken: string) => {
      const success = await loginWithGoogleToken(idToken);

      if (success) {
        goHome();
        return true;
      }

      Alert.alert(
        "Chua ket noi Google OAuth",
        "Frontend da lay duoc Google token, nhung backend can them endpoint /api/Auth/google de cap JWT cho app.",
      );

      return false;
    },
    [goHome, loginWithGoogleToken],
  );

  const { googleLoading, signInWithGoogle } = useGoogleOAuth(handleGoogleToken);

  const handleLogin = async () => {
    const localErrors: { email?: string; password?: string } = {};

    if (!email.trim() || !email.includes("@")) {
      localErrors.email = "Email khong hop le";
    }

    if (password.length < 6) {
      localErrors.password = "Mat khau toi thieu 6 ky tu";
    }

    if (Object.keys(localErrors).length > 0) {
      setErrors(localErrors);
      return;
    }

    setErrors({});
    setLoading(true);

    const success = await login(email.trim(), password);
    setLoading(false);

    if (success) {
      goHome();
      return;
    }

    Alert.alert(
      "Dang nhap that bai",
      "Email hoac mat khau khong chinh xac. Hay kiem tra lai tai khoan trong database backend.",
    );
  };

  const handleGooglePress = async () => {
    try {
      await signInWithGoogle();
    } catch (error: any) {
      Alert.alert("Google OAuth", error?.message || "Khong the mo Google OAuth.");
    }
  };

  return (
    <LinearGradient colors={["#FFE2D7", "#F799A5", "#F55389"]} style={styles.bg}>
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.flex}
        >
          <View style={styles.content}>
            <View style={styles.brandBlock}>
              <Image source={authLogo} style={styles.authLogo} resizeMode="cover" />
            </View>

            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.badge}>
                  <Sparkles size={15} color="#F55389" />
                  <Text style={styles.badgeText}>Beauty booking</Text>
                </View>
                <Text style={styles.title}>Dang nhap</Text>
                <Text style={styles.subtitle}>
                  Tiep tuc hanh trinh lam dep cua ban.
                </Text>
              </View>

              <AuthInput
                icon={<Mail size={18} color="#E46B87" />}
                label="Email"
                placeholder="you@example.com"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                error={errors.email}
              />

              <AuthInput
                icon={<LockKeyhole size={18} color="#E46B87" />}
                label="Mat khau"
                placeholder="Nhap mat khau"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                error={errors.password}
              />

              <TouchableOpacity
                activeOpacity={0.85}
                onPress={handleLogin}
                disabled={loading}
                style={[styles.primaryButton, loading && styles.disabled]}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.primaryButtonText}>Dang nhap</Text>
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
                    <Text style={styles.googleText}>Tiep tuc voi Google</Text>
                  </>
                )}
              </TouchableOpacity>

              <Pressable
                onPress={() => router.push("/register" as any)}
                style={styles.switchRow}
              >
                <Text style={styles.switchText}>Chua co tai khoan?</Text>
                <Text style={styles.switchAction}> Dang ky ngay</Text>
              </Pressable>
            </View>
          </View>
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
  error?: string;
};

function AuthInput({
  icon,
  label,
  placeholder,
  value,
  onChangeText,
  secureTextEntry,
  keyboardType = "default",
  error,
}: AuthInputProps) {
  return (
    <View style={styles.inputWrap}>
      <Text style={styles.inputLabel}>{label}</Text>
      <View style={[styles.inputShell, error && styles.inputError]}>
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
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1 },
  safeArea: { flex: 1 },
  flex: { flex: 1 },
  content: {
    flex: 1,
    paddingHorizontal: 22,
    paddingTop: 18,
    paddingBottom: 18,
    justifyContent: "center",
  },
  brandBlock: {
    alignItems: "center",
    justifyContent: "center",
    height: 88,
    marginBottom: 16,
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
    backgroundColor: "rgba(255,255,255,0.92)",
    padding: 22,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.72)",
    shadowColor: "#BB3A66",
    shadowOpacity: 0.18,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 6,
  },
  cardHeader: { marginBottom: 18 },
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
  inputWrap: { marginBottom: 15 },
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
  inputError: { borderColor: "#E54863", backgroundColor: "#FFF4F5" },
  input: { flex: 1, color: "#301726", fontSize: 15, fontWeight: "600" },
  errorText: { color: "#D63E5B", fontSize: 12, fontWeight: "700", marginTop: 5 },
  primaryButton: {
    height: 56,
    borderRadius: 18,
    backgroundColor: "#F55389",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#F55389",
    shadowOpacity: 0.35,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
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

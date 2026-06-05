import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
// CHUẨN HÓA: Thay thế SafeAreaView lỗi thời bằng thư viện đề xuất mới
import { SafeAreaView } from "react-native-safe-area-context";
// CHUẨN HÓA: Điều chỉnh đường dẫn import tăng thêm một bậc (../../) cho đúng vị trí thư mục (auth)
import CustomButton from "../../components/CustomButton";
import CustomInput from "../../components/CustomInput";
import { useAuthStore } from "../../store/useAuthStore";

export default function LoginScreen() {
  const router = useRouter();
  const loginFn = useAuthStore((state) => state.login);

  const [email, setEmail] = useState("demo@bbook.com"); // Tài khoản mẫu để test nhanh
  const [password, setPassword] = useState("123456");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>(
    {},
  );

  // Quy trình Validation dữ liệu đầu vào phía Client
  const handleLogin = async () => {
    let localErrors: { email?: string; password?: string } = {};
    if (!email.includes("@"))
      localErrors.email = "Định dạng Email không hợp lệ";
    if (password.length < 6)
      localErrors.password = "Mật khẩu phải chứa tối thiểu 6 ký tự";

    if (Object.keys(localErrors).length > 0) {
      setErrors(localErrors);
      return;
    }
    setErrors({});
    setLoading(true);

    const success = await loginFn(email, password);
    setLoading(false);

    if (success) {
      // CHUẨN HÓA: Ép kiểu "as any" để dập tắt triệt để lỗi ts(2345) cứng đầu của Expo Router
      router.replace("/(tabs)/home" as any);
    } else {
      Alert.alert(
        "Lỗi xác thực ❌",
        "Tài khoản hoặc mật khẩu không chính xác. Thử lại với demo@bbook.com / 123456",
      );
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-peach-light">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          className="px-6 justify-center"
        >
          <View className="items-center mb-8">
            <Text className="text-slate-800 text-3xl font-black tracking-tight">
              Chào mừng quay lại!
            </Text>
            <Text className="text-slate-500 text-xs mt-1.5 font-medium">
              Đăng nhập tài khoản B-Book để kết nối vạn sắc đẹp
            </Text>
          </View>

          <View className="bg-white/60 p-5 rounded-3xl border border-pink-100 shadow-sm">
            <CustomInput
              label="Địa chỉ Email"
              placeholder="Nhập email của bạn (ví dụ: demo@bbook.com)"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              error={errors.email}
            />

            <CustomInput
              label="Mật khẩu bảo mật"
              placeholder="Nhập chuỗi mật khẩu"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              error={errors.password}
            />

            <CustomButton
              title="Đăng Nhập Ngay"
              onPress={handleLogin}
              loading={loading}
              className="mt-4"
            />
          </View>

          <View className="flex-row justify-center items-center mt-6">
            <Text className="text-slate-500 text-xs font-semibold">
              Bạn là thành viên mới?{" "}
            </Text>
            {/* CHUẨN HÓA: Rút gọn route chuyển đổi sang trang Register thành relative path kèm ép kiểu */}
            <TouchableOpacity onPress={() => router.push("/register" as any)}>
              <Text className="color-bbook-pinkDark font-bold text-xs underline">
                Đăng ký tại đây
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

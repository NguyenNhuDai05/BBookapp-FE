import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import CustomButton from "../../components/CustomButton";
import CustomInput from "../../components/CustomInput";
import { authService } from "../../services/authService";

export default function RegisterScreen() {
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");

  const handleRegister = async () => {
    try {
      setError("");

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

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (!emailRegex.test(email)) {
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

      setLoading(true);

      await authService.register(fullName, email, password, phoneNumber);

      Alert.alert(
        "Đăng ký thành công 🎉",
        "Tài khoản của bạn đã được tạo thành công.",
        [
          {
            text: "Đăng nhập",
            onPress: () => router.replace("/login" as any),
          },
        ],
      );
    } catch (error: any) {
      console.log("Register error:", error);

      const message =
        error?.response?.data?.message || "Đăng ký thất bại. Vui lòng thử lại.";

      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-peach-light">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
          }}
          className="px-6 justify-center"
          showsVerticalScrollIndicator={false}
        >
          <View className="mb-8">
            <Text className="text-slate-800 text-3xl font-black">
              Chào mừng đến bBeauty ✨
            </Text>

            <Text className="text-slate-500 text-sm mt-2">
              Tạo tài khoản để đặt lịch trang điểm, theo dõi lịch hẹn và nhận
              nhiều ưu đãi dành riêng cho thành viên.
            </Text>
          </View>

          <View className="bg-white p-6 rounded-3xl border border-pink-100">
            {error ? (
              <View className="bg-red-50 border border-red-200 rounded-2xl p-3 mb-4">
                <Text className="text-red-500 text-sm font-bold">
                  ❌ {error}
                </Text>
              </View>
            ) : null}

            <CustomInput
              label="Họ và tên"
              placeholder="Nguyễn Văn A"
              value={fullName}
              onChangeText={setFullName}
            />

            <CustomInput
              label="Email"
              placeholder="example@gmail.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
            />

            <CustomInput
              label="Số điện thoại"
              placeholder="09xxxxxxxx"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              keyboardType="phone-pad"
            />

            <CustomInput
              label="Mật khẩu"
              placeholder="Nhập mật khẩu"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />

            <CustomInput
              label="Xác nhận mật khẩu"
              placeholder="Nhập lại mật khẩu"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
            />

            <CustomButton
              title="Tạo tài khoản"
              onPress={handleRegister}
              loading={loading}
              className="mt-3"
            />
          </View>

          <TouchableOpacity onPress={() => router.back()} className="mt-6">
            <Text className="text-pink-500 text-sm font-bold text-center">
              Đã có tài khoản? Đăng nhập ngay
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

import React from "react";
import { Text, TextInput, View } from "react-native";

interface Props {
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  secureTextEntry?: boolean;
  error?: string;
  keyboardType?: "default" | "email-address" | "phone-pad";
}

export default function CustomInput({
  label,
  placeholder,
  value,
  onChangeText,
  secureTextEntry = false,
  error,
  keyboardType = "default",
}: Props) {
  return (
    <View className="w-full mb-4">
      <Text className="text-xs font-bold color-slate-700 mb-1.5 ml-1 tracking-wide uppercase">
        {label}
      </Text>
      <View
        className={`w-full bg-white/80 rounded-xl px-4 py-3.5 border ${error ? "border-red-500 bg-red-50/20" : "border-pink-100 focus:border-bbook-pinkMedium"}`}
      >
        <TextInput
          placeholder={placeholder}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          placeholderTextColor="#94A3B8"
          className="text-slate-800 text-sm font-medium p-0"
          autoCapitalize="none"
        />
      </View>
      {error && (
        <Text className="text-red-500 text-[11px] mt-1 ml-1 font-semibold">
          ⚠️ {error}
        </Text>
      )}
    </View>
  );
}

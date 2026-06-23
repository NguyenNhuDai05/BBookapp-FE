import React from "react";
import { ActivityIndicator, Text, TouchableOpacity } from "react-native";

interface Props {
  title: string;
  onPress: () => void;
  variant?: "primary" | "secondary";
  loading?: boolean;
  disabled?: boolean;
  className?: string;
}

export default function CustomButton({
  title,
  onPress,
  variant = "primary",
  loading = false,
  disabled = false,
  className = "",
}: Props) {
  const bgStyle =
    variant === "primary"
      ? "bg-bbook-accent shadow-lg shadow-pink-600/30"
      : "bg-white border border-pink-200";
  const textStyle =
    variant === "primary"
      ? "color-white font-bold"
      : "color-bbook-pinkDark font-semibold";

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      disabled={loading || disabled}
      className={`w-full py-4 rounded-xl flex-row justify-center items-center ${bgStyle} ${className} ${(loading || disabled) ? "opacity-70" : ""}`}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === "primary" ? "#fff" : "#C71585"}
          size="small"
        />
      ) : (
        <Text
          className={`text-sm font-bold tracking-wider uppercase ${textStyle}`}
        >
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
}

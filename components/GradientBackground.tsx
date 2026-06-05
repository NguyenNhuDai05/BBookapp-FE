import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { ViewStyle } from "react-native";

// Định nghĩa lại interface Props chuẩn chỉnh theo kiểu dữ liệu của Expo LinearGradient
interface Props {
  children: React.ReactNode;
  className?: string;
  style?: ViewStyle;
  // Cập nhật 2 dòng dưới đây để báo cho TS biết đây là mảng có ít nhất 2 phần tử
  colors?: readonly [string, string, ...string[]];
  locations?: readonly [number, number, ...number[]];
}

export default function GradientBackground({
  children,
  className = "",
  style,
  colors = ["#FFF0EA", "#FFB6C1", "#FF69B4", "#C71585"],
  locations = [0, 0.25, 0.7, 1],
}: Props) {
  return (
    <LinearGradient
      colors={colors}
      locations={locations}
      style={style}
      className={`flex-1 ${className}`}
    >
      {children}
    </LinearGradient>
  );
}

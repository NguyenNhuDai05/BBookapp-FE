import React from "react";
import { Pressable, type PressableProps } from "react-native";

const TAB_PRESS_COLOR = "rgba(245, 68, 106, 0.14)";
const TAB_PRESS_RADIUS = 18;

export function renderBoundedTabBarButton(props: unknown) {
  return (
    <Pressable
      {...(props as PressableProps)}
      android_ripple={{
        borderless: false,
        color: TAB_PRESS_COLOR,
        radius: TAB_PRESS_RADIUS,
      }}
    />
  );
}

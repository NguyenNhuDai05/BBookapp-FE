import { Asset } from "expo-asset";
import { LinearGradient } from "expo-linear-gradient";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import React, { useEffect, useRef } from "react";
import { Dimensions, Image, Platform, StyleSheet, View } from "react-native";
import { useAuthStore } from "../store/useAuthStore";

// Lấy chiều rộng thực tế của thiết bị (Điện thoại hoặc Trình duyệt Web)
const { width: SCREEN_WIDTH } = Dimensions.get("window");

// 1. Tỷ lệ ảnh gốc (Rộng / Cao ≈ 3.04)
const LOGO_ASPECT_RATIO = 140 / 46;

// 2. KÍCH THƯỚC PHÓNG TO TỰ ĐỘNG:
// - Trên Web/PC: Chiếm 35% bề ngang trình duyệt (35vw)
// - Trên Mobile: Chiếm 80% bề ngang màn hình điện thoại
const isWeb = Platform.OS === "web";
const LOGO_WIDTH = isWeb ? SCREEN_WIDTH * 0.35 : SCREEN_WIDTH * 0.8;

export default function SplashScreen() {
  const router = useRouter();
  const initialize = useAuthStore((state) => state.initialize);
  const routerRef = useRef(router);
  const hasStartedRef = useRef(false);

  routerRef.current = router;

  useEffect(() => {
    if (hasStartedRef.current) return;
    hasStartedRef.current = true;

    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    let isMounted = true;

    const initializeApp = async () => {
      const startTime = Date.now();

      let isAuthSuccess = false;

      try {
        await new Promise((resolve) => setTimeout(resolve, 1000));

        isAuthSuccess = await initialize();

        await Asset.loadAsync([
          require("../assets/images/logo-bbook.png"),
        ]).catch((err) => console.log("Bỏ qua lỗi tải ảnh:", err));

        const { status } =
          await Location.requestForegroundPermissionsAsync().catch(() => ({
            status: "denied",
          }));

        if (status !== "granted") {
          console.log("Quyền vị trí bị từ chối.");
        }
      } catch (error) {
        console.error("Lỗi khởi tạo:", error);
      } finally {
        const elapsedTime = Date.now() - startTime;

        const minimumTimeout = 2300;

        const remainingTime = Math.max(0, minimumTimeout - elapsedTime);

        timeoutId = setTimeout(() => {
          if (!isMounted) return;

          if (isAuthSuccess) {
            const currentUser = useAuthStore.getState().user;
            if (currentUser?.role === 'MUA') {
              routerRef.current.replace("/(mua)/dashboard" as any);
            } else if (currentUser?.role === 'ADMIN') {
              routerRef.current.replace("/(admin)/dashboard" as any);
            } else {
              routerRef.current.replace("/(tabs)/home" as any);
            }
          } else {
            routerRef.current.replace("/(auth)/login" as any);
          }
        }, remainingTime);
      }
    };

    initializeApp();

    return () => {
      isMounted = false;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [initialize]);

  return (
    <LinearGradient
      colors={["#ffffff", "#feabb3", "#ff7c98", "#f5446a"]}
      style={styles.fullscreenBackground}
    >
      {/* KHUNG CỐ ĐỊNH TÂM TUYỆT ĐỐI */}
      <View style={styles.absoluteContainer}>
        {/* KHUNG CHỨA LOGO CHỮ PNG TRONG SUỐT (TỰ ĐỘNG PHÓNG TO) */}
        <View style={[styles.logoWrapper, { width: LOGO_WIDTH }]}>
          <Image
            source={require("../assets/images/logo-bbook.png")}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </View>
      </View>
    </LinearGradient>
  );
}

// --- HỆ THỐNG STYLE NATIVE RESPONSIVE ĐÃ ĐƯỢC VÁ LỖI ---
const styles = StyleSheet.create({
  fullscreenBackground: {
    flex: 1, // Đã đồng bộ tên biến để kích hoạt toàn màn hình
  },
  absoluteContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  logoWrapper: {
    aspectRatio: LOGO_ASPECT_RATIO, // Chiều cao tự động tính theo chiều rộng để không bị méo chữ
    alignItems: "center",
    justifyContent: "center",
  },
  logoImage: {
    width: "400%",
    height: "400%",
  },
});

import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import {
  Bell,
  BriefcaseBusiness,
  ChevronRight,
  CreditCard,
  Globe,
  Heart,
  History,
  LogOut,
  ShieldCheck,
  User,
} from "lucide-react-native";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { userService } from "../../services/userService";
import { useAuthStore } from "../../store/useAuthStore";

// Định nghĩa đúng cấu trúc dữ liệu trả về từ Resource "users" trên MockAPI
interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar: string;
  joinedDate: string;
  statsCompleted: number;
  statsFavorites: number;
  membershipTier: string;
}

export default function ProfileScreen() {
  const router = useRouter();
  const { becomeMUA, initialize, logout, user: authUser } = useAuthStore();

  // Các State lưu trữ trạng thái dữ liệu thực tế từ Server
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string>("");

  const fetchProfileFromServer = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMessage("");

      if (!authUser?.email) {
        throw new Error("Không tìm thấy thông tin đăng nhập");
      }

      const profileData = await userService.getUserProfile(authUser.email);

      setUser(profileData);
    } catch (error: any) {
      console.error("Lỗi Profile API:", error);

      setErrorMessage(error?.message || "Không thể kết nối đến server.");
    } finally {
      setLoading(false);
    }
  }, [authUser?.email]);

  useEffect(() => {
    let isMounted = true;

    const loadProfile = async () => {
      if (authUser?.email) {
        await fetchProfileFromServer();
        return;
      }

      const isAuthSuccess = await initialize();

      if (!isAuthSuccess && isMounted) {
        setErrorMessage("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
        setLoading(false);
      }
    };

    loadProfile();

    return () => {
      isMounted = false;
    };
  }, [authUser?.email, fetchProfileFromServer, initialize]);

  // Hàm xử lý đăng xuất đồng bộ hệ thống: Xóa token thiết bị và đẩy về màn Login
  const handleLogout = () => {
    if (Platform.OS === "web") {
      const confirmed = window.confirm(
        "Bạn có chắc chắn muốn đăng xuất khỏi ứng dụng bBeauty không?",
      );

      if (confirmed) {
        logout()
          .then(() => router.replace("/login" as any))
          .catch((error) => console.error("Logout error:", error));
      }

      return;
    }

    Alert.alert(
      "Đăng xuất",
      "Bạn có chắc chắn muốn đăng xuất khỏi ứng dụng bBeauty không?",
      [
        {
          text: "Hủy",
          style: "cancel",
        },
        {
          text: "Đăng xuất",
          style: "destructive",
          onPress: async () => {
            try {
              await logout();

              router.replace("/login" as any);
            } catch (error) {
              console.error("Lỗi khi đăng xuất:", error);
            }
          },
        },
      ],
    );
  };

  // Hàm render giao diện các dòng chức năng
  const isMuaAccount = authUser?.role === 2 || authUser?.role === "MUA";

  const handleBecomeMUA = async () => {
    const runUpgrade = async () => {
      const success = await becomeMUA();
      if (success) {
        router.push("/mua-onboarding" as any);
        return;
      }

      if (Platform.OS === "web") {
        window.alert("Không thể chuyển tài khoản thành Makeup Artist. Vui lòng thử lại.");
        return;
      }

      Alert.alert("Chưa thể chuyển tài khoản", "Vui lòng thử lại sau.");
    };

    if (Platform.OS === "web") {
      if (window.confirm("Bạn muốn đăng ký tài khoản này thành Makeup Artist?")) {
        await runUpgrade();
      }
      return;
    }

    Alert.alert(
      "Trở thành Makeup Artist",
      "Tài khoản của bạn sẽ được chuyển sang Makeup Artist và có thể đăng dịch vụ.",
      [
        { text: "Hủy", style: "cancel" },
        { text: "Tiếp tục", onPress: runUpgrade },
      ],
    );
  };

  const renderSettingRow = (
    icon: React.ReactNode,
    title: string,
    subTitle?: string,
    onPress?: () => void,
    isDestructive = false,
  ) => (
    <TouchableOpacity
      style={styles.rowItem}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.rowLeft}>
        <View
          style={[
            styles.iconWrapper,
            isDestructive && styles.destructiveIconBg,
          ]}
        >
          {icon}
        </View>
        <View style={{ flex: 1 }}>
          <Text
            style={[styles.rowTitle, isDestructive && styles.destructiveText]}
          >
            {title}
          </Text>
          {subTitle && <Text style={styles.rowSubTitle}>{subTitle}</Text>}
        </View>
      </View>
      <ChevronRight size={18} color={isDestructive ? "#F5446A" : "#A397A6"} />
    </TouchableOpacity>
  );

  // 1. TRẠNG THÁI LOADING CHỜ KẾT NỐI SERVER
  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#F5446A" />
        <Text style={styles.loadingText}>Đang đồng bộ hồ sơ từ server...</Text>
      </View>
    );
  }

  // 2. TRẠNG THÁI BÁO LỖI (Ví dụ: Sai URL, chưa tạo endpoint hoặc chưa thêm item "demo@bbook.com")
  if (errorMessage || !user) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>⚠️ Lỗi kết nối dữ liệu</Text>
        <Text style={styles.errorSubText}>
          {errorMessage || "Không tìm thấy thông tin tài khoản."}
        </Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={fetchProfileFromServer}
        >
          <Text style={{ color: "#FFF", fontWeight: "700" }}>
            Thử tải lại dữ liệu
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  // 3. GIAO DIỆN CHÍNH KHI ĐÃ ĐỔ DỮ LIỆU THẬT THÀNH CÔNG
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* HEADER GRADIENT BANNER (Đồng bộ bộ màu từ màn Splash của bạn) */}
        <LinearGradient
          colors={["#ffffff", "#feabb3", "#ff7c98", "#f5446a"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerBanner}
        >
          <View style={styles.userInfoContainer}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarEmoji}>{user.avatar}</Text>
            </View>
            <View style={styles.userTextDetails}>
              <Text style={styles.userName}>{user.name}</Text>
              <Text style={styles.userEmail}>{user.email}</Text>
              <Text style={styles.userSubText}>
                Thành viên từ: {user.joinedDate}
              </Text>
            </View>
          </View>
        </LinearGradient>

        {/* THÔNG SỐ HOẠT ĐỘNG THẬT TRẢ VỀ TỪ SERVER */}
        <View style={styles.statsCard}>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{user.statsCompleted}</Text>
            <Text style={styles.statLabel}>Đã đặt lịch</Text>
          </View>
          <View style={[styles.statBox, styles.statBorder]}>
            <Text style={styles.statNumber}>{user.statsFavorites}</Text>
            <Text style={styles.statLabel}>Yêu thích</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{user.membershipTier}</Text>
            <Text style={styles.statLabel}>Hạng tài khoản</Text>
          </View>
        </View>

        {/* CÁC NHÓM CHỨC NĂNG HỆ THỐNG */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionHeader}>Tài khoản của tôi</Text>
          <View style={styles.cardWrapper}>
            {renderSettingRow(
              <User size={20} color="#ff7c98" />,
              "Chỉnh sửa thông tin",
              "Cập nhật số điện thoại, địa chỉ cá nhân",
            )}
            {renderSettingRow(
              <History size={20} color="#ff7c98" />,
              "Lịch sử đặt lịch",
              "Xem danh sách và trạng thái các lịch đã đặt",
              () => router.push("/history" as any),
            )}
            {renderSettingRow(
              <Heart size={20} color="#ff7c98" />,
              "Nghệ sĩ yêu thích",
              "Danh sách các Makeup Artist bạn đã lưu",
            )}
            {renderSettingRow(
              <CreditCard size={20} color="#ff7c98" />,
              "Ví & Phương thức thanh toán",
              "Quản lý thẻ ngân hàng, tài khoản ví",
            )}
            {!isMuaAccount &&
              renderSettingRow(
                <BriefcaseBusiness size={20} color="#ff7c98" />,
                "Become Makeup Artist",
                "Create Makeup Artist profile, services, and portfolio",
                handleBecomeMUA,
              )}
            {isMuaAccount &&
              renderSettingRow(
                <BriefcaseBusiness size={20} color="#ff7c98" />,
                "Makeup Artist profile",
                "Update portfolio, services, and styles",
                () => router.push("/mua-onboarding" as any),
              )}
          </View>
        </View>

        <View style={styles.sectionContainer}>
          <Text style={styles.sectionHeader}>Cài đặt ứng dụng</Text>
          <View style={styles.cardWrapper}>
            {renderSettingRow(
              <Bell size={20} color="#22152B" />,
              "Thông báo",
              "Cấu hình nhận tin nhắn, cập nhật từ hệ thống",
            )}
            {renderSettingRow(
              <Globe size={20} color="#22152B" />,
              "Ngôn ngữ",
              "Tiếng Việt (VI)",
            )}
            {renderSettingRow(
              <ShieldCheck size={20} color="#22152B" />,
              "Điều khoản & Bảo mật",
              "Chính sách quyền riêng tư của hệ thống",
            )}
          </View>
        </View>

        <View style={[styles.sectionContainer, { marginBottom: 30 }]}>
          <View style={styles.cardWrapper}>
            {renderSettingRow(
              <LogOut size={20} color="#F5446A" />,
              "Đăng xuất tài khoản",
              "Thoát khỏi phiên làm việc hiện tại trên thiết bị",
              handleLogout,
              true,
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── THIẾT KẾ STYLE LAYOUT CHUẨN NATIVE RESPONSIVE ───
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9F6F8" },
  scrollContent: { paddingBottom: 160 },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFF",
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#8C8390",
    fontWeight: "500",
  },
  errorText: { fontSize: 18, fontWeight: "700", color: "#F5446A" },
  errorSubText: {
    fontSize: 14,
    color: "#8C8390",
    textAlign: "center",
    marginTop: 6,
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: "#22152B",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  headerBanner: {
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 50,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  userInfoContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    gap: 16,
  },
  avatarCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: "#FFF",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarEmoji: { fontSize: 36 },
  userTextDetails: { flex: 1, justifyContent: "center" },
  userName: { fontSize: 22, fontWeight: "800", color: "#FFF" },
  userEmail: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.9)",
    marginTop: 2,
    fontWeight: "500",
  },
  userSubText: {
    fontSize: 11,
    color: "rgba(255, 255, 255, 0.7)",
    marginTop: 4,
  },
  statsCard: {
    flexDirection: "row",
    backgroundColor: "#FFF",
    marginHorizontal: 20,
    borderRadius: 20,
    marginTop: -25,
    paddingVertical: 16,
    shadowColor: "#22152B",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 4,
  },
  statBox: { flex: 1, alignItems: "center", justifyContent: "center" },
  statBorder: {
    borderLeftWidth: 0.5,
    borderRightWidth: 0.5,
    borderColor: "#EEE5EA",
  },
  statNumber: { fontSize: 18, fontWeight: "800", color: "#1F1B36" },
  statLabel: {
    fontSize: 11,
    color: "#8C8390",
    marginTop: 4,
    fontWeight: "500",
  },
  sectionContainer: { marginTop: 24, paddingHorizontal: 20 },
  sectionHeader: {
    fontSize: 14,
    fontWeight: "700",
    color: "#8C8390",
    marginBottom: 10,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    paddingLeft: 4,
  },
  cardWrapper: {
    backgroundColor: "#FFF",
    borderRadius: 20,
    overflow: "hidden",
  },
  rowItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: "#F6EFF2",
  },
  rowLeft: { flexDirection: "row", alignItems: "center", gap: 14, flex: 1 },
  iconWrapper: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "#FFF0F2",
    alignItems: "center",
    justifyContent: "center",
  },
  destructiveIconBg: { backgroundColor: "#FFF0F2" },
  rowTitle: { fontSize: 15, fontWeight: "600", color: "#1F1B36" },
  destructiveText: { color: "#F5446A", fontWeight: "700" },
  rowSubTitle: { fontSize: 12, color: "#A397A6", marginTop: 2 },
});

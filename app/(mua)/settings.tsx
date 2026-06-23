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
  CheckCircle,
  Clock,
  ArrowLeft,
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
import { useAuthStore } from "../../store/useAuthStore";
import { useMuaProfile } from "../../hooks/useMuaProfile";

export default function MuaSettingsScreen() {
  const router = useRouter();
  const { user: authUser, logout, switchMode } = useAuthStore();
  const muaId = "me";

  // Fetch MUA data from backend
  const { data: profile, isLoading, error, refetch } = useMuaProfile(muaId);

  // Handle Logout
  const handleLogout = () => {
    if (Platform.OS === "web") {
      const confirmed = window.confirm(
        "Bạn có chắc chắn muốn đăng xuất khỏi ứng dụng bBeauty không?",
      );

      if (confirmed) {
        logout()
          .then(() => router.replace("/(auth)/login" as any))
          .catch((error) => console.error("Logout error:", error));
      }
      return;
    }

    Alert.alert(
      "Đăng xuất",
      "Bạn có chắc chắn muốn đăng xuất khỏi ứng dụng bBeauty không?",
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Đăng xuất",
          style: "destructive",
          onPress: async () => {
            try {
              await logout();
              router.replace("/(auth)/login" as any);
            } catch (error) {
              console.error("Lỗi khi đăng xuất:", error);
            }
          },
        },
      ],
    );
  };

  const handleSwitchToCustomer = () => {
    switchMode('CUSTOMER');
    // Return to the customer tabs layout
    router.replace("/(tabs)/profile" as any);
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

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#F5446A" />
        <Text style={styles.loadingText}>Đang tải hồ sơ Makeup Artist...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>⚠️ Lỗi kết nối dữ liệu</Text>
        <Text style={styles.errorSubText}>
          {error.message || "Không thể tải hồ sơ Makeup Artist."}
        </Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
          <Text style={{ color: "#FFF", fontWeight: "700" }}>Thử lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* HEADER GRADIENT BANNER */}
        <LinearGradient
          colors={["#ffffff", "#feabb3", "#ff7c98", "#f5446a"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerBanner}
        >
          <TouchableOpacity 
            onPress={() => router.back()} 
            style={{ position: 'absolute', top: 50, left: 24, zIndex: 10, width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.3)', alignItems: 'center', justifyContent: 'center' }}
          >
            <ArrowLeft size={24} color="#FFF" />
          </TouchableOpacity>
          <View style={[styles.userInfoContainer, { marginTop: 40 }]}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarEmoji}>{authUser?.name?.charAt(0) || "M"}</Text>
            </View>
            <View style={styles.userTextDetails}>
              <Text style={styles.userName}>{authUser?.name}</Text>
              <Text style={styles.userEmail}>{authUser?.email}</Text>
              <View style={styles.verificationBadge}>
                {profile?.verificationStatus === "APPROVED" ? (
                  <>
                    <CheckCircle size={14} color="#FFF" />
                    <Text style={styles.verificationText}>Đã xác minh</Text>
                  </>
                ) : (
                  <>
                    <Clock size={14} color="#FFF" />
                    <Text style={styles.verificationText}>Chờ duyệt ({profile?.verificationStatus})</Text>
                  </>
                )}
              </View>
            </View>
          </View>
        </LinearGradient>

        {/* STATS OVERLAPPING CARD */}
        <View style={styles.statsCard}>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>12</Text>
            <Text style={styles.statLabel}>Lượt Đặt</Text>
          </View>
          <View style={[styles.statBox, styles.statBorder]}>
            <Text style={styles.statNumber}>4.9</Text>
            <Text style={styles.statLabel}>Đánh giá</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>VIP</Text>
            <Text style={styles.statLabel}>Hạng MUA</Text>
          </View>
        </View>

        {/* SETTINGS SECTIONS */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionHeader}>Quản lý dịch vụ</Text>
          <View style={styles.cardWrapper}>
            {renderSettingRow(
              <BriefcaseBusiness size={20} color="#ff7c98" />,
              "Dịch vụ & Portfolio",
              "Thêm hoặc cập nhật hình ảnh dự án",
              () => router.push("/(mua)/services" as any),
            )}
            {renderSettingRow(
              <History size={20} color="#ff7c98" />,
              "Lịch sử giao dịch",
              "Xem lại các khoản thanh toán",
            )}
            {renderSettingRow(
              <CreditCard size={20} color="#ff7c98" />,
              "Rút tiền & Thanh toán",
              "Quản lý tài khoản ngân hàng của bạn",
            )}
            {renderSettingRow(
              <User size={20} color="#22152B" />,
              "Quay về giao diện Customer",
              "Trở lại vai trò người dùng bình thường",
              handleSwitchToCustomer,
            )}
          </View>
        </View>

        <View style={styles.sectionContainer}>
          <Text style={styles.sectionHeader}>Cài đặt ứng dụng</Text>
          <View style={styles.cardWrapper}>
            {renderSettingRow(
              <Bell size={20} color="#22152B" />,
              "Thông báo",
              "Cấu hình nhận tin nhắn đặt lịch",
            )}
            {renderSettingRow(
              <ShieldCheck size={20} color="#22152B" />,
              "Điều khoản & Bảo mật",
              "Chính sách cho MUA",
            )}
          </View>
        </View>

        <View style={[styles.sectionContainer, { marginBottom: 30 }]}>
          <View style={styles.cardWrapper}>
            {renderSettingRow(
              <LogOut size={20} color="#F5446A" />,
              "Đăng xuất tài khoản",
              "Thoát khỏi phiên làm việc hiện tại",
              handleLogout,
              true,
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

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
  avatarEmoji: { fontSize: 36, color: "#f5446a", fontWeight: "bold" },
  userTextDetails: { flex: 1, justifyContent: "center" },
  userName: { fontSize: 22, fontWeight: "800", color: "#FFF" },
  userEmail: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.9)",
    marginTop: 2,
    fontWeight: "500",
  },
  verificationBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.2)",
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 8,
    gap: 6,
  },
  verificationText: {
    fontSize: 11,
    color: "#FFF",
    fontWeight: "600",
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

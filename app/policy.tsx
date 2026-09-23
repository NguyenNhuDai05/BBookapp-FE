import { Asset } from "expo-asset";
import { readAsStringAsync } from "expo-file-system/legacy";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { ArrowLeft, FileCheck2, ShieldCheck } from "lucide-react-native";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// Metro returns a numeric asset module ID for bundled text files.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const policyAsset = require("../docs/chinhsach.txt");

const isMainHeading = (line: string) =>
  line === "MÀN HÌNH CHẤP THUẬN KHI ĐĂNG KÝ (IN-APP CONSENT SCREEN - CLIENT)" ||
  line === "THỎA THUẬN ĐIỀU KHOẢN DỊCH VỤ DÀNH CHO NGƯỜI TIÊU DÙNG" ||
  line === "CHÍNH SÁCH BẢO VỆ DỮ LIỆU CÁ NHÂN NGƯỜI TIÊU DÙNG";

const isSectionHeading = (line: string) =>
  line === "CĂN CỨ PHÁP LÝ" || /^Điều \d+\./.test(line);

export default function PolicyScreen() {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [error, setError] = useState("");

  const loadPolicy = React.useCallback(async () => {
    try {
      const asset = Asset.fromModule(policyAsset);
      let text: string;

      if (Platform.OS === "web") {
        const response = await fetch(asset.uri);
        if (!response.ok) throw new Error(`Không thể tải tệp chính sách (${response.status}).`);
        text = await response.text();
      } else {
        await asset.downloadAsync();
        if (!asset.localUri) throw new Error("Không tìm thấy tệp chính sách trên thiết bị.");
        text = await readAsStringAsync(asset.localUri);
      }

      setContent(text.replace(/^\uFEFF/, ""));
    } catch (loadError: any) {
      console.error("Policy asset load failed:", loadError);
      setError(loadError?.message || "Không thể tải nội dung chính sách.");
    }
  }, []);

  useEffect(() => {
    // Load the bundled document when the screen is mounted.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadPolicy();
  }, [loadPolicy]);

  const lines = useMemo(() => content.split(/\r?\n/), [content]);

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <LinearGradient
        colors={["#FFF4F6", "#FFE3E8", "#FFD1DB"]}
        style={styles.header}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Quay lại"
          hitSlop={10}
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <ArrowLeft size={22} color="#502031" />
        </Pressable>
        <View style={styles.headerIcon}>
          <ShieldCheck size={26} color="#F55389" />
        </View>
        <View style={styles.headerCopy}>
          <Text style={styles.eyebrow}>B-BOOK</Text>
          <Text style={styles.title}>Chính sách & điều khoản</Text>
          <Text style={styles.subtitle}>Thông tin áp dụng cho tài khoản khách hàng</Text>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {error ? (
          <View style={styles.stateCard}>
            <Text style={styles.errorText}>{error}</Text>
            <Pressable style={styles.retryButton} onPress={() => {
              setError("");
              void loadPolicy();
            }}>
              <Text style={styles.retryText}>Thử tải lại</Text>
            </Pressable>
          </View>
        ) : !content ? (
          <View style={styles.stateCard}>
            <ActivityIndicator size="large" color="#F55389" />
            <Text style={styles.loadingText}>Đang tải chính sách...</Text>
          </View>
        ) : (
          <View style={styles.documentCard}>
            <View style={styles.documentBadge}>
              <FileCheck2 size={17} color="#C94473" />
              <Text style={styles.documentBadgeText}>Văn bản chính thức</Text>
            </View>
            {lines.map((line, index) => {
              if (!line.trim()) return <View key={index} style={styles.spacer} />;
              if (isMainHeading(line)) {
                return (
                  <Text key={index} style={styles.mainHeading}>
                    {line}
                  </Text>
                );
              }
              if (isSectionHeading(line)) {
                return (
                  <Text key={index} style={styles.sectionHeading}>
                    {line}
                  </Text>
                );
              }
              return (
                <Text key={index} style={styles.paragraph}>
                  {line}
                </Text>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#FFF8FA" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 22,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.82)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerIcon: {
    width: 46,
    height: 46,
    marginLeft: 12,
    borderRadius: 16,
    backgroundColor: "#FFF",
    alignItems: "center",
    justifyContent: "center",
  },
  headerCopy: { flex: 1, marginLeft: 12 },
  eyebrow: { color: "#C94473", fontSize: 11, fontWeight: "900", letterSpacing: 1.2 },
  title: { color: "#3A1826", fontSize: 20, fontWeight: "900", marginTop: 2 },
  subtitle: { color: "#8D6674", fontSize: 12, lineHeight: 17, marginTop: 3 },
  scroll: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  stateCard: {
    minHeight: 220,
    borderRadius: 24,
    backgroundColor: "#FFF",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  loadingText: { color: "#8D6674", fontWeight: "700", marginTop: 12 },
  errorText: { color: "#D63E5B", textAlign: "center", fontWeight: "700" },
  retryButton: { marginTop: 16, borderRadius: 14, backgroundColor: "#F55389", paddingHorizontal: 20, paddingVertical: 11 },
  retryText: { color: "#FFF", fontSize: 14, fontWeight: "800" },
  documentCard: {
    borderRadius: 24,
    backgroundColor: "#FFF",
    paddingHorizontal: 20,
    paddingVertical: 22,
    borderWidth: 1,
    borderColor: "#F7DDE3",
    shadowColor: "#7A2948",
    shadowOpacity: 0.07,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  documentBadge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    borderRadius: 999,
    backgroundColor: "#FFF0F4",
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
  },
  documentBadgeText: { color: "#C94473", fontSize: 12, fontWeight: "800" },
  mainHeading: {
    color: "#3A1826",
    fontSize: 18,
    lineHeight: 25,
    fontWeight: "900",
    marginTop: 15,
    marginBottom: 10,
    paddingBottom: 9,
    borderBottomWidth: 2,
    borderBottomColor: "#F7D8E0",
  },
  sectionHeading: {
    color: "#B33763",
    fontSize: 15,
    lineHeight: 22,
    fontWeight: "900",
    marginTop: 13,
    marginBottom: 5,
  },
  paragraph: { color: "#4E3B43", fontSize: 14, lineHeight: 22, marginBottom: 7 },
  spacer: { height: 7 },
});

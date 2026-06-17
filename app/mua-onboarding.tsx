import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { ArrowLeft, BriefcaseBusiness, ImagePlus, Sparkles } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { MakeupStyle, muaService } from "../services/muaService";

export default function MuaOnboardingScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [stylesLoading, setStylesLoading] = useState(true);
  const [styles, setStyles] = useState<MakeupStyle[]>([]);
  const [selectedStyleIds, setSelectedStyleIds] = useState<number[]>([]);

  const [bio, setBio] = useState("");
  const [experienceYears, setExperienceYears] = useState("0");
  const [coverUrl, setCoverUrl] = useState("");
  const [serviceName, setServiceName] = useState("");
  const [serviceDescription, setServiceDescription] = useState("");
  const [servicePrice, setServicePrice] = useState("");
  const [serviceDuration, setServiceDuration] = useState("90");
  const [portfolioUrl, setPortfolioUrl] = useState("");
  const [portfolioDescription, setPortfolioDescription] = useState("");

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace("/(tabs)/home" as any);
  };

  useEffect(() => {
    const loadStyles = async () => {
      try {
        const result = await muaService.getStyles();
        setStyles(result);
      } catch (error) {
        console.error("Load MUA styles error:", error);
      } finally {
        setStylesLoading(false);
      }
    };

    loadStyles();
  }, []);

  const toggleStyle = (styleId: number) => {
    setSelectedStyleIds((current) =>
      current.includes(styleId)
        ? current.filter((id) => id !== styleId)
        : [...current, styleId],
    );
  };

  const finishSetup = async () => {
    const years = Number(experienceYears || 0);
    const price = Number(servicePrice.replace(/[^\d]/g, ""));
    const duration = Number(serviceDuration || 0);

    if (!bio.trim()) {
      Alert.alert("Thiếu thông tin", "Hãy viết vài dòng giới thiệu về bạn.");
      return;
    }

    if (!serviceName.trim() || !price || !duration) {
      Alert.alert(
        "Thiếu dịch vụ",
        "Hãy thêm ít nhất tên dịch vụ, giá và thời lượng để khách có thể đặt lịch.",
      );
      return;
    }

    try {
      setLoading(true);

      await muaService.updateProfile({
        bio: bio.trim(),
        experienceYears: Number.isFinite(years) ? years : 0,
        portfolioCoverUrl: coverUrl.trim() || undefined,
      });

      if (selectedStyleIds.length > 0) {
        await muaService.updateStyles(selectedStyleIds);
      }

      await muaService.addService({
        serviceName: serviceName.trim(),
        description: serviceDescription.trim() || undefined,
        price,
        durationMinutes: duration,
      });

      if (portfolioUrl.trim()) {
        await muaService.addPortfolioImage({
          imageUrl: portfolioUrl.trim(),
          description: portfolioDescription.trim() || undefined,
        });
      }

      const message = "Hồ sơ MUA đã được thiết lập. Khách hàng có thể thấy bạn trong danh sách MUA.";

      if (Platform.OS === "web") {
        window.alert(message);
        router.replace("/(tabs)/home" as any);
        return;
      }

      Alert.alert("Hoàn tất", message, [
        { text: "OK", onPress: () => router.replace("/(tabs)/home" as any) },
      ]);
    } catch (error: any) {
      console.error("MUA onboarding error:", error?.response?.data || error?.message || error);
      Alert.alert(
        "Chưa lưu được hồ sơ",
        error?.response?.data?.message ||
          error?.response?.data?.Message ||
          "Vui lòng kiểm tra thông tin và thử lại.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={stylesSheet.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={stylesSheet.scrollContent}
      >
        <LinearGradient
          colors={["#22152B", "#54344F"] as const}
          style={stylesSheet.hero}
        >
          <TouchableOpacity
            onPress={handleBack}
            style={stylesSheet.backButton}
            activeOpacity={0.85}
          >
            <ArrowLeft size={20} color="#FFF" />
          </TouchableOpacity>
          <View style={stylesSheet.heroIcon}>
            <BriefcaseBusiness size={24} color="#F55389" />
          </View>
          <Text style={stylesSheet.heroTitle}>Thiết lập hồ sơ MUA</Text>
          <Text style={stylesSheet.heroSubtitle}>
            Điền những thông tin đầu tiên để khách xem portfolio, dịch vụ và giá.
          </Text>
        </LinearGradient>

        <View style={stylesSheet.section}>
          <Text style={stylesSheet.sectionTitle}>Hồ sơ</Text>
          <Field
            label="Giới thiệu"
            placeholder="Ví dụ: Chuyên makeup cô dâu, tiệc và photoshoot..."
            value={bio}
            onChangeText={setBio}
            multiline
          />
          <View style={stylesSheet.twoColumns}>
            <Field
              label="Năm kinh nghiệm"
              placeholder="0"
              value={experienceYears}
              onChangeText={setExperienceYears}
              keyboardType="numeric"
            />
            <Field
              label="Ảnh cover URL"
              placeholder="https://..."
              value={coverUrl}
              onChangeText={setCoverUrl}
            />
          </View>
        </View>

        <View style={stylesSheet.section}>
          <Text style={stylesSheet.sectionTitle}>Phong cách</Text>
          {stylesLoading ? (
            <ActivityIndicator color="#F55389" />
          ) : styles.length === 0 ? (
            <Text style={stylesSheet.mutedText}>
              Chưa có danh sách style từ hệ thống. Bạn có thể cập nhật sau.
            </Text>
          ) : (
            <View style={stylesSheet.chipWrap}>
              {styles.map((style) => {
                const active = selectedStyleIds.includes(style.styleId);
                return (
                  <TouchableOpacity
                    key={style.styleId}
                    onPress={() => toggleStyle(style.styleId)}
                    style={[stylesSheet.chip, active && stylesSheet.chipActive]}
                    activeOpacity={0.85}
                  >
                    <Sparkles size={13} color={active ? "#FFF" : "#F55389"} />
                    <Text
                      style={[
                        stylesSheet.chipText,
                        active && stylesSheet.chipTextActive,
                      ]}
                    >
                      {style.name || `Style ${style.styleId}`}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>

        <View style={stylesSheet.section}>
          <Text style={stylesSheet.sectionTitle}>Dịch vụ đầu tiên</Text>
          <Field
            label="Tên dịch vụ"
            placeholder="Makeup dự tiệc"
            value={serviceName}
            onChangeText={setServiceName}
          />
          <Field
            label="Mô tả"
            placeholder="Bao gồm makeup, làm tóc nhẹ..."
            value={serviceDescription}
            onChangeText={setServiceDescription}
            multiline
          />
          <View style={stylesSheet.twoColumns}>
            <Field
              label="Giá"
              placeholder="800000"
              value={servicePrice}
              onChangeText={setServicePrice}
              keyboardType="numeric"
            />
            <Field
              label="Thời lượng phút"
              placeholder="90"
              value={serviceDuration}
              onChangeText={setServiceDuration}
              keyboardType="numeric"
            />
          </View>
        </View>

        <View style={stylesSheet.section}>
          <View style={stylesSheet.sectionHeaderRow}>
            <Text style={stylesSheet.sectionTitle}>Portfolio đầu tiên</Text>
            <ImagePlus size={18} color="#F55389" />
          </View>
          <Field
            label="Ảnh portfolio URL"
            placeholder="https://..."
            value={portfolioUrl}
            onChangeText={setPortfolioUrl}
          />
          <Field
            label="Mô tả ảnh"
            placeholder="Layout cô dâu tone hồng đất"
            value={portfolioDescription}
            onChangeText={setPortfolioDescription}
          />
        </View>

        <TouchableOpacity
          onPress={finishSetup}
          disabled={loading}
          style={[stylesSheet.submitButton, loading && stylesSheet.disabled]}
          activeOpacity={0.9}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={stylesSheet.submitText}>Hoàn tất hồ sơ MUA</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function Field({
  label,
  placeholder,
  value,
  onChangeText,
  multiline,
  keyboardType = "default",
}: {
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (value: string) => void;
  multiline?: boolean;
  keyboardType?: "default" | "numeric";
}) {
  return (
    <View style={stylesSheet.fieldWrap}>
      <Text
        style={stylesSheet.fieldLabel}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.85}
      >
        {label}
      </Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#BCA7B4"
        multiline={multiline}
        keyboardType={keyboardType}
        style={[stylesSheet.input, multiline && stylesSheet.multilineInput]}
      />
    </View>
  );
}

const stylesSheet = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9F6F8" },
  scrollContent: { paddingBottom: 44 },
  hero: {
    paddingHorizontal: 22,
    paddingTop: 18,
    paddingBottom: 28,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.14)",
    alignItems: "center",
    justifyContent: "center",
  },
  heroIcon: {
    width: 52,
    height: 52,
    borderRadius: 18,
    backgroundColor: "#FFF0F4",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 22,
  },
  heroTitle: {
    color: "#FFF",
    fontSize: 28,
    fontWeight: "900",
    marginTop: 14,
  },
  heroSubtitle: {
    color: "rgba(255,255,255,0.72)",
    fontSize: 14,
    lineHeight: 20,
    marginTop: 6,
  },
  section: {
    marginHorizontal: 16,
    marginTop: 16,
    paddingHorizontal: 18,
    paddingVertical: 20,
    borderRadius: 20,
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#F0E5EA",
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionTitle: {
    color: "#22152B",
    fontSize: 17,
    fontWeight: "900",
    marginBottom: 16,
  },
  mutedText: { color: "#8C8390", fontSize: 13, lineHeight: 19 },
  fieldWrap: { width: "100%", minWidth: 0, marginBottom: 16 },
  fieldLabel: {
    color: "#6E3549",
    fontSize: 11,
    lineHeight: 15,
    fontWeight: "900",
    marginBottom: 9,
    textTransform: "uppercase",
  },
  input: {
    minHeight: 58,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#F0C4CD",
    backgroundColor: "#FFF9FA",
    paddingHorizontal: 16,
    paddingVertical: 0,
    color: "#301726",
    fontSize: 15,
    fontWeight: "700",
  },
  multilineInput: {
    minHeight: 112,
    paddingTop: 14,
    paddingBottom: 14,
    textAlignVertical: "top",
  },
  twoColumns: { flexDirection: "column" },
  chipWrap: { flexDirection: "row", flexWrap: "wrap", gap: 9 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#F0C4CD",
    backgroundColor: "#FFF9FA",
  },
  chipActive: { backgroundColor: "#F55389", borderColor: "#F55389" },
  chipText: { color: "#6E3549", fontSize: 12, fontWeight: "900" },
  chipTextActive: { color: "#FFF" },
  submitButton: {
    marginHorizontal: 18,
    marginTop: 20,
    height: 56,
    borderRadius: 18,
    backgroundColor: "#F55389",
    alignItems: "center",
    justifyContent: "center",
  },
  submitText: { color: "#FFF", fontSize: 15, fontWeight: "900" },
  disabled: { opacity: 0.7 },
});

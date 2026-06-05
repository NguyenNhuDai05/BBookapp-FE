import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import {
  CalendarDays,
  CircleUserRound,
  House,
  MapPin,
  MessageCircle,
  Search,
  Sparkles,
  Star,
} from "lucide-react-native";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { MUA, muaService } from "../../services/muaService";

const CATEGORIES = ["Tất cả", "Tự nhiên", "Cô dâu", "Nghệ thuật", "Tiệc"];

export default function HomeScreen() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState("Tất cả");
  const [search, setSearch] = useState("");

  // State quản lý dữ liệu nhận từ API
  const [muaList, setMuaList] = useState<MUA[]>([]);
  const [loading, setLoading] = useState(true);

  // Gọi API lấy danh sách MUA ban đầu
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const data = await muaService.getAllMUAs();
        setMuaList(data);
      } catch (error) {
        console.error("Lỗi lấy danh sách MUA:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchInitialData();
  }, []);

  // 1. XỬ LÝ LỌC DỮ LIỆU (THEO SEARCH VÀ CATEGORY)
  const filteredMUAs = useMemo(() => {
    return muaList.filter((mua) => {
      // Lọc theo từ khóa tìm kiếm (Tên MUA)
      const matchesSearch = mua.name
        .toLowerCase()
        .includes(search.toLowerCase());

      // Lọc theo Phong cách chọn lựa
      const matchesCategory =
        selectedCategory === "Tất cả" ||
        mua.styles.some(
          (style) => style.toLowerCase() === selectedCategory.toLowerCase(),
        );

      return matchesSearch && matchesCategory;
    });
  }, [muaList, search, selectedCategory]);

  // 2. PHÂN LOẠI DANH SÁCH CHO CÁC CHUYÊN MỤC
  // Đề xuất cho bạn: Sắp xếp theo rating giảm dần và lấy 2 người đầu tiên
  const recommendedMUAs = useMemo(() => {
    return [...filteredMUAs].sort((a, b) => b.rating - a.rating).slice(0, 2);
  }, [filteredMUAs]);

  // Gần bạn nhất: Sắp xếp theo khoảng cách (distance) tăng dần và lấy 2 người đầu tiên
  const nearbyMUAs = useMemo(() => {
    return [...filteredMUAs]
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 2);
  }, [filteredMUAs]);

  return (
    <SafeAreaView className="flex-1 bg-[#F7F1F2]">
      <View className="flex-1 max-w-[430px] self-center w-full bg-[#F7F1F2]">
        {loading ? (
          <View
            style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
          >
            <ActivityIndicator size="large" color="#F06A8B" />
          </View>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 110 }}
          >
            {/* ─── HERO GRADIENT BOX ─── */}
            <View className="px-5 mt-3">
              <LinearGradient
                colors={["#17132E", "#3A2B4D"] as const}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  borderRadius: 32,
                  paddingHorizontal: 24,
                  paddingTop: 26,
                  paddingBottom: 28,
                  overflow: "hidden",
                }}
              >
                <View
                  style={{
                    position: "absolute",
                    width: 200,
                    height: 200,
                    borderRadius: 100,
                    backgroundColor: "rgba(255,255,255,0.04)",
                    right: -50,
                    top: -50,
                  }}
                />
                <Text
                  style={{
                    color: "#fff",
                    fontSize: 32,
                    fontWeight: "800",
                    letterSpacing: -0.5,
                  }}
                >
                  B•Book
                </Text>
                <Text
                  style={{
                    color: "#C9BCD5",
                    fontSize: 13,
                    marginTop: 4,
                    fontWeight: "500",
                  }}
                >
                  Tìm MUA hoàn hảo cho bạn
                </Text>

                <View
                  style={{
                    marginTop: 22,
                    borderWidth: 1,
                    borderColor: "rgba(255,255,255,0.12)",
                    backgroundColor: "rgba(255,255,255,0.07)",
                    borderRadius: 24,
                    paddingHorizontal: 16,
                    height: 54,
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 10,
                  }}
                >
                  <Search size={18} color="#C9BCD5" />
                  <TextInput
                    placeholder="Tìm kiếm MUA..."
                    placeholderTextColor="rgba(255,255,255,0.4)"
                    value={search}
                    onChangeText={setSearch}
                    style={{
                      flex: 1,
                      color: "#fff",
                      fontSize: 14,
                      height: "100%",
                      padding: 0,
                    }}
                  />
                  <TouchableOpacity
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 18,
                      alignItems: "center",
                      justifyContent: "center",
                      borderWidth: 1,
                      borderColor: "rgba(240, 106, 139, 0.3)",
                      backgroundColor: "rgba(255,255,255,0.05)",
                    }}
                  >
                    <MapPin size={15} color="#F06A8B" />
                  </TouchableOpacity>
                </View>
              </LinearGradient>
            </View>

            {/* ─── BODY CONTAINER ─── */}
            <View className="px-5 pt-6">
              <Text
                style={{
                  fontSize: 15,
                  fontWeight: "700",
                  color: "#1D1A36",
                  marginBottom: 12,
                }}
              >
                Lọc theo phong cách
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingRight: 4, gap: 8 }}
                style={{ marginBottom: 24 }}
              >
                {CATEGORIES.map((item) => {
                  const active = selectedCategory === item;
                  return (
                    <TouchableOpacity
                      key={item}
                      onPress={() => setSelectedCategory(item)}
                      style={{
                        paddingHorizontal: 20,
                        paddingVertical: 10,
                        borderRadius: 50,
                        borderWidth: 1,
                        backgroundColor: active ? "#18153A" : "#F4EDF0",
                        borderColor: active ? "#18153A" : "#E8DDE3",
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 12,
                          fontWeight: "600",
                          color: active ? "#fff" : "#8B7D8D",
                        }}
                      >
                        {item}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {/* CHUYÊN MỤC 2: ĐỀ XUẤT CHO BẠN */}
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginBottom: 14,
                }}
              >
                <Text
                  style={{
                    fontSize: 15,
                    fontWeight: "700",
                    color: "#1D1A36",
                    marginRight: 4,
                  }}
                >
                  Đề xuất cho bạn
                </Text>
                <Sparkles size={14} color="#F5B000" fill="#F5B000" />
              </View>

              {/* Kiểm tra nếu không có kết quả phù hợp */}
              {recommendedMUAs.length === 0 && (
                <Text
                  style={{
                    color: "#8A8190",
                    textAlign: "center",
                    marginVertical: 10,
                  }}
                >
                  Không tìm thấy MUA phù hợp.
                </Text>
              )}

              {/* Đổ data ĐỀ XUẤT thực từ API */}
              {recommendedMUAs.map((mua, index) => (
                <View
                  key={mua.id}
                  style={{
                    flexDirection: "row",
                    marginBottom: 16,
                    backgroundColor: "#fff",
                    borderRadius: 24,
                    padding: 16,
                    borderWidth: 0.5,
                    borderColor: "#EDE4E8",
                  }}
                >
                  <LinearGradient
                    colors={
                      index === 0
                        ? (["#F5B1C1", "#D98197"] as const)
                        : (["#D8B27A", "#2E2942"] as const)
                    }
                    style={{
                      width: 56,
                      height: 56,
                      borderRadius: 18,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Text
                      style={{ color: "#fff", fontSize: 24, fontWeight: "600" }}
                    >
                      {mua.avatar}
                    </Text>
                  </LinearGradient>

                  <View style={{ flex: 1, marginLeft: 14 }}>
                    <Text
                      style={{
                        fontSize: 15,
                        fontWeight: "700",
                        color: "#1F1B36",
                      }}
                    >
                      {mua.name}
                    </Text>
                    <Text
                      style={{
                        fontSize: 11,
                        color: "#8C8390",
                        marginTop: 2,
                        fontWeight: "500",
                      }}
                    >
                      {mua.styles.join(" · ")}
                    </Text>

                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        marginTop: 6,
                        gap: 8,
                      }}
                    >
                      <View
                        style={{ flexDirection: "row", alignItems: "center" }}
                      >
                        <Star size={11} color="#F6A800" fill="#F6A800" />
                        <Text
                          style={{
                            fontSize: 11,
                            fontWeight: "700",
                            color: "#E09B00",
                            marginLeft: 3,
                          }}
                        >
                          {mua.rating}
                        </Text>
                      </View>
                      <Text
                        style={{
                          fontSize: 11,
                          fontWeight: "700",
                          color: "#D86D9A",
                          backgroundColor: "#FFF0F5",
                          paddingHorizontal: 6,
                          paddingVertical: 1,
                          borderRadius: 4,
                        }}
                      >
                        {mua.priceRange}
                      </Text>
                      <Text
                        style={{
                          fontSize: 11,
                          color: "#8B8392",
                          fontWeight: "500",
                        }}
                      >
                        {mua.distance}km
                      </Text>
                    </View>

                    <TouchableOpacity
                      onPress={() =>
                        router.push({
                          pathname: "/mua-detail",
                          params: { id: mua.id },
                        })
                      }
                      style={{
                        marginTop: 12,
                        borderWidth: 1,
                        borderColor: "#D8CEDB",
                        borderRadius: 14,
                        height: 42,
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: "#FAF7F8",
                        width: "100%",
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 14,
                          fontWeight: "700",
                          color: "#18152F",
                        }}
                      >
                        Book ngay
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}

              {/* CHUYÊN MỤC 3: GẦN BẠN NHẤT */}
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginTop: 8,
                  marginBottom: 14,
                }}
              >
                <Text
                  style={{
                    fontSize: 15,
                    fontWeight: "700",
                    color: "#1D1A36",
                    marginRight: 4,
                  }}
                >
                  Gần bạn nhất
                </Text>
                <Text style={{ fontSize: 14 }}>📍</Text>
              </View>

              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  flexWrap: "wrap", // Giúp hiển thị đẹp khi rớt dòng nếu cần
                }}
              >
                {/* Đổ data GẦN BẠN NHẤT thực từ API */}
                {nearbyMUAs.map((mua, index) => (
                  <TouchableOpacity
                    key={mua.id}
                    onPress={() =>
                      router.push({
                        pathname: "/mua-detail",
                        params: { id: mua.id },
                      })
                    }
                    activeOpacity={0.9}
                    style={{
                      width: "48%",
                      borderRadius: 24,
                      overflow: "hidden",
                      backgroundColor: "#FAF5F7",
                      borderWidth: 0.5,
                      borderColor: "#EDE4E8",
                      marginBottom: 10,
                    }}
                  >
                    <LinearGradient
                      colors={
                        index === 0
                          ? (["#E9B26F", "#E38EA4"] as const)
                          : (["#4FA785", "#223747"] as const)
                      }
                      style={{
                        height: 110,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Text
                        style={{
                          color: "#fff",
                          fontSize: 36,
                          fontWeight: "600",
                          opacity: 0.85,
                        }}
                      >
                        {mua.avatar}
                      </Text>
                    </LinearGradient>
                    <View
                      style={{ paddingHorizontal: 14, paddingVertical: 12 }}
                    >
                      <Text
                        style={{
                          fontWeight: "700",
                          fontSize: 13,
                          color: "#1F1B36",
                        }}
                        numberOfLines={1}
                      >
                        {mua.name}
                      </Text>
                      <Text
                        style={{
                          fontSize: 11,
                          color: "#8A8190",
                          marginTop: 2,
                          fontWeight: "500",
                        }}
                      >
                        {mua.distance}km
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>
        )}

        {/* ─── BOTTOM NAVIGATION TAB BAR ─── */}
        <View
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: "#FCF8FA",
            borderTopWidth: 0.5,
            borderTopColor: "#EEE5EA",
            flexDirection: "row",
            justifyContent: "space-around",
            paddingTop: 10,
            paddingBottom: 24,
          }}
        >
          {[
            {
              icon: <House size={20} color="#F06A8B" />,
              label: "Trang chủ",
              active: true,
            },
            { icon: <Search size={20} color="#70697A" />, label: "Khám phá" },
            {
              icon: <CalendarDays size={20} color="#70697A" />,
              label: "Lịch hẹn",
            },
            {
              icon: <MessageCircle size={20} color="#70697A" />,
              label: "Chat",
            },
            {
              icon: <CircleUserRound size={20} color="#70697A" />,
              label: "Hồ sơ",
            },
          ].map(({ icon, label, active }) => (
            <TouchableOpacity
              key={label}
              style={{ alignItems: "center", flex: 1 }}
            >
              {icon}
              <Text
                style={{
                  fontSize: 10,
                  marginTop: 4,
                  fontWeight: active ? "600" : "500",
                  color: active ? "#F06A8B" : "#8D8593",
                }}
              >
                {label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
}

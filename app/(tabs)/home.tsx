import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { Image, Search, Sparkles, Star, WandSparkles } from "lucide-react-native";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image as RNImage,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MUA, muaService } from "../../services/muaService";

const CATEGORIES = ["Tất cả", "Tự nhiên", "Cô dâu", "Nghệ thuật", "Tiệc"];

export default function HomeScreen() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState("Tất cả");
  const [search, setSearch] = useState("");
  const [muaList, setMuaList] = useState<MUA[]>([]);
  const [loading, setLoading] = useState(true);

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

  const filteredMUAs = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return muaList.filter((mua) => {
      const matchesSearch =
        keyword.length === 0 ||
        mua.name.toLowerCase().includes(keyword) ||
        mua.styles.some((style) => style.toLowerCase().includes(keyword));

      const matchesCategory =
        selectedCategory === "Tất cả" ||
        mua.styles.some((style) =>
          style.toLowerCase().includes(selectedCategory.toLowerCase()),
        );

      return matchesSearch && matchesCategory;
    });
  }, [muaList, search, selectedCategory]);

  const recommendedMUAs = useMemo(() => {
    return [...filteredMUAs].sort((a, b) => b.rating - a.rating).slice(0, 4);
  }, [filteredMUAs]);

  const openMuaDetail = (id: string) => {
    router.push({
      pathname: "/mua-detail",
      params: { id },
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.screen}>
        {loading ? (
          <View style={styles.loadingState}>
            <ActivityIndicator size="large" color="#F55389" />
          </View>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            <LinearGradient
              colors={["#FFE2D7", "#F799A5", "#F55389"] as const}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.hero}
            >
              <View style={styles.heroBadge}>
                <Sparkles size={15} color="#F55389" />
                <Text style={styles.heroBadgeText}>BeautyBook</Text>
              </View>
              <Text style={styles.heroTitle}>Tìm Makeup Artist phù hợp</Text>
              <Text style={styles.heroSubtitle}>
                Khám phá MUA, portfolio, dịch vụ và giá trong một nơi.
              </Text>

              <View style={styles.searchShell}>
                <Search size={18} color="#E46B87" />
                <TextInput
                  placeholder="Tìm theo tên hoặc phong cách"
                  placeholderTextColor="#C99DA7"
                  value={search}
                  onChangeText={setSearch}
                  style={styles.searchInput}
                />
                <View style={styles.searchIconButton}>
                  <WandSparkles size={16} color="#FFF" />
                </View>
              </View>
            </LinearGradient>

            <View style={styles.content}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Phong cách</Text>
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.categoryList}
              >
                {CATEGORIES.map((item) => {
                  const active = selectedCategory === item;
                  return (
                    <TouchableOpacity
                      key={item}
                      onPress={() => setSelectedCategory(item)}
                      activeOpacity={0.85}
                      style={[styles.categoryChip, active && styles.categoryChipActive]}
                    >
                      <Text
                        style={[
                          styles.categoryText,
                          active && styles.categoryTextActive,
                        ]}
                      >
                        {item}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Đề xuất cho bạn</Text>
                <Sparkles size={16} color="#F55389" />
              </View>

              {recommendedMUAs.length === 0 ? (
                <EmptyState />
              ) : (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.featuredList}
                  snapToInterval={246}
                  decelerationRate="fast"
                >
                  {recommendedMUAs.map((mua, index) => (
                    <FeaturedMuaCard
                      key={mua.id}
                      mua={mua}
                      index={index}
                      onPress={() => openMuaDetail(mua.id)}
                    />
                  ))}
                </ScrollView>
              )}

              <View style={[styles.sectionHeader, styles.listHeader]}>
                <Text style={styles.sectionTitle}>Danh sách MUA</Text>
                <Text style={styles.resultCount}>{filteredMUAs.length} kết quả</Text>
              </View>

              <View style={styles.muaList}>
                {filteredMUAs.map((mua) => (
                  <MuaListCard
                    key={mua.id}
                    mua={mua}
                    onPress={() => openMuaDetail(mua.id)}
                  />
                ))}
              </View>
            </View>
          </ScrollView>
        )}
      </View>
    </SafeAreaView>
  );
}

function FeaturedMuaCard({
  mua,
  index,
  onPress,
}: {
  mua: MUA;
  index: number;
  onPress: () => void;
}) {
  const colors =
    index % 2 === 0
      ? (["#F55389", "#F799A5"] as const)
      : (["#301726", "#8D6674"] as const);

  return (
    <TouchableOpacity activeOpacity={0.9} onPress={onPress} style={styles.featuredCard}>
      <LinearGradient colors={colors} style={styles.featuredCover}>
        {mua.coverUrl ? (
          <RNImage source={{ uri: mua.coverUrl }} style={styles.coverImage} />
        ) : (
          <Text style={styles.featuredInitials}>{mua.avatar}</Text>
        )}
        <View style={styles.ratingPill}>
          <Star size={12} color="#F59E0B" fill="#F59E0B" />
          <Text style={styles.ratingText}>{mua.rating.toFixed(1)}</Text>
        </View>
      </LinearGradient>

      <View style={styles.featuredBody}>
        <Text style={styles.featuredName} numberOfLines={1}>
          {mua.name}
        </Text>
        <Text style={styles.featuredStyles} numberOfLines={1}>
          {mua.styles.join(" · ")}
        </Text>
        <View style={styles.featuredMetaRow}>
          <Text style={styles.pricePill} numberOfLines={1}>
            {mua.priceRange}
          </Text>
          <Text style={styles.expText}>{mua.yearsOfExp} năm KN</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

function MuaListCard({ mua, onPress }: { mua: MUA; onPress: () => void }) {
  return (
    <TouchableOpacity activeOpacity={0.88} onPress={onPress} style={styles.listCard}>
      <View style={styles.avatarBox}>
        {mua.avatarUrl ? (
          <RNImage source={{ uri: mua.avatarUrl }} style={styles.avatarImage} />
        ) : (
          <LinearGradient
            colors={["#FFF0F4", "#FFE2D7"] as const}
            style={styles.avatarFallback}
          >
            <Text style={styles.avatarText}>{mua.avatar}</Text>
          </LinearGradient>
        )}
      </View>

      <View style={styles.listBody}>
        <View style={styles.listTitleRow}>
          <Text style={styles.listName} numberOfLines={1}>
            {mua.name}
          </Text>
          <View style={styles.smallRating}>
            <Star size={11} color="#F59E0B" fill="#F59E0B" />
            <Text style={styles.smallRatingText}>{mua.rating.toFixed(1)}</Text>
          </View>
        </View>

        <Text style={styles.listStyles} numberOfLines={1}>
          {mua.styles.join(" · ")}
        </Text>

        <View style={styles.listFooter}>
          <Text style={styles.listPrice} numberOfLines={1}>
            {mua.priceRange}
          </Text>
          <Text style={styles.bookingText}>{mua.completedBooks} lượt book</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

function EmptyState() {
  return (
    <View style={styles.emptyState}>
      <Image size={22} color="#F55389" />
      <Text style={styles.emptyTitle}>Chưa tìm thấy MUA phù hợp</Text>
      <Text style={styles.emptySubtitle}>Thử đổi từ khóa hoặc chọn phong cách khác.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#FFF6F8" },
  screen: {
    flex: 1,
    width: "100%",
    maxWidth: 430,
    alignSelf: "center",
    backgroundColor: "#FFF6F8",
  },
  loadingState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  scrollContent: { paddingBottom: 112 },
  hero: {
    marginHorizontal: 18,
    marginTop: 12,
    borderRadius: 28,
    paddingHorizontal: 22,
    paddingTop: 24,
    paddingBottom: 22,
    overflow: "hidden",
  },
  heroBadge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.92)",
  },
  heroBadgeText: { color: "#F55389", fontSize: 12, fontWeight: "900" },
  heroTitle: {
    color: "#FFF",
    fontSize: 28,
    fontWeight: "900",
    marginTop: 16,
    lineHeight: 34,
  },
  heroSubtitle: {
    color: "rgba(255,255,255,0.88)",
    fontSize: 14,
    lineHeight: 20,
    marginTop: 6,
    fontWeight: "600",
  },
  searchShell: {
    height: 56,
    marginTop: 20,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.94)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.72)",
    paddingLeft: 15,
    paddingRight: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  searchInput: {
    flex: 1,
    height: "100%",
    padding: 0,
    color: "#301726",
    fontSize: 14,
    fontWeight: "700",
  },
  searchIconButton: {
    width: 38,
    height: 38,
    borderRadius: 14,
    backgroundColor: "#F55389",
    alignItems: "center",
    justifyContent: "center",
  },
  content: { paddingTop: 22 },
  sectionHeader: {
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  sectionTitle: {
    color: "#301726",
    fontSize: 16,
    fontWeight: "900",
  },
  categoryList: {
    paddingHorizontal: 20,
    paddingRight: 24,
    gap: 9,
    paddingBottom: 22,
  },
  categoryChip: {
    minHeight: 40,
    paddingHorizontal: 17,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#F0C4CD",
    backgroundColor: "#FFF",
    alignItems: "center",
    justifyContent: "center",
  },
  categoryChipActive: {
    backgroundColor: "#F55389",
    borderColor: "#F55389",
  },
  categoryText: {
    color: "#8D6674",
    fontSize: 12,
    fontWeight: "900",
  },
  categoryTextActive: { color: "#FFF" },
  featuredList: {
    paddingHorizontal: 20,
    paddingRight: 24,
    gap: 14,
    paddingBottom: 24,
  },
  featuredCard: {
    width: 232,
    height: 254,
    borderRadius: 24,
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#F0E5EA",
    overflow: "hidden",
  },
  featuredCover: {
    height: 138,
    alignItems: "center",
    justifyContent: "center",
  },
  coverImage: { width: "100%", height: "100%" },
  featuredInitials: {
    color: "#FFF",
    fontSize: 42,
    fontWeight: "900",
  },
  ratingPill: {
    position: "absolute",
    right: 12,
    bottom: 12,
    height: 28,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.94)",
    paddingHorizontal: 9,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  ratingText: { color: "#301726", fontSize: 12, fontWeight: "900" },
  featuredBody: { padding: 14, flex: 1 },
  featuredName: { color: "#301726", fontSize: 16, fontWeight: "900" },
  featuredStyles: {
    color: "#8D6674",
    fontSize: 12,
    fontWeight: "700",
    marginTop: 5,
  },
  featuredMetaRow: {
    marginTop: "auto",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  pricePill: {
    flex: 1,
    color: "#F55389",
    backgroundColor: "#FFF0F4",
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 10,
    fontSize: 12,
    fontWeight: "900",
  },
  expText: { color: "#8D6674", fontSize: 11, fontWeight: "800" },
  listHeader: { marginTop: 2 },
  resultCount: { color: "#B57F8D", fontSize: 12, fontWeight: "900" },
  muaList: { paddingHorizontal: 20, gap: 12 },
  listCard: {
    minHeight: 104,
    borderRadius: 22,
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#F0E5EA",
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  avatarBox: {
    width: 72,
    height: 72,
    borderRadius: 22,
    overflow: "hidden",
    backgroundColor: "#FFF0F4",
  },
  avatarImage: { width: "100%", height: "100%" },
  avatarFallback: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: "#F55389", fontSize: 22, fontWeight: "900" },
  listBody: { flex: 1, marginLeft: 13, minWidth: 0 },
  listTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  listName: { flex: 1, color: "#301726", fontSize: 15, fontWeight: "900" },
  smallRating: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    minWidth: 44,
    justifyContent: "flex-end",
  },
  smallRatingText: { color: "#301726", fontSize: 11, fontWeight: "900" },
  listStyles: {
    color: "#8D6674",
    fontSize: 12,
    fontWeight: "700",
    marginTop: 5,
  },
  listFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    marginTop: 10,
  },
  listPrice: {
    flex: 1,
    color: "#F55389",
    fontSize: 12,
    fontWeight: "900",
  },
  bookingText: { color: "#B57F8D", fontSize: 11, fontWeight: "800" },
  emptyState: {
    marginHorizontal: 20,
    minHeight: 142,
    borderRadius: 22,
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#F0E5EA",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 22,
    marginBottom: 24,
  },
  emptyTitle: {
    color: "#301726",
    fontSize: 15,
    fontWeight: "900",
    marginTop: 10,
    textAlign: "center",
  },
  emptySubtitle: {
    color: "#8D6674",
    fontSize: 12,
    lineHeight: 18,
    fontWeight: "700",
    marginTop: 5,
    textAlign: "center",
  },
});

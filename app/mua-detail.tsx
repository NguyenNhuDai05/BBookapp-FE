import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  ArrowLeft,
  Calendar,
  CalendarPlus,
  CheckCircle2,
  Clock,
  Heart,
  Star,
  X,
} from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import {
  BookingData,
  MUA,
  muaService,
  PortfolioItem,
  ServiceItem,
} from "../services/muaService";
import {
  formatReviewDate,
  ReviewItem,
  reviewService,
} from "../services/reviewService";
import { useRequireAuth } from "../hooks/useRequireAuth";

export default function MUADetailScreen() {
  const checkingAuth = useRequireAuth();
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const targetId = Array.isArray(id) ? id[0] : id;

  const [isLiked, setIsLiked] = useState(false);
  const [loading, setLoading] = useState(true);

  // States lưu dữ liệu từ API
  const [muaInfo, setMuaInfo] = useState<MUA | null>(null);
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [reviews, setReviews] = useState<ReviewItem[]>([]);

  // ─── STATES PHỤC VỤ ĐẶT LỊCH ───
  const [isBookingModalVisible, setIsBookingModalVisible] = useState(false);
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [bookingAddress, setBookingAddress] = useState("");
  const [bookingNote, setBookingNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Danh sách ngày mock để chọn nhanh
  const availableDates = Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() + index + 1);
    return date.toISOString().slice(0, 10);
  });
  // Danh sách khung giờ mock
  const availableTimes = ["08:00", "10:00", "13:30", "15:30", "17:00", "19:00"];

  useEffect(() => {
    const loadDetailData = async () => {
      if (checkingAuth || !targetId) return;
      try {
        const [infoResult, portfolioResult, servicesResult, reviewResult] =
          await Promise.all([
            muaService.getMUAById(targetId),
            muaService.getPortfolio(targetId),
            muaService.getServices(targetId),
            reviewService.getByMua(targetId),
          ]);

        if (infoResult) setMuaInfo(infoResult);
        setPortfolio(
          portfolioResult.length > 0
            ? portfolioResult
            : infoResult.portfolio || [],
        );
        setServices(
          servicesResult.length > 0 ? servicesResult : infoResult.services || [],
        );
        setReviews(reviewResult);

        // Tự động chọn dịch vụ đầu tiên làm mặc định
        const resolvedServices =
          servicesResult.length > 0 ? servicesResult : infoResult.services || [];

        if (resolvedServices.length > 0) {
          setSelectedService(resolvedServices[0].id);
        }
      } catch (error) {
        console.error("Lỗi khi fetch chi tiết MUA:", error);
      } finally {
        setLoading(false);
      }
    };

    loadDetailData();
  }, [checkingAuth, targetId]);

  // HÀM XỬ LÝ GỬI ĐẶT LỊCH LÊN SERVER
  const handleConfirmBooking = async () => {
    if (!targetId || !selectedService || !selectedDate || !selectedTime || !bookingAddress.trim()) {
      Alert.alert(
        "Thông báo",
        "Vui lòng chọn dịch vụ, ngày giờ và nhập địa chỉ làm makeup.",
      );
      return;
    }

    setSubmitting(true);
    try {
      const bookingPayload: BookingData = {
        muaId: targetId,
        serviceId: selectedService,
        date: selectedDate,
        timeSlot: selectedTime,
        address: bookingAddress.trim(),
        note: bookingNote.trim() || undefined,
      };

      const result = await muaService.createBooking(bookingPayload);

      setIsBookingModalVisible(false);
      setBookingAddress("");
      setBookingNote("");
      Alert.alert(
        "Đặt lịch thành công",
        `Lịch hẹn với ${muaInfo?.name} đã được tạo. Mã đặt lịch: ${result.id || "Booking"}`,
        [{ text: "Xem lịch sử", onPress: () => router.replace("/(tabs)/bookings" as any) }],
      );
    } catch (error: any) {
      console.error("Booking error:", error?.response?.data || error?.message || error);
      Alert.alert(
        "Đặt lịch thất bại",
        error?.response?.data?.message ||
          error?.response?.data?.Message ||
          "Không thể tạo lịch hẹn. Vui lòng thử lại.",
      );
    } finally {
      setSubmitting(false);
    }
  };
  if (checkingAuth || loading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#FFF",
        }}
      >
        <ActivityIndicator size="large" color="#1F1B36" />
      </View>
    );
  }

  if (!muaInfo) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text style={{ fontSize: 16, color: "#8C8390" }}>
          Không tìm thấy thông tin nghệ sĩ này!
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#FFF" }}>
      {/* ─── FIXED BOTTOM BUTTON (NÚT KÍCH HOẠT MỞ MODAL) ─── */}
      <View
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: "#FFF",
          paddingHorizontal: 20,
          paddingTop: 12,
          paddingBottom: 28,
          borderTopWidth: 0.5,
          borderTopColor: "#EEE5EA",
          zIndex: 10,
        }}
      >
        <TouchableOpacity
          onPress={() => setIsBookingModalVisible(true)}
          disabled={services.length === 0}
          style={{
            height: 56,
            borderRadius: 16,
            backgroundColor: services.length === 0 ? "#B8AFBC" : "#22152B",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
          }}
        >
          <CalendarPlus size={20} color="#FFF" />
          <Text style={{ fontSize: 16, fontWeight: "700", color: "#FFF" }}>
            {services.length === 0
              ? "Makeup Artist chưa có dịch vụ"
              : `Đặt lịch với ${muaInfo.name}`}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 110 }}
      >
        {/* HEADER SECTION */}
        <View
          style={{
            backgroundColor: "#2A1B35",
            height: 160,
            paddingHorizontal: 20,
            paddingTop: 16,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <TouchableOpacity
              onPress={() => router.back()}
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: "rgba(255,255,255,0.15)",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <ArrowLeft size={20} color="#FFF" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setIsLiked(!isLiked)}
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: "rgba(255,255,255,0.15)",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Heart
                size={20}
                color={isLiked ? "#FF4B72" : "#FFF"}
                fill={isLiked ? "#FF4B72" : "none"}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* INFO CARD OVERLAP */}
        <View style={{ paddingHorizontal: 20, marginTop: -45 }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "flex-end",
              marginBottom: 12,
            }}
          >
            <View style={{ position: "relative" }}>
              <LinearGradient
                colors={["#F5B1C1", "#D98197"] as const}
                style={{
                  width: 90,
                  height: 90,
                  borderRadius: 28,
                  alignItems: "center",
                  justifyContent: "center",
                  borderWidth: 4,
                  borderColor: "#FFF",
                }}
              >
                <Text
                  style={{ color: "#fff", fontSize: 34, fontWeight: "600" }}
                >
                  {muaInfo.avatar}
                </Text>
              </LinearGradient>
              <View
                style={{
                  position: "absolute",
                  bottom: 0,
                  right: 0,
                  backgroundColor: "#FFF",
                  borderRadius: 10,
                }}
              >
                <CheckCircle2 size={20} color="#FFF" fill="#4ADE80" />
              </View>
            </View>
          </View>

          <Text style={{ fontSize: 24, fontWeight: "800", color: "#1F1B36" }}>
            {muaInfo.name}
          </Text>
          <Text
            style={{
              fontSize: 13,
              color: "#8C8390",
              marginTop: 4,
              fontWeight: "500",
            }}
          >
            {muaInfo.styles.join(" & ")} Makeup Artist · {muaInfo.yearsOfExp} năm KN
          </Text>

          {/* BAO THÔNG SỐ */}
          <View
            style={{
              flexDirection: "row",
              borderWidth: 0.5,
              borderColor: "#EDE4E8",
              borderRadius: 18,
              marginTop: 20,
              backgroundColor: "#FFF",
            }}
          >
            <View
              style={{
                flex: 1,
                alignItems: "center",
                paddingVertical: 14,
                borderRightWidth: 0.5,
                borderRightColor: "#EDE4E8",
              }}
            >
              <Text
                style={{ fontSize: 18, fontWeight: "700", color: "#1F1B36" }}
              >
                {muaInfo.completedBooks}
              </Text>
              <Text style={{ fontSize: 11, color: "#8C8390", marginTop: 3 }}>
                Lượt book
              </Text>
            </View>
            <View
              style={{
                flex: 1,
                alignItems: "center",
                paddingVertical: 14,
                borderRightWidth: 0.5,
                borderRightColor: "#EDE4E8",
              }}
            >
              <Text
                style={{ fontSize: 18, fontWeight: "700", color: "#1F1B36" }}
              >
                {muaInfo.rating}
              </Text>
              <Text style={{ fontSize: 11, color: "#8C8390", marginTop: 3 }}>
                Đánh giá
              </Text>
            </View>
            <View
              style={{ flex: 1, alignItems: "center", paddingVertical: 14 }}
            >
              <Text
                style={{ fontSize: 18, fontWeight: "700", color: "#1F1B36" }}
              >
                {muaInfo.responseRate}%
              </Text>
              <Text style={{ fontSize: 11, color: "#8C8390", marginTop: 3 }}>
                Phản hồi
              </Text>
            </View>
          </View>

          <Text
            style={{
              fontSize: 14,
              color: "#5C5461",
              lineHeight: 22,
              marginTop: 20,
            }}
          >
            {muaInfo.bio}
          </Text>

          {/* PORTFOLIO GRID */}
          <Text
            style={{
              fontSize: 15,
              fontWeight: "700",
              color: "#1D1A36",
              marginTop: 28,
              marginBottom: 14,
            }}
          >
            Portfolio
          </Text>
          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              justifyContent: "space-between",
              gap: 10,
            }}
          >
            {portfolio.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={{
                  width: "31.3%",
                  aspectRatio: 1,
                  borderRadius: 16,
                  overflow: "hidden",
                }}
              >
                {item.imageUrl ? (
                  <Image
                    source={{ uri: item.imageUrl }}
                    style={{ width: "100%", height: "100%" }}
                    resizeMode="cover"
                  />
                ) : (
                  <LinearGradient
                    colors={item.colors}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{
                      flex: 1,
                      alignItems: "center",
                      justifyContent: "center",
                      padding: 8,
                    }}
                  >
                    <Text
                      style={{ fontSize: 18, color: "#7C5866" }}
                      numberOfLines={2}
                    >
                      {item.description || item.icon}
                    </Text>
                  </LinearGradient>
                )}
              </TouchableOpacity>
            ))}
          </View>

          {/* SERVICES LIST */}
          <Text
            style={{
              fontSize: 15,
              fontWeight: "700",
              color: "#1D1A36",
              marginTop: 28,
              marginBottom: 8,
            }}
          >
            Dịch vụ cung cấp
          </Text>
          <View style={{ marginTop: 4 }}>
            {services.length === 0 && (
              <View
                style={{
                  paddingVertical: 18,
                  paddingHorizontal: 14,
                  borderRadius: 14,
                  backgroundColor: "#F9F6F8",
                }}
              >
                <Text style={{ color: "#8C8390", fontSize: 13 }}>
                  Makeup Artist này chưa cập nhật danh sách dịch vụ.
                </Text>
              </View>
            )}
            {services.map((service, index) => (
              <TouchableOpacity
                key={service.id}
                onPress={() => setSelectedService(service.id)}
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  paddingVertical: 16,
                  borderBottomWidth: index === services.length - 1 ? 0 : 0.5,
                  borderBottomColor: "#EEE5EA",
                  backgroundColor:
                    selectedService === service.id ? "#FFF5F7" : "transparent",
                  paddingHorizontal: selectedService === service.id ? 8 : 0,
                  borderRadius: 8,
                }}
              >
                <View style={{ flex: 1, paddingRight: 12 }}>
                  <Text
                    style={{
                      fontSize: 15,
                      fontWeight: "700",
                      color:
                        selectedService === service.id ? "#D86D9A" : "#1F1B36",
                    }}
                  >
                    {service.name} {selectedService === service.id && "✓"}
                  </Text>
                  <Text
                    style={{ fontSize: 12, color: "#8C8390", marginTop: 4 }}
                  >
                    {service.time}
                  </Text>
                  {!!service.description && (
                    <Text
                      style={{
                        fontSize: 12,
                        color: "#8C8390",
                        lineHeight: 17,
                        marginTop: 4,
                      }}
                      numberOfLines={2}
                    >
                      {service.description}
                    </Text>
                  )}
                </View>
                <Text
                  style={{ fontSize: 15, fontWeight: "700", color: "#D86D9A" }}
                >
                  {service.price}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View
            style={{
              marginTop: 28,
              marginBottom: 18,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Text
              style={{
                fontSize: 15,
                fontWeight: "700",
                color: "#1D1A36",
              }}
            >
              Đánh giá từ khách hàng
            </Text>
            <Text style={{ fontSize: 12, color: "#8C8390", fontWeight: "700" }}>
              {reviews.length} review
            </Text>
          </View>

          <View
            style={{
              borderRadius: 18,
              borderWidth: 1,
              borderColor: "#EEE5EA",
              backgroundColor: "#FFF9FA",
              padding: 14,
              marginBottom: 8,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Star size={18} color="#F5A623" fill="#F5A623" />
              <Text style={{ fontSize: 20, color: "#1F1B36", fontWeight: "800" }}>
                {Number(muaInfo.rating || 0).toFixed(1)}
              </Text>
              <Text style={{ fontSize: 13, color: "#8C8390", fontWeight: "600" }}>
                / 5.0
              </Text>
            </View>
            <Text
              style={{
                marginTop: 6,
                fontSize: 12,
                color: "#8C8390",
                fontWeight: "600",
              }}
            >
              Rating trung bình được cập nhật sau mỗi đánh giá hợp lệ.
            </Text>
          </View>

          {reviews.length === 0 ? (
            <View
              style={{
                paddingVertical: 18,
                paddingHorizontal: 14,
                borderRadius: 14,
                backgroundColor: "#F9F6F8",
              }}
            >
              <Text style={{ color: "#8C8390", fontSize: 13 }}>
                Makeup Artist này chưa có đánh giá nào.
              </Text>
            </View>
          ) : (
            reviews.map((review) => (
              <View
                key={review.reviewId}
                style={{
                  borderBottomWidth: 1,
                  borderBottomColor: "#F6EFF2",
                  paddingVertical: 14,
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 12,
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        color: "#1F1B36",
                        fontSize: 14,
                        fontWeight: "800",
                      }}
                      numberOfLines={1}
                    >
                      {review.customerName}
                    </Text>
                    <Text
                      style={{
                        color: "#A397A6",
                        fontSize: 11,
                        fontWeight: "600",
                        marginTop: 2,
                      }}
                    >
                      {formatReviewDate(review.createdAt)}
                    </Text>
                  </View>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
                    {[1, 2, 3, 4, 5].map((value) => (
                      <Star
                        key={value}
                        size={14}
                        color="#F5A623"
                        fill={value <= review.rating ? "#F5A623" : "transparent"}
                      />
                    ))}
                  </View>
                </View>
                {!!review.comment && (
                  <Text
                    style={{
                      color: "#5C5461",
                      fontSize: 13,
                      lineHeight: 19,
                      marginTop: 8,
                    }}
                  >
                    {review.comment}
                  </Text>
                )}
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* ─── MODAL PANEL ĐẶT LỊCH HẸN POPUP ─── */}
      <Modal
        visible={isBookingModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsBookingModalVisible(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.5)",
            justifyContent: "flex-end",
          }}
        >
          <View
            style={{
              backgroundColor: "#FFF",
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              paddingHorizontal: 20,
              paddingTop: 20,
              paddingBottom: 34,
              maxHeight: "80%",
            }}
          >
            {/* Thanh bar header modal */}
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 20,
              }}
            >
              <Text
                style={{ fontSize: 18, fontWeight: "800", color: "#1F1B36" }}
              >
                Chọn thời gian đặt lịch
              </Text>
              <TouchableOpacity
                onPress={() => setIsBookingModalVisible(false)}
                style={{ padding: 4 }}
              >
                <X size={22} color="#8C8390" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* SECTION CHỌN NGÀY */}
              <View style={{ marginBottom: 20 }}>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 6,
                    marginBottom: 12,
                  }}
                >
                  <Calendar size={16} color="#8C8390" />
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: "700",
                      color: "#5C5461",
                    }}
                  >
                    Chọn ngày làm việc
                  </Text>
                </View>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ gap: 10 }}
                >
                  {availableDates.map((date) => {
                    const isSelected = selectedDate === date;
                    // Format text hiển thị ví dụ từ 2026-05-29 lấy ngày 29
                    const dayLabel = date.split("-")[2];
                    const monthLabel = date.split("-")[1];
                    return (
                      <TouchableOpacity
                        key={date}
                        onPress={() => setSelectedDate(date)}
                        style={{
                          width: 65,
                          height: 70,
                          borderRadius: 16,
                          backgroundColor: isSelected ? "#22152B" : "#F6EFF2",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 16,
                            fontWeight: "700",
                            color: isSelected ? "#FFF" : "#1F1B36",
                          }}
                        >
                          {dayLabel}
                        </Text>
                        <Text
                          style={{
                            fontSize: 11,
                            color: isSelected ? "#F5B1C1" : "#A397A6",
                            marginTop: 2,
                          }}
                        >
                          Thg {monthLabel}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>

              {/* SECTION CHỌN KHUNG GIỜ */}
              <View style={{ marginBottom: 24 }}>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 6,
                    marginBottom: 12,
                  }}
                >
                  <Clock size={16} color="#8C8390" />
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: "700",
                      color: "#5C5461",
                    }}
                  >
                    Chọn khung giờ trống
                  </Text>
                </View>
                <View
                  style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}
                >
                  {availableTimes.map((time) => {
                    const isSelected = selectedTime === time;
                    return (
                      <TouchableOpacity
                        key={time}
                        onPress={() => setSelectedTime(time)}
                        style={{
                          paddingHorizontal: 16,
                          paddingVertical: 12,
                          borderRadius: 12,
                          backgroundColor: isSelected ? "#D86D9A" : "#FFF",
                          borderWidth: 1,
                          borderColor: isSelected ? "#D86D9A" : "#EEE5EA",
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 14,
                            fontWeight: "600",
                            color: isSelected ? "#FFF" : "#5C5461",
                          }}
                        >
                          {time}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              <View style={{ marginBottom: 24 }}>
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: "700",
                    color: "#5C5461",
                    marginBottom: 12,
                  }}
                >
                  Địa chỉ làm makeup
                </Text>
                <TextInput
                  value={bookingAddress}
                  onChangeText={setBookingAddress}
                  placeholder="Số nhà, đường, phường/xã, quận/huyện"
                  placeholderTextColor="#BCA7B4"
                  style={{
                    minHeight: 52,
                    borderRadius: 14,
                    borderWidth: 1,
                    borderColor: "#EEE5EA",
                    backgroundColor: "#FFF9FA",
                    paddingHorizontal: 14,
                    color: "#1F1B36",
                    fontSize: 14,
                    fontWeight: "600",
                  }}
                />
                <TextInput
                  value={bookingNote}
                  onChangeText={setBookingNote}
                  placeholder="Ghi chú thêm cho Makeup Artist (tòa nhà, tone makeup mong muốn...)"
                  placeholderTextColor="#BCA7B4"
                  multiline
                  style={{
                    minHeight: 82,
                    borderRadius: 14,
                    borderWidth: 1,
                    borderColor: "#EEE5EA",
                    backgroundColor: "#FFF9FA",
                    paddingHorizontal: 14,
                    paddingTop: 12,
                    color: "#1F1B36",
                    fontSize: 14,
                    fontWeight: "600",
                    marginTop: 10,
                    textAlignVertical: "top",
                  }}
                />
              </View>
              {/* TÓM TẮT DỊCH VỤ ĐÃ CHỌN */}
              <View
                style={{
                  backgroundColor: "#F9F6F8",
                  padding: 14,
                  borderRadius: 16,
                  marginBottom: 24,
                }}
              >
                <Text
                  style={{ fontSize: 12, color: "#8C8390", fontWeight: "600" }}
                >
                  DỊCH VỤ ĐÃ CHỌN
                </Text>
                <Text
                  style={{
                    fontSize: 15,
                    fontWeight: "700",
                    color: "#1F1B36",
                    marginTop: 4,
                  }}
                >
                  {services.find((s) => s.id === selectedService)?.name ||
                    "Chưa chọn dịch vụ"}
                </Text>
                <Text
                  style={{
                    fontSize: 14,
                    color: "#D86D9A",
                    fontWeight: "700",
                    marginTop: 2,
                  }}
                >
                  Giá:{" "}
                  {services.find((s) => s.id === selectedService)?.price ||
                    "0đ"}
                </Text>
              </View>

              {/* NÚT XÁC NHẬN GỬI HOÀN TẤT */}
              <TouchableOpacity
                onPress={handleConfirmBooking}
                disabled={submitting}
                style={{
                  height: 54,
                  borderRadius: 16,
                  backgroundColor: "#22152B",
                  alignItems: "center",
                  justifyContent: "center",
                  opacity: submitting ? 0.7 : 1,
                }}
              >
                {submitting ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text
                    style={{ color: "#FFF", fontSize: 16, fontWeight: "700" }}
                  >
                    Xác nhận đặt lịch ngay
                  </Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  ArrowLeft,
  Calendar,
  CalendarPlus,
  CheckCircle2,
  Clock,
  Heart,
  X,
} from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  SafeAreaView,
  ScrollView,
  Text,
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

export default function MUADetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const targetId = Array.isArray(id) ? id[0] : id;

  const [isLiked, setIsLiked] = useState(false);
  const [loading, setLoading] = useState(true);

  // States lưu dữ liệu từ API
  const [muaInfo, setMuaInfo] = useState<MUA | null>(null);
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [services, setServices] = useState<ServiceItem[]>([]);

  // ─── STATES PHỤC VỤ ĐẶT LỊCH ───
  const [isBookingModalVisible, setIsBookingModalVisible] = useState(false);
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Danh sách ngày mock để chọn nhanh
  const availableDates = [
    "2026-05-29",
    "2026-05-30",
    "2026-05-31",
    "2026-06-01",
  ];
  // Danh sách khung giờ mock
  const availableTimes = ["08:00", "10:00", "13:30", "15:30", "17:00", "19:00"];

  useEffect(() => {
    const loadDetailData = async () => {
      if (!targetId) return;
      try {
        const [infoResult, portfolioResult, servicesResult] = await Promise.all(
          [
            muaService.getMUAById(targetId),
            muaService.getPortfolio(targetId),
            muaService.getServices(targetId),
          ],
        );

        if (infoResult) setMuaInfo(infoResult);
        setPortfolio(portfolioResult);
        setServices(servicesResult);

        // Tự động chọn dịch vụ đầu tiên làm mặc định
        if (servicesResult.length > 0) {
          setSelectedService(servicesResult[0].id);
        }
      } catch (error) {
        console.error("Lỗi khi fetch chi tiết MUA:", error);
      } finally {
        setLoading(false);
      }
    };

    loadDetailData();
  }, [targetId]);

  // HÀM XỬ LÝ GỬI ĐẶT LỊCH LÊN SERVER
  const handleConfirmBooking = async () => {
    if (!targetId || !selectedService || !selectedDate || !selectedTime) {
      Alert.alert(
        "Thông báo",
        "Vui lòng chọn đầy đủ Dịch vụ, Ngày và Giờ đặt lịch!",
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
      };

      // Gọi hàm POST sang MockAPI đã viết ở service
      const result = await muaService.createBooking(bookingPayload);

      setIsBookingModalVisible(false); // Đóng modal nháp
      Alert.alert(
        "Thành công 🎉",
        `Lịch hẹn của bạn với ${muaInfo?.name} đã được ghi nhận thành công! (Mã đặt: ${result.id || "MUA-" + targetId})`,
        [{ text: "OK", onPress: () => router.push("/") }], // Quay về trang chủ hoặc lịch trình
      );
    } catch (error) {
      console.error("Lỗi đặt lịch:", error);
      Alert.alert(
        "Thất bại",
        "Đã có lỗi xảy ra trong quá trình đặt lịch. Vui lòng thử lại!",
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
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
          style={{
            height: 56,
            borderRadius: 16,
            backgroundColor: "#22152B",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
          }}
        >
          <CalendarPlus size={20} color="#FFF" />
          <Text style={{ fontSize: 16, fontWeight: "700", color: "#FFF" }}>
            Đặt lịch với {muaInfo.name}
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
            {muaInfo.styles.join(" & ")} MUA · {muaInfo.yearsOfExp} năm KN
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
                <LinearGradient
                  colors={item.colors}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{
                    flex: 1,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text style={{ fontSize: 26 }}>{item.icon}</Text>
                </LinearGradient>
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
                <View>
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
                </View>
                <Text
                  style={{ fontSize: 15, fontWeight: "700", color: "#D86D9A" }}
                >
                  {service.price}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
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

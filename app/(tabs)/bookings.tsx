import {
  CalendarDays,
  Check,
  CheckCircle2,
  MapPin,
  RefreshCw,
  Star,
  WalletCards,
  X,
} from "lucide-react-native";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import {
  BookingItem,
  BookingStatus,
  bookingService,
  formatBookingDate,
  formatMoney,
} from "../../services/bookingService";
import { reviewService } from "../../services/reviewService";
import { useAuthStore } from "../../store/useAuthStore";

const STATUS_META = {
  Pending: { label: "Chờ duyệt", color: "#D86D9A", bg: "#FFF0F4" },
  Approved: { label: "Đã duyệt", color: "#227A5C", bg: "#EAF8F1" },
  Completed: { label: "Hoàn thành", color: "#3B6BB3", bg: "#EEF5FF" },
  Cancelled: { label: "Đã từ chối", color: "#B34444", bg: "#FFF0F0" },
};

const isArtistRole = (role: unknown) => role === 2 || role === "MUA";

export default function BookingScreen() {
  const authUser = useAuthStore((state) => state.user);
  const artistMode = isArtistRole(authUser?.role);

  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [reviewTarget, setReviewTarget] = useState<BookingItem | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewSubmitting, setReviewSubmitting] = useState(false);

  const loadBookings = useCallback(async () => {
    try {
      setError("");
      const result = await bookingService.getBookings();
      setBookings(result);
    } catch (err: any) {
      console.error("Load bookings error:", err?.response?.data || err?.message || err);
      setError(
        err?.response?.data?.message ||
          err?.response?.data?.Message ||
          "Không thể tải danh sách đặt lịch.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadBookings();
  }, [loadBookings]);

  const refresh = () => {
    setRefreshing(true);
    loadBookings();
  };

  const title = artistMode ? "Lịch khách đã đặt" : "Lịch sử đặt lịch";
  const subtitle = artistMode
    ? "Duyệt lịch mới, từ chối lịch không phù hợp và đánh dấu hoàn thành sau buổi makeup."
    : "Theo dõi các lịch hẹn makeup đã tạo và trạng thái xử lý.";

  const emptyCopy = artistMode
    ? "Khi khách đặt lịch với bạn, booking sẽ xuất hiện tại đây."
    : "Sau khi đặt lịch với Makeup Artist, booking sẽ xuất hiện tại đây.";

  const sortedBookings = useMemo(
    () =>
      [...bookings].sort(
        (a, b) =>
          new Date(b.bookingDate).getTime() - new Date(a.bookingDate).getTime(),
      ),
    [bookings],
  );

  const updateStatus = async (booking: BookingItem, status: BookingStatus) => {
    try {
      setUpdatingId(booking.id);
      await bookingService.updateStatus(booking.id, status);
      await loadBookings();
    } catch (err: any) {
      Alert.alert(
        "Không thể cập nhật lịch",
        err?.response?.data?.message ||
          err?.response?.data?.Message ||
          "Vui lòng thử lại sau.",
      );
    } finally {
      setUpdatingId(null);
    }
  };

  const openReview = (booking: BookingItem) => {
    setReviewTarget(booking);
    setReviewRating(5);
    setReviewComment("");
  };

  const submitReview = async () => {
    if (!reviewTarget) return;

    try {
      setReviewSubmitting(true);
      await reviewService.createForBooking(
        reviewTarget.id,
        reviewRating,
        reviewComment.trim() || undefined,
      );
      setReviewTarget(null);
      await loadBookings();
      Alert.alert("Đã gửi đánh giá", "Cảm ơn bạn đã chia sẻ trải nghiệm.");
    } catch (err: any) {
      Alert.alert(
        "Không thể gửi đánh giá",
        err?.response?.data?.message ||
          err?.response?.data?.Message ||
          "Bạn chỉ có thể đánh giá lịch đã hoàn thành và chưa được đánh giá.",
      );
    } finally {
      setReviewSubmitting(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.centerScreen}>
        <ActivityIndicator size="large" color="#F55389" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor="#F55389" />
        }
      >
        <View style={styles.header}>
          <View style={styles.headerIcon}>
            <CalendarDays size={24} color="#F55389" />
          </View>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </View>

        {error ? (
          <View style={styles.messageCard}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={refresh} style={styles.retryButton}>
              <RefreshCw size={15} color="#FFF" />
              <Text style={styles.retryText}>Tải lại</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {!error && sortedBookings.length === 0 ? (
          <View style={styles.messageCard}>
            <WalletCards size={28} color="#F55389" />
            <Text style={styles.emptyTitle}>Chưa có lịch hẹn nào</Text>
            <Text style={styles.emptySubtitle}>{emptyCopy}</Text>
          </View>
        ) : (
          <View style={styles.list}>
            {sortedBookings.map((booking) => (
              <BookingCard
                key={booking.id}
                booking={booking}
                artistMode={artistMode}
                updating={updatingId === booking.id}
                onStatusChange={updateStatus}
                onOpenReview={openReview}
              />
            ))}
          </View>
        )}
      </ScrollView>

      <ReviewModal
        booking={reviewTarget}
        rating={reviewRating}
        comment={reviewComment}
        submitting={reviewSubmitting}
        onClose={() => setReviewTarget(null)}
        onRatingChange={setReviewRating}
        onCommentChange={setReviewComment}
        onSubmit={submitReview}
      />
    </SafeAreaView>
  );
}

function BookingCard({
  booking,
  artistMode,
  updating,
  onStatusChange,
  onOpenReview,
}: {
  booking: BookingItem;
  artistMode: boolean;
  updating: boolean;
  onStatusChange: (booking: BookingItem, status: BookingStatus) => void;
  onOpenReview: (booking: BookingItem) => void;
}) {
  const status = STATUS_META[booking.status] || STATUS_META.Pending;
  const title = artistMode ? booking.customerName || "Khách hàng" : booking.muaName;
  const subtitle = artistMode ? booking.serviceName : booking.serviceName;
  const canApprove = artistMode && booking.status === "Pending";
  const canComplete = artistMode && booking.status === "Approved";
  const canReview = !artistMode && booking.status === "Completed" && !booking.hasReview;

  return (
    <View style={styles.card}>
      <View style={styles.cardTopRow}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {title
              .split(" ")
              .filter(Boolean)
              .slice(-2)
              .map((word) => word[0])
              .join("")
              .toUpperCase() || (artistMode ? "KH" : "MA")}
          </Text>
        </View>
        <View style={styles.cardTitleBlock}>
          <Text style={styles.bookingName} numberOfLines={1}>
            {title}
          </Text>
          <Text style={styles.serviceName} numberOfLines={1}>
            {subtitle}
          </Text>
        </View>
        <View style={[styles.statusPill, { backgroundColor: status.bg }]}>
          <Text style={[styles.statusText, { color: status.color }]}>
            {status.label}
          </Text>
        </View>
      </View>

      <View style={styles.infoRow}>
        <CalendarDays size={15} color="#8D6674" />
        <Text style={styles.infoText}>{formatBookingDate(booking.bookingDate)}</Text>
      </View>

      <View style={styles.infoRow}>
        <MapPin size={15} color="#8D6674" />
        <Text style={styles.infoText} numberOfLines={2}>
          {booking.address || "Chưa có địa chỉ"}
        </Text>
      </View>

      {!!booking.note && (
        <Text style={styles.noteText} numberOfLines={2}>
          {booking.note}
        </Text>
      )}

      <View style={styles.totalRow}>
        <Text style={styles.totalLabel}>Tổng tiền</Text>
        <Text style={styles.totalValue}>{formatMoney(booking.totalPrice)}</Text>
      </View>

      {artistMode && (canApprove || canComplete) ? (
        <View style={styles.actionRow}>
          {canApprove ? (
            <>
              <TouchableOpacity
                style={[styles.actionButton, styles.rejectButton]}
                disabled={updating}
                onPress={() => onStatusChange(booking, "Cancelled")}
              >
                <X size={16} color="#B34444" />
                <Text style={styles.rejectText}>Từ chối</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.approveButton]}
                disabled={updating}
                onPress={() => onStatusChange(booking, "Approved")}
              >
                <Check size={16} color="#FFF" />
                <Text style={styles.approveText}>Chấp nhận</Text>
              </TouchableOpacity>
            </>
          ) : null}

          {canComplete ? (
            <TouchableOpacity
              style={[styles.actionButton, styles.completeButton]}
              disabled={updating}
              onPress={() => onStatusChange(booking, "Completed")}
            >
              <CheckCircle2 size={16} color="#FFF" />
              <Text style={styles.approveText}>Đánh dấu hoàn thành</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      ) : null}

      {canReview ? (
        <TouchableOpacity
          style={[styles.actionButton, styles.reviewButton]}
          onPress={() => onOpenReview(booking)}
        >
          <Star size={16} color="#FFF" fill="#FFF" />
          <Text style={styles.approveText}>Đánh giá Makeup Artist</Text>
        </TouchableOpacity>
      ) : null}

      {!artistMode && booking.hasReview ? (
        <Text style={styles.reviewedText}>Bạn đã đánh giá lịch hẹn này.</Text>
      ) : null}
    </View>
  );
}

function ReviewModal({
  booking,
  rating,
  comment,
  submitting,
  onClose,
  onRatingChange,
  onCommentChange,
  onSubmit,
}: {
  booking: BookingItem | null;
  rating: number;
  comment: string;
  submitting: boolean;
  onClose: () => void;
  onRatingChange: (rating: number) => void;
  onCommentChange: (comment: string) => void;
  onSubmit: () => void;
}) {
  return (
    <Modal visible={!!booking} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={styles.modalPanel}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Đánh giá Makeup Artist</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={20} color="#8D6674" />
            </TouchableOpacity>
          </View>

          <Text style={styles.modalSubtitle} numberOfLines={2}>
            {booking?.muaName} · {booking?.serviceName}
          </Text>

          <View style={styles.starRow}>
            {[1, 2, 3, 4, 5].map((value) => (
              <TouchableOpacity
                key={value}
                onPress={() => onRatingChange(value)}
                style={styles.starButton}
              >
                <Star
                  size={32}
                  color="#F5A623"
                  fill={value <= rating ? "#F5A623" : "transparent"}
                />
              </TouchableOpacity>
            ))}
          </View>

          <TextInput
            value={comment}
            onChangeText={onCommentChange}
            placeholder="Chia sẻ cảm nhận của bạn..."
            placeholderTextColor="#BCA7B4"
            multiline
            style={styles.reviewInput}
          />

          <TouchableOpacity
            onPress={onSubmit}
            disabled={submitting}
            style={[styles.submitReviewButton, submitting && styles.disabledButton]}
          >
            {submitting ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.submitReviewText}>Gửi đánh giá</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFF6F8" },
  centerScreen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFF6F8",
  },
  scrollContent: { paddingBottom: 144 },
  header: {
    paddingHorizontal: 22,
    paddingTop: 18,
    paddingBottom: 14,
  },
  headerIcon: {
    width: 52,
    height: 52,
    borderRadius: 18,
    backgroundColor: "#FFF0F4",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    color: "#301726",
    fontSize: 28,
    fontWeight: "900",
    marginTop: 14,
  },
  subtitle: {
    color: "#8D6674",
    fontSize: 14,
    lineHeight: 20,
    marginTop: 5,
    fontWeight: "700",
  },
  list: { paddingHorizontal: 18, gap: 12 },
  card: {
    borderRadius: 22,
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#F0E5EA",
    padding: 15,
  },
  cardTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: "#FFF0F4",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: "#F55389", fontSize: 15, fontWeight: "900" },
  cardTitleBlock: { flex: 1, minWidth: 0 },
  bookingName: { color: "#301726", fontSize: 15, fontWeight: "900" },
  serviceName: {
    color: "#8D6674",
    fontSize: 12,
    fontWeight: "700",
    marginTop: 3,
  },
  statusPill: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  statusText: { fontSize: 11, fontWeight: "900" },
  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    marginTop: 13,
  },
  infoText: {
    flex: 1,
    color: "#4D2636",
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "700",
  },
  noteText: {
    color: "#8D6674",
    backgroundColor: "#FFF9FA",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "700",
    marginTop: 12,
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: "#F6EFF2",
    paddingTop: 13,
    marginTop: 13,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  totalLabel: { color: "#8D6674", fontSize: 12, fontWeight: "900" },
  totalValue: { color: "#F55389", fontSize: 15, fontWeight: "900" },
  actionRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 14,
  },
  actionButton: {
    minHeight: 42,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    flex: 1,
  },
  rejectButton: {
    backgroundColor: "#FFF0F0",
    borderWidth: 1,
    borderColor: "#FFD5D5",
  },
  approveButton: { backgroundColor: "#227A5C" },
  completeButton: { backgroundColor: "#3B6BB3" },
  reviewButton: {
    backgroundColor: "#F55389",
    marginTop: 14,
  },
  rejectText: { color: "#B34444", fontSize: 13, fontWeight: "900" },
  approveText: { color: "#FFF", fontSize: 13, fontWeight: "900" },
  reviewedText: {
    color: "#8D6674",
    fontSize: 12,
    fontWeight: "800",
    marginTop: 12,
  },
  messageCard: {
    marginHorizontal: 18,
    marginTop: 14,
    borderRadius: 22,
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#F0E5EA",
    padding: 20,
    alignItems: "center",
  },
  emptyTitle: {
    color: "#301726",
    fontSize: 16,
    fontWeight: "900",
    marginTop: 12,
  },
  emptySubtitle: {
    color: "#8D6674",
    fontSize: 13,
    lineHeight: 19,
    fontWeight: "700",
    textAlign: "center",
    marginTop: 5,
  },
  errorText: {
    color: "#B34444",
    fontSize: 13,
    lineHeight: 19,
    fontWeight: "800",
    textAlign: "center",
  },
  retryButton: {
    marginTop: 14,
    backgroundColor: "#F55389",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  retryText: { color: "#FFF", fontSize: 13, fontWeight: "900" },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(48, 23, 38, 0.45)",
    justifyContent: "flex-end",
  },
  modalPanel: {
    backgroundColor: "#FFF",
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 34,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  modalTitle: { color: "#301726", fontSize: 18, fontWeight: "900" },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#FFF0F4",
    alignItems: "center",
    justifyContent: "center",
  },
  modalSubtitle: {
    color: "#8D6674",
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "700",
    marginTop: 6,
  },
  starRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 18,
    marginBottom: 16,
  },
  starButton: { padding: 4 },
  reviewInput: {
    minHeight: 110,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#F0E5EA",
    backgroundColor: "#FFF9FA",
    paddingHorizontal: 14,
    paddingTop: 12,
    color: "#301726",
    fontSize: 14,
    fontWeight: "700",
    textAlignVertical: "top",
  },
  submitReviewButton: {
    height: 52,
    borderRadius: 16,
    backgroundColor: "#F55389",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 14,
  },
  disabledButton: { opacity: 0.65 },
  submitReviewText: { color: "#FFF", fontSize: 15, fontWeight: "900" },
});

import { AppModal } from '../../../components/ui/AppModal';
import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import { AppAlert as appDialog } from '../../../components/ui/dialogStore';

import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, AlertTriangle } from 'lucide-react-native';
import { BrandColors, Radius, Spacing, Typography, Shadows } from '../../../constants/theme';
import { useBookingDetail, useCancelBooking } from '../../../hooks/useBooking';
import { formatVnd } from '../../../utils/bookingStatus';
import { getApiError } from '../../../services/api';

const CANCEL_REASONS = [
  'Thay đổi đột xuất',
  'Tìm thấy chuyên viên khác',
  'Vấn đề giá cả',
  'Cá nhân',
  'Khác',
];

export default function CancelBookingScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: booking, isLoading: isFetching } = useBookingDetail(id);
  const { mutate: cancelBooking, isPending } = useCancelBooking();

  const [selectedReason, setSelectedReason] = useState<string>('');
  const [note, setNote] = useState('');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const submitLockRef = useRef(false);

  if (isFetching || !booking) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color={BrandColors.accentPink} />
      </SafeAreaView>
    );
  }

  const submitCancellation = () => {
    if (isPending || submitLockRef.current) return;
    submitLockRef.current = true;
    cancelBooking({
      bookingId: booking.id,
      reason: selectedReason,
      note,
    }, {
      onSuccess: () => {
        setShowConfirmation(false);
        router.replace(`/booking/${booking.id}/cancel-success`);
      },
      onError: (error) => {
        submitLockRef.current = false;
        setShowConfirmation(false);
        const apiError = getApiError(error);
        const isUncertainResult = apiError.isNetworkError || apiError.message.startsWith('Chưa thể xác minh kết quả hủy booking');
        appDialog.alert(
          isUncertainResult ? 'Chưa xác minh được kết quả' : 'Không thể hủy booking',
          apiError.message || 'Vui lòng thử lại sau.',
        );
      }
    });
  };

  const handleCancel = () => {
    if (!selectedReason) {
      appDialog.alert('Chưa chọn lý do', 'Vui lòng chọn lý do hủy.');
      return;
    }

    setShowConfirmation(true);
  };

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.header}>
        <TouchableOpacity style={styles.headerBtn} onPress={() => router.back()}>
          <ArrowLeft size={24} color={BrandColors.textDark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Hủy đơn đặt lịch</Text>
        <View style={styles.headerRight} />
      </SafeAreaView>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.warningBanner}>
          <AlertTriangle size={20} color="#FF9800" />
          <View style={styles.warningTextContainer}>
            <Text style={styles.warningTitle}>Bạn chắc chắn muốn hủy?</Text>
            <Text style={styles.warningDesc}>Đơn đặt lịch của bạn với chuyên gia {booking.mua.name} sẽ bị hủy bỏ.</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Lý do hủy đơn</Text>
        <View style={styles.card}>
          {CANCEL_REASONS.map((reason, index) => {
            const isSelected = selectedReason === reason;
            return (
              <TouchableOpacity
                key={reason}
                style={[styles.radioRow, index === CANCEL_REASONS.length - 1 && { borderBottomWidth: 0 }]}
                onPress={() => setSelectedReason(reason)}
                activeOpacity={0.7}
              >
                <Text style={styles.radioLabel}>{reason}</Text>
                <View style={[styles.radioOuter, isSelected && styles.radioOuterSelected]}>
                  {isSelected && <View style={styles.radioInner} />}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={styles.sectionTitle}>Chi tiết thêm (không bắt buộc)</Text>
        <TextInput
          style={styles.textInput}
          placeholder="Nhập ghi chú thêm..."
          placeholderTextColor={BrandColors.textLight}
          value={note}
          onChangeText={setNote}
          multiline
          textAlignVertical="top"
        />

        <View style={styles.policyBox}>
          <Text style={styles.policyTitle}>Chính sách hủy đơn</Text>
          <Text style={styles.policyText}>• Bạn có thể hủy trước khi dịch vụ bắt đầu.</Text>
          <Text style={styles.policyText}>• Tiền cọc: {formatVnd(booking.depositAmount)}.</Text>
          <Text style={styles.policyText}>• Mức hoàn thực tế được backend xác định theo trạng thái và thời điểm hủy.</Text>
          <Text style={styles.policyText}>• Nếu có khoản hoàn, hệ thống sẽ hiển thị số tiền và trạng thái xử lý sau khi hủy thành công.</Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.secondaryBtn} onPress={() => router.back()}>
          <Text style={styles.secondaryBtnText}>Quay lại</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.primaryBtn, !selectedReason && styles.primaryBtnDisabled]}
          onPress={handleCancel}
          disabled={!selectedReason || isPending}
        >
          {isPending ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.primaryBtnText}>Xác nhận hủy đơn</Text>
          )}
        </TouchableOpacity>
      </View>

      <AppModal visible={showConfirmation} title="Xác nhận hủy booking" variant="destructive"
    description="Bạn có chắc muốn hủy booking này?" loading={isPending} onClose={()=>setShowConfirmation(false)}
    primaryAction={{label:'Xác nhận hủy',onPress:submitCancellation,loading:isPending}}
    secondaryAction={{label:'Quay lại',onPress:()=>setShowConfirmation(false)}}>
      <View style={styles.modalSummary}><Text style={styles.modalSummaryLabel}>Tiền cọc</Text><Text style={styles.modalSummaryValue}>{formatVnd(booking.depositAmount)}</Text></View>
      <Text style={styles.modalHint}>Mức hoàn và số tiền hoàn sẽ được hệ thống xác định theo chính sách tại thời điểm hủy. Khoản hoàn không được đảm bảo về tài khoản ngay lập tức.</Text>
    </AppModal>
    </View>
  );
}

const styles = StyleSheet.create({
container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    backgroundColor: '#FFF',
  },
headerBtn: { padding: Spacing.xs },
headerTitle: {
    fontFamily: Typography.bold,
    fontSize: 16,
    color: BrandColors.textDark,
  },
headerRight: { width: 32 },
scrollContent: {
    padding: Spacing.xl,
    paddingBottom: 100,
  },
warningBanner: {
    flexDirection: 'row',
    backgroundColor: '#FFF3E0',
    padding: Spacing.md,
    borderRadius: Radius.lg,
    alignItems: 'flex-start',
    marginBottom: Spacing.xl,
  },
warningTextContainer: {
    flex: 1,
    marginLeft: Spacing.sm,
  },
warningTitle: {
    fontFamily: Typography.bold,
    fontSize: 15,
    color: '#E65100',
    marginBottom: 4,
  },
warningDesc: {
    fontFamily: Typography.regular,
    fontSize: 13,
    color: '#E65100',
    lineHeight: 18,
  },
sectionTitle: {
    fontFamily: Typography.bold,
    fontSize: 16,
    color: BrandColors.textDark,
    marginBottom: Spacing.sm,
  },
card: {
    backgroundColor: '#FFF',
    borderRadius: Radius.xl,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    ...Shadows.card,
  },
radioRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
radioLabel: {
    fontFamily: Typography.medium,
    fontSize: 15,
    color: BrandColors.textDark,
  },
radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    alignItems: 'center',
    justifyContent: 'center',
  },
radioOuterSelected: {
    borderColor: '#F44336',
  },
radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#F44336',
  },
textInput: {
    backgroundColor: '#FFF',
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    padding: Spacing.md,
    height: 100,
    fontFamily: Typography.regular,
    fontSize: 14,
    color: BrandColors.textDark,
    marginBottom: Spacing.xl,
  },
policyBox: {
    backgroundColor: '#F5F5F5',
    padding: Spacing.md,
    borderRadius: Radius.lg,
  },
policyTitle: {
    fontFamily: Typography.bold,
    fontSize: 14,
    color: BrandColors.textDark,
    marginBottom: 8,
  },
policyText: {
    fontFamily: Typography.regular,
    fontSize: 13,
    color: BrandColors.textSecondary,
    marginBottom: 4,
    lineHeight: 18,
  },
footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFF',
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.lg,
    flexDirection: 'row',
    gap: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
secondaryBtn: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    paddingVertical: 14,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
secondaryBtnText: {
    fontFamily: Typography.bold,
    fontSize: 14,
    color: BrandColors.textDark,
  },
primaryBtn: {
    flex: 1,
    backgroundColor: '#F44336',
    paddingVertical: 14,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
primaryBtnDisabled: {
    backgroundColor: '#FFCDD2',
  },
primaryBtnText: {
    fontFamily: Typography.bold,
    fontSize: 14,
    color: '#FFF',
  },
modalSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: BrandColors.bgPinkLight,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginTop: Spacing.lg,
  },
modalSummaryLabel: { fontFamily: Typography.medium, fontSize: 14, color: BrandColors.textSecondary },
modalSummaryValue: { fontFamily: Typography.bold, fontSize: 16, color: BrandColors.accentPink },
modalHint: {
    fontFamily: Typography.regular,
    fontSize: 13,
    lineHeight: 19,
    color: BrandColors.textSecondary,
    marginTop: Spacing.md,
  }
});

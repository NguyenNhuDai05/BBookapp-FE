import React, { useRef, useState } from 'react';
import { Alert, View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import * as Crypto from 'expo-crypto';
import * as WebBrowser from 'expo-web-browser';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { 
  ArrowLeft, MapPin, Calendar, Clock, Trash2, Plus, Minus, Sparkles,
  QrCode, ArrowRight
} from 'lucide-react-native';
import { BrandColors, Radius, Spacing, Typography } from '../../constants/theme';
import { useBookingStore } from '../../store/useBookingStore';
import { useCreateBooking, usePayBookingDeposit } from '../../hooks/useBooking';
import { useMuaDetail } from '../../hooks/useMuaDetail';
import { DatePickerSheet } from '../../components/booking/DatePickerSheet';
import { TimePickerSheet } from '../../components/booking/TimePickerSheet';
import { AddressPickerSheet } from '../../components/booking/AddressPickerSheet';
import { getApiError } from '../../services/api';

function createLocalBookingDate(date: string, time: string) {
  const [year, month, day] = date.split('-').map(Number);
  const [hour, minute] = time.split(':').map(Number);
  return new Date(year, month - 1, day, hour, minute, 0, 0);
}

function formatDuration(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (!hours) return `${remainingMinutes} phút`;
  if (!remainingMinutes) return `${hours} giờ`;
  return `${hours} giờ ${remainingMinutes} phút`;
}

export default function CheckoutScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { 
    draft, setAddress, setDate, setTime, updateServiceParticipantsCount, removeService
  } = useBookingStore();
  
  const [dateSheetVisible, setDateSheetVisible] = useState(false);
  const [timeSheetVisible, setTimeSheetVisible] = useState(false);
  const [addressSheetVisible, setAddressSheetVisible] = useState(false);
  const checkoutAttemptRef = useRef<{ fingerprint: string; idempotencyKey: string } | null>(null);
  const checkoutInFlightRef = useRef(false);

  const { mutateAsync: createBooking, isPending: isCreating } = useCreateBooking();
  const { mutateAsync: payDeposit, isPending: isPaying } = usePayBookingDeposit();
  const { muaInfo, loading: muaLoading } = useMuaDetail(draft.mua?.id || '');

  // If store is empty, go back
  if (!draft.mua || draft.services.length === 0) {
    return (
      <SafeAreaView style={styles.emptyState}>
        <Text style={styles.errorText}>Chưa có dịch vụ nào được chọn.</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>Quay lại</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const serviceTotal = draft.services.reduce((sum, s) => sum + (s.price * s.participantsCount), 0);
  const travelFee = 0;
  const totalAmount = serviceTotal + travelFee;
  const estimatedDepositAmount = totalAmount * 0.3;
  const estimatedRemainingAmount = totalAmount - estimatedDepositAmount;
  const isPending = isCreating || isPaying;

  const totalDuration = draft.services.reduce((sum, s) => sum + (s.durationMinutes * s.participantsCount), 0);
  const isFormValid = Boolean(draft.address.trim() && draft.date && draft.time && draft.services.length > 0);
  const expectedEndTime = draft.time
    ? new Date(createLocalBookingDate(draft.date || '2000-01-01', draft.time).getTime() + totalDuration * 60_000)
      .toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false })
    : '';

  const handleDateSelect = (date: string) => {
    setDate(date);
    setTime('');
  };

  const handleCheckout = async () => {
    if (checkoutInFlightRef.current) return;
    if (!draft.address.trim() || !draft.date || !draft.time || draft.services.length === 0) {
      Alert.alert('Chưa đủ thông tin', 'Vui lòng chọn địa chỉ, ngày, giờ và ít nhất một dịch vụ.');
      return;
    }

    if (createLocalBookingDate(draft.date, draft.time).getTime() <= Date.now()) {
      Alert.alert('Thời gian không hợp lệ', 'Vui lòng chọn thời gian thực hiện trong tương lai.');
      return;
    }

    let createdBookingId: string | undefined;
    checkoutInFlightRef.current = true;
    try {
      const bookingRequest = {
        muaId: draft.mua!.id,
        services: draft.services.map(s => ({ serviceId: s.id, participantsCount: s.participantsCount })),
        date: draft.date,
        time: draft.time,
        address: draft.address,
        note: draft.note,
        paymentMethod: draft.paymentMethod,
      };
      const fingerprint = JSON.stringify(bookingRequest);
      if (checkoutAttemptRef.current?.fingerprint !== fingerprint) {
        checkoutAttemptRef.current = {
          fingerprint,
          idempotencyKey: Crypto.randomUUID(),
        };
      }

      const booking = await createBooking({
        ...bookingRequest,
        idempotencyKey: checkoutAttemptRef.current.idempotencyKey,
      });
      createdBookingId = booking.id;

      const payment = await payDeposit(booking.id);
      if (!payment.checkoutUrl) {
        throw new Error('payOS không trả về đường dẫn thanh toán.');
      }

      await WebBrowser.openBrowserAsync(payment.checkoutUrl);
      router.push({ pathname: '/checkout/success', params: { bookingId: booking.id } });
    } catch (error: unknown) {
      const apiError = getApiError(error);
      if (apiError.isNetworkError && createdBookingId) {
        Alert.alert(
          'Chưa thể xác nhận trạng thái thanh toán',
          'Booking đã được tạo nhưng kết nối bị gián đoạn. Vui lòng kiểm tra lại trạng thái booking trước khi tạo yêu cầu thanh toán mới.',
          [{ text: 'Kiểm tra booking', onPress: () => router.replace(`/booking/${createdBookingId}`) }],
        );
      } else {
        Alert.alert('Không thể tiếp tục', apiError.message || 'Vui lòng thử lại sau.');
      }
    } finally {
      checkoutInFlightRef.current = false;
    }
  };

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.header}>
        <TouchableOpacity style={styles.headerBtn} onPress={() => router.back()}>
          <ArrowLeft size={24} color={BrandColors.textDark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>Đặt lịch với {draft.mua.name.split(' ')[0]}</Text>
        <View style={styles.headerSpacer} />
      </SafeAreaView>

      <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: 112 + insets.bottom }]} showsVerticalScrollIndicator={false}>
        {/* Professional MUA Info Card */}
        <View style={styles.muaCard}>
          {muaLoading ? (
            <ActivityIndicator color={BrandColors.accentPink} style={{ padding: 20 }} />
          ) : (
            <>
              <Image 
                source={{ uri: muaInfo?.avatar || draft.mua.avatarUrl || 'https://via.placeholder.com/150' }} 
                style={styles.muaAvatar} 
              />
              <View style={styles.muaInfo}>
                <Text style={styles.muaName} numberOfLines={1}>{muaInfo?.name || draft.mua.name}</Text>
                <Text style={styles.muaBrand} numberOfLines={1}>{muaInfo?.specialties?.[0] || 'Chuyên gia trang điểm'}</Text>
                
                <View style={styles.muaStatsRow}>
                  <View style={styles.muaStatBadge}>
                    <Text style={styles.muaStatText}>⭐ {muaInfo?.rating || 5.0} ({muaInfo?.reviewCount || 0})</Text>
                  </View>
                  <View style={styles.muaStatBadge}>
                    <Text style={styles.muaStatText}>💼 {muaInfo?.yearsExperience || 2} năm KN</Text>
                  </View>
                </View>
              </View>
            </>
          )}
        </View>

        <View style={styles.sectionHeading}>
          <MapPin size={20} color={BrandColors.textDark} />
          <Text style={styles.sectionHeadingText}>Địa chỉ thực hiện</Text>
        </View>
        <View style={styles.card}>
          <View style={styles.addressRow}>
            <View style={styles.iconBox}>
              <MapPin size={20} color={BrandColors.accentPink} />
            </View>
            <Text style={[styles.addressText, !draft.address && styles.addressPlaceholder]}>
              {draft.address || 'Chọn địa điểm bạn muốn sử dụng dịch vụ'}
            </Text>
            <TouchableOpacity onPress={() => setAddressSheetVisible(true)} hitSlop={8}>
              <Text style={styles.changeText}>{draft.address ? 'Thay đổi' : 'Chọn'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.sectionHeading}>
          <Calendar size={20} color={BrandColors.textDark} />
          <Text style={styles.sectionHeadingText}>Chọn ngày & giờ</Text>
        </View>
        <View style={styles.dateTimeRow}>
          <TouchableOpacity style={styles.pickerBox} onPress={() => setDateSheetVisible(true)}>
            <View style={styles.pickerHeader}>
              <Calendar size={14} color={BrandColors.accentPink} />
              <Text style={styles.pickerLabel}>Ngày thực hiện</Text>
            </View>
            <Text style={styles.pickerValue}>
              {draft.date 
                ? draft.date.split('-').reverse().join('/') 
                : 'Chọn ngày'} ▾
            </Text>
          </TouchableOpacity>
          
          <View style={styles.pickerSpacer} />
          
          <TouchableOpacity 
            style={styles.pickerBox} 
            onPress={() => setTimeSheetVisible(true)}
            disabled={!draft.date}
          >
            <View style={styles.pickerHeader}>
              <Clock size={14} color={BrandColors.accentPink} />
              <Text style={styles.pickerLabel}>Giờ bắt đầu</Text>
            </View>
            <Text style={[styles.pickerValue, !draft.date && { color: '#BDBDBD' }]}>
              {draft.time || 'Chọn giờ'} ▾
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.durationCard}>
          <View style={styles.durationIcon}><Clock size={18} color={BrandColors.accentPink} /></View>
          <View style={styles.durationCopy}>
            <Text style={styles.durationLabel}>Thời gian dự kiến</Text>
            <Text style={styles.durationValue}>
              {draft.time ? `${draft.time} – ${expectedEndTime} · ` : ''}{formatDuration(totalDuration)}
            </Text>
          </View>
        </View>

        <View style={styles.sectionTitleRow}>
          <View style={styles.sectionHeadingInline}>
            <Sparkles size={20} color={BrandColors.textDark} />
            <Text style={styles.sectionHeadingText}>Dịch vụ đã chọn</Text>
          </View>
          <TouchableOpacity style={styles.addMoreBtn} onPress={() => router.back()}>
            <Text style={styles.addMoreText}>+ Thêm dịch vụ</Text>
          </TouchableOpacity>
        </View>

        {draft.services.map((service) => (
          <View key={service.id} style={styles.serviceCard}>
            <View style={styles.serviceHeader}>
              <Text style={styles.serviceName}>{service.name}</Text>
              <TouchableOpacity onPress={() => removeService(service.id)}>
                <Trash2 size={18} color="#BDBDBD" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.serviceFooter}>
              <View style={styles.serviceMeta}>
                <Text style={styles.servicePrice}>{(service.price || 0).toLocaleString('vi-VN')}đ</Text>
                <View style={styles.serviceDurationRow}>
                  <Clock size={13} color={BrandColors.textSecondary} />
                  <Text style={styles.serviceMetaText}>{service.durationMinutes} phút</Text>
                </View>
              </View>
              
              <View style={styles.quantityControl}>
                <TouchableOpacity 
                  style={styles.qtyBtn}
                  onPress={() => updateServiceParticipantsCount(service.id, service.participantsCount - 1)}
                >
                  <Minus size={16} color={service.participantsCount <= 1 ? BrandColors.borderLight : BrandColors.accentPink} />
                </TouchableOpacity>
                <Text style={styles.qtyText}>{service.participantsCount.toString().padStart(2, '0')}</Text>
                <TouchableOpacity 
                  style={styles.qtyBtn}
                  onPress={() => updateServiceParticipantsCount(service.id, service.participantsCount + 1)}
                >
                  <Plus size={16} color={BrandColors.accentPink} />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ))}

        {/* Payment Summary */}
        <Text style={styles.sectionTitlePlain}>Chi tiết thanh toán</Text>
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Tổng tiền dịch vụ</Text>
            <Text style={styles.summaryValue}>{serviceTotal.toLocaleString('vi-VN')}đ</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.summaryRowTotal}>
            <Text style={styles.totalLabelText}>Tổng thanh toán</Text>
            <Text style={styles.totalValueText}>{totalAmount.toLocaleString('vi-VN')}đ</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.depositSummary}>
            <View style={styles.paymentTimingRow}>
              <View style={styles.paymentTimingCopy}>
                <Text style={styles.paymentTimingEyebrow}>Thanh toán hôm nay</Text>
                <View style={styles.depositLabelRow}>
                  <Text style={styles.paymentTimingLabel}>Đặt cọc</Text>
                  <View style={styles.depositBadge}><Text style={styles.depositBadgeText}>30%</Text></View>
                </View>
              </View>
              <Text style={styles.depositAmount} numberOfLines={1}>{estimatedDepositAmount.toLocaleString('vi-VN')}đ</Text>
            </View>

            <View style={styles.paymentTimingRow}>
              <View style={styles.paymentTimingCopy}>
                <Text style={styles.paymentTimingEyebrow}>Thanh toán sau</Text>
                <Text style={styles.paymentTimingHint}>Sau khi hoàn thành dịch vụ</Text>
              </View>
              <Text style={styles.remainingAmount} numberOfLines={1}>{estimatedRemainingAmount.toLocaleString('vi-VN')}đ</Text>
            </View>

            <Text style={styles.depositHelp}>Bạn chỉ cần thanh toán 30% để giữ lịch.</Text>
          </View>
        </View>

        {/* Payment Method */}
        <Text style={styles.sectionTitlePlain}>Phương thức thanh toán</Text>
        
        <PaymentMethodItem 
          title="Chuyển khoản QR"
          subtitle="Thanh toán an toàn qua payOS"
          icon={<QrCode size={20} color={BrandColors.accentPink} />}
          isSelected
          onSelect={() => undefined}
        />
        <Text style={styles.paymentMethodHelp}>Quét QR bằng ứng dụng ngân hàng của bạn</Text>
      </ScrollView>

      {/* Footer */}
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, Spacing.md) }]}>
        <View style={styles.footerInfo}>
          <Text style={styles.footerLabel}>Cần thanh toán</Text>
          <Text style={styles.footerAmount} numberOfLines={1}>{estimatedDepositAmount.toLocaleString('vi-VN')}đ</Text>
        </View>
        <TouchableOpacity 
          style={[styles.submitBtn, (!isFormValid || isPending) && styles.submitBtnDisabled]}
          onPress={handleCheckout}
          disabled={!isFormValid || isPending}
        >
          {isPending ? (
            <Text style={styles.submitBtnText} numberOfLines={1}>Đang tạo thanh toán...</Text>
          ) : (
            <>
              <Text style={styles.submitBtnText} numberOfLines={1}>Xác nhận và thanh toán</Text>
              <ArrowRight size={16} color="#FFF" />
            </>
          )}
        </TouchableOpacity>
      </View>

      <DatePickerSheet 
        visible={dateSheetVisible} 
        onClose={() => setDateSheetVisible(false)} 
        selectedDate={draft.date}
        onSelectDate={handleDateSelect}
      />
      
      {timeSheetVisible ? (
        <TimePickerSheet
          visible
          onClose={() => setTimeSheetVisible(false)}
          muaId={draft.mua.id}
          date={draft.date}
          durationMinutes={totalDuration}
          selectedTime={draft.time}
          onSelectTime={setTime}
        />
      ) : null}
      {addressSheetVisible ? (
        <AddressPickerSheet
          visible
          value={draft.address}
          onClose={() => setAddressSheetVisible(false)}
          onSelectAddress={setAddress}
        />
      ) : null}
    </View>
  );
}

const PaymentMethodItem = ({ title, subtitle, icon, isSelected, onSelect }: any) => (
  <TouchableOpacity 
    style={[styles.paymentMethodCard, isSelected && styles.paymentMethodCardSelected]} 
    onPress={onSelect}
    activeOpacity={0.8}
  >
    <View style={styles.paymentMethodIcon}>{icon}</View>
    <View style={styles.paymentMethodInfo}>
      <Text style={styles.paymentMethodTitle}>{title}</Text>
      {subtitle && <Text style={styles.paymentMethodSubtitle}>{subtitle}</Text>}
    </View>
    <View style={[styles.radioBtn, isSelected && styles.radioBtnSelected]}>
      {isSelected && <View style={styles.radioBtnInner} />}
    </View>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { fontFamily: Typography.medium, color: BrandColors.textSecondary, marginBottom: Spacing.lg },
  backBtn: { padding: Spacing.md, backgroundColor: BrandColors.bgPinkLight, borderRadius: Radius.md },
  backBtnText: { color: BrandColors.accentPink, fontFamily: Typography.bold },
  
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: Spacing.sm,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: BrandColors.borderDivider,
  },
  headerBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerSpacer: { width: 40, height: 40 },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontFamily: Typography.semiBold,
    fontSize: 20,
    color: BrandColors.textDark,
  },
  
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: Spacing.lg,
  },
  
  muaCard: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderRadius: Radius.xl,
    padding: Spacing.md,
    marginBottom: Spacing.xl,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  muaAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    marginRight: Spacing.md,
    borderWidth: 2,
    borderColor: BrandColors.bgPinkLight,
  },
  muaInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  muaName: {
    fontFamily: Typography.bold,
    fontSize: 17,
    color: BrandColors.textDark,
    marginBottom: 2,
  },
  muaBrand: {
    fontFamily: Typography.medium,
    fontSize: 13,
    color: BrandColors.textSecondary,
    marginBottom: 8,
  },
  muaStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  muaStatBadge: {
    backgroundColor: BrandColors.bgPinkLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  muaStatText: {
    fontFamily: Typography.semiBold,
    fontSize: 11,
    color: BrandColors.accentPink,
  },
  
  sectionTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 28,
    marginBottom: 14,
  },
  sectionHeading: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginTop: 28, marginBottom: 14 },
  sectionHeadingInline: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  sectionHeadingText: { fontFamily: Typography.semiBold, fontSize: 19, color: BrandColors.textDark },
  sectionTitlePlain: {
    fontFamily: Typography.semiBold,
    fontSize: 19,
    color: BrandColors.textDark,
    marginTop: 28,
    marginBottom: 14,
  },
  addMoreBtn: {
    borderWidth: 1,
    borderColor: BrandColors.accentPink,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.full,
  },
  addMoreText: {
    color: BrandColors.accentPink,
    fontFamily: Typography.semiBold,
    fontSize: 12,
  },
  
  card: {
    backgroundColor: '#FFF',
    borderRadius: Radius.base,
    padding: Spacing.base,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: BrandColors.borderLight,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: BrandColors.bgPinkLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  addressText: {
    flex: 1,
    fontFamily: Typography.medium,
    fontSize: 14,
    color: BrandColors.textDark,
    lineHeight: 20,
  },
  addressPlaceholder: { color: BrandColors.textMuted },
  changeText: {
    fontFamily: Typography.semiBold,
    fontSize: 13,
    color: BrandColors.accentPink,
    marginLeft: Spacing.sm,
  },
  
  dateTimeRow: {
    flexDirection: 'row',
    marginBottom: Spacing.sm,
  },
  pickerSpacer: { width: Spacing.sm },
  pickerBox: {
    flex: 1,
    backgroundColor: '#FFF',
    borderRadius: Radius.base,
    padding: Spacing.base,
    borderWidth: 1,
    borderColor: BrandColors.borderLight,
  },
  pickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  pickerLabel: {
    fontFamily: Typography.semiBold,
    fontSize: 11,
    color: BrandColors.textSecondary,
    marginLeft: 6,
  },
  pickerValue: {
    fontFamily: Typography.bold,
    fontSize: 16,
    color: BrandColors.textDark,
  },
  
  durationCard: { flexDirection: 'row', alignItems: 'center', marginTop: Spacing.md, padding: Spacing.md, borderRadius: Radius.base, backgroundColor: BrandColors.bgPinkLight },
  durationIcon: { width: 38, height: 38, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center', backgroundColor: BrandColors.bgCard, marginRight: Spacing.md },
  durationCopy: { flex: 1 },
  durationLabel: { fontFamily: Typography.regular, fontSize: 12, color: BrandColors.textMuted },
  durationValue: { marginTop: 2, fontFamily: Typography.semiBold, fontSize: 14, color: BrandColors.textDark },
  
  serviceCard: {
    backgroundColor: '#FFF',
    borderRadius: Radius.xl,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  serviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  serviceName: {
    fontFamily: Typography.bold,
    fontSize: 15,
    color: BrandColors.textDark,
  },
  serviceFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  serviceMeta: {
    flexDirection: 'column',
    justifyContent: 'center',
  },
  serviceDurationRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  serviceMetaText: {
    fontFamily: Typography.medium,
    fontSize: 12,
    color: BrandColors.textSecondary,
  },
  servicePrice: {
    fontFamily: Typography.bold,
    fontSize: 16,
    color: BrandColors.accentPink,
  },
  quantityControl: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: BrandColors.borderLight,
    borderRadius: 8,
    padding: 2,
  },
  qtyBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF',
    borderRadius: 6,
  },
  qtyText: {
    fontFamily: Typography.bold,
    fontSize: 15,
    color: BrandColors.textDark,
    width: 30,
    textAlign: 'center',
  },
  
  summaryCard: {
    backgroundColor: '#FFF',
    borderRadius: Radius.lg,
    padding: 20,
    borderWidth: 1,
    borderColor: BrandColors.borderDivider,
    shadowColor: BrandColors.textDark,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 0,
  },
  summaryLabel: {
    fontFamily: Typography.regular,
    fontSize: 15,
    color: BrandColors.textSecondary,
  },
  summaryValue: {
    fontFamily: Typography.semiBold,
    fontSize: 15,
    color: BrandColors.textDark,
  },
  divider: {
    height: 1,
    backgroundColor: BrandColors.borderDivider,
    marginVertical: 14,
  },
  summaryRowTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 0,
  },
  totalLabelText: {
    fontFamily: Typography.bold,
    fontSize: 17,
    color: BrandColors.textDark,
  },
  totalValueText: {
    fontFamily: Typography.bold,
    fontSize: 20,
    color: BrandColors.accentPink,
  },
  depositSummary: { gap: 14 },
  paymentTimingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.md },
  paymentTimingCopy: { flex: 1, minWidth: 0 },
  paymentTimingEyebrow: { fontFamily: Typography.medium, fontSize: 12, color: BrandColors.textMuted, marginBottom: 3 },
  depositLabelRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  paymentTimingLabel: { fontFamily: Typography.semiBold, fontSize: 15, color: BrandColors.textDark },
  paymentTimingHint: { fontFamily: Typography.regular, fontSize: 13, color: BrandColors.textSecondary },
  depositBadge: { borderRadius: Radius.full, paddingHorizontal: 8, paddingVertical: 2, backgroundColor: BrandColors.bgPink },
  depositBadgeText: { fontFamily: Typography.bold, fontSize: 11, color: BrandColors.accentPink },
  depositAmount: { flexShrink: 0, fontFamily: Typography.bold, fontSize: 20, color: BrandColors.accentPink },
  remainingAmount: { flexShrink: 0, fontFamily: Typography.bold, fontSize: 17, color: BrandColors.textDark },
  depositHelp: { fontFamily: Typography.regular, fontSize: 12, color: BrandColors.textMuted, lineHeight: 17 },
  
  paymentMethodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    minHeight: 76,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.base,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  paymentMethodCardSelected: {
    borderColor: BrandColors.accentPink,
    backgroundColor: '#FFF',
  },
  paymentMethodIcon: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    backgroundColor: BrandColors.bgPinkLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  paymentMethodInfo: {
    flex: 1,
  },
  paymentMethodTitle: {
    fontFamily: Typography.semiBold,
    fontSize: 16,
    color: BrandColors.textDark,
  },
  paymentMethodSubtitle: {
    fontFamily: Typography.regular,
    fontSize: 12,
    color: BrandColors.textSecondary,
    marginTop: 2,
  },
  radioBtn: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioBtnSelected: {
    borderColor: BrandColors.accentPink,
  },
  radioBtnInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: BrandColors.accentPink,
  },
  paymentMethodHelp: { marginTop: Spacing.sm, fontFamily: Typography.regular, fontSize: 12, color: BrandColors.textMuted },
  
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFF',
    paddingHorizontal: 20,
    paddingTop: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    shadowColor: BrandColors.textDark,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 12,
  },
  footerInfo: {
    flexShrink: 0,
    maxWidth: 108,
  },
  footerLabel: {
    fontFamily: Typography.semiBold,
    fontSize: 12,
    color: BrandColors.textSecondary,
  },
  footerAmount: {
    fontFamily: Typography.bold,
    fontSize: 21,
    color: BrandColors.textDark,
    marginTop: 2,
  },
  submitBtn: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: BrandColors.accentPink,
    minHeight: 50,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderRadius: Radius.base,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginLeft: Spacing.md,
  },
  submitBtnDisabled: { opacity: 0.68 },
  submitBtnText: {
    fontFamily: Typography.bold,
    fontSize: 14,
    color: '#FFF',
  },
});

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { 
  ArrowLeft, MapPin, Calendar, Clock, Info, Trash2, Plus, Minus, 
  Wallet, CreditCard, ShieldCheck, ArrowRight 
} from 'lucide-react-native';
import { BrandColors, Radius, Spacing, Typography, Shadows } from '../../constants/theme';
import { useBookingStore } from '../../store/useBookingStore';
import { useCreateBooking } from '../../hooks/useBooking';
import { useMuaDetail } from '../../hooks/useMuaDetail';
import { DatePickerSheet } from '../../components/booking/DatePickerSheet';
import { TimePickerSheet } from '../../components/booking/TimePickerSheet';

export default function CheckoutScreen() {
  const router = useRouter();
  const { 
    draft, setDate, setTime, updateServiceParticipantsCount, removeService, setPaymentMethod 
  } = useBookingStore();
  
  const [dateSheetVisible, setDateSheetVisible] = useState(false);
  const [timeSheetVisible, setTimeSheetVisible] = useState(false);

  const { mutate: createBooking, isPending } = useCreateBooking();
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
  const travelFee = 50000;
  const totalAmount = serviceTotal + travelFee;
  const depositAmount = totalAmount * 0.3;

  const totalDuration = draft.services.reduce((sum, s) => sum + (s.durationMinutes * s.participantsCount), 0);

  const handleCheckout = () => {
    if (!draft.date || !draft.time) {
      alert('Vui lòng chọn ngày và giờ!');
      return;
    }
    
    createBooking({
      muaId: draft.mua!.id,
      services: draft.services.map(s => ({ serviceId: s.id, participantsCount: s.participantsCount })),
      date: draft.date,
      time: draft.time,
      address: draft.address || '123 Nguyễn Huệ, Bến Nghé, Quận 1',
      note: draft.note,
      paymentMethod: draft.paymentMethod,
    }, {
      onSuccess: () => {
        router.push('/checkout/success');
      },
      onError: (err: any) => {
        const msg = err.response?.data?.message || err.response?.data?.Message || err.message;
        alert('Có lỗi xảy ra: ' + msg);
      }
    });
  };

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.header}>
        <TouchableOpacity style={styles.headerBtn} onPress={() => router.back()}>
          <ArrowLeft size={24} color={BrandColors.textDark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Đặt lịch với {draft.mua.name.split(' ')[0]}</Text>
        <Text style={styles.stepText}>Bước 2/4</Text>
      </SafeAreaView>
      
      {/* Progress Line */}
      <View style={styles.progressLineContainer}>
        <View style={styles.progressLineFill} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
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

        {/* 1. Address */}
        <Text style={styles.sectionTitle}>
          <View style={styles.stepCircle}><Text style={styles.stepCircleText}>1</Text></View>
          Địa chỉ thực hiện
        </Text>
        <View style={styles.card}>
          <View style={styles.addressRow}>
            <View style={styles.iconBox}>
              <MapPin size={20} color={BrandColors.accentPink} />
            </View>
            <Text style={styles.addressText}>
              123 Nguyễn Huệ, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh
            </Text>
            <TouchableOpacity>
              <Text style={styles.changeText}>Thay đổi</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 2. Date & Time */}
        <Text style={styles.sectionTitle}>
          <View style={styles.stepCircle}><Text style={styles.stepCircleText}>2</Text></View>
          Chọn ngày & giờ
        </Text>
        <View style={styles.dateTimeRow}>
          <TouchableOpacity style={styles.pickerBox} onPress={() => setDateSheetVisible(true)}>
            <View style={styles.pickerHeader}>
              <Calendar size={14} color={BrandColors.accentPink} />
              <Text style={styles.pickerLabel}>NGÀY THỰC HIỆN</Text>
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
              <Text style={styles.pickerLabel}>GIỜ BẮT ĐẦU</Text>
            </View>
            <Text style={[styles.pickerValue, !draft.date && { color: '#BDBDBD' }]}>
              {draft.time || 'Chọn giờ'} ▾
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.infoBanner}>
          <Info size={16} color={BrandColors.accentPink} />
          <Text style={styles.infoBannerText}>
            Tổng thời gian dự kiến: {totalDuration > 60 ? `${Math.floor(totalDuration/60)} giờ ` : ''}{totalDuration % 60 !== 0 ? `${totalDuration % 60} phút` : ''} ({totalDuration} phút)
          </Text>
        </View>

        {/* 3. Services */}
        <View style={styles.sectionTitleRow}>
          <Text style={styles.sectionTitle}>
            <View style={styles.stepCircle}><Text style={styles.stepCircleText}>3</Text></View>
            Dịch vụ đã chọn
          </Text>
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
                <Text style={styles.serviceMetaText}>⏱ {service.durationMinutes} phút</Text>
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
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Phí di chuyển <Info size={12} color="#BDBDBD" /></Text>
            <Text style={styles.summaryValue}>{travelFee.toLocaleString('vi-VN')}đ</Text>
          </View>
          
          <View style={styles.divider} />
          
          <View style={styles.summaryRowTotal}>
            <Text style={styles.totalLabelText}>Tổng thanh toán</Text>
            <Text style={styles.totalValueText}>{totalAmount.toLocaleString('vi-VN')}đ</Text>
          </View>
          
          <View style={styles.paymentSplit}>
            <View style={[styles.splitBox, styles.splitBoxActive]}>
              <Text style={styles.splitBoxTitle}>ĐẶT CỌC (30%)</Text>
              <Text style={styles.splitBoxSubtitle}>Thanh toán ngay</Text>
              <Text style={styles.splitBoxAmount}>{depositAmount.toLocaleString('vi-VN')}đ</Text>
            </View>
            <View style={styles.splitBox}>
              <Text style={styles.splitBoxTitleMuted}>THANH TOÁN SAU (70%)</Text>
              <Text style={styles.splitBoxSubtitle}>Sau khi hoàn thành</Text>
              <Text style={styles.splitBoxAmountMuted}>{(totalAmount - depositAmount).toLocaleString('vi-VN')}đ</Text>
            </View>
          </View>
        </View>

        {/* Payment Method */}
        <Text style={styles.sectionTitlePlain}>Phương thức thanh toán</Text>
        
        <PaymentMethodItem 
          title="Ví BeautyBook" 
          subtitle="Số dư: 2.000.000đ"
          icon={<Wallet size={20} color={BrandColors.accentPink} />}
          isSelected={draft.paymentMethod === 'Ví BeautyBook'}
          onSelect={() => setPaymentMethod('Ví BeautyBook')}
        />
        <PaymentMethodItem 
          title="Ví MoMo" 
          icon={<CreditCard size={20} color="#A50064" />}
          isSelected={draft.paymentMethod === 'Ví MoMo'}
          onSelect={() => setPaymentMethod('Ví MoMo')}
        />
        <PaymentMethodItem 
          title="VNPay" 
          icon={<CreditCard size={20} color="#005BAA" />}
          isSelected={draft.paymentMethod === 'VNPay'}
          onSelect={() => setPaymentMethod('VNPay')}
        />
        
        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.footerInfo}>
          <Text style={styles.footerLabel}>ĐẶT CỌC NGAY</Text>
          <Text style={styles.footerAmount}>{depositAmount.toLocaleString('vi-VN')}đ</Text>
        </View>
        <TouchableOpacity 
          style={styles.submitBtn} 
          onPress={handleCheckout}
          disabled={isPending}
        >
          {isPending ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <>
              <Text style={styles.submitBtnText}>Xác nhận và thanh toán</Text>
              <ArrowRight size={16} color="#FFF" />
            </>
          )}
        </TouchableOpacity>
      </View>

      <DatePickerSheet 
        visible={dateSheetVisible} 
        onClose={() => setDateSheetVisible(false)} 
        selectedDate={draft.date}
        onSelectDate={setDate}
      />
      
      <TimePickerSheet 
        visible={timeSheetVisible} 
        onClose={() => setTimeSheetVisible(false)} 
        muaId={draft.mua.id}
        date={draft.date}
        selectedTime={draft.time}
        onSelectTime={setTime}
      />
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
  stepText: {
    fontFamily: Typography.semiBold,
    fontSize: 14,
    color: BrandColors.accentPink,
  },
  progressLineContainer: {
    height: 4,
    backgroundColor: '#F5F5F5',
    width: '100%',
  },
  progressLineFill: {
    height: '100%',
    width: '50%',
    backgroundColor: BrandColors.accentPink,
  },
  
  scrollContent: {
    padding: Spacing.xl,
    paddingBottom: 100,
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
    marginTop: Spacing.lg,
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontFamily: Typography.bold,
    fontSize: 16,
    color: BrandColors.textDark,
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.lg,
    marginBottom: Spacing.md,
  },
  sectionTitlePlain: {
    fontFamily: Typography.bold,
    fontSize: 16,
    color: BrandColors.textDark,
    marginTop: Spacing.xl,
    marginBottom: Spacing.md,
  },
  stepCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: BrandColors.accentPink,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  stepCircleText: {
    color: '#FFF',
    fontSize: 12,
    fontFamily: Typography.bold,
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
    borderRadius: Radius.xl,
    padding: Spacing.md,
    marginBottom: Spacing.md,
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
    borderRadius: Radius.xl,
    padding: Spacing.md,
  },
  pickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  pickerLabel: {
    fontFamily: Typography.semiBold,
    fontSize: 11,
    color: BrandColors.accentPink,
    marginLeft: 6,
    letterSpacing: 0.5,
  },
  pickerValue: {
    fontFamily: Typography.bold,
    fontSize: 16,
    color: BrandColors.textDark,
  },
  
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BrandColors.bgPinkLight,
    padding: Spacing.sm,
    borderRadius: Radius.lg,
  },
  infoBannerText: {
    fontFamily: Typography.medium,
    fontSize: 13,
    color: BrandColors.textDark,
    marginLeft: 8,
  },
  
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
  serviceCat: {
    fontFamily: Typography.regular,
    fontSize: 13,
    color: BrandColors.textSecondary,
    marginTop: 2,
    marginBottom: Spacing.sm,
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
  serviceMetaText: {
    fontFamily: Typography.medium,
    fontSize: 12,
    color: BrandColors.textSecondary,
    marginBottom: 4,
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
    borderRadius: Radius.xl,
    padding: Spacing.lg,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  summaryLabel: {
    fontFamily: Typography.regular,
    fontSize: 14,
    color: BrandColors.textSecondary,
  },
  summaryValue: {
    fontFamily: Typography.semiBold,
    fontSize: 14,
    color: BrandColors.textDark,
  },
  divider: {
    height: 1,
    backgroundColor: '#F5F5F5',
    marginVertical: Spacing.md,
  },
  summaryRowTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  totalLabelText: {
    fontFamily: Typography.bold,
    fontSize: 16,
    color: BrandColors.textDark,
  },
  totalValueText: {
    fontFamily: Typography.bold,
    fontSize: 18,
    color: BrandColors.accentPink,
  },
  paymentSplit: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  splitBox: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: Radius.lg,
    backgroundColor: '#FAFAFA',
  },
  splitBoxActive: {
    backgroundColor: BrandColors.bgPinkLight,
  },
  splitBoxTitle: {
    fontFamily: Typography.bold,
    fontSize: 11,
    color: BrandColors.accentPink,
    marginBottom: 2,
  },
  splitBoxTitleMuted: {
    fontFamily: Typography.bold,
    fontSize: 11,
    color: BrandColors.textSecondary,
    marginBottom: 2,
  },
  splitBoxSubtitle: {
    fontFamily: Typography.regular,
    fontSize: 11,
    color: BrandColors.textSecondary,
    marginBottom: 8,
  },
  splitBoxAmount: {
    fontFamily: Typography.bold,
    fontSize: 15,
    color: BrandColors.accentPink,
  },
  splitBoxAmountMuted: {
    fontFamily: Typography.bold,
    fontSize: 15,
    color: BrandColors.textDark,
  },
  
  paymentMethodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: Spacing.md,
    borderRadius: Radius.xl,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  paymentMethodCardSelected: {
    borderColor: BrandColors.accentPink,
    backgroundColor: BrandColors.bgPinkLight,
  },
  paymentMethodIcon: {
    width: 40,
    height: 40,
    borderRadius: Radius.lg,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  paymentMethodInfo: {
    flex: 1,
  },
  paymentMethodTitle: {
    fontFamily: Typography.bold,
    fontSize: 15,
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
  
  bottomPadding: { height: 40 },
  
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
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  footerInfo: {
    flex: 1,
  },
  footerLabel: {
    fontFamily: Typography.semiBold,
    fontSize: 11,
    color: BrandColors.textSecondary,
    letterSpacing: 0.5,
  },
  footerAmount: {
    fontFamily: Typography.bold,
    fontSize: 20,
    color: BrandColors.textDark,
  },
  submitBtn: {
    flexDirection: 'row',
    backgroundColor: BrandColors.accentPink,
    paddingHorizontal: Spacing.xl,
    paddingVertical: 14,
    borderRadius: Radius.full,
    alignItems: 'center',
    gap: 8,
  },
  submitBtnText: {
    fontFamily: Typography.bold,
    fontSize: 15,
    color: '#FFF',
  },
});

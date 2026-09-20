import React from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View, ActivityIndicator, ScrollView } from 'react-native';
import { X } from 'lucide-react-native';
import { BrandColors, Radius, Spacing, Typography } from '../../constants/theme';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAvailableTimeSlots } from '../../hooks/useBooking';
import { getApiError } from '../../services/api';

interface TimePickerSheetProps {
  visible: boolean;
  onClose: () => void;
  muaId: string;
  date: string;
  durationMinutes: number;
  selectedTime: string;
  onSelectTime: (time: string) => void;
}

export function TimePickerSheet({
  visible, onClose, muaId, date, durationMinutes, selectedTime, onSelectTime
}: TimePickerSheetProps) {
  const { data: timeSlots, error, isLoading, isFetching, isError, refetch } = useAvailableTimeSlots(muaId, date, durationMinutes);
  const [openedAt] = React.useState(() => Date.now());

  const isPastSlot = (time: string) => {
    if (!date) return true;
    const [year, month, day] = date.split('-').map(Number);
    const [hour, minute] = time.split(':').map(Number);
    return new Date(year, month - 1, day, hour, minute, 0, 0).getTime() <= openedAt;
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>Chọn giờ bắt đầu</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={20} color={BrandColors.textDark} />
            </TouchableOpacity>
          </View>
          
          <ScrollView contentContainerStyle={styles.content}>
            {isLoading && (
              <View style={styles.centerBox}>
                <ActivityIndicator size="large" color={BrandColors.accentPink} />
              </View>
            )}

            {isError && (
              <View style={styles.centerBox}>
                <Text style={styles.errorText}>{getApiError(error).message || 'Không thể tải danh sách giờ trống.'}</Text>
                <TouchableOpacity style={styles.retryButton} onPress={() => refetch()} disabled={isFetching}>
                  <Text style={styles.retryText}>{isFetching ? 'Đang thử lại...' : 'Thử lại'}</Text>
                </TouchableOpacity>
              </View>
            )}

            {!isLoading && !isError && timeSlots?.length === 0 && (
              <View style={styles.centerBox}>
                <Text style={styles.emptyText}>Không còn giờ trống phù hợp trong ngày này.</Text>
              </View>
            )}

            {!isLoading && !isFetching && !isError && timeSlots && timeSlots.length > 0 && (
              <View style={styles.grid}>
                {timeSlots.map((slot) => {
                  const isSelected = selectedTime === slot.time;
                  const isDisabled = !slot.available || isPastSlot(slot.time);
                  return (
                    <TouchableOpacity
                      key={slot.time}
                      disabled={isDisabled}
                      style={[
                        styles.timeBox,
                        isSelected && styles.timeBoxSelected,
                        isDisabled && styles.timeBoxDisabled
                      ]}
                      onPress={() => {
                        onSelectTime(slot.time);
                        onClose();
                      }}
                    >
                      <Text style={[
                        styles.timeText,
                        isSelected && styles.timeTextSelected,
                        isDisabled && styles.timeTextDisabled
                      ]}>
                        {slot.time}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </ScrollView>
          <SafeAreaView edges={['bottom']} />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
  },
  sheet: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: Radius.xxl,
    borderTopRightRadius: Radius.xxl,
    paddingTop: Spacing.xl,
    paddingHorizontal: Spacing.xl,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  title: {
    fontFamily: Typography.bold,
    fontSize: 18,
    color: BrandColors.textDark,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    paddingBottom: 40,
  },
  centerBox: {
    padding: Spacing.xl,
    alignItems: 'center',
  },
  errorText: {
    fontFamily: Typography.medium,
    color: BrandColors.accentPink,
  },
  emptyText: {
    fontFamily: Typography.medium,
    color: BrandColors.textMuted,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: Spacing.md,
    borderRadius: Radius.full,
    backgroundColor: BrandColors.accentPink,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  retryText: {
    fontFamily: Typography.semiBold,
    color: '#FFF',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  timeBox: {
    width: '31%',
    paddingVertical: Spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: Radius.lg,
  },
  timeBoxSelected: {
    borderColor: BrandColors.accentPink,
    backgroundColor: BrandColors.bgPinkLight,
  },
  timeBoxDisabled: {
    backgroundColor: '#F5F5F5',
    borderColor: '#F5F5F5',
  },
  timeText: {
    fontFamily: Typography.semiBold,
    fontSize: 15,
    color: BrandColors.textDark,
  },
  timeTextSelected: {
    color: BrandColors.accentPink,
  },
  timeTextDisabled: {
    color: '#BDBDBD',
  },
});

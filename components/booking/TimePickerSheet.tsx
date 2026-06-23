import React from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View, ActivityIndicator, ScrollView } from 'react-native';
import { X } from 'lucide-react-native';
import { BrandColors, Radius, Spacing, Typography } from '../../constants/theme';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAvailableTimeSlots } from '../../hooks/useBooking';

interface TimePickerSheetProps {
  visible: boolean;
  onClose: () => void;
  muaId: string;
  date: string;
  selectedTime: string;
  onSelectTime: (time: string) => void;
}

export function TimePickerSheet({ 
  visible, onClose, muaId, date, selectedTime, onSelectTime 
}: TimePickerSheetProps) {
  const { data: timeSlots, isLoading, isError } = useAvailableTimeSlots(muaId, date);

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
                <Text style={styles.errorText}>Không thể tải danh sách giờ trống.</Text>
              </View>
            )}

            {!isLoading && !isError && timeSlots && (
              <View style={styles.grid}>
                {timeSlots.map((slot) => {
                  const isSelected = selectedTime === slot.time;
                  return (
                    <TouchableOpacity
                      key={slot.time}
                      disabled={!slot.available}
                      style={[
                        styles.timeBox,
                        isSelected && styles.timeBoxSelected,
                        !slot.available && styles.timeBoxDisabled
                      ]}
                      onPress={() => {
                        onSelectTime(slot.time);
                        onClose();
                      }}
                    >
                      <Text style={[
                        styles.timeText,
                        isSelected && styles.timeTextSelected,
                        !slot.available && styles.timeTextDisabled
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
    ...StyleSheet.absoluteFillObject,
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

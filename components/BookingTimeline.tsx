import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Calendar, ClipboardCheck, Briefcase, CheckCircle, XCircle } from 'lucide-react-native';
import { BrandColors, Radius, Spacing, Typography } from '../constants/theme';
import { BookingDto } from '../types/booking';

interface BookingTimelineProps {
  booking: BookingDto;
}

export function BookingTimeline({ booking }: BookingTimelineProps) {
  const isCancelled = booking.status === 'CANCELLED' || booking.status === 'REJECTED';

  // Define steps
  const steps = [
    {
      id: 'booked',
      title: 'Đặt lịch lúc',
      time: booking.createdAt,
      isActive: true, // always true if booking exists
      isCancelled: false,
      icon: Calendar,
    },
    {
      id: 'confirmed',
      title: isCancelled ? (booking.status === 'REJECTED' ? 'Từ chối lúc' : 'Đã hủy lúc') : 'MUA xác nhận lúc',
      time: isCancelled ? (booking.cancelledAt || booking.updatedAt) : booking.confirmedAt,
      isActive: isCancelled || !!booking.confirmedAt || booking.status === 'CONFIRMED' || booking.status === 'IN_PROGRESS' || booking.status === 'WAITING_CUSTOMER' || booking.status === 'COMPLETED',
      isCancelled: isCancelled,
      icon: isCancelled ? XCircle : ClipboardCheck,
    },
  ];

  if (!isCancelled) {
    steps.push({
      id: 'started',
      title: 'Thực hiện lúc',
      time: booking.startedAt,
      isActive: !!booking.startedAt || booking.status === 'IN_PROGRESS' || booking.status === 'WAITING_CUSTOMER' || booking.status === 'COMPLETED',
      isCancelled: false,
      icon: Briefcase,
    });
    steps.push({
      id: 'completed',
      title: 'Hoàn thành lúc',
      time: booking.completedAt,
      isActive: !!booking.completedAt || booking.status === 'COMPLETED',
      isCancelled: false,
      icon: CheckCircle,
    });
  }

  // Find the last active step to show its details by default
  const defaultActiveIndex = Math.max(0, steps.map(s => s.isActive).lastIndexOf(true));
  const [selectedIndex, setSelectedIndex] = useState(defaultActiveIndex);

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '--:-- --/--/----';
    try {
      return new Date(dateStr).toLocaleString('vi-VN');
    } catch {
      return dateStr;
    }
  };

  const selectedStep = steps[selectedIndex];

  return (
    <View style={styles.card}>
      <Text style={styles.sectionTitle}>Trạng thái đơn</Text>
      
      <View style={styles.timelineRow}>
        {steps.map((step, index) => {
          const isLast = index === steps.length - 1;
          const color = step.isCancelled ? '#F44336' : (step.isActive ? BrandColors.accentPink : '#E0E0E0');
          const Icon = step.icon;
          const isSelected = selectedIndex === index;

          return (
            <React.Fragment key={step.id}>
              <TouchableOpacity 
                style={styles.stepContainer} 
                onPress={() => setSelectedIndex(index)}
                activeOpacity={0.7}
              >
                <View style={[styles.iconWrapper, { borderColor: color, backgroundColor: isSelected ? color + '15' : '#FFF' }]}>
                  <Icon size={20} color={color} />
                </View>
              </TouchableOpacity>

              {!isLast && (
                <View style={[styles.timelineLine, { backgroundColor: steps[index + 1]?.isActive || step.isCancelled ? color : '#E0E0E0' }]} />
              )}
            </React.Fragment>
          );
        })}
      </View>

      {/* Details for selected step */}
      <View style={styles.detailsContainer}>
        <Text style={[styles.detailTitle, selectedStep.isCancelled && { color: '#F44336' }]}>
          {selectedStep.title}
        </Text>
        <Text style={styles.detailTime}>
          {selectedStep.isActive && selectedStep.time ? formatDate(selectedStep.time) : 'Chưa có thông tin'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFF',
    borderRadius: Radius.xl,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    shadowColor: '#22152B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 4,
  },
  sectionTitle: {
    fontFamily: Typography.bold,
    fontSize: 16,
    color: BrandColors.textDark,
    marginBottom: Spacing.md,
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  stepContainer: {
    alignItems: 'center',
    zIndex: 2,
  },
  iconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF',
  },
  timelineLine: {
    flex: 1,
    height: 2,
    marginHorizontal: -8,
    zIndex: 1,
  },
  detailsContainer: {
    alignItems: 'center',
    paddingTop: Spacing.xs,
    borderTopWidth: 1,
    borderTopColor: '#F5F5F5',
  },
  detailTitle: {
    fontFamily: Typography.bold,
    fontSize: 13,
    color: BrandColors.textDark,
    marginBottom: 2,
  },
  detailTime: {
    fontFamily: Typography.regular,
    fontSize: 12,
    color: BrandColors.textSecondary,
  },
});

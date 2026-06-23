import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { BrandColors, Radius, Spacing, Typography } from '../../../constants/theme';
import { ServiceDto } from '../../../types/ServiceDto';
import { Edit2, Archive, Trash2, EyeOff } from 'lucide-react-native';

interface ServiceListProps {
  services: ServiceDto[];
  onEdit: (service: ServiceDto) => void;
  onArchive: (id: string) => void;
  onDelete: (id: string) => void;
}

export function ServiceList({ services, onEdit, onArchive, onDelete }: ServiceListProps) {
  if (services.length === 0) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyText}>Chưa có dịch vụ nào.</Text>
        <Text style={styles.emptySubText}>Hãy thêm dịch vụ để bắt đầu nhận lịch đặt từ khách hàng.</Text>
      </View>
    );
  }

  return (
    <View style={styles.list}>
      {services.map((service: any) => (
        <View key={service.id || service.serviceId} style={[styles.card, service.status === 'ARCHIVED' && styles.cardArchived]}>
          <View style={styles.cardHeader}>
            <View style={styles.titleRow}>
              <Text style={styles.name}>{service.name}</Text>
              {!service.visibility && <EyeOff size={16} color={BrandColors.textMuted} style={styles.hiddenIcon} />}
            </View>
            <Text style={styles.price}>{service.price.toLocaleString('vi-VN')}đ</Text>
          </View>
          
          <Text style={styles.desc} numberOfLines={2}>{service.description}</Text>
          
          <View style={styles.meta}>
            <View style={styles.tag}>
              <Text style={styles.tagText}>{service.category}</Text>
            </View>
            <Text style={styles.duration}>{"\u23F1\uFE0F"} {service.durationMinutes} {"ph\u00FAt"}</Text>
            {service.travelAvailable ? (
              <Text style={styles.travel}>{"\uD83D\uDE97"} {"\u0110i t\u1EADn n\u01A1i"}</Text>
            ) : null}
          </View>

          <View style={styles.actions}>
            <TouchableOpacity style={styles.actionBtn} onPress={() => onEdit(service)}>
              <Edit2 size={16} color={BrandColors.textDark} />
              <Text style={styles.actionText}>Sửa</Text>
            </TouchableOpacity>
            {service.status !== 'ARCHIVED' && (
              <TouchableOpacity style={styles.actionBtn} onPress={() => onArchive(service.id || service.serviceId)}>
                <Archive size={16} color={BrandColors.statusPending} />
                <Text style={[styles.actionText, { color: BrandColors.statusPending }]}>Lưu trữ</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.actionBtn} onPress={() => onDelete(service.id || service.serviceId)}>
              <Trash2 size={16} color={BrandColors.statusCancelled} />
              <Text style={[styles.actionText, { color: BrandColors.statusCancelled }]}>Xóa</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: Spacing.md,
  },
  emptyState: {
    padding: Spacing.xl,
    backgroundColor: BrandColors.bgPink,
    borderRadius: Radius.md,
    alignItems: 'center',
    marginTop: Spacing.lg,
  },
  emptyText: {
    fontFamily: Typography.bold,
    fontSize: 16,
    color: BrandColors.accentRose,
    marginBottom: Spacing.sm,
  },
  emptySubText: {
    fontFamily: Typography.regular,
    fontSize: 14,
    color: BrandColors.textMuted,
    textAlign: 'center',
  },
  card: {
    backgroundColor: BrandColors.bgCard,
    padding: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: BrandColors.borderLight,
  },
  cardArchived: {
    opacity: 0.6,
    backgroundColor: '#F9FAFB',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.xs,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingRight: Spacing.sm,
  },
  hiddenIcon: {
    marginLeft: Spacing.xs,
  },
  name: {
    fontFamily: Typography.bold,
    fontSize: 16,
    color: BrandColors.textDark,
  },
  price: {
    fontFamily: Typography.bold,
    fontSize: 16,
    color: BrandColors.accentRose,
  },
  desc: {
    fontFamily: Typography.regular,
    fontSize: 14,
    color: BrandColors.textMuted,
    marginBottom: Spacing.sm,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  tag: {
    backgroundColor: BrandColors.bgPinkSoft,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.sm,
  },
  tagText: {
    fontFamily: Typography.medium,
    fontSize: 12,
    color: BrandColors.textDark,
  },
  duration: {
    fontFamily: Typography.medium,
    fontSize: 13,
    color: BrandColors.textLight,
  },
  travel: {
    fontFamily: Typography.medium,
    fontSize: 13,
    color: BrandColors.statusConfirmed,
  },
  actions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: BrandColors.borderLight,
    paddingTop: Spacing.sm,
    gap: Spacing.md,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    gap: 4,
  },
  actionText: {
    fontFamily: Typography.medium,
    fontSize: 13,
    color: BrandColors.textDark,
  }
});

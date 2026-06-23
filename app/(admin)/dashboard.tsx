import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LogOut, ShieldAlert } from 'lucide-react-native';
import { BrandColors, Spacing, Typography } from '../../constants/theme';
import { useAuthStore } from '../../store/useAuthStore';
import { useRouter } from 'expo-router';

export default function AdminDashboard() {
  const { user, logout } = useAuthStore();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.replace('/(auth)/login');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Xin chào, Admin</Text>
          <Text style={styles.name}>{user?.name}</Text>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <LogOut size={20} color={BrandColors.textMuted} />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={styles.emptyState}>
          <ShieldAlert size={48} color="#FF4C4C" style={{ marginBottom: Spacing.md }} />
          <Text style={styles.emptyTitle}>Admin Portal</Text>
          <Text style={styles.emptySubtitle}>
            Hệ thống quản trị BeautyBook. Quản lý MUA, duyệt hồ sơ, xử lý vi phạm.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: BrandColors.borderLight,
  },
  greeting: {
    fontFamily: Typography.medium,
    color: BrandColors.textMuted,
    fontSize: 14,
  },
  name: {
    fontFamily: Typography.bold,
    color: '#FF4C4C',
    fontSize: 20,
  },
  logoutBtn: {
    padding: Spacing.sm,
  },
  content: {
    flex: 1,
    padding: Spacing.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
    padding: Spacing.xl,
    backgroundColor: '#FFF',
    borderRadius: 16,
    width: '100%',
  },
  emptyTitle: {
    fontFamily: Typography.bold,
    color: BrandColors.textDark,
    fontSize: 18,
    marginBottom: Spacing.xs,
  },
  emptySubtitle: {
    fontFamily: Typography.regular,
    color: BrandColors.textMuted,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});

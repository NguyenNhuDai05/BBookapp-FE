import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Clock, Share2, Sparkles } from 'lucide-react-native';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { GradientButton } from '../components/ui/GradientButton';
import { BrandColors, Radius, Spacing, Shadows } from '../constants/theme';
import { Strings } from '../constants/strings';

export default function PortfolioDetailScreen() {
  const router = useRouter();
  const { id, muaId } = useLocalSearchParams<{ id: string; muaId: string }>();

  // Placeholder data — will be replaced when API exists
  const detail = {
    title: 'Cô Dâu Cổ Điển',
    categoryTag: 'Bridal Makeup',
    description:
      'Phong cách trang điểm cô dâu cổ điển, tôn lên nét đẹp tự nhiên và thanh lịch. Sử dụng tông màu hồng nude, kết hợp kỹ thuật contouring nhẹ nhàng và highlight tinh tế.',
    durationMinutes: 120,
    mainProducts: 'Chanel, Dior, YSL',
    allProducts: 'Kem nền Chanel Ultra Le Teint, Phấn phủ Dior, Son YSL Rouge Pur, Mascara Lancôme',
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Hero Image */}
        <View style={styles.heroContainer}>
          <LinearGradient
            colors={['#2A1B35', BrandColors.accentPinkMedium, BrandColors.accentPink] as const}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroGradient}
          >
            <View style={styles.heroOverlay}>
              <View style={styles.tagBadge}>
                <Text style={styles.tagText}>{detail.categoryTag}</Text>
              </View>
              <Text style={styles.heroTitle}>{detail.title}</Text>
            </View>
          </LinearGradient>

          {/* Nav Overlay */}
          <View style={styles.navOverlay}>
            <TouchableOpacity onPress={() => router.back()} style={styles.navBtn}>
              <ArrowLeft size={20} color={BrandColors.textWhite} />
            </TouchableOpacity>
            <Text style={styles.navTitle}>{Strings.portfolioDetailTitle}</Text>
            <TouchableOpacity style={styles.navBtn}>
              <Share2 size={18} color={BrandColors.textWhite} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.description}>{detail.description}</Text>
        </View>

      </ScrollView>

      {/* Bottom CTA */}
      <View style={styles.bottomBar}>
        <GradientButton
          title={Strings.portfolioBookThis}
          onPress={() => {
            if (muaId) {
              router.push({ pathname: '/mua-detail', params: { id: muaId } });
            } else {
              router.back();
            }
          }}
          style={styles.bottomButton}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: BrandColors.bgPrimary,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  heroContainer: {
    height: 300,
    position: 'relative',
  },
  heroGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'flex-end',
  },
  heroOverlay: {
    padding: Spacing.lg,
  },
  tagBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
    marginBottom: Spacing.sm,
  },
  tagText: {
    color: BrandColors.textWhite,
    fontSize: 12,
    fontWeight: '800',
  },
  heroTitle: {
    color: BrandColors.textWhite,
    fontSize: 28,
    fontWeight: '900',
    lineHeight: 34,
  },
  navOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.sm,
  },
  navBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navTitle: {
    color: BrandColors.textWhite,
    fontSize: 16,
    fontWeight: '800',
  },
  section: {
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
  },
  description: {
    fontSize: 14,
    fontWeight: '600',
    color: BrandColors.textBody,
    lineHeight: 22,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: BrandColors.textDark,
    marginBottom: Spacing.md,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: BrandColors.bgCard,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: 34,
    borderTopWidth: 1,
    borderTopColor: BrandColors.borderLight,
    ...Shadows.elevated,
  },
  bottomButton: {
    width: '100%',
  },
});

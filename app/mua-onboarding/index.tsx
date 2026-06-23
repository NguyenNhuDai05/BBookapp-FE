import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Dimensions, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { ArrowLeft, Sparkles, TrendingUp, CalendarDays, ShieldCheck } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');

export default function MuaPitchPage() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        bounces={false}
      >
        {/* Premium Hero Section */}
        <View style={styles.heroContainer}>
          <Image 
            source={{ uri: 'https://images.unsplash.com/photo-1516975080661-412140c94297?q=80&w=1000' }} 
            style={styles.heroImage} 
            contentFit="cover" 
          />
          <LinearGradient
            colors={['rgba(0,0,0,0.4)', 'rgba(0,0,0,0.1)', '#121212']}
            locations={[0, 0.4, 1]}
            style={styles.heroGradient}
          />
          
          {/* Back Button */}
          <View style={[styles.backButtonContainer, { top: Math.max(insets.top, 20) }]}>
            <TouchableOpacity 
              onPress={() => router.back()}
              style={styles.backButton}
            >
              <ArrowLeft size={22} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* Hero Content */}
          <View style={styles.heroContent}>
            <View style={styles.badge}>
              <Sparkles size={14} color="#FFD166" />
              <Text style={styles.badgeText}>FOR PROFESSIONALS</Text>
            </View>
            <Text style={styles.heroTitle}>
              Elevate Your Beauty Business
            </Text>
            <Text style={styles.heroSubtitle}>
              Join Vietnam's premium beauty marketplace. Manage bookings, grow your clientele, and build your digital portfolio.
            </Text>
          </View>
        </View>

        {/* Value Proposition Grid */}
        <View style={styles.featuresContainer}>
          <Text style={styles.featuresTitle}>Why Partner With Us?</Text>
          
          <View style={styles.grid}>
            <FeatureCard 
              icon={<TrendingUp size={24} color="#E11D48" />}
              title="Grow Revenue"
              description="Reach thousands of high-intent clients looking for your style."
            />
            <FeatureCard 
              icon={<CalendarDays size={24} color="#E11D48" />}
              title="Flexible Hours"
              description="You are the boss. Set your own schedule and pricing."
            />
            <FeatureCard 
              icon={<Sparkles size={24} color="#E11D48" />}
              title="Premium Tools"
              description="A beautiful digital portfolio that showcases your artistry."
            />
            <FeatureCard 
              icon={<ShieldCheck size={24} color="#E11D48" />}
              title="Secure Payouts"
              description="Guaranteed payments straight to your bank account."
            />
          </View>
        </View>
      </ScrollView>

      {/* Floating CTA */}
      <LinearGradient
        colors={['rgba(18,18,18,0)', 'rgba(18,18,18,0.9)', '#121212']}
        style={[styles.floatingCtaContainer, { paddingBottom: Math.max(insets.bottom, 24) }]}
      >
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => router.push('/mua-onboarding/apply')}
          style={styles.primaryButton}
        >
          <Text style={styles.primaryButtonText}>Get Started Now</Text>
        </TouchableOpacity>
      </LinearGradient>
    </View>
  );
}

const FeatureCard = ({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) => (
  <View style={styles.featureCard}>
    <View style={styles.iconContainer}>
      {icon}
    </View>
    <Text style={styles.featureTitle}>{title}</Text>
    <Text style={styles.featureDescription}>{description}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  scrollContent: {
    paddingBottom: 120,
  },
  heroContainer: {
    width: width,
    height: height * 0.65,
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroGradient: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  backButtonContainer: {
    position: 'absolute',
    width: '100%',
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  heroContent: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1,
    marginLeft: 6,
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 42,
    fontWeight: 'bold',
    lineHeight: 46,
    marginBottom: 16,
  },
  heroSubtitle: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '500',
  },
  featuresContainer: {
    paddingHorizontal: 24,
    paddingTop: 24,
    backgroundColor: '#121212',
  },
  featuresTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 24,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  featureCard: {
    width: '48%',
    backgroundColor: '#1E1E1E',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(225, 29, 72, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  featureTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  featureDescription: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 13,
    lineHeight: 20,
  },
  floatingCtaContainer: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    paddingHorizontal: 24,
    paddingTop: 40,
  },
  primaryButton: {
    width: '100%',
    backgroundColor: '#E11D48',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#E11D48',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
});

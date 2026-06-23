import React, { useState } from 'react';
import { 
  View, Text, ScrollView, TouchableOpacity, Alert, 
  KeyboardAvoidingView, Platform, TextInput, ActivityIndicator, StyleSheet
} from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, CheckCircle2 } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useSubmitApplication } from '../../hooks/useMuaOnboarding';
import { useAuthStore } from '../../store/useAuthStore';
import type { MuaApplicationRequestDto } from '../../types/onboarding';

export default function MuaApplyScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  const submitApplication = useSubmitApplication();

  const [form, setForm] = useState<MuaApplicationRequestDto>({
    displayName: user?.name || '',
    phoneNumber: '',
    city: '',
    bio: '',
    experienceYears: undefined,
    specialization: '',
    socialLinks: '',
  });

  const [errors, setErrors] = useState<Partial<Record<keyof MuaApplicationRequestDto, string>>>({});

  const handleUpdate = (field: keyof MuaApplicationRequestDto, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const validate = () => {
    const newErrors: Partial<Record<keyof MuaApplicationRequestDto, string>> = {};
    if (!form.displayName.trim()) newErrors.displayName = 'This field is required';
    if (!form.city.trim()) newErrors.city = 'This field is required';
    if (!form.bio.trim()) newErrors.bio = 'This field is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) {
      return;
    }

    const payload = {
      ...form,
      experienceYears: form.experienceYears ? parseInt(form.experienceYears.toString(), 10) : undefined
    };

    submitApplication.mutate(payload, {
      onSuccess: () => {
        router.replace('/(mua)/dashboard');
      },
      onError: (error: any) => {
        Alert.alert(
          'Application Failed', 
          error?.response?.data?.Message || error.message || 'Something went wrong.'
        );
      }
    });
  };

  const InputField = ({ 
    label, value, field, placeholder, multiline = false, keyboardType = 'default', optional = false 
  }: { 
    label: string, value: string | undefined, field: keyof MuaApplicationRequestDto, 
    placeholder: string, multiline?: boolean, keyboardType?: any, optional?: boolean 
  }) => (
    <View style={styles.inputContainer}>
      <View style={styles.inputHeader}>
        <Text style={styles.inputLabel}>{label}</Text>
        {optional && <Text style={styles.optionalText}>Optional</Text>}
      </View>
      <View style={[styles.inputWrapper, errors[field] && styles.inputWrapperError]}>
        <TextInput
          style={[styles.textInput, multiline && styles.textInputMultiline]}
          placeholder={placeholder}
          placeholderTextColor="#666666"
          value={value ? value.toString() : ''}
          onChangeText={(text) => handleUpdate(field, text)}
          multiline={multiline}
          keyboardType={keyboardType}
          selectionColor="#E11D48"
        />
      </View>
      {errors[field] && <Text style={styles.errorText}>{errors[field]}</Text>}
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 20) }]}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={20} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Application Form</Text>
        </View>
      </View>

      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Info Banner */}
          <View style={styles.banner}>
            <CheckCircle2 size={20} color="#E11D48" style={styles.bannerIcon} />
            <Text style={styles.bannerText}>
              Fill in your professional details. Your profile will be created as a <Text style={styles.boldText}>Draft</Text> for you to review before publishing.
            </Text>
          </View>

          {/* Form Sections */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Personal Details</Text>
            
            <InputField 
              label="Business/Display Name" 
              field="displayName" 
              value={form.displayName} 
              placeholder="e.g. Nguyen Thao Makeup" 
            />

            <InputField 
              label="City" 
              field="city" 
              value={form.city} 
              placeholder="e.g. Ho Chi Minh" 
            />

            <InputField 
              label="Phone Number" 
              field="phoneNumber" 
              value={form.phoneNumber || ''} 
              placeholder="e.g. 0901234567" 
              keyboardType="phone-pad"
              optional
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Professional Info</Text>

            <InputField 
              label="Years of Experience" 
              field="experienceYears" 
              value={form.experienceYears ? form.experienceYears.toString() : ''} 
              placeholder="e.g. 3" 
              keyboardType="number-pad"
              optional
            />

            <InputField 
              label="Specialization" 
              field="specialization" 
              value={form.specialization || ''} 
              placeholder="e.g. Bridal, Editorial, Party" 
              optional
            />

            <InputField 
              label="Professional Bio" 
              field="bio" 
              value={form.bio} 
              placeholder="Tell clients about your unique style and background..." 
              multiline
            />

            <InputField 
              label="Social Portfolio" 
              field="socialLinks" 
              value={form.socialLinks || ''} 
              placeholder="Instagram/Facebook link" 
              optional
            />
          </View>

        </ScrollView>
      </KeyboardAvoidingView>

      {/* Floating CTA */}
      <LinearGradient
        colors={['rgba(18,18,18,0)', 'rgba(18,18,18,0.9)', '#121212']}
        style={[styles.floatingCtaContainer, { paddingBottom: Math.max(insets.bottom, 24) }]}
      >
        <TouchableOpacity
          activeOpacity={0.9}
          disabled={submitApplication.isPending}
          onPress={handleSubmit}
          style={[styles.primaryButton, submitApplication.isPending && styles.primaryButtonDisabled]}
        >
          {submitApplication.isPending ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.primaryButtonText}>Submit Application</Text>
          )}
        </TouchableOpacity>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2A',
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: '#1E1E1E',
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
    marginRight: 40, // offset for back button
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 120,
  },
  banner: {
    backgroundColor: 'rgba(225, 29, 72, 0.1)',
    padding: 16,
    borderRadius: 16,
    marginBottom: 32,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: 'rgba(225, 29, 72, 0.2)',
  },
  bannerIcon: {
    marginTop: 2,
    marginRight: 12,
  },
  bannerText: {
    flex: 1,
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    lineHeight: 20,
  },
  boldText: {
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 24,
  },
  divider: {
    height: 1,
    width: '100%',
    backgroundColor: '#2A2A2A',
    marginBottom: 32,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  inputLabel: {
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '500',
    fontSize: 14,
  },
  optionalText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 12,
    fontWeight: '500',
  },
  inputWrapper: {
    width: '100%',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#2A2A2A',
    backgroundColor: '#1E1E1E',
    overflow: 'hidden',
  },
  inputWrapperError: {
    borderColor: 'rgba(239, 68, 68, 0.5)',
    backgroundColor: 'rgba(239, 68, 68, 0.05)',
  },
  textInput: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '500',
  },
  textInputMultiline: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  errorText: {
    color: '#F87171',
    fontSize: 12,
    marginTop: 6,
    marginLeft: 4,
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
    borderRadius: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E11D48',
    shadowColor: '#E11D48',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  primaryButtonDisabled: {
    backgroundColor: 'rgba(225, 29, 72, 0.5)',
    shadowOpacity: 0,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
});

import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useRef, useState, useEffect } from 'react';
import {
  ActivityIndicator,
  Animated,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { showAlert } from '../services/alert';
import { providerAPI } from '../services/api';
import { ProviderProfile } from '../types';
import { FadeInView } from '../components/FadeInView';
import { AnimatedButton } from '../components/AnimatedButton';

export default function CompleteProviderProfileScreen() {
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const [companyName, setCompanyName] = useState('');
  const [companyDescription, setCompanyDescription] = useState(''); // Stores organization size
  const [location, setLocation] = useState(''); // Stores headquarters country
  const [saving, setSaving] = useState(false);
  const [activeInput, setActiveInput] = useState<string | null>(null);

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  }, [fadeAnim]);

  const handleSave = async () => {
    if (!companyName.trim()) {
      showAlert('Required', 'Please enter your organization name.');
      return;
    }
    setSaving(true);
    try {
      const profileData: ProviderProfile = {
        companyName: companyName.trim(),
        companyDescription: companyDescription.trim() ? `Size: ${companyDescription.trim()} workers` : '',
        location: location.trim(),
        phoneNumber: '+919876543210', // Pass a default phone number behind the scenes
      };
      await providerAPI.saveProfile(profileData);
      showAlert('Success!', 'Your organization details have been saved.');
      router.replace('/(provider)/my-jobs' as any);
    } catch (error: any) {
      const msg =
        error.response?.data?.error?.message ||
        error.response?.data?.message ||
        'Failed to save organization details.';
      showAlert('Error', msg);
    } finally {
      setSaving(false);
    }
  };

  const isFormValid = companyName.trim().length > 0;

  return (
    <SafeAreaView style={styles.screen}>
      {/* Top Header Row matching OTP/organization details screens */}
      <View style={styles.topHeader}>
        <Text style={styles.logoText}>jobspot.</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity>
            <Text style={styles.headerRightText}>Help</Text>
          </TouchableOpacity>
          <View style={styles.headerDivider} />
          <TouchableOpacity onPress={() => router.replace('/login' as any)}>
            <Text style={styles.headerRightText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          bounces={false}
        >
          <FadeInView delay={50} style={{ flex: 1 }}>
            {/* Back Button */}
            <AnimatedButton style={styles.backBtn} onPress={() => router.replace('/login' as any)}>
              <Ionicons name="arrow-back" size={20} color="#111827" />
              <Text style={styles.backBtnText}>Back</Text>
            </AnimatedButton>

            <Text style={styles.screenTitle}>Your organization details</Text>
            <Text style={styles.subtitle}>
              Please provide your Organization information accurately, it will be used in all your communications
              on the platform.
            </Text>

            {/* Form Fields */}
            <View style={styles.formSection}>
              {/* Organization Name */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Organization name</Text>
                <View
                  style={[
                    styles.inputContainer,
                    activeInput === 'companyName' && styles.inputFocused,
                  ]}
                >
                  <TextInput
                    style={styles.textInput}
                    placeholder="Organization name"
                    placeholderTextColor="#9CA3AF"
                    value={companyName}
                    onChangeText={setCompanyName}
                    onFocus={() => setActiveInput('companyName')}
                    onBlur={() => setActiveInput(null)}
                  />
                </View>
              </View>

              {/* Organization Size */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Organization size</Text>
                <View
                  style={[
                    styles.inputContainer,
                    activeInput === 'companyDescription' && styles.inputFocused,
                  ]}
                >
                  <TextInput
                    style={styles.textInput}
                    placeholder="Organization size"
                    placeholderTextColor="#9CA3AF"
                    value={companyDescription}
                    onChangeText={setCompanyDescription}
                    onFocus={() => setActiveInput('companyDescription')}
                    onBlur={() => setActiveInput(null)}
                    keyboardType="numeric"
                  />
                </View>
                <Text style={styles.fieldHint}>Approximate number of workers</Text>
              </View>

              {/* Headquarters Country */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Headquarters country</Text>
                <View
                  style={[
                    styles.inputContainer,
                    activeInput === 'location' && styles.inputFocused,
                  ]}
                >
                  <TextInput
                    style={styles.textInput}
                    placeholder="Headquarters country"
                    placeholderTextColor="#9CA3AF"
                    value={location}
                    onChangeText={setLocation}
                    onFocus={() => setActiveInput('location')}
                    onBlur={() => setActiveInput(null)}
                  />
                  <Ionicons name="chevron-down" size={18} color="#6B7280" />
                </View>
              </View>

              {/* Save/Next Button */}
              <AnimatedButton
                style={[
                  styles.nextBtn,
                  !isFormValid && styles.nextBtnDisabled,
                ]}
                onPress={handleSave}
                disabled={!isFormValid || saving}
              >
                {saving ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={[styles.nextBtnText, !isFormValid && styles.nextBtnTextDisabled]}>Next</Text>
                )}
              </AnimatedButton>
            </View>
          </FadeInView>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    backgroundColor: '#FFFFFF',
  },
  logoText: {
    fontSize: 24,
    fontWeight: '900',
    color: '#111827',
    letterSpacing: -1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerRightText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4B5563',
  },
  headerDivider: {
    width: 1,
    height: 14,
    backgroundColor: '#D1D5DB',
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 40,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginBottom: 24,
    gap: 6,
  },
  backBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  screenTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#111827',
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
    marginBottom: 32,
  },
  formSection: {
    marginBottom: 16,
  },
  fieldGroup: {
    marginBottom: 22,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    height: 52,
    paddingHorizontal: 16,
  },
  inputFocused: {
    borderColor: '#111827',
    borderWidth: 1.5,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    color: '#111827',
    height: '100%',
  },
  fieldHint: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 6,
  },
  nextBtn: {
    backgroundColor: '#111827', // Black background matches next buttons
    borderRadius: 8,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  nextBtnDisabled: {
    backgroundColor: '#F3F4F6',
  },
  nextBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  nextBtnTextDisabled: {
    color: '#9CA3AF',
  },
});

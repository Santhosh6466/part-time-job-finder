import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
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
import { PROFESSIONAL_THEME as theme } from '../constants/theme';
import { showAlert } from '../services/alert';
import { seekerAPI } from '../services/api';
import { SeekerProfile } from '../types';
import { FadeInView } from '../components/FadeInView';
import { AnimatedButton } from '../components/AnimatedButton';

export default function CompleteSeekerProfileScreen() {
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const [fullName, setFullName] = useState('');
  const [skills, setSkills] = useState('');
  const [experience, setExperience] = useState('');
  const [location, setLocation] = useState('');
  const [bio, setBio] = useState('');
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);
  const [activeInput, setActiveInput] = useState<string | null>(null);

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  }, [fadeAnim]);

  const handleSave = async () => {
    if (!fullName.trim()) {
      showAlert('Required', 'Please enter your full name.');
      return;
    }
    if (!skills.trim()) {
      showAlert('Required', 'Please add at least one skill.');
      return;
    }
    setSaving(true);
    try {
      const profileData: SeekerProfile = {
        fullName: fullName.trim(),
        skills: skills
          .split(',')
          .map((skill) => skill.trim())
          .filter((skill) => skill.length > 0),
        experience: experience.trim(),
        location: location.trim(),
        bio: bio.trim(),
        phoneNumber: phone.trim(),
      };
      await seekerAPI.saveProfile(profileData);
      showAlert('Welcome!', 'Your profile has been created successfully.');
      router.replace('/(tabs)/home' as any);
    } catch (error: any) {
      const msg =
        error.response?.data?.error?.message ||
        error.response?.data?.message ||
        'Failed to save profile.';
      showAlert('Error', msg);
    } finally {
      setSaving(false);
    }
  };

  const isFormValid = fullName.trim().length > 0 && skills.trim().length > 0;

  return (
    <SafeAreaView style={styles.screen}>
      {/* Top Header Row matching provider details / OTP screens */}
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

            <Text style={styles.screenTitle}>Your profile details</Text>
            <Text style={styles.subtitle}>
              Please complete your details accurately to help employers find your skills.
            </Text>

            {/* Form Fields Section */}
            <View style={styles.formSection}>
              {/* Full Name */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Full name</Text>
                <View
                  style={[
                    styles.inputContainer,
                    activeInput === 'fullName' && styles.inputFocused,
                  ]}
                >
                  <TextInput
                    style={styles.textInput}
                    placeholder="Full name"
                    placeholderTextColor="#9CA3AF"
                    value={fullName}
                    onChangeText={setFullName}
                    onFocus={() => setActiveInput('fullName')}
                    onBlur={() => setActiveInput(null)}
                  />
                </View>
              </View>

              {/* Skills */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Skills</Text>
                <View
                  style={[
                    styles.inputContainer,
                    activeInput === 'skills' && styles.inputFocused,
                  ]}
                >
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g. React Native, Node.js"
                    placeholderTextColor="#9CA3AF"
                    value={skills}
                    onChangeText={setSkills}
                    onFocus={() => setActiveInput('skills')}
                    onBlur={() => setActiveInput(null)}
                  />
                </View>
                <Text style={styles.fieldHint}>Separate multiple skills with commas</Text>
              </View>

              {/* Experience */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Experience</Text>
                <View
                  style={[
                    styles.inputContainer,
                    activeInput === 'experience' && styles.inputFocused,
                  ]}
                >
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g. 3 years in mobile development"
                    placeholderTextColor="#9CA3AF"
                    value={experience}
                    onChangeText={setExperience}
                    onFocus={() => setActiveInput('experience')}
                    onBlur={() => setActiveInput(null)}
                  />
                </View>
              </View>

              {/* Location */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Location</Text>
                <View
                  style={[
                    styles.inputContainer,
                    activeInput === 'location' && styles.inputFocused,
                  ]}
                >
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g. Hyderabad, India"
                    placeholderTextColor="#9CA3AF"
                    value={location}
                    onChangeText={setLocation}
                    onFocus={() => setActiveInput('location')}
                    onBlur={() => setActiveInput(null)}
                  />
                </View>
              </View>

              {/* Bio */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Bio</Text>
                <View
                  style={[
                    styles.inputContainer,
                    styles.textAreaContainer,
                    activeInput === 'bio' && styles.inputFocused,
                  ]}
                >
                  <TextInput
                    style={[styles.textInput, styles.textArea]}
                    placeholder="Tell employers about yourself..."
                    placeholderTextColor="#9CA3AF"
                    value={bio}
                    onChangeText={setBio}
                    onFocus={() => setActiveInput('bio')}
                    onBlur={() => setActiveInput(null)}
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                  />
                </View>
              </View>

              {/* Phone Number */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Phone number</Text>
                <View
                  style={[
                    styles.inputContainer,
                    activeInput === 'phone' && styles.inputFocused,
                  ]}
                >
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g. +91 9876543210"
                    placeholderTextColor="#9CA3AF"
                    value={phone}
                    onChangeText={setPhone}
                    onFocus={() => setActiveInput('phone')}
                    onBlur={() => setActiveInput(null)}
                    keyboardType="phone-pad"
                  />
                </View>
              </View>

              {/* Next/Save Button */}
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
  textAreaContainer: {
    height: 110,
    paddingVertical: 10,
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
  textArea: {
    textAlignVertical: 'top',
  },
  fieldHint: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 6,
  },
  nextBtn: {
    backgroundColor: '#111827',
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

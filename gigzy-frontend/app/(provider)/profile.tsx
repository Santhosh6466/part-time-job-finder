import { Ionicons } from '@expo/vector-icons';
import * as themeConst from '../../constants/theme';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { showAlert, showConfirm } from '../../services/alert';
import { getToken, providerAPI, removeToken, decodeJWT } from '../../services/api';
import { ProviderProfile } from '../../types';
import { FadeInView } from '../../components/FadeInView';
import { AnimatedButton } from '../../components/AnimatedButton';


// ── Section Card (same pattern as seeker profile) ───────────────────────────
const SectionCard = ({ title, iconName, isEmpty, children, onAdd }: any) => {
  const { colors, isDarkMode } = useTheme();
  const theme = { ...themeConst.PROFESSIONAL_THEME, colors };
  const styles = getStyles(theme, isDarkMode);
  return (
    <View style={styles.sectionCard}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleRow}>
          <Ionicons name={iconName} size={20} color={colors.primary} />
          <Text style={styles.sectionTitle}>{title}</Text>
        </View>
        {isEmpty && (
          <TouchableOpacity style={styles.sectionActionBtn} onPress={onAdd}>
            <Ionicons name="add" size={18} color={colors.primary} />
          </TouchableOpacity>
        )}
      </View>
      {!isEmpty && <View style={styles.sectionContent}>{children}</View>}
    </View>
  );
};

export default function ProviderProfileScreen() {
  const router = useRouter();
  const { colors, isDarkMode } = useTheme();
  const theme = { ...themeConst.PROFESSIONAL_THEME, colors };
  const styles = getStyles(theme, isDarkMode);
  const [email, setEmail] = useState('');
  const [profileLoading, setProfileLoading] = useState(true);

  // Display state
  const [companyName, setCompanyName] = useState('');
  const [companyDescription, setCompanyDescription] = useState('');
  const [location, setLocation] = useState('');
  const [phone, setPhone] = useState('');

  // Edit modal state
  const [isEditing, setIsEditing] = useState(false);
  const [editCompanyName, setEditCompanyName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [saving, setSaving] = useState(false);
  const [activeInput, setActiveInput] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Profile image state
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);
  const [pendingImageAsset, setPendingImageAsset] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [imageDeleting, setImageDeleting] = useState(false);
  const [imageModalVisible, setImageModalVisible] = useState(false);

  const displayImageUri = pendingImageAsset ? pendingImageAsset.uri : profileImageUrl;

  const loadProviderProfile = async () => {
    try {
      const response = await providerAPI.getProfile();
      const data = response.data?.data || response.data;
      if (data) {
        setCompanyName((data as any).companyName || '');
        setCompanyDescription((data as any).companyDescription || '');
        setLocation((data as any).location || '');
        setPhone((data as any).phoneNumber || '');
        setProfileImageUrl((data as any).profileImageUrl || null);
      }
    } catch (error: any) {
      if (error.response?.status !== 404) {
        console.log('❌ Fetch provider profile error:', error?.message);
      }
    }
  };

  useEffect(() => {
    (async () => {
      const token = await getToken();
      if (token) {
        const payload = decodeJWT(token);
        if (payload) setEmail(payload.sub || payload.email || '');
      }

      await loadProviderProfile();
      setProfileLoading(false);
    })();
  }, []);

  const openEditModal = () => {
    setEditCompanyName(companyName);
    setEditDescription(companyDescription);
    setEditLocation(location);
    setEditPhone(phone);
    setStatusMessage(null);
    setIsEditing(true);
  };

  const closeEditModal = () => {
    setPendingImageAsset(null);
    setIsEditing(false);
  };

  const handleSaveProfile = async () => {
    setStatusMessage(null);
    if (!editCompanyName.trim()) {
      setStatusMessage({ type: 'error', text: 'Company Name is required.' });
      return;
    }
    setSaving(true);
    try {
      const profileData: ProviderProfile = {
        companyName: editCompanyName.trim(),
        companyDescription: editDescription.trim(),
        location: editLocation.trim(),
        phoneNumber: editPhone.trim(),
      };
      
      if (pendingImageAsset) {
        const formData = new FormData();
        formData.append('profile', JSON.stringify(profileData));
        formData.append('image', {
          uri: pendingImageAsset.uri,
          name: pendingImageAsset.fileName || 'profile.jpg',
          type: pendingImageAsset.mimeType || 'image/jpeg',
        } as any);
        await providerAPI.saveProfile(formData);
        setPendingImageAsset(null);
      } else {
        await providerAPI.saveProfile(profileData);
      }

      await loadProviderProfile();
      setIsEditing(false);
      setStatusMessage({ type: 'success', text: 'Profile saved successfully!' });
    } catch (error: any) {
      const msg =
        error.response?.data?.error?.message ||
        error.response?.data?.message ||
        'Failed to save profile.';
      setStatusMessage({ type: 'error', text: msg });
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    showConfirm(
      'Log Out',
      'Are you sure you want to log out?',
      async () => {
        await removeToken();
        router.replace('/login' as any);
      },
      'Log Out'
    );
  };

  // ── Profile image handlers ─────────────────────────────────────────────────

  const storeImageAsset = (asset: ImagePicker.ImagePickerAsset) => {
    setPendingImageAsset(asset);
    if (!isEditing) {
      openEditModal();
    }
  };

  const launchGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      showAlert('Permission Required', 'Please allow access to your photo library.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets?.length > 0) {
      storeImageAsset(result.assets[0]);
    }
  };

  const launchCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      showAlert('Permission Required', 'Please allow camera access to take a profile photo.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets?.length > 0) {
      storeImageAsset(result.assets[0]);
    }
  };

  const handlePickImage = () => {
    if (saving || imageDeleting) return;

    // Web: camera not supported via ImagePicker — show options modal (upload or remove)
    if (Platform.OS === 'web') {
      setImageModalVisible(true);
      return;
    }

    // Native: show action sheet
    // Include "Remove Photo" only when a photo exists on the server (not a pending local preview)
    const buttons: any[] = [
      { text: 'Take Photo', onPress: launchCamera },
      { text: 'Choose from Gallery', onPress: launchGallery },
    ];
    if (profileImageUrl && !pendingImageAsset) {
      buttons.push({ text: 'Remove Photo', style: 'destructive', onPress: handleDeleteImage });
    }
    buttons.push({ text: 'Cancel', style: 'cancel' });

    Alert.alert('Profile Photo', 'Choose an option', buttons, { cancelable: true });
  };

  const handleDeleteImage = () => {
    if (imageDeleting || saving) return;
    if (pendingImageAsset) {
      setPendingImageAsset(null);
      return;
    }
    showConfirm(
      'Remove Photo',
      'Are you sure you want to remove your profile picture?',
      async () => {
        setImageDeleting(true);
        try {
          await providerAPI.deleteImage();
          await loadProviderProfile();
          showAlert('Success', 'Profile picture removed successfully.');
        } catch (error: any) {
          const msg =
            error.response?.data?.error?.message ||
            error.response?.data?.message ||
            'Failed to remove photo. Please try again.';
          showAlert('Delete Failed', msg);
        } finally {
          setImageDeleting(false);
        }
      },
      'Remove'
    );
  };

  const initial = companyName
    ? companyName.charAt(0).toUpperCase()
    : email
    ? email.charAt(0).toUpperCase()
    : 'C';

  if (profileLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8F9FA' }}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* ══ HEADER ══════════════════════════════════════════════════════════ */}
        <FadeInView delay={50}>
          <View style={{ position: 'absolute', top: -1000, left: 0, right: 0, height: 1000, backgroundColor: '#D2C5FC' }} />
          <LinearGradient
            colors={['#D2C5FC', '#EBE7FF', 'rgba(255, 255, 255, 0)']}
            style={styles.gradientHeader}
          >
            <View style={styles.header}>
              {/* Avatar */}
              <View style={styles.avatarWrapper}>
                <TouchableOpacity
                  onPress={handlePickImage}
                  disabled={saving || imageDeleting}
                  activeOpacity={0.8}
                  accessibilityLabel="Change profile picture"
                >
                  {displayImageUri ? (
                    <Image
                      source={{ uri: displayImageUri }}
                      style={styles.avatarCircle}
                    />
                  ) : (
                    <View style={styles.avatarCircle}>
                      <Text style={styles.avatarText}>{initial}</Text>
                    </View>
                  )}
                  {/* Camera badge */}
                  <View style={styles.avatarCameraBadge}>
                    <Ionicons name="camera" size={12} color="#fff" />
                  </View>
                  {/* Upload overlay */}
                  {saving && pendingImageAsset && (
                    <View style={styles.avatarOverlay}>
                      <ActivityIndicator size="small" color="#fff" />
                    </View>
                  )}
                </TouchableOpacity>
                {/* Show pending-image indicator */}
                {pendingImageAsset && (
                  <Text style={styles.pendingImageText}>Unsaved</Text>
                )}
              </View>

              {/* Name, Email, Role */}
              <View style={styles.headerInfo}>
                <Text style={styles.displayName}>{companyName || 'Your Company'}</Text>
                <Text style={styles.emailText}>{email}</Text>
                <View style={styles.roleBadge}>
                  <Ionicons
                    name="business-outline"
                    size={12}
                    color="#111827"
                  />
                  <Text style={styles.roleBadgeText}>Provider</Text>
                </View>
              </View>

              {/* Edit button */}
              <AnimatedButton style={styles.editBtn} onPress={openEditModal}>
                <Ionicons name="create-outline" size={16} color="#fff" />
                <Text style={styles.editBtnText}>Edit</Text>
              </AnimatedButton>
            </View>
          </LinearGradient>
        </FadeInView>

        {/* ── Section Cards ── */}
        <View style={styles.sectionsContainer}>

          {/* About / Description */}
          <FadeInView delay={100}>
            <SectionCard
              title="About Company"
              iconName="business-outline"
              isEmpty={!companyDescription}
              onAdd={openEditModal}
            >
              <Text style={styles.bioText}>{companyDescription}</Text>
            </SectionCard>
          </FadeInView>

          {/* Contact Info */}
          <FadeInView delay={150}>
            <SectionCard
              title="Contact Information"
              iconName="call-outline"
              isEmpty={!phone && !email}
              onAdd={openEditModal}
            >
              {phone ? (
                <View style={styles.infoRow}>
                  <View style={styles.infoIconBox}>
                    <Ionicons name="call-outline" size={16} color={theme.colors.primary} />
                  </View>
                  <View>
                    <Text style={styles.infoLabel}>Phone</Text>
                    <Text style={styles.infoValue}>{phone}</Text>
                  </View>
                </View>
              ) : null}
              {email ? (
                <View style={[styles.infoRow, { marginTop: phone ? 14 : 0 }]}>
                  <View style={styles.infoIconBox}>
                    <Ionicons name="mail-outline" size={16} color={theme.colors.primary} />
                  </View>
                  <View>
                    <Text style={styles.infoLabel}>Email</Text>
                    <Text style={styles.infoValue}>{email}</Text>
                  </View>
                </View>
              ) : null}
            </SectionCard>
          </FadeInView>

          {/* Location */}
          <FadeInView delay={200}>
            <SectionCard
              title="Location"
              iconName="location-outline"
              isEmpty={!location}
              onAdd={openEditModal}
            >
              <View style={styles.infoRow}>
                <View style={styles.infoIconBox}>
                  <Ionicons name="location-outline" size={16} color={theme.colors.primary} />
                </View>
                <View>
                  <Text style={styles.infoLabel}>Headquarters</Text>
                  <Text style={styles.infoValue}>{location}</Text>
                </View>
              </View>
            </SectionCard>
          </FadeInView>

          {/* Account Info */}
          <FadeInView delay={250}>
            <SectionCard
              title="Account"
              iconName="shield-checkmark-outline"
              isEmpty={false}
              onAdd={openEditModal}
            >
              <View style={styles.infoRow}>
                <View style={styles.infoIconBox}>
                  <Ionicons name="shield-checkmark-outline" size={16} color={theme.colors.primary} />
                </View>
                <View>
                  <Text style={styles.infoLabel}>Role</Text>
                  <Text style={styles.infoValue}>Job Provider</Text>
                </View>
              </View>
            </SectionCard>
          </FadeInView>

          {/* Logout Button */}
          <FadeInView delay={300}>
            <AnimatedButton style={styles.logoutBtn} onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={styles.logoutBtnText}>Log Out</Text>
            </AnimatedButton>
          </FadeInView>

          <View style={{ height: 40 }} />
        </View>
      </ScrollView>

      {/* ══ IMAGE OPTIONS MODAL (WEB FALLBACK) ═══════════════════════════════ */}
      <Modal
        visible={imageModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setImageModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setImageModalVisible(false)}
        >
          <View style={styles.imageOptionsCard}>
            <Text style={styles.imageOptionsTitle}>Profile Photo</Text>

            <TouchableOpacity
              style={styles.imageOptionBtn}
              onPress={() => {
                setImageModalVisible(false);
                launchGallery();
              }}
            >
              <Ionicons name="images-outline" size={20} color={theme.colors.text} style={{ marginRight: 10 }} />
              <Text style={styles.imageOptionText}>Choose from Gallery</Text>
            </TouchableOpacity>

            {/* Show remove only for a confirmed server image, not a pending local preview */}
            {profileImageUrl && !pendingImageAsset && (
              <TouchableOpacity
                style={[styles.imageOptionBtn, styles.deleteOptionBtn]}
                onPress={() => {
                  setImageModalVisible(false);
                  handleDeleteImage();
                }}
              >
                <Ionicons name="trash-outline" size={20} color={theme.colors.warning} style={{ marginRight: 10 }} />
                <Text style={[styles.imageOptionText, styles.deleteOptionText]}>Remove Photo</Text>
              </TouchableOpacity>
            )}

            {/* Discard pending selection */}
            {pendingImageAsset && (
              <TouchableOpacity
                style={[styles.imageOptionBtn, styles.deleteOptionBtn]}
                onPress={() => {
                  setImageModalVisible(false);
                  setPendingImageAsset(null);
                }}
              >
                <Ionicons name="close-circle-outline" size={20} color={theme.colors.warning} style={{ marginRight: 10 }} />
                <Text style={[styles.imageOptionText, styles.deleteOptionText]}>Discard New Photo</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.cancelOptionBtn}
              onPress={() => setImageModalVisible(false)}
            >
              <Text style={styles.cancelOptionText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ── Edit Profile Modal (matches seeker design) ── */}
      <Modal visible={isEditing} animationType="slide" transparent={false} onRequestClose={closeEditModal}>
        <SafeAreaView style={styles.modalContainer}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={closeEditModal} style={styles.modalCloseBtn}>
                <Ionicons name="close" size={24} color={isDarkMode ? '#FFFFFF' : '#1A1A2E'} />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Edit Company Profile</Text>
              <View style={{ width: 24 }} />
            </View>

            <ScrollView contentContainerStyle={styles.modalScrollContent} keyboardShouldPersistTaps="handled">
              {statusMessage && (
                <View style={[styles.statusBanner, statusMessage.type === 'success' ? styles.statusSuccess : styles.statusError]}>
                  <Text style={styles.statusText}>
                    {statusMessage.type === 'success' ? '✅ ' : '⚠️ '}
                    {statusMessage.text}
                  </Text>
                </View>
              )}

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Company Name *</Text>
                <TextInput
                  style={[styles.fieldInput, activeInput === 'companyName' && styles.fieldInputFocused]}
                  placeholder="e.g. Acme Corp"
                  placeholderTextColor={theme.colors.textMuted}
                  value={editCompanyName}
                  onChangeText={setEditCompanyName}
                  onFocus={() => setActiveInput('companyName')}
                  onBlur={() => setActiveInput(null)}
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Company Description</Text>
                <TextInput
                  style={[styles.fieldInput, styles.textArea, activeInput === 'description' && styles.fieldInputFocused]}
                  placeholder="Describe your company and the work you offer..."
                  placeholderTextColor={theme.colors.textMuted}
                  value={editDescription}
                  onChangeText={setEditDescription}
                  onFocus={() => setActiveInput('description')}
                  onBlur={() => setActiveInput(null)}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Location</Text>
                <TextInput
                  style={[styles.fieldInput, activeInput === 'location' && styles.fieldInputFocused]}
                  placeholder="e.g. Hyderabad, India"
                  placeholderTextColor={theme.colors.textMuted}
                  value={editLocation}
                  onChangeText={setEditLocation}
                  onFocus={() => setActiveInput('location')}
                  onBlur={() => setActiveInput(null)}
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Phone Number</Text>
                <TextInput
                  style={[styles.fieldInput, activeInput === 'phone' && styles.fieldInputFocused]}
                  placeholder="e.g. +91 9876543210"
                  placeholderTextColor={theme.colors.textMuted}
                  value={editPhone}
                  onChangeText={setEditPhone}
                  onFocus={() => setActiveInput('phone')}
                  onBlur={() => setActiveInput(null)}
                  keyboardType="phone-pad"
                />
              </View>

              <AnimatedButton
                style={styles.saveBtn}
                onPress={handleSaveProfile}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.saveBtnText}>Save Changes</Text>
                )}
              </AnimatedButton>
              <View style={{ height: 40 }} />
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

function getStyles(theme: any, isDarkMode: boolean) { return StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.bg,
  },
  gradientHeader: {
    paddingTop: Platform.OS === 'ios' ? 50 : 35,
  },
  scrollContent: {
    paddingBottom: 40,
  },

  // ── Header ──
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 24,
    backgroundColor: 'transparent',
    gap: 16,
  },
  avatarWrapper: {
    position: 'relative',
    alignItems: 'center',
    gap: 4,
    flexShrink: 0,
  },
  avatarCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  avatarText: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '800',
  },
  avatarCameraBadge: {
    position: 'absolute',
    bottom: 20,
    right: -2,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.colors.card,
  },
  avatarOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  removePhotoText: {
    color: theme.colors.warning,
    fontSize: 11,
    fontWeight: '600',
    textDecorationLine: 'underline',
    marginTop: 2,
  },
  pendingImageText: {
    color: theme.colors.pending,
    fontSize: 10,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 2,
    letterSpacing: 0.5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageOptionsCard: {
    backgroundColor: theme.colors.card,
    borderRadius: 16,
    padding: 24,
    width: 280,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  imageOptionsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 20,
  },
  imageOptionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    paddingVertical: 12,
  },
  imageOptionText: {
    fontSize: 15,
    color: theme.colors.text,
    fontWeight: '500',
  },
  deleteOptionBtn: {
    borderBottomWidth: 0,
  },
  deleteOptionText: {
    color: theme.colors.warning,
  },
  cancelOptionBtn: {
    marginTop: 16,
    width: '100%',
    paddingVertical: 12,
    backgroundColor: theme.colors.cardBackgroundLight,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelOptionText: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.textMuted,
  },
  headerInfo: {
    flex: 1,
    gap: 4,
  },
  displayName: {
    color: theme.colors.text,
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  emailText: {
    color: theme.colors.textMuted,
    fontSize: 13,
    fontWeight: '400',
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    backgroundColor: theme.colors.primaryLight,
    borderWidth: 1,
    borderColor: theme.colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 9999,
    marginTop: 4,
  },
  roleBadgeText: {
    color: isDarkMode ? '#111827' : '#111827',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 8,
    flexShrink: 0,
  },
  editBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },

  // ─── Section Cards ─────────────────────────────
  sectionsContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  sectionCard: {
    backgroundColor: theme.colors.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    color: theme.colors.text,
    fontSize: 15,
    fontWeight: '700',
    marginLeft: 10,
  },
  sectionActionBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: theme.colors.cardBackgroundLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionContent: { marginTop: 16 },

  bioText: {
    color: theme.colors.textMuted,
    fontSize: 14,
    lineHeight: 22,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: theme.colors.cardBackgroundLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  infoLabel: {
    fontSize: 11,
    color: theme.colors.textMuted,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 14,
    color: theme.colors.text,
    fontWeight: '600',
  },

  // ─── Logout Button ─────────────────────────────
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EF4444',
    borderRadius: 12,
    paddingVertical: 14,
    marginHorizontal: 4,
    marginTop: 6,
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  logoutBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },

  // ─── Edit Modal ────────────────────────────────
  modalContainer: { flex: 1, backgroundColor: theme.colors.bg },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  modalCloseBtn: { padding: 4 },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: theme.colors.text,
  },
  modalScrollContent: { padding: 24 },
  statusBanner: {
    padding: 14,
    borderRadius: 8,
    marginBottom: 24,
    borderWidth: 1,
  },
  statusSuccess: {
    backgroundColor: theme.colors.successBg,
    borderColor: theme.colors.success,
  },
  statusError: {
    backgroundColor: theme.colors.warningBg,
    borderColor: theme.colors.warning,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.text,
  },
  fieldGroup: { marginBottom: 20 },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 8,
  },
  fieldInput: {
    backgroundColor: theme.colors.inputBg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: 16,
    height: 54,
    color: theme.colors.text,
    fontSize: 15,
    borderRadius: 8,
  },
  fieldInputFocused: {
    borderColor: theme.colors.primary,
    borderWidth: 1.5,
  },
  textArea: {
    minHeight: 120,
    height: undefined,
    paddingVertical: 14,
  },
  saveBtn: {
    backgroundColor: theme.colors.primary,
    borderRadius: 8,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  saveBtnText: {
    color: isDarkMode ? '#111827' : '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
}

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
import { getToken, providerAPI, removeToken, seekerAPI, decodeJWT } from '../../services/api';
import { Application, Job, SeekerProfile } from '../../types';
import { FadeInView } from '../../components/FadeInView';
import { AnimatedButton } from '../../components/AnimatedButton';

// ─── Helpers ─────────────────────────────────────────────────────────────────
function formatDate(dateStr?: string): string {
  if (!dateStr) return '';
  try {
    return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

const STATUS_BADGE: Record<string, { color: string; bg: string; label: string }> = {
  PENDING:  { color: '#B36B00', bg: '#FFF3E0', label: 'Pending'  },
  ACCEPTED: { color: '#146C2E', bg: '#E8F5E9', label: 'Accepted' },
  REJECTED: { color: '#B3261E', bg: '#FCEEEE', label: 'Rejected' },
  OPEN:     { color: '#146C2E', bg: '#E8F5E9', label: 'Open'     },
  FILLED:   { color: '#1565C0', bg: '#E3F2FD', label: 'Filled'   },
  CLOSED:   { color: '#555',    bg: '#F0F0F0', label: 'Closed'   },
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function InfoRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  const { colors, isDarkMode } = useTheme();
  const theme = { ...themeConst.PROFESSIONAL_THEME, colors };
  const styles = getStyles(theme, isDarkMode);
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoIconWrap}>
        <Ionicons name={icon as any} size={18} color={colors.primary} />
      </View>
      <View style={styles.infoTextWrap}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

function SectionHeader({ title, icon }: { title: string; icon: string }) {
  const { colors, isDarkMode } = useTheme();
  const theme = { ...themeConst.PROFESSIONAL_THEME, colors };
  const styles = getStyles(theme, isDarkMode);
  return (
    <View style={styles.sectionHeader}>
      <Ionicons name={icon as any} size={18} color={colors.primary} />
      <Text style={styles.sectionHeaderText}>{title}</Text>
    </View>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function ProfileScreen() {
  const router = useRouter();
  const { colors, isDarkMode } = useTheme();
  const theme = { ...themeConst.PROFESSIONAL_THEME, colors };
  const styles = getStyles(theme, isDarkMode);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('SEEKER');

  // Seeker profile state
  const [fullName, setFullName] = useState('');
  const [skills, setSkills] = useState<string[]>([]);
  const [experience, setExperience] = useState('');
  const [location, setLocation] = useState('');
  const [bio, setBio] = useState('');
  const [phone, setPhone] = useState('');
  const [profileLoading, setProfileLoading] = useState(true);

  // Stats
  const [totalApplications, setTotalApplications] = useState(0);
  const [acceptedApplications, setAcceptedApplications] = useState(0);
  const [recentApplications, setRecentApplications] = useState<Application[]>([]);

  // Provider stats
  const [jobsPosted, setJobsPosted] = useState(0);
  const [totalApplicants, setTotalApplicants] = useState(0);
  const [recentJobs, setRecentJobs] = useState<Job[]>([]);

  // Edit Modal
  const [isEditing, setIsEditing] = useState(false);
  const [editFullName, setEditFullName] = useState('');
  const [editSkills, setEditSkills] = useState('');
  const [editExperience, setEditExperience] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [activeInput, setActiveInput] = useState<string | null>(null);

  // Profile image state
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);
  const [pendingImageAsset, setPendingImageAsset] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [imageDeleting, setImageDeleting] = useState(false);
  const [imageModalVisible, setImageModalVisible] = useState(false);

  const displayImageUri = pendingImageAsset ? pendingImageAsset.uri : profileImageUrl;

  // ── Load data ──────────────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      const token = await getToken();
      if (token) {
        const payload = decodeJWT(token);
        if (payload) {
          setEmail(payload.sub || payload.email || '');
          const detectedRole = payload.role || payload.Role || 'SEEKER';
          setRole(detectedRole);

          if (detectedRole === 'PROVIDER') {
            await loadProviderData();
          } else {
            await loadSeekerData();
          }
        }
      }
      setProfileLoading(false);
    })();
  }, []);

  const loadSeekerData = async () => {
    try {
      const [profileRes, appsRes] = await Promise.allSettled([
        seekerAPI.getProfile(),
        seekerAPI.getApplications(),
      ]);

      if (profileRes.status === 'fulfilled') {
        const data = profileRes.value.data?.data || profileRes.value.data;
        if (data) {
          setFullName((data as any).fullName || '');
          setSkills(Array.isArray((data as any).skills) ? (data as any).skills : []);
          setExperience((data as any).experience || '');
          setLocation((data as any).location || '');
          setBio((data as any).bio || '');
          setPhone((data as any).phoneNumber || '');
          setProfileImageUrl((data as any).profileImageUrl || null);
        }
      }

      if (appsRes.status === 'fulfilled') {
        const appData = appsRes.value.data?.data || appsRes.value.data;
        if (Array.isArray(appData)) {
          setTotalApplications(appData.length);
          setAcceptedApplications(appData.filter((a: Application) => a.status === 'ACCEPTED').length);
          setRecentApplications(appData.slice(0, 5));
        }
      }
    } catch (error: any) {
      if (error.response?.status !== 404) console.log('❌ Seeker data error:', error?.message);
    }
  };

  const loadProviderData = async () => {
    try {
      const [profileRes, jobsRes, appsRes] = await Promise.allSettled([
        providerAPI.getProfile(),
        providerAPI.getMyJobs(),
        providerAPI.getApplications(),
      ]);

      if (profileRes.status === 'fulfilled') {
        const data = profileRes.value.data?.data || profileRes.value.data;
        if (data) {
          setFullName((data as any).companyName || '');
          setLocation((data as any).location || '');
          setBio((data as any).companyDescription || '');
          setPhone((data as any).phoneNumber || '');
        }
      }

      if (jobsRes.status === 'fulfilled') {
        const jData = jobsRes.value.data?.data || jobsRes.value.data;
        if (Array.isArray(jData)) {
          setJobsPosted(jData.length);
          setRecentJobs(jData.slice(0, 5));
        }
      }

      if (appsRes.status === 'fulfilled') {
        const aData = appsRes.value.data?.data || appsRes.value.data;
        if (Array.isArray(aData)) {
          setTotalApplicants(aData.length);
        }
      }
    } catch (error: any) {
      if (error.response?.status !== 404) console.log('❌ Provider data error:', error?.message);
    }
  };

  // ── Edit modal ─────────────────────────────────────────────────────────────
  const openEditModal = () => {
    setEditFullName(fullName);
    setEditSkills(skills.join(', '));
    setEditExperience(experience);
    setEditLocation(location);
    setEditBio(bio);
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
    if (!editFullName.trim()) {
      setStatusMessage({ type: 'error', text: 'Full Name is required.' });
      return;
    }
    setSaving(true);
    try {
      const profileData: SeekerProfile = {
        fullName: editFullName.trim(),
        skills: editSkills.split(',').map(s => s.trim()).filter(s => s.length > 0),
        experience: editExperience.trim(),
        location: editLocation.trim(),
        bio: editBio.trim(),
        phoneNumber: editPhone.trim(),
      };

      if (pendingImageAsset) {
        // Upload profile + new image together as multipart FormData
        const formData = new FormData();
        formData.append('profile', JSON.stringify(profileData));
        formData.append('image', {
          uri: pendingImageAsset.uri,
          name: pendingImageAsset.fileName || 'profile.jpg',
          type: pendingImageAsset.mimeType || 'image/jpeg',
        } as any);
        await seekerAPI.saveProfile(formData);
        setPendingImageAsset(null);
      } else {
        // No new image — send plain JSON to avoid touching the existing image
        await seekerAPI.saveProfile(profileData);
      }

      // Reload from backend to get the latest data (including any updated image URL)
      await loadSeekerData();
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

  // Pick image and preview locally — actual upload happens on Save
  const storeImageAsset = (asset: ImagePicker.ImagePickerAsset) => {
    setPendingImageAsset(asset);
    // Open edit modal if not already open so user can confirm with Save
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
    if (imageDeleting) return;

    // Web: camera not supported via ImagePicker — show options modal (upload or remove)
    if (Platform.OS === 'web') {
      setImageModalVisible(true);
      return;
    }

    // Native: show action sheet
    // Include "Remove Photo" only when a confirmed server image exists (not a pending local preview)
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
    if (imageDeleting) return;
    // If user only picked a local image (not yet saved), just cancel the pending selection
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
          await seekerAPI.deleteImage();
          setProfileImageUrl(null);
          await loadSeekerData();
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

  // ── Derived ────────────────────────────────────────────────────────────────
  const displayName = fullName || (email ? email.split('@')[0] : 'User');
  const initial = displayName.charAt(0).toUpperCase();
  const isProvider = role === 'PROVIDER';

  // ── Loading ────────────────────────────────────────────────────────────────
  if (profileLoading) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  // ── Main render ────────────────────────────────────────────────────────────
  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >

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
                  disabled={imageDeleting}
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
                  {/* Delete/loading overlay */}
                  {imageDeleting && (
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
                <Text style={styles.displayName}>{displayName}</Text>
                <Text style={styles.emailText}>{email}</Text>
                <View style={styles.roleBadge}>
                  <Ionicons
                    name={isProvider ? 'business-outline' : 'person-outline'}
                    size={12}
                    color="#111827"
                  />
                  <Text style={styles.roleBadgeText}>{isProvider ? 'Provider' : 'Seeker'}</Text>
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


        {/* ══ ACTIVITY CARDS ═══════════════════════════════════════════════════ */}
        <FadeInView delay={100}>
          <View style={styles.cardsRow}>
            {isProvider ? (
              <>
                <View style={styles.activityCard}>
                  <Text style={styles.activityCardNumber}>{jobsPosted}</Text>
                  <Text style={styles.activityCardTitle}>Jobs Posted</Text>
                  <Text style={styles.activityCardSub}>Total jobs listed</Text>
                </View>
                <View style={styles.activityCard}>
                  <Text style={styles.activityCardNumber}>{totalApplicants}</Text>
                  <Text style={styles.activityCardTitle}>Applications</Text>
                  <Text style={styles.activityCardSub}>Applications received</Text>
                </View>
              </>
            ) : (
              <>
                <View style={styles.activityCard}>
                  <Text style={styles.activityCardNumber}>{totalApplications}</Text>
                  <Text style={styles.activityCardTitle}>Applications</Text>
                  <Text style={styles.activityCardSub}>Total Applications</Text>
                </View>
                <View style={styles.activityCard}>
                  <Text style={styles.activityCardNumber}>{acceptedApplications}</Text>
                  <Text style={styles.activityCardTitle}>Accepted</Text>
                  <Text style={styles.activityCardSub}>Accepted Jobs</Text>
                </View>
              </>
            )}
          </View>
        </FadeInView>

        {/* ══ INFO SECTION ════════════════════════════════════════════════════ */}
        <FadeInView delay={150}>
          <View style={styles.infoCard}>
            <SectionHeader title="About" icon="information-circle-outline" />
            <View style={styles.infoCardBody}>
              {bio ? (
                <Text style={styles.bioText}>{bio}</Text>
              ) : (
                <Text style={styles.emptyText}>No bio added yet.</Text>
              )}

              <View style={styles.infoRowsWrap}>
                {location ? <InfoRow icon="location-outline" label="Location" value={location} /> : null}
                {phone ? <InfoRow icon="call-outline" label="Phone" value={phone} /> : null}
                {experience && !isProvider ? <InfoRow icon="time-outline" label="Experience" value={experience} /> : null}
              </View>
            </View>
          </View>
        </FadeInView>

        {/* ══ SKILLS (SEEKER ONLY) ════════════════════════════════════════════ */}
        {!isProvider && (
          <FadeInView delay={200}>
            <View style={styles.infoCard}>
              <SectionHeader title="Skills" icon="construct-outline" />
              <View style={styles.infoCardBody}>
                {skills.length > 0 ? (
                  <View style={styles.skillsWrap}>
                    {skills.map((skill, i) => (
                      <View key={i} style={styles.skillChip}>
                        <Text style={styles.skillChipText}>{skill}</Text>
                      </View>
                    ))}
                  </View>
                ) : (
                  <Text style={styles.emptyText}>No skills added yet.</Text>
                )}
              </View>
            </View>
          </FadeInView>
        )}

        {/* ══ RECENT APPLICATIONS (SEEKER) ════════════════════════════════════ */}
        {!isProvider && recentApplications.length > 0 && (
          <FadeInView delay={250}>
            <View style={styles.infoCard}>
              <SectionHeader title="Recent Applications" icon="document-text-outline" />
              <View style={styles.historyList}>
                {recentApplications.map((app) => {
                  const badge = STATUS_BADGE[app.status] || { color: '#555', bg: '#eee', label: app.status };
                  return (
                    <View key={app.id} style={styles.historyItem}>
                      <View style={styles.historyItemLeft}>
                        <Text style={styles.historyTitle} numberOfLines={1}>
                          {app.jobTitle || `Job #${app.jobId}`}
                        </Text>
                        {(app as any).jobProviderName ? (
                          <Text style={styles.historySubtitle} numberOfLines={1}>
                            {(app as any).jobProviderName}
                          </Text>
                        ) : null}
                        {app.appliedDate ? (
                          <Text style={styles.historyDate}>{formatDate(app.appliedDate)}</Text>
                        ) : null}
                      </View>
                      <View style={[styles.historyBadge, { backgroundColor: badge.bg }]}>
                        <Text style={[styles.historyBadgeText, { color: badge.color }]}>{badge.label}</Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
          </FadeInView>
        )}

        {/* ══ RECENT JOBS (PROVIDER) ══════════════════════════════════════════ */}
        {isProvider && recentJobs.length > 0 && (
          <FadeInView delay={250}>
            <View style={styles.infoCard}>
              <SectionHeader title="Recently Posted Jobs" icon="briefcase-outline" />
              <View style={styles.historyList}>
                {recentJobs.map((job) => {
                  const statusKey = (job as any).status || 'OPEN';
                  const badge = STATUS_BADGE[statusKey] || { color: '#555', bg: '#eee', label: statusKey };
                  return (
                    <View key={job.id} style={styles.historyItem}>
                      <View style={styles.historyItemLeft}>
                        <Text style={styles.historyTitle} numberOfLines={1}>{job.title}</Text>
                        <Text style={styles.historySubtitle} numberOfLines={1}>{job.location}</Text>
                      </View>
                      <View style={[styles.historyBadge, { backgroundColor: badge.bg }]}>
                        <Text style={[styles.historyBadgeText, { color: badge.color }]}>{badge.label}</Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
          </FadeInView>
        )}

        {/* ══ LOGOUT ══════════════════════════════════════════════════════════ */}
        <FadeInView delay={300}>
          <AnimatedButton style={styles.logoutBtn} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={18} color="#FFFFFF" style={{ marginRight: 4 }} />
            <Text style={styles.logoutBtnText}>Log Out</Text>
          </AnimatedButton>
        </FadeInView>

        <View style={{ height: 48 }} />
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
                  loadSeekerData();
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

      {/* ══ EDIT PROFILE MODAL ══════════════════════════════════════════════ */}
      <Modal
        visible={isEditing}
        animationType="slide"
        transparent={false}
        onRequestClose={closeEditModal}
      >
        <SafeAreaView style={styles.modalContainer}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={{ flex: 1 }}
          >
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={closeEditModal} style={styles.modalCloseBtn}>
                <Ionicons name="close" size={24} color={theme.colors.text} />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Edit Profile</Text>
              <View style={{ width: 32 }} />
            </View>

            <ScrollView
              contentContainerStyle={styles.modalScrollContent}
              keyboardShouldPersistTaps="handled"
            >
              {statusMessage && (
                <View style={[
                  styles.statusBanner,
                  statusMessage.type === 'success' ? styles.statusSuccess : styles.statusError,
                ]}>
                  <Text style={styles.statusText}>
                    {statusMessage.type === 'success' ? '✅ ' : '⚠️ '}{statusMessage.text}
                  </Text>
                </View>
              )}

              <Field
                label="Full Name"
                value={editFullName}
                onChange={setEditFullName}
                placeholder="e.g. John Doe"
                active={activeInput === 'fullName'}
                onFocus={() => setActiveInput('fullName')}
                onBlur={() => setActiveInput(null)}
              />
              <Field
                label="Skills (comma separated)"
                value={editSkills}
                onChange={setEditSkills}
                placeholder="e.g. Plumbing, Electrician"
                active={activeInput === 'skills'}
                onFocus={() => setActiveInput('skills')}
                onBlur={() => setActiveInput(null)}
              />
              <Field
                label="Experience"
                value={editExperience}
                onChange={setEditExperience}
                placeholder="e.g. 3 years in plumbing"
                active={activeInput === 'experience'}
                onFocus={() => setActiveInput('experience')}
                onBlur={() => setActiveInput(null)}
              />
              <Field
                label="Location"
                value={editLocation}
                onChange={setEditLocation}
                placeholder="e.g. Hyderabad, India"
                active={activeInput === 'location'}
                onFocus={() => setActiveInput('location')}
                onBlur={() => setActiveInput(null)}
              />
              <Field
                label="Phone Number"
                value={editPhone}
                onChange={setEditPhone}
                placeholder="e.g. +91 9876543210"
                active={activeInput === 'phone'}
                onFocus={() => setActiveInput('phone')}
                onBlur={() => setActiveInput(null)}
                keyboardType="phone-pad"
              />
              <Field
                label="About Me"
                value={editBio}
                onChange={setEditBio}
                placeholder="Tell us about yourself..."
                active={activeInput === 'bio'}
                onFocus={() => setActiveInput('bio')}
                onBlur={() => setActiveInput(null)}
                multiline
              />

              <AnimatedButton
                style={styles.saveBtn}
                onPress={handleSaveProfile}
                disabled={saving}
              >
                {saving
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={styles.saveBtnText}>Save Changes</Text>
                }
              </AnimatedButton>
              <View style={{ height: 40 }} />
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>
    </View>
  );
}

// ─── Field helper component ───────────────────────────────────────────────────
function Field({
  label, value, onChange, placeholder, active, onFocus, onBlur, multiline, keyboardType,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  active: boolean;
  onFocus: () => void;
  onBlur: () => void;
  multiline?: boolean;
  keyboardType?: any;
}) {
  const { colors, isDarkMode } = useTheme();
  const theme = { ...themeConst.PROFESSIONAL_THEME, colors };
  const styles = getStyles(theme, isDarkMode);
  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={[
          styles.fieldInput,
          multiline && styles.textArea,
          active && styles.fieldInputFocused,
        ]}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        value={value}
        onChangeText={onChange}
        onFocus={onFocus}
        onBlur={onBlur}
        multiline={multiline}
        numberOfLines={multiline ? 4 : 1}
        textAlignVertical={multiline ? 'top' : 'center'}
        keyboardType={keyboardType}
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
function getStyles(theme: any, isDarkMode: boolean) { return StyleSheet.create({
  loadingScreen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.bg,
  },
  screen: {
    flex: 1,
    backgroundColor: theme.colors.bg,
  },
  scrollContent: {
    paddingBottom: 32,
  },

  gradientHeader: {
    paddingTop: Platform.OS === 'ios' ? 50 : 35,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 16,
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
    color: '#111827',
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

  // ── Stats row (inline pill, AllTrails style) ──
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.card,
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  statPill: {
    flex: 1,
    alignItems: 'center',
  },
  statPillValue: {
    color: theme.colors.text,
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: 2,
  },
  statPillLabel: {
    color: theme.colors.textMuted,
    fontSize: 12,
    fontWeight: '500',
  },
  statsDivider: {
    width: 1,
    height: 36,
    backgroundColor: theme.colors.border,
  },

  // ── Activity cards ──
  cardsRow: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 4,
  },
  activityCard: {
    flex: 1,
    backgroundColor: theme.colors.card,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: theme.colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  activityCardNumber: {
    color: theme.colors.text,
    fontSize: 36,
    fontWeight: '800',
    letterSpacing: -1,
    marginBottom: 6,
  },
  activityCardTitle: {
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 3,
  },
  activityCardSub: {
    color: theme.colors.textMuted,
    fontSize: 12,
    fontWeight: '400',
  },

  // ── Info card ──
  infoCard: {
    backgroundColor: theme.colors.card,
    marginHorizontal: 24,
    marginTop: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  sectionHeaderText: {
    color: theme.colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  infoCardBody: {
    padding: 20,
    gap: 12,
  },
  bioText: {
    color: theme.colors.textMuted,
    fontSize: 14,
    lineHeight: 22,
  },
  emptyText: {
    color: theme.colors.textMuted,
    fontSize: 13,
    fontStyle: 'italic',
  },

  // ── Info rows ──
  infoRowsWrap: {
    gap: 10,
    marginTop: 4,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  infoIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: theme.colors.cardBackgroundLight,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  infoTextWrap: {
    flex: 1,
  },
  infoLabel: {
    color: theme.colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  infoValue: {
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: '500',
  },

  // ── Skills chips ──
  skillsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  skillChip: {
    backgroundColor: theme.colors.cardBackgroundLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  skillChipText: {
    color: theme.colors.text,
    fontSize: 13,
    fontWeight: '600',
  },

  // ── History list ──
  historyList: {
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  historyItemLeft: {
    flex: 1,
    marginRight: 12,
  },
  historyTitle: {
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 3,
  },
  historySubtitle: {
    color: theme.colors.textMuted,
    fontSize: 12,
    marginBottom: 2,
  },
  historyDate: {
    color: theme.colors.textMuted,
    fontSize: 11,
  },
  historyBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 9999,
    flexShrink: 0,
  },
  historyBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },

  // ── Logout ──
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 24,
    marginTop: 24,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#EF4444',
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

  // ── Edit modal ──
  modalContainer: {
    flex: 1,
    backgroundColor: theme.colors.bg,
  },
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
  modalScrollContent: {
    padding: 24,
  },
  statusBanner: {
    padding: 14,
    borderRadius: 12,
    marginBottom: 24,
    borderWidth: 1,
  },
  statusSuccess: { backgroundColor: theme.colors.successBg, borderColor: theme.colors.success },
  statusError: { backgroundColor: theme.colors.warningBg, borderColor: theme.colors.warning },
  statusText: { fontSize: 13, fontWeight: '600', color: theme.colors.text },
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
  saveBtnText: { color: isDarkMode ? '#111827' : '#fff', fontSize: 16, fontWeight: '700' },
});
}

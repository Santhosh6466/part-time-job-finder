import { Ionicons } from '@expo/vector-icons';
import * as themeConst from '../../constants/theme';
import { useFocusEffect, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  FlatList,
  Image,
  Platform,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { getCategoryLabel } from '../../constants/categories';
import { showAlert, showConfirm } from '../../services/alert';
import { getToken, providerAPI, decodeJWT } from '../../services/api';
import { checkProfileComplete } from '../../services/profileUtils';
import { Job } from '../../types';
import { FadeInView } from '../../components/FadeInView';
import { AnimatedButton } from '../../components/AnimatedButton';


// Rotating color palette for job card logos
const LOGO_COLORS = [
  { bg: '#EEE8FF', text: '#6B4EFF' },
  { bg: '#FFE8E8', text: '#FF4E4E' },
  { bg: '#E8F4FF', text: '#1E90FF' },
  { bg: '#E8FFE8', text: '#2DB55D' },
  { bg: '#FFF5E8', text: '#FF9500' },
  { bg: '#FFE8F8', text: '#C548AB' },
];

export default function MyJobsScreen() {
  const router = useRouter();
  const { colors, isDarkMode } = useTheme();
  const theme = { ...themeConst.PROFESSIONAL_THEME, colors };
  const styles = getStyles(theme, isDarkMode);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [companyName, setCompanyName] = useState('Company');
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [deletingJobId, setDeletingJobId] = useState<number | null>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const fetchMyJobs = useCallback(async () => {
    try {
      const response = await providerAPI.getMyJobs();
      const data = response.data?.data || response.data;
      setJobs(Array.isArray(data) ? data : []);
    } catch (error: any) {
      console.log('❌ Fetch provider jobs error:', error);
      if (error.response?.status !== 404) {
        showAlert('Error', 'Failed to load your jobs. Pull down to retry.');
      }
    }
  }, []);

  // Re-sync company details and profile image every time this tab gains focus
  useFocusEffect(
    useCallback(() => {
      (async () => {
        try {
          const profileRes = await providerAPI.getProfile();
          const profileData = profileRes.data?.data || profileRes.data;
          if (profileData) {
            if (profileData.companyName) setCompanyName(profileData.companyName);
            setProfileImageUrl(profileData.profileImageUrl || null);
          }
        } catch (e) {
          console.log("Failed to load profile in focus effect");
        }
      })();
    }, [])
  );

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();

    (async () => {
      const profileCheck = await checkProfileComplete('PROVIDER');
      if (!profileCheck.complete) {
        router.replace('/complete-provider-profile' as any);
        return;
      }

      // Load company name and profile image
      try {
        const profileRes = await providerAPI.getProfile();
        const profileData = profileRes.data?.data || profileRes.data;
        if (profileData) {
          if (profileData.companyName) setCompanyName(profileData.companyName);
          setProfileImageUrl(profileData.profileImageUrl || null);
        }
      } catch {
        // Fall back to token email
        const token = await getToken();
        if (token) {
          const payload = decodeJWT(token);
          if (payload) setEmail(payload.sub || payload.email || '');
        }
      }

      await fetchMyJobs();
      setLoading(false);
    })();
  }, [fetchMyJobs, fadeAnim]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchMyJobs();
    setRefreshing(false);
  };

  const handleEditJob = (job: Job) => {
    router.push({
      pathname: '/(provider)/post-job' as any,
      params: { jobStr: JSON.stringify(job) },
    });
  };

  const handleDeleteJob = async (jobId: number) => {
    setDeletingJobId(jobId);
    try {
      await providerAPI.deleteJob(jobId);
      showAlert('Success', 'Job deleted successfully.');
      setJobs((prev) => prev.filter((j) => j.id !== jobId));
    } catch (error: any) {
      const msg =
          error.response?.data?.error?.message ||
          error.response?.data?.message ||
          'Failed to delete job.';
      showAlert('Error', msg);
    } finally {
      setDeletingJobId(null);
    }
  };

  const confirmDeleteJob = (jobId: number, jobTitle: string) => {
    showConfirm(
      'Delete Job',
      `Are you sure you want to delete "${jobTitle}"? This action cannot be undone.`,
      () => handleDeleteJob(jobId),
      'Delete'
    );
  };

  const companyInitial = companyName
    ? companyName.charAt(0).toUpperCase()
    : email
    ? email.charAt(0).toUpperCase()
    : 'C';

  const renderJobCard = ({ item, index }: { item: Job; index: number }) => {
    const colorPair = LOGO_COLORS[index % LOGO_COLORS.length];

    return (
      <FadeInView delay={Math.min(index * 60, 300)}>
        <View style={styles.jobCard}>
          {/* Card Header */}
          <View style={styles.jobCardHeader}>
            {/* Company Logo — uses company's first letter */}
            <View style={[styles.jobLogoContainer, { backgroundColor: colorPair.bg }]}>
              <Text style={[styles.jobLogoText, { color: colorPair.text }]}>
                {companyInitial}
              </Text>
            </View>

            <View style={styles.jobInfo}>
              <Text style={styles.jobTitle} numberOfLines={1}>{item.title}</Text>
              <Text style={styles.jobSubtitle} numberOfLines={1}>
                {companyName}
              </Text>
            </View>

            <View style={styles.categoryBadge}>
              <Text style={styles.categoryBadgeText}>{getCategoryLabel(item.category)}</Text>
            </View>
          </View>

          {/* Description */}
          <Text style={styles.jobDescription} numberOfLines={2}>
            {item.description}
          </Text>

          {/* Footer Row */}
          <View style={styles.jobCardFooter}>
            <View style={styles.budgetPill}>
              <Text style={styles.jobBudget}>₹{item.budget}</Text>
              <Text style={styles.jobBudgetUnit}>/Mo</Text>
            </View>

            <View style={styles.locationRow}>
              <Ionicons name="location-outline" size={13} color={theme.colors.textMuted} />
              <Text style={styles.locationText}>{item.location}</Text>
            </View>

            {item.skillsRequired && item.skillsRequired.slice(0, 2).map((skill, idx) => (
              <View key={idx} style={styles.tag}>
                <Text style={styles.tagText}>{skill}</Text>
              </View>
            ))}
            {item.skillsRequired && item.skillsRequired.length > 2 && (
              <View style={styles.tag}>
                <Text style={styles.tagText}>+{item.skillsRequired.length - 2}</Text>
              </View>
            )}
          </View>

          {/* Edit / Delete Actions */}
          <View style={styles.jobActionsRow}>
            <AnimatedButton
              style={styles.editJobBtn}
              onPress={() => handleEditJob(item)}
            >
              <Ionicons name="create-outline" size={16} color={theme.colors.primary} />
              <Text style={styles.editJobBtnText}>Edit</Text>
            </AnimatedButton>
            <AnimatedButton
              style={styles.deleteJobBtn}
              onPress={() => confirmDeleteJob(item.id, item.title)}
              disabled={deletingJobId === item.id}
            >
              {deletingJobId === item.id ? (
                <ActivityIndicator size="small" color={theme.colors.warning} />
              ) : (
                <>
                  <Ionicons name="trash-outline" size={16} color={theme.colors.warning} />
                  <Text style={styles.deleteJobBtnText}>Delete</Text>
                </>
              )}
            </AnimatedButton>
          </View>
        </View>
      </FadeInView>
    );
  };

  if (loading) {
    return (
      <View style={styles.screen}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </View>
    );
  }

  const ListHeader = () => (
    <View style={styles.listHeader}>
      {/* Blended Premium Gradient Header */}
      <View style={{ position: 'absolute', top: -1000, left: 0, right: 0, height: 1000, backgroundColor: '#D2C5FC' }} />
      <LinearGradient
        colors={['#D2C5FC', '#EBE7FF', 'rgba(255, 255, 255, 0)']}
        style={styles.gradientHeader}
      >
        {/* Top Bar Row */}
        <View style={styles.topBar}>
          {/* Left Side: Group Selector */}
          <View style={styles.groupSelector}>
            <View style={styles.groupLogoCircle}>
              <Ionicons name="briefcase-sharp" size={20} color={isDarkMode ? '#FFFFFF' : '#111827'} />
            </View>
            <View style={styles.groupTextCol}>
              <View style={styles.groupNameRow}>
                <Text style={styles.groupNameText} numberOfLines={1}>{companyName}</Text>
                <Ionicons name="chevron-down" size={14} color={isDarkMode ? '#FFFFFF' : '#111827'} style={{ marginLeft: 2 }} />
              </View>
              <Text style={styles.groupSubtitleText}>Provider</Text>
            </View>
          </View>

          {/* Right Side: Controls */}
          <View style={styles.headerRightControls}>
            <TouchableOpacity style={styles.headerCircleBtn} onPress={() => router.push('/settings')}>
              <Ionicons name="settings-outline" size={19} color={isDarkMode ? '#FFFFFF' : '#111827'} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.headerCircleBtn}>
              <Ionicons name="notifications-outline" size={19} color={isDarkMode ? '#FFFFFF' : '#111827'} />
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationBadgeText}>7</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.headerCircleBtn} onPress={() => router.push('/(provider)/profile' as any)}>
              {profileImageUrl ? (
                <Image source={{ uri: profileImageUrl }} style={styles.avatarImage} />
              ) : (
                <Text style={styles.avatarInitialsText}>{companyInitial}</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>

      {/* Stats Banner */}
      <FadeInView delay={100}>
        <View style={styles.statsBanner}>
          <View style={styles.statsContent}>
            <Text style={styles.statsTitle}>Your Jobs</Text>
            <Text style={styles.statsSubtitle}>
              {jobs.length} {jobs.length === 1 ? 'position' : 'positions'} posted
            </Text>
            <AnimatedButton
              style={styles.statsBtn}
              onPress={() => router.push('/(provider)/post-job' as any)}
            >
              <Text style={styles.statsBtnText}>+ Post New Job</Text>
            </AnimatedButton>
          </View>
          {/* Decorative Circle */}
          <View style={styles.statsDecoCircle} />
        </View>
      </FadeInView>

      {/* Stats Cards Row */}
      <FadeInView delay={150}>
        <View style={styles.statsRow}>
          <View style={[styles.statsCard, { backgroundColor: theme.colors.statsCyan }]}>
            <Ionicons name="briefcase-outline" size={20} color="#1A1A2E" style={{ marginBottom: 8 }} />
            <Text style={styles.statsCardCount}>{jobs.length}</Text>
            <Text style={styles.statsCardLabel}>Active Jobs</Text>
          </View>
          <View style={[styles.statsCard, { backgroundColor: theme.colors.statsPurple }]}>
            <Ionicons name="people-outline" size={20} color="#1A1A2E" style={{ marginBottom: 8 }} />
            <Text style={styles.statsCardCount}>—</Text>
            <Text style={styles.statsCardLabel}>Applicants</Text>
          </View>
          <View style={[styles.statsCard, { backgroundColor: theme.colors.statsOrange }]}>
            <Ionicons name="checkmark-circle-outline" size={20} color="#1A1A2E" style={{ marginBottom: 8 }} />
            <Text style={styles.statsCardCount}>—</Text>
            <Text style={styles.statsCardLabel}>Hired</Text>
          </View>
        </View>
      </FadeInView>

      <FadeInView delay={200}>
        <Text style={styles.sectionTitle}>My Posted Jobs</Text>
      </FadeInView>
    </View>
  );

  return (
    <View style={styles.screen}>
      <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
        <FlatList
          data={jobs}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderJobCard}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={<ListHeader />}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={theme.colors.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <View style={styles.emptyIcon}>
                <Ionicons name="briefcase-outline" size={36} color={theme.colors.textMuted} />
              </View>
              <Text style={styles.emptyTitle}>No jobs posted yet</Text>
              <Text style={styles.emptyBody}>Tap "Post Job" to create your first listing.</Text>
              <AnimatedButton
                style={styles.emptyBtn}
                onPress={() => router.push('/(provider)/post-job' as any)}
              >
                <Text style={styles.emptyBtnText}>Post a Job</Text>
              </AnimatedButton>
            </View>
          }
        />
      </Animated.View>
    </View>
  );
}

const getStyles = (theme: any, isDarkMode: boolean) => StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.bg,
  },
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContent: {
    paddingHorizontal: 18,
    paddingBottom: 40,
  },
  listHeader: {
    paddingBottom: 4,
  },
  gradientHeader: {
    marginHorizontal: -18,
    paddingHorizontal: 18,
    paddingTop: Platform.OS === 'ios' ? 60 : 45,
    paddingBottom: 24,
    marginBottom: 16,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  groupSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  groupLogoCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: isDarkMode ? theme.colors.card : '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  groupTextCol: {
    justifyContent: 'center',
  },
  groupNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  groupNameText: {
    fontSize: 16,
    fontWeight: '700',
    color: isDarkMode ? '#FFFFFF' : '#111827',
    maxWidth: 110,
  },
  groupSubtitleText: {
    fontSize: 12,
    color: isDarkMode ? '#9CA3AF' : '#6B7280',
    fontWeight: '500',
    marginTop: 1,
  },
  headerRightControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerCircleBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 255, 255, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#EF4444',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  notificationBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },
  avatarInitialsText: {
    fontSize: 14,
    fontWeight: '700',
    color: isDarkMode ? '#FFFFFF' : '#111827',
  },
  avatarImage: {
    width: 38,
    height: 38,
    borderRadius: 19,
  },

  // ─── Stats Banner ───────────────────────────
  statsBanner: {
    backgroundColor: theme.colors.primary,
    borderRadius: 20,
    padding: 24,
    marginBottom: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  statsContent: { zIndex: 2 },
  statsTitle: {
    color: '#FFF',
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 4,
  },
  statsSubtitle: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 14,
    marginBottom: 16,
  },
  statsBtn: {
    backgroundColor: '#FF9B42',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignSelf: 'flex-start',
  },
  statsBtnText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 13,
  },
  statsDecoCircle: {
    position: 'absolute',
    right: -30,
    bottom: -30,
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },

  // ─── Stats Row ──────────────────────────────
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 24,
  },
  statsCard: {
    flex: 1,
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsCardCount: {
    fontSize: 18,
    fontWeight: '800',
    color: isDarkMode ? '#FFFFFF' : '#1A1A2E',
    marginBottom: 2,
  },
  statsCardLabel: {
    fontSize: 11,
    color: isDarkMode ? '#9CA3AF' : '#444',
    fontWeight: '500',
    textAlign: 'center',
  },

  // ─── Section Title ──────────────────────────
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 12,
  },

  // ─── Job Card ───────────────────────────────
  jobCard: {
    backgroundColor: theme.colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.sm,
  },
  jobCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  jobLogoContainer: {
    width: 46,
    height: 46,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  jobLogoText: {
    fontSize: 20,
    fontWeight: '800',
  },
  jobInfo: { flex: 1 },
  jobTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 3,
  },
  jobSubtitle: {
    fontSize: 12,
    color: theme.colors.textMuted,
  },
  categoryBadge: {
    backgroundColor: theme.colors.cardBackgroundLight,
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 6,
    marginLeft: 8,
  },
  categoryBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: theme.colors.textMuted,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  jobDescription: {
    fontSize: 13,
    color: theme.colors.textMuted,
    lineHeight: 19,
    marginBottom: 12,
  },
  jobCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  budgetPill: {
    flexDirection: 'row',
    alignItems: 'baseline',
    backgroundColor: theme.colors.cardBackgroundLight,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    marginRight: 2,
  },
  jobBudget: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.text,
  },
  jobBudgetUnit: {
    fontSize: 11,
    color: theme.colors.textMuted,
    fontWeight: '400',
    marginLeft: 1,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: theme.colors.cardBackgroundLight,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
  },
  locationText: {
    fontSize: 11,
    color: theme.colors.textMuted,
    fontWeight: '500',
  },
  tag: {
    backgroundColor: theme.colors.cardBackgroundLight,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 7,
  },
  tagText: {
    fontSize: 11,
    color: theme.colors.textMuted,
    fontWeight: '500',
  },

  // ─── Job Actions Row ────────────────────────
  jobActionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 10,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  editJobBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.cardBackgroundLight,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 5,
  },
  editJobBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  deleteJobBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.warningBg,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 5,
  },
  deleteJobBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.warning,
  },

  // ─── Empty State ────────────────────────────
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.cardBackgroundLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 6,
  },
  emptyBody: {
    fontSize: 14,
    color: theme.colors.textMuted,
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyBtn: {
    backgroundColor: theme.colors.primary,
    height: 54,
    paddingHorizontal: 28,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyBtnText: {
    color: isDarkMode ? '#111827' : '#FFF',
    fontWeight: '700',
    fontSize: 15,
  },
});

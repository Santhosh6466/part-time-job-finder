import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  FlatList,
  Image,
  Modal,
  Platform,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import * as themeConst from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';
import { getCategoryLabel } from '../../constants/categories';
import { showAlert, showConfirm } from '../../services/alert';
import { getToken, providerAPI, decodeJWT } from '../../services/api';
import { enrichProviderApplications, EnrichedProviderApplication } from '../../services/profileUtils';
import { Application } from '../../types';
import { FadeInView } from '../../components/FadeInView';
import { AnimatedButton } from '../../components/AnimatedButton';


const getStatusStyles = (theme: any): Record<Application['status'], { color: string; bg: string }> => ({
  ACCEPTED: { color: theme.colors.success, bg: theme.colors.successBg },
  PENDING: { color: theme.colors.pending, bg: theme.colors.pendingBg },
  REJECTED: { color: theme.colors.warning, bg: theme.colors.warningBg },
});

const JOB_LOGO_COLORS = [
  { bg: '#EEE8FF', text: '#6B4EFF' },
  { bg: '#FFE8E8', text: '#FF4E4E' },
  { bg: '#E8F4FF', text: '#1E90FF' },
  { bg: '#E8FFE8', text: '#2DB55D' },
  { bg: '#FFF5E8', text: '#FF9500' },
  { bg: '#FFE8F8', text: '#C548AB' },
];

export default function ProviderApplicationsScreen() {
  const { colors, isDarkMode } = useTheme();
  const theme = { ...themeConst.PROFESSIONAL_THEME, colors };
  const styles = getStyles(theme, isDarkMode);

  const [applications, setApplications] = useState<EnrichedProviderApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [companyName, setCompanyName] = useState('Company');
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [selectedApplicant, setSelectedApplicant] = useState<EnrichedProviderApplication | null>(null);

  const fetchApplications = useCallback(async () => {
    try {
      const response = await providerAPI.getApplications();
      const data = response.data?.data || response.data;
      let appList = Array.isArray(data) ? data : [];
      
      if (appList.length > 0) {
        appList = await enrichProviderApplications(appList);
      }
      setApplications(appList);
    } catch (error: any) {
      console.log('❌ Fetch provider applications error:', error?.response?.status);
      if (error.response?.status !== 404) {
        setApplications([]);
      }
    }
  }, []);

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    (async () => {
      // Load company name for job logos
      try {
        const profileRes = await providerAPI.getProfile();
        const pd = profileRes.data?.data || profileRes.data;
        if (pd?.companyName) setCompanyName(pd.companyName);
      } catch {}
      await fetchApplications();
      setLoading(false);
    })();
  }, [fetchApplications, fadeAnim]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchApplications();
    setRefreshing(false);
  };

  const handleUpdateStatus = async (applicationId: number, status: 'ACCEPTED' | 'REJECTED') => {
    setUpdatingId(applicationId);
    try {
      await providerAPI.updateApplicationStatus(applicationId, status);
      showAlert('Success', `Application ${status.toLowerCase()}.`);
      // Update local state
      setApplications((prev) =>
        prev.map((app) =>
          app.id === applicationId ? { ...app, status } : app
        )
      );
    } catch (error: any) {
      const msg =
        error.response?.data?.error?.message ||
        error.response?.data?.message ||
        'Failed to update status.';
      showAlert('Error', msg);
    } finally {
      setUpdatingId(null);
    }
  };

  const confirmAction = (applicationId: number, status: 'ACCEPTED' | 'REJECTED') => {
    const action = status === 'ACCEPTED' ? 'accept' : 'reject';
    showConfirm(
      `${status === 'ACCEPTED' ? 'Accept' : 'Reject'} Application`,
      `Are you sure you want to ${action} this application?`,
      () => handleUpdateStatus(applicationId, status),
      status === 'ACCEPTED' ? 'Accept' : 'Reject'
    );
  };

  const renderApplication = ({ item, index }: { item: EnrichedProviderApplication; index: number }) => {
    const statusStyle = getStatusStyles(theme)[item.status] || { color: theme.colors.textMuted, bg: theme.colors.bg };
    const isPending = item.status === 'PENDING';
    const isUpdating = updatingId === item.id;

    const displayName = item.seekerFullName || item.seekerName || item.seekerEmail?.split('@')[0] || 'Applicant';
    const applicantInitial = displayName.charAt(0).toUpperCase();

    const hasProfile = !!item.seekerFullName;
    const skillsList = Array.isArray(item.seekerSkills)
      ? item.seekerSkills
      : (item.seekerSkills ? (item.seekerSkills as any).split(',').map((s: string) => s.trim()).filter(Boolean) : []);

    const reqSkillsList = Array.isArray(item.jobSkillsRequired)
      ? item.jobSkillsRequired
      : (item.jobSkillsRequired ? (item.jobSkillsRequired as any).split(',').map((s: string) => s.trim()).filter(Boolean) : []);

    return (
      <FadeInView delay={Math.min(index * 60, 300)}>
        <View style={styles.card}>
          {/* ── Applicant Details Section ── */}
          <View style={styles.applicantProfileRow}>
            <View style={styles.avatarCircle}>
              {item.seekerProfileImageUrl ? (
                <Image source={{ uri: item.seekerProfileImageUrl }} style={styles.avatarImage} />
              ) : (
                <Text style={styles.avatarInitial}>{applicantInitial}</Text>
              )}
            </View>
            <View style={styles.applicantDetails}>
              <Text style={styles.applicantName}>{displayName}</Text>
              {item.seekerEmail && (
                <Text style={styles.applicantEmail}>{item.seekerEmail}</Text>
              )}
            </View>
          </View>

          {hasProfile ? (
            <View style={{ marginBottom: 12 }}>
              {item.seekerPhone && (
                <View style={styles.attributeRow}>
                  <Ionicons name="call-outline" size={14} color={theme.colors.textMuted} />
                  <Text style={styles.attributeText}>{item.seekerPhone}</Text>
                </View>
              )}
              {item.seekerLocation && (
                <View style={styles.attributeRow}>
                  <Ionicons name="location-outline" size={14} color={theme.colors.textMuted} />
                  <Text style={styles.attributeText}>{item.seekerLocation}</Text>
                </View>
              )}
              {item.seekerExperience && (
                <View style={styles.attributeRow}>
                  <Ionicons name="briefcase-outline" size={14} color={theme.colors.textMuted} />
                  <Text style={styles.attributeText}>{item.seekerExperience}</Text>
                </View>
              )}

              {skillsList.length > 0 && (
                <View style={[styles.skillsContainer, { marginTop: 8 }]}>
                  {skillsList.map((skill: string, idx: number) => (
                    <View key={idx} style={styles.skillTag}>
                      <Text style={styles.skillTagText}>{skill}</Text>
                    </View>
                  ))}
                </View>
              )}

              {item.seekerBio && (
                <Text style={[styles.seekerBioText, { marginTop: 8 }]} numberOfLines={3}>
                  {item.seekerBio}
                </Text>
              )}
            </View>
          ) : (
            <Text style={styles.profileMissingText}>Applicant profile has not been completed.</Text>
          )}

          <View style={styles.dividerLineLight} />

          {/* ── Applied For Section ── */}
          <View style={styles.appliedJobSection}>
            <Text style={styles.appliedForHeader}>Applied For</Text>
            <Text style={styles.jobTitleText}>{item.jobTitle || `Job #${item.jobId}`}</Text>
            
            <View style={styles.jobMetaRow}>
              {item.jobCategory ? <Text style={styles.jobMetaText}>Category: {getCategoryLabel(item.jobCategory)}</Text> : null}
              {item.jobBudget != null ? <Text style={styles.jobMetaText}>Budget: ₹{item.jobBudget.toLocaleString('en-IN')}</Text> : null}
              {item.jobLocation ? <Text style={styles.jobMetaText}>Location: {item.jobLocation}</Text> : null}
            </View>

            {item.jobDescription ? (
              <Text style={styles.jobDescText} numberOfLines={3}>{item.jobDescription}</Text>
            ) : null}

            {reqSkillsList.length > 0 && (
              <View style={styles.skillsContainer}>
                {reqSkillsList.map((skill: string, idx: number) => (
                  <View key={idx} style={styles.skillTag}>
                    <Text style={styles.skillTagText}>{skill}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>

          <View style={styles.dividerLineLight} />

          {/* ── Status and Actions ── */}
          <View style={styles.bottomStatusRow}>
            <View style={[styles.statusBadge, { borderColor: statusStyle.color, backgroundColor: statusStyle.bg }]}>
              <View style={[styles.statusDot, { backgroundColor: statusStyle.color }]} />
              <Text style={[styles.statusBadgeText, { color: statusStyle.color }]}>{item.status}</Text>
            </View>

            {isPending && (
              <View style={styles.actionRow}>
                <AnimatedButton
                  style={styles.acceptBtn}
                  onPress={() => confirmAction(item.id, 'ACCEPTED')}
                  disabled={isUpdating}
                >
                  {isUpdating ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <>
                      <Ionicons name="checkmark-circle-outline" size={16} color="#fff" style={{ marginRight: 6 }} />
                      <Text style={styles.acceptBtnText}>ACCEPT</Text>
                    </>
                  )}
                </AnimatedButton>
                <AnimatedButton
                  style={styles.rejectBtn}
                  onPress={() => confirmAction(item.id, 'REJECTED')}
                  disabled={isUpdating}
                >
                  <Ionicons name="close-circle-outline" size={16} color={theme.colors.warning} style={{ marginRight: 6 }} />
                  <Text style={styles.rejectBtnText}>REJECT</Text>
                </AnimatedButton>
              </View>
            )}
          </View>

          {/* View Full Profile Button */}
          {hasProfile && (
            <AnimatedButton
              style={styles.viewProfileBtn}
              onPress={() => setSelectedApplicant(item)}
            >
              <Ionicons name="person-circle-outline" size={16} color={theme.colors.primary} />
              <Text style={styles.viewProfileBtnText}>View Full Profile</Text>
            </AnimatedButton>
          )}
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

  return (
    <View style={styles.screen}>
      <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
        <View style={{ position: 'absolute', top: -1000, left: 0, right: 0, height: 1000, backgroundColor: '#D2C5FC' }} />
        <LinearGradient
          colors={['#D2C5FC', '#EBE7FF', 'rgba(255, 255, 255, 0)']}
          style={styles.gradientHeader}
        >
          <View style={styles.headerSection}>
            <Text style={styles.screenTitle}>Applicants</Text>
            <Text style={styles.body}>Review and manage applications for your gigs.</Text>
          </View>
        </LinearGradient>

        <FlatList
          data={applications}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderApplication}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <View style={styles.emptyIconCircle}>
                <Ionicons name="people-outline" size={32} color={theme.colors.textMuted} />
              </View>
              <Text style={styles.emptyTitle}>No applications yet</Text>
              <Text style={styles.emptyBody}>Applicants will appear here when seekers apply.</Text>
            </View>
          }
        />
      </Animated.View>

      {/* ── Seeker Profile Modal ── */}
      <Modal visible={selectedApplicant !== null} animationType="slide" transparent={false}>
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setSelectedApplicant(null)} style={styles.modalCloseBtn}>
              <Ionicons name="close" size={24} color={theme.colors.text} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Applicant Profile</Text>
            <View style={{ width: 32 }} />
          </View>
          {selectedApplicant && (
            <ScrollView contentContainerStyle={styles.modalScrollContent} showsVerticalScrollIndicator={false}>
              {/* Avatar + Name */}
              <View style={styles.modalAvatarSection}>
                <View style={styles.modalAvatarCircle}>
                  {selectedApplicant.seekerProfileImageUrl ? (
                    <Image source={{ uri: selectedApplicant.seekerProfileImageUrl }} style={styles.modalAvatarImage} />
                  ) : (
                    <Text style={styles.modalAvatarText}>
                      {(selectedApplicant.seekerFullName || selectedApplicant.seekerName || 'A').charAt(0).toUpperCase()}
                    </Text>
                  )}
                </View>
                <Text style={styles.modalName}>
                  {selectedApplicant.seekerFullName || selectedApplicant.seekerName || 'Applicant'}
                </Text>
                {selectedApplicant.seekerEmail && (
                  <Text style={styles.modalEmail}>{selectedApplicant.seekerEmail}</Text>
                )}
              </View>

              {/* Applied For */}
              <View style={styles.modalInfoCard}>
                <Text style={styles.modalInfoLabel}>Applied For</Text>
                <Text style={styles.modalInfoValue}>{selectedApplicant.jobTitle || `Job #${selectedApplicant.jobId}`}</Text>
              </View>

              {/* Experience */}
              {selectedApplicant.seekerExperience ? (
                <View style={styles.modalInfoCard}>
                  <Text style={styles.modalInfoLabel}>Experience</Text>
                  <Text style={styles.modalInfoValue}>{selectedApplicant.seekerExperience}</Text>
                </View>
              ) : null}

              {/* Location */}
              {selectedApplicant.seekerLocation ? (
                <View style={styles.modalInfoCard}>
                  <Text style={styles.modalInfoLabel}>Location</Text>
                  <Text style={styles.modalInfoValue}>{selectedApplicant.seekerLocation}</Text>
                </View>
              ) : null}

              {/* Phone */}
              {selectedApplicant.seekerPhone ? (
                <View style={styles.modalInfoCard}>
                  <Text style={styles.modalInfoLabel}>Phone</Text>
                  <Text style={styles.modalInfoValue}>{selectedApplicant.seekerPhone}</Text>
                </View>
              ) : null}

              {/* Skills */}
              {(() => {
                const skills = Array.isArray(selectedApplicant.seekerSkills)
                  ? selectedApplicant.seekerSkills
                  : (selectedApplicant.seekerSkills ? selectedApplicant.seekerSkills.split(',').map((s: string) => s.trim()).filter(Boolean) : []);
                return skills.length > 0 ? (
                  <View style={styles.modalInfoCard}>
                    <Text style={styles.modalInfoLabel}>Skills</Text>
                    <View style={styles.modalSkillsRow}>
                      {skills.map((skill: string, idx: number) => (
                        <View key={idx} style={styles.modalSkillTag}>
                          <Text style={styles.modalSkillTagText}>{skill}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                ) : null;
              })()}

              {/* Bio */}
              {selectedApplicant.seekerBio ? (
                <View style={styles.modalInfoCard}>
                  <Text style={styles.modalInfoLabel}>About</Text>
                  <Text style={styles.modalInfoValue}>{selectedApplicant.seekerBio}</Text>
                </View>
              ) : null}

              <View style={{ height: 40 }} />
            </ScrollView>
          )}
        </SafeAreaView>
      </Modal>
    </View>
  );
}

const getStyles = (theme: any, isDarkMode: boolean) => StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.bg,
  },
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gradientHeader: {
    paddingTop: Platform.OS === 'ios' ? 50 : 35,
  },
  headerSection: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 16,
  },
  screenTitle: {
    color: theme.colors.text,
    ...theme.typography.display,
    marginBottom: 8,
  },
  body: {
    color: theme.colors.textMuted,
    ...theme.typography.body,
  },
  listContent: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  card: {
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borders.radiusLg,
    padding: 20,
    marginBottom: 12,
    ...theme.shadows.sm,
  },
  // ─── Job Card Header ────────────────────────
  jobCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
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
  jobRoleText: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 2,
  },
  jobCompanyText: {
    fontSize: 12,
    color: theme.colors.textMuted,
    fontWeight: '500',
  },
  dividerLineLight: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginVertical: 14,
    opacity: 0.6,
  },
  applicantProfileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFF0E8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
    borderWidth: 1,
    borderColor: 'rgba(232, 78, 27, 0.2)',
  },
  avatarImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  avatarInitial: {
    color: theme.colors.primary,
    fontSize: 20,
    fontWeight: '700',
  },
  applicantDetails: {
    flex: 1,
  },
  applicantName: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  applicantEmail: {
    color: theme.colors.textMuted,
    fontSize: 13,
  },
  attributesContainer: {
    marginBottom: 16,
    gap: 8,
  },
  attributeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  attributeText: {
    color: theme.colors.text,
    fontSize: 13,
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  skillTag: {
    backgroundColor: theme.colors.cardBackgroundLight || '#F8F9FA',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  skillTagText: {
    color: theme.colors.textMuted,
    fontSize: 11,
    fontWeight: '500',
  },
  seekerBioText: {
    color: theme.colors.textMuted,
    fontSize: 13,
    lineHeight: 19,
    fontStyle: 'italic',
    marginBottom: 16,
    paddingLeft: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: theme.borders.pill,
    gap: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: theme.borders.pill,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 1,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
    flex: 1,
    justifyContent: 'flex-end',
    marginLeft: 12,
  },
  acceptBtn: {
    flex: 1,
    backgroundColor: theme.colors.success,
    borderRadius: theme.borders.radius,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    ...theme.shadows.sm,
  },
  acceptBtnText: {
    color: '#ffffff',
    ...theme.typography.caption,
  },
  rejectBtn: {
    flex: 1,
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.warning,
    borderRadius: theme.borders.radius,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    ...theme.shadows.sm,
  },
  rejectBtnText: {
    color: theme.colors.warning,
    ...theme.typography.caption,
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 80,
  },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: theme.colors.cardBackgroundLight,
    borderWidth: 1,
    borderColor: theme.colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    color: theme.colors.text,
    ...theme.typography.h2,
    marginBottom: 8,
  },
  emptyBody: {
    color: theme.colors.textMuted,
    ...theme.typography.body,
  },
  viewProfileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    marginTop: 12,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    borderRadius: theme.borders.radius,
    gap: 6,
  },
  viewProfileBtnText: {
    color: theme.colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: theme.colors.bg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text,
  },
  modalScrollContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 40,
  },
  modalAvatarSection: {
    alignItems: 'center',
    marginBottom: 28,
  },
  modalAvatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFF0E8',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(232, 78, 27, 0.2)',
  },
  modalAvatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  modalAvatarText: {
    color: theme.colors.primary,
    fontSize: 32,
    fontWeight: '700',
  },
  modalName: {
    fontSize: 22,
    fontWeight: '800',
    color: theme.colors.text,
    marginBottom: 4,
  },
  modalEmail: {
    fontSize: 14,
    color: theme.colors.textMuted,
  },
  modalInfoCard: {
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borders.radiusLg,
    padding: 16,
    marginBottom: 12,
  },
  modalInfoLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  modalInfoValue: {
    fontSize: 15,
    color: theme.colors.text,
    lineHeight: 22,
  },
  modalSkillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 6,
  },
  modalSkillTag: {
    backgroundColor: theme.colors.cardBackgroundLight || '#F8F9FA',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  modalSkillTagText: {
    color: theme.colors.textMuted,
    fontSize: 12,
    fontWeight: '500',
  },
  profileMissingText: {
    color: theme.colors.textMuted,
    fontSize: 13,
    fontStyle: 'italic',
    marginBottom: 12,
    paddingLeft: 2,
  },
  appliedJobSection: {
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: theme.borders.radius,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: 12,
  },
  appliedForHeader: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  jobTitleText: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 6,
  },
  jobMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 8,
  },
  jobMetaText: {
    fontSize: 12,
    color: theme.colors.textMuted,
    fontWeight: '500',
  },
  jobDescText: {
    color: theme.colors.text,
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 12,
  },
  bottomStatusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 8,
  },
});

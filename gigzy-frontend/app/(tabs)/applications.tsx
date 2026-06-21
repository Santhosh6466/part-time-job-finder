import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  FlatList,
  Image,
  Linking,
  Platform,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Modal,
  ScrollView
} from 'react-native';
import { getCategoryLabel } from '../../constants/categories';
import { PROFESSIONAL_THEME as theme } from '../../constants/theme';
import { enrichSeekerApplications, EnrichedSeekerApplication } from '../../services/profileUtils';
import { showAlert, showConfirm } from '../../services/alert';
import { seekerAPI } from '../../services/api';
import { Application, Job } from '../../types';
import { FadeInView } from '../../components/FadeInView';

// ─── Status config ────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<
  Application['status'],
  { color: string; bg: string; border: string; label: string }
> = {
  PENDING: { color: '#B36B00', bg: '#FFF3E0', border: '#FFB74D', label: 'Pending' },
  ACCEPTED: { color: '#146C2E', bg: '#E8F5E9', border: '#66BB6A', label: 'Accepted' },
  REJECTED: { color: '#B3261E', bg: '#FCEEEE', border: '#EF9A9A', label: 'Rejected' },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatDate(dateStr?: string): string | null {
  if (!dateStr) return null;
  try {
    const d = new Date(dateStr);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - d.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
    if (diffDays <= 1) return 'Today';
    if (diffDays === 2) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  } catch {
    return dateStr;
  }
}

function formatBudget(budget?: number): string | null {
  if (budget == null) return null;
  return `₹${budget.toLocaleString('en-IN')}/mo`;
}

function parseSkills(raw?: string | string[]): string[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.filter(Boolean);
  return raw.split(',').map((s) => s.trim()).filter(Boolean);
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function ApplicationsScreen() {
  const router = useRouter();
  const [applications, setApplications] = useState<EnrichedSeekerApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [cancellingId, setCancellingId] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  
  // Details Modal State
  const [selectedApp, setSelectedApp] = useState<EnrichedSeekerApplication | null>(null);

  // ── Fetch & enrich ──────────────────────────────────────────────────────
  const fetchApplications = useCallback(async () => {
    setErrorMsg(null);
    try {
      const appResponse = await seekerAPI.getApplications();
      const data = appResponse.data?.data || appResponse.data;
      const appList: Application[] = Array.isArray(data) ? data : [];

      const enriched = await enrichSeekerApplications(appList);
      setApplications(enriched);
    } catch (error: any) {
      console.log('❌ Fetch applications error:', error?.message);
      const status = error?.response?.status;
      setApplications([]);
      if (status !== 404) {
        setErrorMsg('Could not load applications. Pull down to retry.');
      }
    }
  }, []);

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    (async () => {
      await fetchApplications();
      setLoading(false);
    })();
  }, [fetchApplications, fadeAnim]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchApplications();
    setRefreshing(false);
  };

  // ── Actions ──────────────────────────────────────────────────
  const handleCancel = (item: EnrichedSeekerApplication) => {
    const label = item.jobTitle || `Job #${item.jobId}`;
    showConfirm(
      'Cancel Application',
      `Are you sure you want to cancel your application for "${label}"?`,
      async () => {
        setCancellingId(item.id);
        setSelectedApp(null); // Close modal if open
        try {
          await seekerAPI.cancelApplication(item.id);
          showAlert('Cancelled', 'Your application has been cancelled.');
          await fetchApplications();
        } catch (error: any) {
          const msg =
            error?.response?.data?.message ||
            error?.response?.data?.error?.message ||
            'Failed to cancel application. Please try again.';
          showAlert('Error', msg);
        } finally {
          setCancellingId(null);
        }
      },
      'Yes, Cancel'
    );
  };

  const handleViewJob = (item: EnrichedSeekerApplication) => {
    if (item._job) {
      router.push({
        pathname: '/job/[id]',
        params: { id: item._job.id, jobStr: JSON.stringify(item._job) },
      });
    } else {
      showAlert('Error', 'Job details are no longer available.');
    }
  };

  // ── Details Modal ───────────────────────────────────────────────────────
  const renderDetailsModal = () => {
    if (!selectedApp) return null;
    const item = selectedApp;
    const title = item.jobTitle || `Job #${item.jobId}`;
    const skills = parseSkills(item.jobSkillsRequired);
    const appliedOn = formatDate(item.appliedDate);
    const isCancelling = cancellingId === item.id;
    const cfg = STATUS_CONFIG[item.status] ?? STATUS_CONFIG.PENDING;

    return (
      <Modal
        visible={!!selectedApp}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSelectedApp(null)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setSelectedApp(null)} style={styles.modalCloseBtn}>
              <Ionicons name="close" size={24} color={theme.colors.text} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Application Details</Text>
            <View style={{ width: 40 }} />
          </View>

          <ScrollView contentContainerStyle={styles.modalScroll}>
            {/* Header info */}
            <View style={styles.modalTopSection}>
              <Text style={styles.modalJobTitle}>{title}</Text>
              <Text style={styles.modalCompanyName}>
                {item._providerProfile?.companyName || item.jobCompanyName || item._job?.companyName || 'Unknown Company'}
              </Text>
              
              <View style={styles.modalMetaRow}>
                <View style={[styles.statusBadge, { backgroundColor: cfg.bg }]}>
                  <View style={[styles.statusDot, { backgroundColor: cfg.color }]} />
                  <Text style={[styles.statusText, { color: cfg.color }]}>{cfg.label}</Text>
                </View>
                <Text style={styles.modalMetaText}>Applied {appliedOn}</Text>
                <Text style={styles.modalMetaText}>ID: #{item.id}</Text>
              </View>
            </View>

            <View style={styles.modalDivider} />

            {/* Job details */}
            <View style={styles.modalSection}>
              <Text style={styles.modalSectionTitle}>Job Description</Text>
              <Text style={styles.modalBodyText}>{item.jobDescription || 'No description provided.'}</Text>
            </View>
            
            <View style={styles.modalSection}>
              <Text style={styles.modalSectionTitle}>Required Skills</Text>
              {skills.length > 0 ? (
                <View style={styles.modalSkillsRow}>
                  {skills.map((skill, idx) => (
                    <View key={idx} style={styles.modalSkillChip}>
                      <Text style={styles.modalSkillText}>{skill}</Text>
                    </View>
                  ))}
                </View>
              ) : (
                <Text style={styles.modalBodyText}>Not specified</Text>
              )}
            </View>

            <View style={styles.modalDivider} />

            {/* Company Details */}
            <View style={styles.modalSection}>
              <Text style={styles.modalSectionTitle}>Company Details</Text>
              <View style={styles.modalDetailRow}>
                <Ionicons name="business-outline" size={16} color={theme.colors.textMuted} />
                <Text style={styles.modalDetailText}>{item._providerProfile?.companyName || item.jobCompanyName || 'N/A'}</Text>
              </View>
              <View style={styles.modalDetailRow}>
                <Ionicons name="location-outline" size={16} color={theme.colors.textMuted} />
                <Text style={styles.modalDetailText}>{item._providerProfile?.location || item.jobLocation || 'N/A'}</Text>
              </View>
              <View style={styles.modalDetailRow}>
                <Ionicons name="call-outline" size={16} color={theme.colors.textMuted} />
                <Text style={styles.modalDetailText}>{item._providerProfile?.phoneNumber || 'N/A'}</Text>
              </View>
              <View style={styles.modalDetailRow}>
                <Ionicons name="mail-outline" size={16} color={theme.colors.textMuted} />
                <Text style={styles.modalDetailText}>{item._job?.providerEmail || 'N/A'}</Text>
              </View>
              {item._providerProfile?.companyDescription ? (
                <Text style={[styles.modalBodyText, { marginTop: 8 }]}>
                  {item._providerProfile.companyDescription}
                </Text>
              ) : null}
            </View>

            <View style={styles.modalDivider} />

            {/* Actions */}
            <View style={styles.modalSection}>
              {item.status === 'ACCEPTED' ? (
                <View style={styles.modalActionsGrid}>
                  {item._providerProfile?.phoneNumber ? (
                    <TouchableOpacity 
                      style={styles.btnPrimary}
                      activeOpacity={0.8}
                      onPress={() => Linking.openURL(`tel:${item._providerProfile?.phoneNumber}`)}
                    >
                      <Ionicons name="call" size={18} color="#FFF" />
                      <Text style={styles.btnPrimaryText}>Call Provider</Text>
                    </TouchableOpacity>
                  ) : null}
                  {item._job?.providerEmail ? (
                    <TouchableOpacity 
                      style={styles.btnOutline}
                      activeOpacity={0.8}
                      onPress={() => Linking.openURL(`mailto:${item._job?.providerEmail}`)}
                    >
                      <Ionicons name="mail" size={18} color={theme.colors.primary} />
                      <Text style={styles.btnOutlineText}>Email Provider</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              ) : item.status === 'PENDING' ? (
                <TouchableOpacity 
                  style={styles.btnDangerOutline}
                  activeOpacity={0.8}
                  onPress={() => handleCancel(item)}
                  disabled={isCancelling}
                >
                  {isCancelling ? (
                    <ActivityIndicator size="small" color="#B3261E" />
                  ) : (
                    <>
                      <Ionicons name="trash-outline" size={18} color="#B3261E" />
                      <Text style={styles.btnDangerOutlineText}>Cancel Application</Text>
                    </>
                  )}
                </TouchableOpacity>
              ) : null}
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    );
  };

  // ── Render card ──────────────────────────────────────────────────────────
  const renderApplication = ({ item, index }: { item: EnrichedSeekerApplication; index: number }) => {
    const cfg = STATUS_CONFIG[item.status] ?? STATUS_CONFIG.PENDING;
    const title = item.jobTitle || `Job #${item.jobId}`;
    const companyName = item._providerProfile?.companyName || item.jobCompanyName || item._job?.companyName || 'Unknown Company';
    const skills = parseSkills(item.jobSkillsRequired);
    const budget = formatBudget(item.jobBudget);
    const appliedOn = formatDate(item.appliedDate);
    const location = item.jobLocation || item._job?.location;

    return (
      <FadeInView delay={Math.min(index * 60, 300)} slideUp={true} slideOffset={20}>
        <View style={styles.compactCard}>
          {/* Top Row: Logo, Company Name, Status */}
          <View style={styles.cardHeaderRow}>
            <View style={styles.cardHeaderLeft}>
              {item._providerProfile?.profileImageUrl ? (
                <Image source={{ uri: item._providerProfile.profileImageUrl }} style={styles.compactLogo} />
              ) : (
                <View style={styles.compactLogoFallback}>
                  <Ionicons name="business" size={12} color={theme.colors.textMuted} />
                </View>
              )}
              <Text style={styles.compactCompanyName} numberOfLines={1}>{companyName}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: cfg.bg }]}>
              <View style={[styles.statusDot, { backgroundColor: cfg.color }]} />
              <Text style={[styles.statusText, { color: cfg.color }]}>{cfg.label}</Text>
            </View>
          </View>

          {/* Job Title */}
          <Text style={styles.compactJobTitle} numberOfLines={1}>{title}</Text>

          {/* Metadata Row */}
          <View style={styles.compactMetaRow}>
            {budget && <Text style={styles.compactMetaText}>{budget}</Text>}
            {budget && location && <Text style={styles.metaDot}>•</Text>}
            {location && <Text style={styles.compactMetaText}>{location}</Text>}
            {(budget || location) && appliedOn && <Text style={styles.metaDot}>•</Text>}
            {appliedOn && <Text style={styles.compactMetaText}>{appliedOn}</Text>}
          </View>

          {/* Skills Row */}
          {skills.length > 0 && (
            <View style={styles.compactSkillsRow}>
              {skills.slice(0, 3).map((skill, idx) => (
                <View key={idx} style={styles.compactSkillChip}>
                  <Text style={styles.compactSkillText}>{skill}</Text>
                </View>
              ))}
              {skills.length > 3 && (
                <View style={styles.compactSkillChip}>
                  <Text style={styles.compactSkillText}>+{skills.length - 3}</Text>
                </View>
              )}
            </View>
          )}

          {/* Actions Row */}
          <View style={styles.compactActionsRow}>
            <TouchableOpacity 
              style={styles.btnSecondary} 
              activeOpacity={0.7}
              onPress={() => handleViewJob(item)}
            >
              <Text style={styles.btnSecondaryText}>View Job</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.btnPrimary} 
              activeOpacity={0.8}
              onPress={() => setSelectedApp(item)}
            >
              <Text style={styles.btnPrimaryText}>View Details</Text>
            </TouchableOpacity>
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

  return (
    <View style={styles.screen}>
      <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
        <View style={{ position: 'absolute', top: -1000, left: 0, right: 0, height: 1000, backgroundColor: 'rgba(90, 79, 207, 0.10)' }} />
        <LinearGradient
          colors={['rgba(90, 79, 207, 0.10)', 'rgba(250, 250, 252, 0)']}
          style={styles.gradientHeader}
        >
          <View style={styles.headerSection}>
            <Text style={styles.screenTitle}>My Applications</Text>
            <Text style={styles.body}>Track the status of your gig applications.</Text>
          </View>
        </LinearGradient>

        {errorMsg ? (
          <View style={styles.errorBanner}>
            <Ionicons name="alert-circle-outline" size={16} color="#B3261E" />
            <Text style={styles.errorBannerText}>{errorMsg}</Text>
          </View>
        ) : null}

        <FlatList
          data={applications}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderApplication}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={theme.colors.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <View style={styles.emptyIconCircle}>
                <Ionicons name="document-text-outline" size={32} color={theme.colors.textMuted} />
              </View>
              <Text style={styles.emptyTitle}>No applications yet</Text>
              <Text style={styles.emptyBody}>Apply to gigs from the Home tab.</Text>
            </View>
          }
        />
      </Animated.View>

      {renderDetailsModal()}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.colors.bg },
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  gradientHeader: { paddingTop: Platform.OS === 'ios' ? 50 : 35 },
  headerSection: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 16 },
  screenTitle: { color: theme.colors.text, fontSize: 26, fontWeight: '700', letterSpacing: -0.5, marginBottom: 4 },
  body: { color: theme.colors.textMuted, fontSize: 14 },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 12,
    padding: 12,
    backgroundColor: '#FCEEEE',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#EF9A9A',
    gap: 8,
  },
  errorBannerText: { flex: 1, fontSize: 13, color: '#B3261E' },
  listContent: { paddingHorizontal: 20, paddingBottom: 32 },

  // ── Compact Card
  compactCard: {
    backgroundColor: theme.colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  compactLogo: {
    width: 20,
    height: 20,
    borderRadius: 4,
    marginRight: 8,
  },
  compactLogoFallback: {
    width: 20,
    height: 20,
    borderRadius: 4,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  compactCompanyName: {
    fontSize: 13,
    color: theme.colors.textMuted,
    fontWeight: '500',
    flexShrink: 1,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 11, fontWeight: '600' },
  compactJobTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 6,
  },
  compactMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  compactMetaText: {
    fontSize: 13,
    color: theme.colors.textMuted,
  },
  metaDot: {
    fontSize: 13,
    color: theme.colors.textDim,
    marginHorizontal: 6,
  },
  compactSkillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 16,
  },
  compactSkillChip: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  compactSkillText: {
    fontSize: 12,
    color: theme.colors.text,
    fontWeight: '500',
  },
  compactActionsRow: {
    flexDirection: 'row',
    gap: 12,
  },

  // ── Buttons
  btnPrimary: {
    flex: 1,
    height: 44,
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  btnPrimaryText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  btnSecondary: {
    flex: 1,
    height: 44,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  btnSecondaryText: {
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  btnOutline: {
    flex: 1,
    height: 44,
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: theme.colors.primary,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  btnOutlineText: {
    color: theme.colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  btnDangerOutline: {
    height: 44,
    backgroundColor: '#FFF',
    borderWidth: 1.5,
    borderColor: '#EF9A9A',
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  btnDangerOutlineText: {
    color: '#B3261E',
    fontSize: 14,
    fontWeight: '600',
  },

  // ── Modal
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
  modalCloseBtn: {
    padding: 4,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
  },
  modalScroll: {
    paddingBottom: 40,
  },
  modalTopSection: {
    padding: 24,
  },
  modalJobTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 8,
  },
  modalCompanyName: {
    fontSize: 16,
    color: theme.colors.primary,
    fontWeight: '500',
    marginBottom: 16,
  },
  modalMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flexWrap: 'wrap',
  },
  modalMetaText: {
    fontSize: 13,
    color: theme.colors.textMuted,
  },
  modalDivider: {
    height: 8,
    backgroundColor: theme.colors.cardBackgroundLight,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: theme.colors.border,
  },
  modalSection: {
    padding: 24,
  },
  modalSectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 16,
  },
  modalBodyText: {
    fontSize: 15,
    color: theme.colors.text,
    lineHeight: 24,
  },
  modalSkillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  modalSkillChip: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  modalSkillText: {
    fontSize: 13,
    color: theme.colors.text,
    fontWeight: '500',
  },
  modalDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  modalDetailText: {
    fontSize: 15,
    color: theme.colors.text,
  },
  modalActionsGrid: {
    flexDirection: 'column',
    gap: 12,
  },

  // ── Empty state
  emptyState: { alignItems: 'center', paddingTop: 80 },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyTitle: { color: theme.colors.text, fontSize: 18, fontWeight: '700', marginBottom: 8 },
  emptyBody: { color: theme.colors.textMuted, fontSize: 15, textAlign: 'center' },
});

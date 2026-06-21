import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { PROFESSIONAL_THEME as theme } from '../../constants/theme';
import { getCategoryLabel } from '../../constants/categories';
import { showAlert } from '../../services/alert';
import { seekerAPI } from '../../services/api';
import { Job, ProviderProfile } from '../../types';
import { FadeInView } from '../../components/FadeInView';
import { AnimatedButton } from '../../components/AnimatedButton';

export default function JobDetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { id, jobStr } = params;

  // Parse the passed job object
  const job: Job | null = jobStr ? JSON.parse(jobStr as string) : null;

  const [isApplying, setIsApplying] = useState(false);
  const [isApplied, setIsApplied] = useState(false);
  const [showFullDesc, setShowFullDesc] = useState(false);
  const [providerProfile, setProviderProfile] = useState<ProviderProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);

  // Check if user has already applied to this job
  useEffect(() => {
    if (!job?.id) return;
    seekerAPI.getApplications()
      .then((res) => {
        const data = res.data?.data || res.data;
        if (Array.isArray(data)) {
          const alreadyApplied = data.some(
            (app: any) =>
              String(app.jobId) === String(job.id) &&
              app.status !== 'REJECTED'
          );
          setIsApplied(alreadyApplied);
        }
      })
      .catch(() => { /* ignore */ });
  }, [job?.id]);

  // Fetch provider profile when job has providerEmail or createdBy
  useEffect(() => {
    const email = job?.providerEmail || job?.createdBy;
    if (email) {
      setLoadingProfile(true);
      seekerAPI.getProviderProfileByEmail(email)
        .then((res) => {
          const data = res.data?.data || res.data;
          if (data) setProviderProfile(data as ProviderProfile);
        })
        .catch((err) => {
          console.log('Could not load provider profile:', err?.response?.status);
        })
        .finally(() => setLoadingProfile(false));
    }
  }, [job?.providerEmail, job?.createdBy]);

  if (!job) {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color={theme.colors.textMuted} style={{ marginBottom: 16 }} />
          <Text style={styles.errorText}>Job not found.</Text>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Text style={styles.backBtnText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const handleApply = async () => {
    if (isApplied) return;
    setIsApplying(true);
    try {
      await seekerAPI.applyToJob(job.id);
      setIsApplied(true);
      showAlert('Success', 'Application submitted successfully!');
    } catch (error: any) {
      const msg =
        error.response?.data?.error?.message ||
        error.response?.data?.message ||
        'Failed to apply. Please try again.';
      // If already applied, mark as applied
      if (msg.toLowerCase().includes('already applied')) {
        setIsApplied(true);
      }
      showAlert('Error', msg);
    } finally {
      setIsApplying(false);
    }
  };

  // Company display: prefer job.companyName, then providerProfile, then category label
  const companyDisplay =
    job.companyName ||
    providerProfile?.companyName ||
    getCategoryLabel(job.category) ||
    null;
  const companyInitial = (companyDisplay || job.title || 'J').charAt(0).toUpperCase();

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <TouchableOpacity hitSlop={10}>
          <Ionicons name="ellipsis-vertical" size={24} color={theme.colors.textMuted} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Company Logo + Title Hero */}
        <FadeInView delay={0} duration={350}>
          <View style={styles.heroSection}>
            <View style={styles.logoCircle}>
              {providerProfile?.profileImageUrl ? (
                <Image source={{ uri: providerProfile.profileImageUrl }} style={styles.logoImage} />
              ) : (
                <Text style={styles.logoText}>{companyInitial}</Text>
              )}
            </View>
            {companyDisplay ? (
              <Text style={styles.companyLabel} numberOfLines={1}>{companyDisplay}</Text>
            ) : null}
            <Text style={styles.jobTitle}>{job.title}</Text>

            <View style={styles.metaRow}>
              <Text style={styles.metaText}>{getCategoryLabel(job.category)}</Text>
              <Text style={styles.metaDot}>•</Text>
              <Text style={styles.metaText}>{job.location}</Text>
            </View>
          </View>
        </FadeInView>

        {/* Info Tags Row */}
        <FadeInView delay={80} duration={350}>
          <View style={styles.infoTagsRow}>
            <View style={styles.infoTag}>
              <Ionicons name="cash-outline" size={16} color={theme.colors.primary} />
              <Text style={styles.infoTagText}>₹{job.budget}</Text>
            </View>
            <View style={styles.infoTag}>
              <Ionicons name="location-outline" size={16} color={theme.colors.primary} />
              <Text style={styles.infoTagText}>{job.location}</Text>
            </View>
            <View style={styles.infoTag}>
              <Ionicons name="briefcase-outline" size={16} color={theme.colors.primary} />
              <Text style={styles.infoTagText}>{getCategoryLabel(job.category)}</Text>
            </View>
          </View>
        </FadeInView>

        {/* Description Section */}
        <FadeInView delay={140} duration={350}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Job Description</Text>
            <Text style={styles.descriptionText} numberOfLines={showFullDesc ? undefined : 3}>
              {job.description}
            </Text>
            {job.description && job.description.length > 150 ? (
              <TouchableOpacity
                style={styles.readMoreBtn}
                onPress={() => setShowFullDesc(!showFullDesc)}
              >
                <Text style={styles.readMoreText}>{showFullDesc ? 'Read Less' : 'Read More'}</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </FadeInView>

        {/* Skills Required */}
        {job.skillsRequired && job.skillsRequired.length > 0 ? (
          <FadeInView delay={200} duration={350}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Skills Required</Text>
              {job.skillsRequired.map((skill, index) => (
                <View key={index} style={styles.bulletRow}>
                  <View style={styles.bulletPoint} />
                  <Text style={styles.bulletText}>{skill}</Text>
                </View>
              ))}
            </View>
          </FadeInView>
        ) : null}

        {/* Provider/Company Section */}
        {(providerProfile || job.companyName) ? (
          <FadeInView delay={260} duration={350}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>About Company</Text>
              <View style={styles.companyCard}>
                <View style={styles.companyLogoCircle}>
                  {providerProfile?.profileImageUrl ? (
                    <Image source={{ uri: providerProfile.profileImageUrl }} style={styles.companyLogoImage} />
                  ) : (
                    <Text style={styles.companyLogoText}>
                      {providerProfile?.companyName?.charAt(0).toUpperCase() || job.companyName?.charAt(0).toUpperCase() || 'C'}
                    </Text>
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.companyName}>{providerProfile?.companyName || job.companyName}</Text>
                  {(providerProfile?.location || job.location) ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                      <Ionicons name="location-outline" size={13} color={theme.colors.textMuted} />
                      <Text style={styles.companyMeta}> {providerProfile?.location || job.location}</Text>
                    </View>
                  ) : null}
                  {providerProfile?.phoneNumber ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 3 }}>
                      <Ionicons name="call-outline" size={13} color={theme.colors.textMuted} />
                      <Text style={styles.companyMeta}> {providerProfile.phoneNumber}</Text>
                    </View>
                  ) : null}
                  {(job.providerEmail || job.createdBy) ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 3 }}>
                      <Ionicons name="mail-outline" size={13} color={theme.colors.textMuted} />
                      <Text style={styles.companyMeta}> {job.providerEmail || job.createdBy}</Text>
                    </View>
                  ) : null}
                </View>
              </View>
              {providerProfile?.companyDescription ? (
                <Text style={styles.companyDescription}>{providerProfile.companyDescription}</Text>
              ) : null}
            </View>
          </FadeInView>
        ) : null}

        {/* Bottom padding to avoid overlapping with sticky button */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Sticky Apply Button */}
      <View style={styles.bottomBar}>
        <AnimatedButton
          style={[
            styles.applyBtn,
            isApplied && styles.appliedBtn,
          ]}
          onPress={handleApply}
          disabled={isApplying || isApplied}
        >
          {isApplying ? (
            <ActivityIndicator color="#fff" />
          ) : isApplied ? (
            <View style={styles.appliedRow}>
              <Ionicons name="checkmark-circle" size={20} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.applyBtnText}>APPLIED</Text>
            </View>
          ) : (
            <Text style={styles.applyBtnText}>APPLY NOW</Text>
          )}
        </AnimatedButton>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.bg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 16,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#AEE9F5', // Cyan background from mock
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  logoImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  logoText: {
    fontSize: 40,
    fontWeight: '800',
    color: '#0052cc', // Dark blue text
  },
  companyLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textMuted,
    marginBottom: 6,
    textAlign: 'center',
  },
  jobTitle: {
    color: theme.colors.text,
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: '500',
  },
  metaDot: {
    color: theme.colors.text,
    marginHorizontal: 12,
    fontSize: 14,
    fontWeight: '800',
  },
  infoTagsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 24,
  },
  infoTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF0E8',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: theme.borders.pill,
    gap: 6,
  },
  infoTagText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.text,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginHorizontal: -24, // bleed to edge
    marginBottom: 24,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    color: theme.colors.text,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  descriptionText: {
    color: theme.colors.textMuted,
    fontSize: 15,
    lineHeight: 24,
    marginBottom: 12,
  },
  readMoreBtn: {
    alignSelf: 'flex-start',
    marginTop: 6,
  },
  readMoreText: {
    color: theme.colors.secondary,
    fontSize: 14,
    fontWeight: '600',
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    paddingRight: 16,
  },
  bulletPoint: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.colors.primary,
    marginTop: 8,
    marginRight: 12,
  },
  bulletText: {
    color: theme.colors.textMuted,
    fontSize: 15,
    lineHeight: 22,
    flex: 1,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 24,
    backgroundColor: 'rgba(250, 250, 250, 0.95)',
    borderTopWidth: 1,
    borderColor: theme.colors.border,
  },
  applyBtn: {
    backgroundColor: theme.colors.primary,
    borderRadius: 8,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appliedBtn: {
    backgroundColor: theme.colors.success,
  },
  appliedRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  applyBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 18,
    color: theme.colors.textMuted,
    marginBottom: 16,
  },
  backBtn: {
    padding: 12,
    backgroundColor: theme.colors.primary,
    borderRadius: 8,
  },
  backBtnText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  // ─── Company Section ────────────────────────
  companyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  companyLogoCircle: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: theme.colors.cardBackgroundLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  companyLogoImage: {
    width: 48,
    height: 48,
    borderRadius: 8,
  },
  companyLogoText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
  },
  companyName: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text,
  },
  companyMeta: {
    fontSize: 13,
    color: theme.colors.textMuted,
  },
  companyDescription: {
    fontSize: 14,
    lineHeight: 22,
    color: theme.colors.textMuted,
  },
});

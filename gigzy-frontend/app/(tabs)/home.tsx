import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  FlatList,
  Image,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { FadeInView } from '../../components/FadeInView';
import * as themeConst from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';
import { showAlert } from '../../services/alert';
import { decodeJWT, getToken, seekerAPI } from '../../services/api';
import { checkProfileComplete, clearProfileCache, enrichJobsWithCompanyNames } from '../../services/profileUtils';
import { Job } from '../../types';

// ─── Logo Helper ─────────────────────────────────────────────────────────────
function CompanyLogo({ company, type, logoUrl }: { company: string; type?: string; logoUrl?: string }) {
  const initial = company.charAt(0).toUpperCase();
  if (logoUrl) {
    return <Image source={{ uri: logoUrl }} style={{ width: 44, height: 44, borderRadius: 22 }} />;
  }

  const brandType = (type || company).toLowerCase();

  if (brandType.includes('tokopedia')) {
    return (
      <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: '#2ECC71', justifyContent: 'center', alignItems: 'center' }}>
        <Ionicons name="basket" size={22} color="#FFF" />
      </View>
    );
  }
  if (brandType.includes('netflix')) {
    return (
      <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: '#E50914', fontWeight: 'bold', fontSize: 22 }}>N</Text>
      </View>
    );
  }
  if (brandType.includes('spotify')) {
    return (
      <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: '#1DB954', justifyContent: 'center', alignItems: 'center' }}>
        <Ionicons name="radio" size={22} color="#FFF" />
      </View>
    );
  }
  if (brandType.includes('google')) {
    return (
      <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: '#FFF', borderWidth: 1, borderColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 1 }}>
        <Text style={{ color: '#4285F4', fontWeight: '800', fontSize: 22 }}>G</Text>
      </View>
    );
  }
  if (brandType.includes('ovo')) {
    return (
      <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: '#4C2A86', justifyContent: 'center', alignItems: 'center' }}>
        <View style={{ width: 22, height: 22, borderRadius: 11, borderWidth: 3, borderColor: '#FFF', backgroundColor: 'transparent' }} />
      </View>
    );
  }
  if (brandType.includes('slack')) {
    return (
      <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E5E7EB', justifyContent: 'center', alignItems: 'center' }}>
        <Ionicons name="logo-slack" size={24} color="#3B82F6" />
      </View>
    );
  }

  // Fallback to random background color based on name
  const colors = ['#F5B7B1', '#AED6F1', '#A9DFBF', '#F9E79F', '#D2B4DE', '#F5CBA7'];
  const color = colors[company.length % colors.length];
  return (
    <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: color, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ color: '#555', fontWeight: '700', fontSize: 18 }}>{initial}</Text>
    </View>
  );
}

const TRENDING_JOBS = [
  {
    id: 99001,
    company: 'Tokopedia',
    location: 'Indonesia',
    logoType: 'tokopedia',
    openPositions: 12,
    jobType: 'Full time - Internship',
    title: 'Software Engineer',
  },
  {
    id: 99002,
    company: 'Netflix',
    location: 'Singapore',
    logoType: 'netflix',
    openPositions: 8,
    jobType: 'Internship',
    title: 'UI/UX Designer',
  },
  {
    id: 99003,
    company: 'Spotify',
    location: 'Sweden',
    logoType: 'spotify',
    openPositions: 6,
    jobType: 'Full time',
    title: 'Product Owner',
  }
];

const DUMMY_RECOMMENDED_JOBS: Job[] = [
  {
    id: 99101,
    title: 'Data Scientist',
    companyName: 'Google',
    location: 'Singapore',
    budget: 1500,
    category: 'Data Science',
    description: 'We are looking for a Data Scientist to join our global team. This role requires exceptional skills, collaborative mindset, and passion for innovation.',
    skillsRequired: ['Remote', 'Internship', '2 Year Exp'],
    providerEmail: 'google@recruitment.com',
  },
  {
    id: 99102,
    title: 'Data Analyst',
    companyName: 'OVO',
    location: 'Singapore',
    budget: 650,
    category: 'Analytics',
    description: 'OVO is seeking a talented Data Analyst to join our team in Singapore. You will help drive decisions by analyzing trends and key business metrics.',
    skillsRequired: ['Remote', 'Internship', '1 Year Exp'],
    providerEmail: 'ovo@recruitment.com',
  },
  {
    id: 99103,
    title: 'Data Analyst',
    companyName: 'Slack',
    location: 'Singapore',
    budget: 800,
    category: 'Analytics',
    description: 'Slack is hiring a Data Analyst. Help us build a better workspace experience for millions of teams worldwide.',
    skillsRequired: ['Remote', 'Internship', '1 Year Exp'],
    providerEmail: 'slack@recruitment.com',
  }
];

export default function HomeScreen() {
  const router = useRouter();
  const { colors, isDarkMode } = useTheme();
  const theme = { ...themeConst.PROFESSIONAL_THEME, colors };
  const styles = getStyles(theme, isDarkMode);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [userName, setUserName] = useState<string>('Guest');
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);
  const [appliedJobs, setAppliedJobs] = useState<Set<number>>(new Set());
  const [applyingJobId, setApplyingJobId] = useState<number | null>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [searchKeyword, setSearchKeyword] = useState('');
  const [allJobs, setAllJobs] = useState<Job[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [activeInput, setActiveInput] = useState<string | null>(null);
  const [bookmarks, setBookmarks] = useState<Set<number>>(new Set());
  const [avatarModalVisible, setAvatarModalVisible] = useState(false);
  const avatarScale = useRef(new Animated.Value(0)).current;
  const avatarOpacity = useRef(new Animated.Value(0)).current;

  const showAvatarModal = () => {
    setAvatarModalVisible(true);
    Animated.parallel([
      Animated.spring(avatarScale, {
        toValue: 1,
        tension: 80,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.timing(avatarOpacity, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const hideAvatarModal = () => {
    Animated.parallel([
      Animated.timing(avatarScale, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(avatarOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setAvatarModalVisible(false);
    });
  };

  // Load bookmarks from local storage
  useEffect(() => {
    AsyncStorage.getItem('job_bookmarks').then((val) => {
      if (val) {
        setBookmarks(new Set(JSON.parse(val)));
      }
    });
  }, []);

  const toggleBookmark = async (jobId: number) => {
    const next = new Set(bookmarks);
    if (next.has(jobId)) {
      next.delete(jobId);
    } else {
      next.add(jobId);
    }
    setBookmarks(next);
    await AsyncStorage.setItem('job_bookmarks', JSON.stringify(Array.from(next)));
  };

  const fetchData = useCallback(async () => {
    clearProfileCache();
    try {
      try {
        const profileRes = await seekerAPI.getProfile();
        const profileData = profileRes.data?.data || profileRes.data;
        if (profileData) {
          if ((profileData as any).fullName) {
            setUserName((profileData as any).fullName);
          }
          setProfileImageUrl((profileData as any).profileImageUrl || null);
        } else {
          const token = await getToken();
          if (token) {
            const payload = decodeJWT(token);
            if (payload) {
              const nameOrEmail = payload.name || payload.sub || 'User';
              const name = nameOrEmail.split('@')[0].split('.')[0];
              setUserName(name.charAt(0).toUpperCase() + name.slice(1));
            }
          }
        }
      } catch (_e) {
        console.log("Failed to load profile for username");
      }

      const response = await seekerAPI.getJobs();
      const data = response.data?.data || response.data;
      const rawJobList = Array.isArray(data) ? data : [];
      const jobList = await enrichJobsWithCompanyNames(rawJobList);
      const combined = [...DUMMY_RECOMMENDED_JOBS, ...jobList];
      setJobs(combined);
      setAllJobs(combined);

      // Pre-populate applied jobs from existing applications
      try {
        const appResponse = await seekerAPI.getApplications();
        const appData = appResponse.data?.data || appResponse.data;
        if (Array.isArray(appData)) {
          const appliedIds = new Set<number>(appData.map((app: any) => app.jobId));
          setAppliedJobs(appliedIds);
        }
      } catch {
        // No applications yet — that's fine
      }
    } catch (error: any) {
      console.log('❌ Fetch jobs error:', error?.response?.status, error?.message);
      if (error.response?.status !== 404) {
        showAlert('Error', 'Failed to load jobs. Pull down to retry.');
      }
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
      let isActive = true;
      (async () => {
        // Guard: Check profile completion before loading jobs
        const profileCheck = await checkProfileComplete('SEEKER');
        if (!isActive) return;
        if (!profileCheck.complete) {
          router.replace('/complete-seeker-profile' as any);
          return;
        }

        await fetchData();
        if (isActive) {
          setLoading(false);
        }
      })();
      return () => {
        isActive = false;
      };
    }, [fetchData, fadeAnim, router])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    setSearchKeyword('');
    await fetchData();
    setRefreshing(false);
  };

  // Re-sync applied jobs every time this tab gains focus
  // This handles the case where a job was applied/cancelled in another tab
  useFocusEffect(
    useCallback(() => {
      (async () => {
        try {
          // Re-fetch profile on focus to get updated name / image URL
          try {
            const profileRes = await seekerAPI.getProfile();
            const profileData = profileRes.data?.data || profileRes.data;
            if (profileData) {
              if (profileData.fullName) setUserName(profileData.fullName);
              setProfileImageUrl(profileData.profileImageUrl || null);
            }
          } catch (_e) {
            console.log("Failed to load profile in focus effect");
          }

          const appResponse = await seekerAPI.getApplications();
          const appData = appResponse.data?.data || appResponse.data;
          if (Array.isArray(appData)) {
            // Only count PENDING/ACCEPTED as "applied" — not REJECTED or cancelled
            const appliedIds = new Set<number>(
              appData
                .filter((app: any) => app.status !== 'REJECTED')
                .map((app: any) => app.jobId)
            );
            setAppliedJobs(appliedIds);
          } else {
            // Unexpected response shape — clear to be safe
            setAppliedJobs(new Set());
          }
        } catch (err: any) {
          // 404 = no applications yet → clear the set so buttons reset to "Apply"
          if (err?.response?.status === 404) {
            setAppliedJobs(new Set());
          }
          // Other errors: leave current state — don't disrupt the user
        }
      })();
    }, [])
  );

  // Debounced search effect
  useEffect(() => {
    const timer = setTimeout(async () => {
      const kw = searchKeyword.trim();
      if (!kw) {
        // Restored all jobs when cleared
        setJobs(allJobs);
        return;
      }
      setLoading(true);
      try {
        const res = await seekerAPI.searchJobs(kw);
        const data = res.data?.data || res.data;
        const rawJobList = Array.isArray(data) ? data : [];
        const jobList = await enrichJobsWithCompanyNames(rawJobList);
        setJobs(jobList);
      } catch (error) {
        console.log('Search error:', error);
      } finally {
        setLoading(false);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchKeyword, allJobs]);

  const handleJobPress = (job: Job) => {
    router.push({
      pathname: '/job/[id]',
      params: { id: job.id, jobStr: JSON.stringify(job) },
    });
  };

  const handleApply = async (jobId: number) => {
    setApplyingJobId(jobId);
    try {
      await seekerAPI.applyToJob(jobId);
      setAppliedJobs((prev) => new Set(prev).add(jobId));
      showAlert('Success', 'Application submitted successfully!');
    } catch (error: any) {
      const msg =
        error.response?.data?.error?.message ||
        error.response?.data?.message ||
        'Failed to apply. Please try again.';
      // If already applied, mark it as applied in UI
      if (msg.toLowerCase().includes('already applied')) {
        setAppliedJobs((prev) => new Set(prev).add(jobId));
      }
      showAlert('Error', msg);
    } finally {
      setApplyingJobId(null);
    }
  };

  const renderTrendingCard = ({ item }: { item: any }) => {
    const isBookmarked = bookmarks.has(item.id);
    return (
      <View style={styles.trendingCard}>
        <View style={styles.trendingCardHeader}>
          <CompanyLogo company={item.company} type={item.logoType} />
          <View style={styles.trendingHeaderInfo}>
            <Text style={styles.trendingCompanyText} numberOfLines={1}>{item.company}</Text>
            <Text style={styles.trendingLocationText} numberOfLines={1}>{item.location}</Text>
          </View>
          <TouchableOpacity onPress={() => toggleBookmark(item.id)} style={styles.trendingBookmarkBtn}>
            <Ionicons
              name={isBookmarked ? 'bookmark' : 'bookmark-outline'}
              size={18}
              color={isBookmarked ? '#5A4FCF' : theme.colors.textMuted}
            />
          </TouchableOpacity>
        </View>

        {/* Actively recruiting status */}
        <View style={styles.activelyRecruitingRow}>
          <View style={styles.recruitingDot} />
          <Text style={styles.recruitingText}>Actively recruiting</Text>
        </View>

        {/* Details stats */}
        <View style={styles.trendingDetails}>
          <View style={styles.trendingStatRow}>
            <Ionicons name="briefcase-outline" size={14} color={theme.colors.textMuted} style={{ marginRight: 6 }} />
            <Text style={styles.trendingStatText}>{item.openPositions} Open Position</Text>
          </View>
          <View style={styles.trendingStatRow}>
            <Ionicons name="time-outline" size={14} color={theme.colors.textMuted} style={{ marginRight: 6 }} />
            <Text style={styles.trendingStatText} numberOfLines={1}>{item.jobType}</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.trendingBtn}
          onPress={() => {
            router.push({
              pathname: '/add',
              params: { search: item.company }
            } as any);
          }}
        >
          <Text style={styles.trendingBtnText}>Show All</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderJobCard = ({ item, index }: { item: Job; index: number }) => {
    const company = item.companyName || item.category || 'Company';
    const isBookmarked = bookmarks.has(item.id);

    // Dynamic tag generation based on budget or location
    const tags = item.id >= 99000 ? item.skillsRequired : ['Remote'];
    if (item.id < 99000) {
      if (item.budget > 15000) {
        tags.push('Fulltime');
      } else {
        tags.push('Internship');
      }
      if (item.skillsRequired && item.skillsRequired.length > 0) {
        tags.push(item.skillsRequired[0]);
      } else {
        tags.push('Entry Level');
      }
    }

    // High fidelity salary & applicants count map
    const salaryText = item.id === 99101 ? '$1200 - $1900' : item.id === 99102 ? '$400 - $900' : item.id === 99103 ? '$400 - $1200' : `₹${item.budget}`;
    const applicantsCount = item.id === 99101 ? '84' : item.id === 99102 ? '12' : item.id === 99103 ? '48' : '12';

    return (
      <FadeInView delay={Math.min(index * 60, 300)} slideUp={true} slideOffset={20}>
        <TouchableOpacity
          style={styles.recommendedCard}
          activeOpacity={0.7}
          onPress={() => handleJobPress(item)}
        >
          <View style={styles.recommendedHeader}>
            <CompanyLogo company={company} logoUrl={item.providerProfileImageUrl} />
            <View style={styles.recommendedHeaderInfo}>
              <Text style={styles.recommendedTitle} numberOfLines={1}>{item.title}</Text>
              <Text style={styles.recommendedCompany} numberOfLines={1}>{company}</Text>
            </View>
            <TouchableOpacity onPress={() => toggleBookmark(item.id)} style={styles.recommendedBookmarkBtn} hitSlop={8}>
              <Ionicons
                name={isBookmarked ? 'bookmark' : 'bookmark-outline'}
                size={20}
                color={isBookmarked ? '#5A4FCF' : theme.colors.textMuted}
              />
            </TouchableOpacity>
          </View>

          {/* Meta rows: location, salary */}
          <View style={styles.recommendedMetaRow}>
            <View style={styles.recommendedMetaCol}>
              <Ionicons name="location-outline" size={14} color={theme.colors.textMuted} style={{ marginRight: 4 }} />
              <Text style={styles.recommendedMetaText}>{item.location}</Text>
            </View>
            <View style={styles.recommendedMetaCol}>
              <Ionicons name="wallet-outline" size={14} color={theme.colors.textMuted} style={{ marginRight: 4 }} />
              <Text style={styles.recommendedMetaText}>{salaryText}</Text>
            </View>
          </View>

          {/* Tags chips row */}
          <View style={styles.recommendedChipsRow}>
            {tags.slice(0, 3).map((tag, idx) => (
              <View key={idx} style={styles.chip}>
                <Text style={styles.chipText}>{tag}</Text>
              </View>
            ))}
          </View>

          {/* Card Footer: Post time & Applicants */}
          <View style={styles.recommendedFooter}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="time-outline" size={12} color={theme.colors.textMuted} style={{ marginRight: 4 }} />
              <Text style={styles.recommendedFooterText}>1 Day ago</Text>
            </View>
            <Text style={styles.recommendedDot}>•</Text>
            <Text style={styles.recommendedFooterLink}>{applicantsCount} Applicants</Text>
          </View>
        </TouchableOpacity>
      </FadeInView>
    );
  };

  const ListHeader = () => {
    return (
      <View style={styles.listHeader}>
        {/* Header bar logo & bell */}
        <View style={styles.headerLogoRow}>
          <View style={styles.logoTextWrapper}>
            <View style={styles.logoIconContainer}>
              <Ionicons name="location" size={28} color="#111827" />
              <View style={styles.logoIconInner}>
                <Ionicons name="search" size={12} color="#FFF" style={{ marginTop: -2 }} />
              </View>
            </View>
            <Text style={styles.logoTitle}>Jobspot</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <TouchableOpacity style={styles.notificationBellBtn}>
              <Ionicons name="notifications-outline" size={24} color={theme.colors.text} />
              <View style={styles.notificationBadgeDot} />
            </TouchableOpacity>
            <TouchableOpacity onPress={showAvatarModal}>
              {profileImageUrl ? (
                <Image
                  source={{ uri: profileImageUrl }}
                  style={{ width: 42, height: 42, borderRadius: 21, borderWidth: 1, borderColor: theme.colors.border }}
                />
              ) : (
                <View style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: '#5A4FCF', justifyContent: 'center', alignItems: 'center' }}>
                  <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 16 }}>
                    {userName.charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Search bar redirection input */}
        <TouchableOpacity
          style={styles.searchBarRedirect}
          activeOpacity={0.9}
          onPress={() => router.push('/add')}
        >
          <Ionicons name="search-outline" size={20} color={theme.colors.textMuted} style={{ marginRight: 10 }} />
          <Text style={styles.searchRedirectPlaceholder}>Search Job, Company & Role</Text>
        </TouchableOpacity>

        {/* Trending Section */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitleText}>On Trending</Text>
          <TouchableOpacity onPress={() => router.push('/add')}>
            <Text style={styles.sectionLinkText}>Show All</Text>
          </TouchableOpacity>
        </View>

        {/* Horizontal FlatList */}
        <FlatList
          horizontal
          data={TRENDING_JOBS}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderTrendingCard}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.trendingScrollContainer}
          style={{ marginBottom: 24 }}
        />

        {/* Recommendation Section Header */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitleText}>Recommendation</Text>
          <TouchableOpacity onPress={() => router.push('/add')}>
            <Text style={styles.sectionLinkText}>Show All</Text>
          </TouchableOpacity>
        </View>
      </View>
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
      <View style={{ position: 'absolute', top: -1000, left: 0, right: 0, height: 1000, backgroundColor: '#D2C5FC' }} />
      <LinearGradient
        colors={['#D2C5FC', '#EBE7FF', 'rgba(255, 255, 255, 0)']}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 400 }}
      />
      <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
        <FlatList
          data={jobs}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderJobCard}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={ListHeader}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="briefcase-outline" size={48} color={theme.colors.textMuted} style={{ marginBottom: 16 }} />
              <Text style={styles.emptyTitle}>No jobs available</Text>
              <Text style={styles.emptyBody}>Check back later or pull to refresh.</Text>
            </View>
          }
        />
      </Animated.View>

      {avatarModalVisible && (
        <Animated.View
          style={[
            styles.avatarModalBackdrop,
            { opacity: avatarOpacity }
          ]}
        >
          <TouchableOpacity
            style={styles.avatarModalCloseOverlay}
            activeOpacity={1}
            onPress={hideAvatarModal}
          />
          <Animated.View
            style={[
              styles.avatarContainerEnlarged,
              { transform: [{ scale: avatarScale }] }
            ]}
          >
            {profileImageUrl ? (
              <Image
                source={{ uri: profileImageUrl }}
                style={styles.avatarEnlargedImage}
              />
            ) : (
              <View style={styles.avatarFallbackEnlarged}>
                <Text style={styles.avatarFallbackTextEnlarged}>
                  {userName.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
            <TouchableOpacity style={styles.avatarCloseBtn} onPress={hideAvatarModal}>
              <Ionicons name="close" size={24} color="#FFF" />
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>
      )}
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
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  listHeader: {
    paddingBottom: 16,
    paddingTop: Platform.OS === 'ios' ? 60 : 45,
  },

  // ─── Header Logo Row ───
  headerLogoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  logoTextWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoIconContainer: {
    position: 'relative',
    marginRight: 6,
    width: 28,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoIconInner: {
    position: 'absolute',
    top: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
    letterSpacing: -0.5,
  },
  notificationBellBtn: {
    width: 42,
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.card,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  notificationBadgeDot: {
    position: 'absolute',
    top: 10,
    right: 11,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#3B82F6',
  },

  // ─── Search Redirect ───
  searchBarRedirect: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 54,
    marginBottom: 24,
    ...theme.shadows.sm,
  },
  searchRedirectPlaceholder: {
    fontSize: 15,
    color: theme.colors.textMuted,
  },

  // ─── Section Header ───
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitleText: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text,
  },
  sectionLinkText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#5A4FCF',
  },

  // ─── Trending Slider ───
  trendingScrollContainer: {
    gap: 14,
    paddingRight: 20,
  },
  trendingCard: {
    backgroundColor: theme.colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 16,
    width: 260,
    ...theme.shadows.sm,
  },
  trendingCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  trendingHeaderInfo: {
    flex: 1,
    marginLeft: 10,
  },
  trendingCompanyText: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.text,
  },
  trendingLocationText: {
    fontSize: 12,
    color: theme.colors.textMuted,
    marginTop: 1,
  },
  trendingBookmarkBtn: {
    padding: 4,
  },
  activelyRecruitingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  recruitingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
    marginRight: 6,
  },
  recruitingText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#10B981',
  },
  trendingDetails: {
    gap: 8,
    marginBottom: 16,
  },
  trendingStatRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trendingStatText: {
    fontSize: 12,
    color: theme.colors.textMuted,
  },
  trendingBtn: {
    backgroundColor: '#111827',
    borderRadius: 12,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trendingBtnText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '700',
  },

  // ─── Recommended Card ───
  recommendedCard: {
    backgroundColor: theme.colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 16,
    marginBottom: 12,
    ...theme.shadows.sm,
  },
  recommendedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  recommendedHeaderInfo: {
    flex: 1,
    marginLeft: 12,
  },
  recommendedTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 2,
  },
  recommendedCompany: {
    fontSize: 13,
    color: theme.colors.textMuted,
  },
  recommendedBookmarkBtn: {
    padding: 4,
  },
  recommendedMetaRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  recommendedMetaCol: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  recommendedMetaText: {
    fontSize: 13,
    color: theme.colors.textMuted,
  },
  recommendedChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  chip: {
    backgroundColor: theme.colors.cardBackgroundLight,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  chipText: {
    fontSize: 11,
    color: theme.colors.textMuted,
    fontWeight: '500',
  },
  recommendedFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingTop: 12,
    marginTop: 4,
  },
  recommendedFooterText: {
    fontSize: 12,
    color: theme.colors.textMuted,
  },
  recommendedDot: {
    fontSize: 12,
    color: theme.colors.textMuted,
    marginHorizontal: 6,
  },
  recommendedFooterLink: {
    fontSize: 12,
    color: '#5A4FCF',
    fontWeight: '500',
  },
  smallApplyBtn: {
    marginLeft: 'auto',
    backgroundColor: '#111827',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 8,
    minWidth: 70,
    alignItems: 'center',
    justifyContent: 'center',
  },
  smallAppliedBtn: {
    backgroundColor: theme.colors.successBg,
  },
  smallApplyText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFF',
  },
  smallAppliedText: {
    color: theme.colors.success,
  },

  // ─── Empty State ───
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 8,
  },
  emptyBody: {
    fontSize: 14,
    color: theme.colors.textMuted,
  },
  avatarModalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  avatarModalCloseOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  avatarContainerEnlarged: {
    width: 260,
    height: 260,
    borderRadius: 130,
    overflow: 'hidden',
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    borderWidth: 4,
    borderColor: '#FFF',
    ...theme.shadows.md,
  },
  avatarEnlargedImage: {
    width: '100%',
    height: '100%',
    borderRadius: 130,
  },
  avatarFallbackEnlarged: {
    width: '100%',
    height: '100%',
    borderRadius: 130,
    backgroundColor: '#5A4FCF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarFallbackTextEnlarged: {
    color: '#FFF',
    fontSize: 90,
    fontWeight: 'bold',
  },
  avatarCloseBtn: {
    position: 'absolute',
    bottom: 20,
    alignSelf: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Modal,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { showAlert } from '../../services/alert';
import { seekerAPI } from '../../services/api';
import { enrichJobsWithCompanyNames, clearProfileCache } from '../../services/profileUtils';
import { Job } from '../../types';
import { FadeInView } from '../../components/FadeInView';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── Company Logo Helper ───
function CompanyLogo({ company, logoUrl }: { company: string; logoUrl?: string }) {
  const initial = company.charAt(0).toUpperCase();
  if (logoUrl) {
    return <Image source={{ uri: logoUrl }} style={styles.jobLogoImage} />;
  }

  const brandType = company.toLowerCase();

  if (brandType.includes('tokopedia')) {
    return (
      <View style={[styles.jobLogoContainer, { backgroundColor: '#2ECC71' }]}>
        <Ionicons name="basket" size={22} color="#FFF" />
      </View>
    );
  }
  if (brandType.includes('netflix')) {
    return (
      <View style={[styles.jobLogoContainer, { backgroundColor: '#000' }]}>
        <Text style={{ color: '#E50914', fontWeight: 'bold', fontSize: 20 }}>N</Text>
      </View>
    );
  }
  if (brandType.includes('spotify')) {
    return (
      <View style={[styles.jobLogoContainer, { backgroundColor: '#1DB954' }]}>
        <Ionicons name="radio" size={22} color="#FFF" />
      </View>
    );
  }
  if (brandType.includes('google')) {
    return (
      <View style={[styles.jobLogoContainer, { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#F3F4F6', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 1 }]}>
        <Text style={{ color: '#4285F4', fontWeight: '800', fontSize: 22 }}>G</Text>
      </View>
    );
  }
  if (brandType.includes('ovo')) {
    return (
      <View style={[styles.jobLogoContainer, { backgroundColor: '#4C2A86' }]}>
        <View style={{ width: 22, height: 22, borderRadius: 11, borderWidth: 3, borderColor: '#FFF', backgroundColor: 'transparent' }} />
      </View>
    );
  }
  if (brandType.includes('slack')) {
    return (
      <View style={[styles.jobLogoContainer, { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E5E7EB' }]}>
        <Ionicons name="logo-slack" size={24} color="#3B82F6" />
      </View>
    );
  }

  // Soft palette
  const colors = ['#F5B7B1', '#AED6F1', '#A9DFBF', '#F9E79F', '#D2B4DE', '#F5CBA7'];
  const color = colors[company.length % colors.length];
  return (
    <View style={[styles.jobLogoContainer, { backgroundColor: color }]}>
      <Text style={styles.jobLogoText}>{initial}</Text>
    </View>
  );
}

const DUMMY_SEARCH_JOBS: Job[] = [
  {
    id: 99201,
    title: 'Data Analyst',
    companyName: 'OVO',
    location: 'Singapore',
    budget: 650,
    category: 'Analytics',
    description: 'We are looking for a Data Analyst to join OVO in Singapore. You will analyze key business metrics to drive growth.',
    skillsRequired: ['Remote', 'Internship', '1 Year Exp'],
    providerEmail: 'ovo@recruitment.com'
  },
  {
    id: 99202,
    title: 'Data Analyst',
    companyName: 'Slack',
    location: 'Singapore',
    budget: 800,
    category: 'Analytics',
    description: 'Slack is hiring a Data Analyst to join our team in Singapore. Help us refine the workspace of tomorrow.',
    skillsRequired: ['Remote', 'Internship', '1 Year Exp'],
    providerEmail: 'slack@recruitment.com'
  },
  {
    id: 99203,
    title: 'Data Analyst',
    companyName: 'Netflix',
    location: 'Singapore',
    budget: 1000,
    category: 'Media',
    description: 'Netflix is looking for a Data Analyst in Singapore to analyze viewer data and streaming patterns.',
    skillsRequired: ['Remote', 'Internship', '1 Year Exp'],
    providerEmail: 'netflix@recruitment.com'
  }
];

const LOCATIONS = ['ALL', 'Singapore', 'Indonesia', 'Sweden', 'Hyderabad', 'Bangalore'];

export default function SearchScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { colors } = useTheme();

  // Core Data
  const [allJobs, setAllJobs] = useState<Job[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  // Active Filter States
  const [searchKeyword, setSearchKeyword] = useState('');
  const [locationFilter, setLocationFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('relevancy'); // relevancy, newest, popular
  const [selectedJobTypes, setSelectedJobTypes] = useState<Set<string>>(new Set()); // Remote, Internship, Fulltime

  // Modal / Temp Filter States
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [tempSearchKeyword, setTempSearchKeyword] = useState('');
  const [tempLocation, setTempLocation] = useState('ALL');
  const [tempSortBy, setTempSortBy] = useState('relevancy');
  const [tempJobTypes, setTempJobTypes] = useState<Set<string>>(new Set());
  const [locationDropdownVisible, setLocationDropdownVisible] = useState(false);

  // Apply & Bookmarks States
  const [appliedJobs, setAppliedJobs] = useState<Set<number>>(new Set());
  const [applyingJobId, setApplyingJobId] = useState<number | null>(null);
  const [bookmarks, setBookmarks] = useState<Set<number>>(new Set());

  // Load Initial Data
  useFocusEffect(
    useCallback(() => {
      fetchInitialData();
    }, [])
  );

  // Listen for search parameter from home page redirect
  useEffect(() => {
    if (params?.search) {
      const kw = params.search as string;
      setSearchKeyword(kw);
      setTempSearchKeyword(kw);
      applyActiveFilters(kw, locationFilter, sortBy, selectedJobTypes);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params?.search]);

  // Load Bookmarks & Applications
  useFocusEffect(
    useCallback(() => {
      (async () => {
        try {
          // Applications
          const appResponse = await seekerAPI.getApplications();
          const appData = appResponse.data?.data || appResponse.data;
          if (Array.isArray(appData)) {
            const appliedIds = new Set<number>(appData.map((app: any) => app.jobId));
            setAppliedJobs(appliedIds);
          }

          // Bookmarks
          const bookmarksVal = await AsyncStorage.getItem('job_bookmarks');
          if (bookmarksVal) {
            setBookmarks(new Set(JSON.parse(bookmarksVal)));
          }
        } catch {
          // Ignore error
        }
      })();
    }, [])
  );

  const fetchInitialData = async () => {
    setLoading(true);
    clearProfileCache();
    try {
      const response = await seekerAPI.getJobs();
      const data = response.data?.data || response.data;
      const rawJobs = Array.isArray(data) ? data : [];
      const enrichedJobs = await enrichJobsWithCompanyNames(rawJobs);
      const combined = [...DUMMY_SEARCH_JOBS, ...enrichedJobs];
      setAllJobs(combined);
      
      // Initially apply filters
      const initialKeyword = params?.search ? (params.search as string) : searchKeyword;
      const filtered = computeFilteredJobs(combined, initialKeyword, locationFilter, sortBy, selectedJobTypes);
      setJobs(filtered);
    } catch (error) {
      console.log('Fetch jobs error:', error);
    } finally {
      setLoading(false);
    }
  };

  // ─── Filter Logic ───
  const computeFilteredJobs = (
    list: Job[],
    kw: string,
    loc: string,
    sort: string,
    types: Set<string>
  ) => {
    let filtered = [...list];

    // 1. Keyword search (title, company name, skills, description)
    if (kw.trim()) {
      const q = kw.toLowerCase().trim();
      filtered = filtered.filter(
        (job) =>
          (job.title && job.title.toLowerCase().includes(q)) ||
          (job.companyName && job.companyName.toLowerCase().includes(q)) ||
          (job.description && job.description.toLowerCase().includes(q)) ||
          (job.category && job.category.toLowerCase().includes(q)) ||
          (job.skillsRequired && job.skillsRequired.some(s => s.toLowerCase().includes(q)))
      );
    }

    // 2. Location filter
    if (loc && loc !== 'ALL') {
      const q = loc.toLowerCase().trim();
      filtered = filtered.filter(
        (job) => job.location && job.location.toLowerCase().includes(q)
      );
    }

    // 3. Job Type filters
    if (types.size > 0) {
      filtered = filtered.filter((job) => {
        // Derive tags
        const jobTags = new Set<string>();
        if (job.location && job.location.toLowerCase().includes('remote')) {
          jobTags.add('Remote');
        }
        if (job.budget > 15000) {
          jobTags.add('Fulltime');
        } else {
          jobTags.add('Internship');
        }
        
        let match = false;
        types.forEach((t) => {
          if (jobTags.has(t)) match = true;
          if (job.skillsRequired && job.skillsRequired.some(s => s.toLowerCase() === t.toLowerCase())) {
            match = true;
          }
        });
        return match;
      });
    }

    // 4. Sort By
    if (sort === 'newest') {
      filtered.sort((a, b) => b.id - a.id);
    } else if (sort === 'popular') {
      filtered.sort((a, b) => (b.id % 5) - (a.id % 5));
    }

    return filtered;
  };

  const applyActiveFilters = (
    kw: string,
    loc: string,
    sort: string,
    types: Set<string>
  ) => {
    const filtered = computeFilteredJobs(allJobs, kw, loc, sort, types);
    setJobs(filtered);
  };

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
        'Failed to apply.';
      if (msg.toLowerCase().includes('already applied')) {
        setAppliedJobs((prev) => new Set(prev).add(jobId));
      }
      showAlert('Error', msg);
    } finally {
      setApplyingJobId(null);
    }
  };

  // ─── Modal Triggers ───
  const openFilterModal = () => {
    setTempSearchKeyword(searchKeyword);
    setTempLocation(locationFilter);
    setTempSortBy(sortBy);
    setTempJobTypes(new Set(selectedJobTypes));
    setFilterModalVisible(true);
  };

  const handleCommitFilters = () => {
    setSearchKeyword(tempSearchKeyword);
    setLocationFilter(tempLocation);
    setSortBy(tempSortBy);
    setSelectedJobTypes(new Set(tempJobTypes));
    applyActiveFilters(tempSearchKeyword, tempLocation, tempSortBy, tempJobTypes);
    setFilterModalVisible(false);
  };

  const handleClearFilters = () => {
    setTempSearchKeyword('');
    setTempLocation('ALL');
    setTempSortBy('relevancy');
    setTempJobTypes(new Set());
  };

  // Pill Toggles
  const handleTogglePill = (type: string) => {
    const next = new Set(selectedJobTypes);
    if (next.has(type)) {
      next.delete(type);
    } else {
      next.add(type);
    }
    setSelectedJobTypes(next);
    applyActiveFilters(searchKeyword, locationFilter, sortBy, next);
  };

  // Modal Counter
  const tempMatchCount = computeFilteredJobs(
    allJobs,
    tempSearchKeyword,
    tempLocation,
    tempSortBy,
    tempJobTypes
  ).length;

  const renderJobCard = ({ item, index }: { item: Job; index: number }) => {
    const company = item.companyName || item.category || 'Company';
    const isBookmarked = bookmarks.has(item.id);

    // Derive tags
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

    // High fidelity salary, time, and applicants map
    const salaryText = item.id === 99201 ? '$400 - $900' : item.id === 99202 ? '$400 - $1200' : item.id === 99203 ? '$400 - $1600' : `₹${item.budget}`;
    const timeText = item.id === 99201 ? '1 Day ago' : '3 Day ago';
    const applicantsText = item.id === 99201 ? '12 Applicants' : item.id === 99202 ? '48 Applicants' : item.id === 99203 ? '48 Applicants' : '12 Applicants';

    return (
      <FadeInView delay={Math.min(index * 60, 300)} slideUp={true} slideOffset={20}>
        <TouchableOpacity
          style={styles.jobCard}
          activeOpacity={0.7}
          onPress={() => handleJobPress(item)}
        >
          <View style={styles.jobCardHeader}>
            <CompanyLogo company={company} logoUrl={item.providerProfileImageUrl} />
            <View style={styles.jobInfo}>
              <Text style={styles.jobTitle} numberOfLines={1}>{item.title}</Text>
              <Text style={styles.jobCompanyName} numberOfLines={1}>{company}</Text>
            </View>
            <TouchableOpacity onPress={() => toggleBookmark(item.id)} style={styles.bookmarkBtn} hitSlop={8}>
              <Ionicons
                name={isBookmarked ? 'bookmark' : 'bookmark-outline'}
                size={22}
                color={isBookmarked ? '#5A4FCF' : colors.textMuted}
              />
            </TouchableOpacity>
          </View>

          {/* Details Row */}
          <View style={styles.detailsRow}>
            <View style={styles.detailCol}>
              <Ionicons name="location-outline" size={14} color={colors.textMuted} style={{ marginRight: 4 }} />
              <Text style={styles.detailText}>{item.location}</Text>
            </View>
            <View style={styles.detailCol}>
              <Ionicons name="wallet-outline" size={14} color={colors.textMuted} style={{ marginRight: 4 }} />
              <Text style={styles.detailText}>{salaryText}</Text>
            </View>
          </View>

          {/* Chips Row */}
          <View style={styles.chipsRow}>
            {tags.slice(0, 3).map((tag, idx) => (
              <View key={idx} style={styles.chip}>
                <Text style={styles.chipText}>{tag}</Text>
              </View>
            ))}
          </View>

          {/* Footer */}
          <View style={styles.cardFooter}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="time-outline" size={12} color={colors.textMuted} style={{ marginRight: 4 }} />
              <Text style={styles.footerText}>{timeText}</Text>
            </View>
            <Text style={styles.footerDot}>-</Text>
            <Text style={styles.footerLink}>{applicantsText}</Text>
          </View>
        </TouchableOpacity>
      </FadeInView>
    );
  };

  const isRemoteActive = selectedJobTypes.has('Remote');
  const isInternshipActive = selectedJobTypes.has('Internship');

  return (
    <View style={[styles.screen, { backgroundColor: colors.bg }]}>
      {/* ─── Search bar & Filter Pills Header ─── */}
      <View style={[styles.headerContainer, { borderBottomColor: colors.border }]}>
        <View style={styles.searchRow}>
          <View style={[styles.searchInputWrapper, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Ionicons name="search-outline" size={20} color={colors.textMuted} style={{ marginRight: 8 }} />
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              placeholder="Search Job, Company & Role"
              placeholderTextColor={colors.textMuted}
              value={searchKeyword}
              onChangeText={(text) => {
                setSearchKeyword(text);
                applyActiveFilters(text, locationFilter, sortBy, selectedJobTypes);
              }}
            />
            {searchKeyword.length > 0 && (
              <TouchableOpacity
                onPress={() => {
                  setSearchKeyword('');
                  applyActiveFilters('', locationFilter, sortBy, selectedJobTypes);
                }}
                hitSlop={8}
              >
                <Ionicons name="close-circle" size={18} color={colors.textMuted} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Filter Pills horizontal list */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pillsScrollContainer}>
          <TouchableOpacity style={styles.filterPill} onPress={openFilterModal}>
            <Text style={styles.filterPillText}>Sort</Text>
            <Ionicons name="chevron-down" size={12} color={colors.textMuted} style={{ marginLeft: 4 }} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterPill, locationFilter !== 'ALL' && styles.filterPillActive]}
            onPress={openFilterModal}
          >
            <Ionicons name="location-outline" size={13} color={locationFilter !== 'ALL' ? '#FFF' : colors.textMuted} style={{ marginRight: 4 }} />
            <Text style={[styles.filterPillText, locationFilter !== 'ALL' && styles.filterPillTextActive]}>
              {locationFilter === 'ALL' ? 'Singapore' : locationFilter}
            </Text>
            <Ionicons name="chevron-down" size={12} color={locationFilter !== 'ALL' ? '#FFF' : colors.textMuted} style={{ marginLeft: 4 }} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterPill, isRemoteActive && styles.filterPillActive]}
            onPress={() => handleTogglePill('Remote')}
          >
            <Ionicons name="videocam-outline" size={13} color={isRemoteActive ? '#FFF' : colors.textMuted} style={{ marginRight: 4 }} />
            <Text style={[styles.filterPillText, isRemoteActive && styles.filterPillTextActive]}>Remote</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterPill, isInternshipActive && styles.filterPillActive]}
            onPress={() => handleTogglePill('Internship')}
          >
            <Ionicons name="time-outline" size={13} color={isInternshipActive ? '#FFF' : colors.textMuted} style={{ marginRight: 4 }} />
            <Text style={[styles.filterPillText, isInternshipActive && styles.filterPillTextActive]}>Internship</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* ─── Jobs Results ─── */}
      <FlatList
        data={jobs}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderJobCard}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIcon}>
                <Ionicons name="search-outline" size={36} color={colors.textMuted} />
              </View>
              <Text style={[styles.emptyTitle, { color: colors.text }]}>No results found</Text>
              <Text style={styles.emptyBody}>Try adjusting your search filters.</Text>
            </View>
          ) : null
        }
      />

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#5A4FCF" />
        </View>
      )}

      {/* ─── Sticky Bottom Center Filter Button ─── */}
      <TouchableOpacity style={styles.floatingFilterBtn} activeOpacity={0.85} onPress={openFilterModal}>
        <Ionicons name="funnel-outline" size={16} color="#FFF" style={{ marginRight: 6 }} />
        <Text style={styles.floatingFilterText}>Filter</Text>
      </TouchableOpacity>

      {/* ─── Sort & Filter Slide-up Modal ─── */}
      <Modal
        visible={filterModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setFilterModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalSheet, { backgroundColor: colors.card }]}>
            {/* Modal Header */}
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <TouchableOpacity onPress={() => setFilterModalVisible(false)} hitSlop={10}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Sort & Filter</Text>
              <TouchableOpacity onPress={handleClearFilters} hitSlop={10}>
                <Text style={styles.clearText}>Clear</Text>
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalScrollBody} showsVerticalScrollIndicator={false}>
              {/* Keyword Search Section */}
              <Text style={[styles.modalSectionTitle, { color: colors.text }]}>Search Job, Company & Role</Text>
              <View style={[styles.modalInputWrapper, { backgroundColor: colors.bg, borderColor: colors.border }]}>
                <Ionicons name="search-outline" size={18} color={colors.textMuted} style={{ marginRight: 8 }} />
                <TextInput
                  style={[styles.modalTextInput, { color: colors.text }]}
                  placeholder="Data Analyst"
                  placeholderTextColor={colors.textMuted}
                  value={tempSearchKeyword}
                  onChangeText={setTempSearchKeyword}
                />
                {tempSearchKeyword.length > 0 && (
                  <TouchableOpacity onPress={() => setTempSearchKeyword('')} hitSlop={8}>
                    <Ionicons name="close-circle" size={16} color={colors.textMuted} />
                  </TouchableOpacity>
                )}
              </View>

              {/* Location Dropdown styled container */}
              <Text style={[styles.modalSectionTitle, { color: colors.text }]}>Location</Text>
              <TouchableOpacity
                style={[styles.modalDropdownInput, { borderColor: colors.border }]}
                onPress={() => setLocationDropdownVisible(!locationDropdownVisible)}
                activeOpacity={0.7}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons name="location-outline" size={18} color={colors.textMuted} style={{ marginRight: 8 }} />
                  <Text style={{ color: colors.text, fontSize: 14 }}>
                    {tempLocation === 'ALL' ? 'Anywhere' : tempLocation}
                  </Text>
                </View>
                <Ionicons
                  name={locationDropdownVisible ? 'chevron-up' : 'chevron-down'}
                  size={16}
                  color={colors.textMuted}
                />
              </TouchableOpacity>

              {/* Location Dropdown expanding options */}
              {locationDropdownVisible && (
                <View style={[styles.dropdownListContainer, { borderColor: colors.border, backgroundColor: colors.bg }]}>
                  {LOCATIONS.map((loc) => {
                    const isSelected = tempLocation === loc;
                    return (
                      <TouchableOpacity
                        key={loc}
                        style={[styles.dropdownItem, isSelected && { backgroundColor: colors.border }]}
                        onPress={() => {
                          setTempLocation(loc);
                          setLocationDropdownVisible(false);
                        }}
                      >
                        <Ionicons
                          name="location-outline"
                          size={14}
                          color={isSelected ? '#5A4FCF' : colors.textMuted}
                          style={{ marginRight: 8 }}
                        />
                        <Text style={[styles.dropdownItemText, { color: colors.text }, isSelected && { fontWeight: '700' }]}>
                          {loc === 'ALL' ? 'Anywhere' : loc}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}

              {/* Sort By Options */}
              <Text style={[styles.modalSectionTitle, { color: colors.text }]}>Sort by</Text>
              {['relevancy', 'newest', 'popular'].map((option) => {
                const isSelected = tempSortBy === option;
                return (
                  <TouchableOpacity
                    key={option}
                    style={styles.radioRow}
                    onPress={() => setTempSortBy(option)}
                  >
                    <Text style={[styles.radioLabel, { color: colors.text }]}>
                      {option.charAt(0).toUpperCase() + option.slice(1)}
                    </Text>
                    <View style={[styles.radioCircle, isSelected && styles.radioCircleChecked]}>
                      {isSelected && <View style={styles.radioDot} />}
                    </View>
                  </TouchableOpacity>
                );
              })}

              {/* Job Type Options */}
              <Text style={[styles.modalSectionTitle, { color: colors.text }]}>Job Type</Text>
              {['Internship', 'Fulltime', 'Remote'].map((type) => {
                const isChecked = tempJobTypes.has(type);
                const typeLabel = type === 'Internship' ? 'Internship (20)' : type === 'Fulltime' ? 'Fulltime (34)' : 'Remote';
                return (
                  <TouchableOpacity
                    key={type}
                    style={styles.checkboxRow}
                    onPress={() => {
                      const next = new Set(tempJobTypes);
                      if (next.has(type)) {
                        next.delete(type);
                      } else {
                        next.add(type);
                      }
                      setTempJobTypes(next);
                    }}
                  >
                    <Text style={[styles.checkboxLabel, { color: colors.text }]}>{typeLabel}</Text>
                    <View style={[styles.checkboxBox, isChecked && styles.checkboxBoxChecked]}>
                      {isChecked && <Ionicons name="checkmark" size={14} color="#FFF" />}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Bottom Actions */}
            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.commitBtn} onPress={handleCommitFilters}>
                <Text style={styles.commitBtnText}>See {tempMatchCount} Result</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  headerContainer: {
    paddingTop: Platform.OS === 'ios' ? 60 : 45,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  searchRow: {
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  searchInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 50,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    height: '100%',
  },
  pillsScrollContainer: {
    paddingHorizontal: 20,
    gap: 8,
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  filterPillActive: {
    backgroundColor: '#111827',
    borderColor: '#111827',
  },
  filterPillText: {
    fontSize: 13,
    color: '#4B5563',
    fontWeight: '500',
  },
  filterPillTextActive: {
    color: '#FFF',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 90, // room for floating filter button
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // ─── Job Card Styles (matches recommended) ───
  jobCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  jobCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  jobLogoContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  jobLogoImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  jobLogoText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
  },
  jobInfo: {
    flex: 1,
    marginLeft: 12,
  },
  jobTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 2,
  },
  jobCompanyName: {
    fontSize: 13,
    color: '#6B7280',
  },
  bookmarkBtn: {
    padding: 4,
  },
  detailsRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  detailCol: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    fontSize: 13,
    color: '#6B7280',
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  chip: {
    backgroundColor: '#F3F4F6',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  chipText: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '500',
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 12,
    marginTop: 4,
  },
  footerText: {
    fontSize: 12,
    color: '#6B7280',
  },
  footerDot: {
    fontSize: 12,
    color: '#6B7280',
    marginHorizontal: 6,
  },
  footerLink: {
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
    backgroundColor: '#ECFDF5',
  },
  smallApplyText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFF',
  },
  smallAppliedText: {
    color: '#10B981',
  },

  // ─── Floating Action Button ───
  floatingFilterBtn: {
    position: 'absolute',
    bottom: 24,
    alignSelf: 'center',
    backgroundColor: '#111827',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 22,
    paddingVertical: 13,
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 8,
  },
  floatingFilterText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.3,
  },

  // ─── Modal Sheet Styles ───
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  clearText: {
    fontSize: 15,
    color: '#EF4444',
    fontWeight: '600',
  },
  modalScrollBody: {
    padding: 20,
  },
  modalSectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginTop: 18,
    marginBottom: 10,
  },
  modalInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 50,
    marginBottom: 8,
  },
  modalTextInput: {
    flex: 1,
    fontSize: 14,
    height: '100%',
  },
  modalDropdownInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 50,
    marginBottom: 8,
  },
  dropdownListContainer: {
    borderWidth: 1,
    borderRadius: 12,
    marginTop: 4,
    marginBottom: 12,
    overflow: 'hidden',
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  dropdownItemText: {
    fontSize: 14,
  },
  radioRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  radioLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioCircleChecked: {
    borderColor: '#3B82F6',
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#3B82F6',
  },
  checkboxRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  checkboxLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  checkboxBox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxBoxChecked: {
    backgroundColor: '#111827',
    borderColor: '#111827',
  },
  modalFooter: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  commitBtn: {
    backgroundColor: '#111827',
    height: 54,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  commitBtnText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 6,
  },
  emptyBody: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
});

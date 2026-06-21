import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import * as themeConst from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';
import { CATEGORY_GROUPS, ALL_CATEGORIES, getCategoryLabel, getCategoryIcon } from '../../constants/categories';
import { showAlert } from '../../services/alert';
import { providerAPI } from '../../services/api';
import { FadeInView } from '../../components/FadeInView';
import { AnimatedButton } from '../../components/AnimatedButton';

export default function PostJobScreen() {
  const { colors, isDarkMode } = useTheme();
  const theme = { ...themeConst.PROFESSIONAL_THEME, colors };
  const styles = getStyles(theme, isDarkMode);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [budget, setBudget] = useState('');
  const [category, setCategory] = useState('');
  const [skillsRequired, setSkillsRequired] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [pickerSearch, setPickerSearch] = useState('');
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    'Home Services': true,
    'IT & Digital': true,
  });

  const toggleGroup = (groupName: string) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [groupName]: !prev[groupName],
    }));
  };

  const handleSelectCategory = (catKey: string) => {
    setCategory(catKey);
    setShowPicker(false);
    setPickerSearch('');
  };

  const filteredCategories = pickerSearch.trim()
    ? ALL_CATEGORIES.filter(
        (cat) =>
          cat.label.toLowerCase().includes(pickerSearch.toLowerCase()) ||
          cat.key.toLowerCase().includes(pickerSearch.toLowerCase())
      )
    : [];
  const [activeInput, setActiveInput] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const router = useRouter();
  const params = useLocalSearchParams();
  const editJobStr = params.jobStr as string | undefined;
  const [editJobId, setEditJobId] = useState<number | null>(null);
  const isEditing = editJobId !== null;

  // Prefill form if editing an existing job
  useEffect(() => {
    if (editJobStr) {
      try {
        const job = JSON.parse(editJobStr);
        setTitle(job.title || '');
        setDescription(job.description || '');
        setLocation(job.location || '');
        setBudget(job.budget ? String(job.budget) : '');
        setCategory(job.category || '');
        setSkillsRequired(
          Array.isArray(job.skillsRequired) ? job.skillsRequired.join(', ') : (job.skillsRequired || '')
        );
        setEditJobId(job.id);
      } catch (e) {
        console.log('Failed to parse edit job:', e);
      }
    }
  }, [editJobStr]);

  const handlePost = async () => {
    console.log('🚀 POST JOB button pressed');
    setStatusMessage(null);

    if (!title || !description || !location || !budget || !category || !skillsRequired) {
      const msg = 'Please fill in all fields.';
      setStatusMessage({ type: 'error', text: msg });
      showAlert('Error', msg);
      return;
    }

    const budgetNum = parseFloat(budget);
    if (isNaN(budgetNum) || budgetNum <= 0) {
      const msg = 'Please enter a valid budget amount.';
      setStatusMessage({ type: 'error', text: msg });
      showAlert('Error', msg);
      return;
    }

    // Convert comma-separated skills to array
    const skillsArray = skillsRequired
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    if (skillsArray.length === 0) {
      const msg = 'Please enter at least one skill.';
      setStatusMessage({ type: 'error', text: msg });
      showAlert('Error', msg);
      return;
    }

    setLoading(true);
    try {
      if (isEditing && editJobId) {
        console.log('📤 Updating job...');
        await providerAPI.updateJob(editJobId, {
          title,
          description,
          location,
          skillsRequired: skillsArray,
          budget: budgetNum,
          category: category.toUpperCase(),
        });
        console.log('✅ Job updated successfully');
        setStatusMessage({ type: 'success', text: 'Job updated successfully!' });
        showAlert('Success', 'Job updated successfully!');
        // Navigate back to my-jobs after editing
        setTimeout(() => router.back(), 800);
      } else {
        console.log('📤 Sending job payload...');
        const response = await providerAPI.postJob({
          title,
          description,
          location,
          skillsRequired: skillsArray,
          budget: budgetNum,
          category: category.toUpperCase(),
        });
        console.log('✅ Job posted successfully:', response.data);
        setStatusMessage({ type: 'success', text: 'Job posted successfully!' });
        showAlert('Success', 'Job posted successfully!');
        // Clear the form
        setTitle('');
        setDescription('');
        setLocation('');
        setBudget('');
        setCategory('');
        setSkillsRequired('');
      }
    } catch (error: any) {
      console.log('❌ Post job error:', error);
      console.log('❌ Error response:', error.response?.data);
      console.log('❌ Error status:', error.response?.status);
      const msg = error.response?.data?.message || error.message || 'Failed to post job. Please try again.';
      setStatusMessage({ type: 'error', text: msg });
      showAlert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.screen}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <FadeInView delay={50}>

          <View style={{ position: 'absolute', top: -1000, left: 0, right: 0, height: 1000, backgroundColor: '#D2C5FC' }} />
          <LinearGradient
            colors={['#D2C5FC', '#EBE7FF', 'rgba(255, 255, 255, 0)']}
            style={styles.gradientHeader}
          >
            <View style={styles.headerSection}>
              <Text style={styles.screenTitle}>{isEditing ? 'Edit Gig' : 'Post a Gig'}</Text>
              <Text style={styles.body}>{isEditing ? 'Update this job listing.' : 'Create a new job for seekers to apply.'}</Text>
            </View>
          </LinearGradient>

          {/* ✅ Inline status banner — always visible on screen */}
          {statusMessage && (
            <View
              style={[
                styles.statusBanner,
                statusMessage.type === 'success' ? styles.statusSuccess : styles.statusError,
              ]}
            >
              <Text style={styles.statusText}>
                {statusMessage.type === 'success' ? '✅ ' : '⚠️ '}
                {statusMessage.text}
              </Text>
            </View>
          )}

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Job Title</Text>
            <TextInput
              style={[styles.fieldInput, activeInput === 'title' && styles.fieldInputFocused]}
              placeholder="e.g. Fix pipe"
              placeholderTextColor={theme.colors.textMuted}
              value={title}
              onChangeText={setTitle}
              onFocus={() => setActiveInput('title')}
              onBlur={() => setActiveInput(null)}
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Description</Text>
            <TextInput
              style={[
                styles.fieldInput,
                styles.textArea,
                activeInput === 'description' && styles.fieldInputFocused,
              ]}
              placeholder="e.g. Kitchen leakage needs fixing"
              placeholderTextColor={theme.colors.textMuted}
              value={description}
              onChangeText={setDescription}
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
              placeholder="e.g. Hyderabad"
              placeholderTextColor={theme.colors.textMuted}
              value={location}
              onChangeText={setLocation}
              onFocus={() => setActiveInput('location')}
              onBlur={() => setActiveInput(null)}
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Skills Required</Text>
            <TextInput
              style={[styles.fieldInput, activeInput === 'skills' && styles.fieldInputFocused]}
              placeholder="e.g. Plumbing, Electrical (comma separated)"
              placeholderTextColor={theme.colors.textMuted}
              value={skillsRequired}
              onChangeText={setSkillsRequired}
              onFocus={() => setActiveInput('skills')}
              onBlur={() => setActiveInput(null)}
            />
            <Text style={styles.fieldHint}>Separate multiple skills with commas</Text>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Budget (₹)</Text>
            <TextInput
              style={[styles.fieldInput, activeInput === 'budget' && styles.fieldInputFocused]}
              placeholder="e.g. 500"
              placeholderTextColor={theme.colors.textMuted}
              value={budget}
              onChangeText={setBudget}
              onFocus={() => setActiveInput('budget')}
              onBlur={() => setActiveInput(null)}
              keyboardType="numeric"
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Category</Text>
            <AnimatedButton
              style={[
                styles.fieldInput,
                styles.categorySelectorTrigger,
              ]}
              onPress={() => setShowPicker(true)}
            >
              <View style={styles.categoryTriggerContent}>
                {category ? (
                  <>
                    <Ionicons
                      name={getCategoryIcon(category) as any}
                      size={18}
                      color={theme.colors.primary}
                      style={{ marginRight: 8 }}
                    />
                    <Text style={styles.categorySelectedText}>{getCategoryLabel(category)}</Text>
                  </>
                ) : (
                  <Text style={styles.categoryPlaceholderText}>Select a category...</Text>
                )}
              </View>
              <Ionicons name="chevron-down" size={18} color={theme.colors.textMuted} />
            </AnimatedButton>
          </View>

          <AnimatedButton
            style={styles.primaryBtn}
            onPress={handlePost}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.primaryBtnText}>{isEditing ? 'UPDATE JOB' : 'POST JOB'}</Text>
            )}
          </AnimatedButton>

          {/* Grouped, Searchable Category Selector Modal */}
          <Modal visible={showPicker} animationType="slide" transparent={false}>
            <SafeAreaView style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select Category</Text>
                <Pressable onPress={() => { setShowPicker(false); setPickerSearch(''); }} style={styles.closeBtn}>
                  <Ionicons name="close" size={24} color={theme.colors.text} />
                </Pressable>
              </View>
              
              <View style={styles.modalSearchRow}>
                <View style={styles.modalSearchInputWrapper}>
                  <Ionicons name="search-outline" size={18} color={theme.colors.textMuted} style={styles.modalSearchIcon} />
                  <TextInput
                    style={styles.modalSearchInput}
                    placeholder="Search categories..."
                    placeholderTextColor={theme.colors.textMuted}
                    value={pickerSearch}
                    onChangeText={setPickerSearch}
                    autoCorrect={false}
                  />
                  {pickerSearch.length > 0 && (
                    <Pressable onPress={() => setPickerSearch('')}>
                      <Ionicons name="close-circle" size={18} color={theme.colors.textMuted} />
                    </Pressable>
                  )}
                </View>
              </View>

              <ScrollView contentContainerStyle={styles.modalScrollContent} keyboardShouldPersistTaps="handled">
                {pickerSearch.trim() ? (
                  // Search results view
                  <View>
                    <Text style={styles.searchResultsTitle}>Search Results ({filteredCategories.length})</Text>
                    {filteredCategories.length > 0 ? (
                      <View style={styles.categoryGrid}>
                        {filteredCategories.map((cat) => (
                          <Pressable
                            key={cat.key}
                            style={[
                              styles.categoryChip,
                              category === cat.key && styles.categoryChipActive,
                              styles.modalCategoryChip
                            ]}
                            onPress={() => handleSelectCategory(cat.key)}
                          >
                            <Ionicons
                              name={cat.icon as any}
                              size={14}
                              color={category === cat.key ? '#FFF' : theme.colors.textMuted}
                              style={{ marginRight: 6 }}
                            />
                            <Text
                              style={[
                                styles.categoryChipText,
                                category === cat.key && styles.categoryChipTextActive,
                              ]}
                            >
                              {cat.label}
                            </Text>
                          </Pressable>
                        ))}
                      </View>
                    ) : (
                      <View style={styles.noResultsContainer}>
                        <Ionicons name="alert-circle-outline" size={40} color={theme.colors.textMuted} />
                        <Text style={styles.noResultsText}>No matching categories found</Text>
                      </View>
                    )}
                  </View>
                ) : (
                  // Grouped categories
                  CATEGORY_GROUPS.map((group) => {
                    const isExpanded = !!expandedGroups[group.name];
                    return (
                      <View key={group.name} style={styles.groupContainer}>
                        <Pressable
                          style={styles.groupHeader}
                          onPress={() => toggleGroup(group.name)}
                        >
                          <Text style={styles.groupTitle}>{group.name}</Text>
                          <Ionicons
                            name={isExpanded ? 'chevron-up' : 'chevron-down'}
                            size={18}
                            color={theme.colors.textMuted}
                          />
                        </Pressable>
                        {isExpanded && (
                          <View style={styles.groupContent}>
                            <View style={styles.categoryGrid}>
                              {group.categories.map((cat) => (
                                <Pressable
                                  key={cat.key}
                                  style={[
                                    styles.categoryChip,
                                    category === cat.key && styles.categoryChipActive,
                                    styles.modalCategoryChip
                                  ]}
                                  onPress={() => handleSelectCategory(cat.key)}
                                >
                                  <Ionicons
                                    name={cat.icon as any}
                                    size={14}
                                    color={category === cat.key ? '#FFF' : theme.colors.textMuted}
                                    style={{ marginRight: 6 }}
                                  />
                                  <Text
                                    style={[
                                      styles.categoryChipText,
                                      category === cat.key && styles.categoryChipTextActive,
                                    ]}
                                  >
                                    {cat.label}
                                  </Text>
                                </Pressable>
                              ))}
                            </View>
                          </View>
                        )}
                      </View>
                    );
                  })
                )}
              </ScrollView>
            </SafeAreaView>
          </Modal>

        </FadeInView>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const getStyles = (theme: any, isDarkMode: boolean) => StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.bg,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  gradientHeader: {
    marginHorizontal: -24,
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 60 : 45,
    paddingBottom: 24,
    marginBottom: 24,
  },
  headerSection: {
    marginBottom: 0,
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
  statusBanner: {
    padding: 14,
    borderRadius: theme.borders.radius,
    marginBottom: 24,
    borderWidth: 1,
  },
  statusSuccess: {
    backgroundColor: '#e6f4ea',
    borderColor: '#2d6a4f',
  },
  statusError: {
    backgroundColor: '#fde8e8',
    borderColor: '#c0392b',
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.text,
  },
  fieldGroup: {
    marginBottom: 28,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  fieldInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    height: 54,
    paddingHorizontal: 16,
    color: theme.colors.text,
    fontSize: 15,
  },
  fieldInputFocused: {
    borderColor: '#111827',
    borderWidth: 1.5,
  },
  fieldHint: {
    color: theme.colors.textDim,
    fontSize: 11,
    marginTop: 6,
  },
  textArea: {
    minHeight: 120,
    height: undefined,
    paddingVertical: 14,
  },
  primaryBtn: {
    backgroundColor: theme.colors.primary,
    borderRadius: 8,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  categoryChip: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borders.radius,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: 'transparent',
  },
  categoryChipActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  categoryChipText: {
    color: theme.colors.textMuted,
    fontSize: 12,
    fontWeight: '500',
  },
  categoryChipTextActive: {
    color: '#FFFFFF',
  },
  categorySelectorTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  categoryTriggerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categorySelectedText: {
    color: theme.colors.text,
    fontSize: 15,
    fontWeight: '500',
  },
  categoryPlaceholderText: {
    color: theme.colors.textMuted,
    fontSize: 15,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
    backgroundColor: '#FFFFFF',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text,
  },
  closeBtn: {
    padding: 4,
  },
  modalSearchRow: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
  },
  modalSearchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 40,
  },
  modalSearchIcon: {
    marginRight: 8,
  },
  modalSearchInput: {
    flex: 1,
    fontSize: 14,
    color: theme.colors.text,
    height: '100%',
  },
  modalScrollContent: {
    padding: 24,
    paddingBottom: 40,
  },
  searchResultsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textMuted,
    marginBottom: 12,
  },
  modalCategoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8E8E8',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  groupContainer: {
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    overflow: 'hidden',
  },
  groupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
  },
  groupTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.text,
  },
  groupContent: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#F7F7F7',
    backgroundColor: '#FAFAFA',
  },
  noResultsContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  noResultsText: {
    fontSize: 14,
    color: theme.colors.textMuted,
    marginTop: 8,
  },
});

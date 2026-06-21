import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Switch,
  Platform,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';

export default function SettingsScreen() {
  const router = useRouter();
  const { isDarkMode, toggleTheme, colors } = useTheme();

  const styles = getStyles(colors);

  const handleBack = () => {
    router.back();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Appearance Group */}
        <Text style={styles.groupTitle}>Appearance</Text>
        <View style={styles.card}>
          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <View style={[styles.iconContainer, { backgroundColor: isDarkMode ? '#2D2D30' : '#EBE7FF' }]}>
                <Ionicons name="moon-outline" size={20} color={isDarkMode ? '#EBE7FF' : '#5E43C8'} />
              </View>
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingTitle}>Dark Mode</Text>
                <Text style={styles.settingSubtitle}>Switch between light and dark themes</Text>
              </View>
            </View>
            <Switch
              value={isDarkMode}
              onValueChange={toggleTheme}
              trackColor={{ false: '#D1D5DB', true: '#B4A2F8' }}
              thumbColor={isDarkMode ? '#5E43C8' : '#F4F3F4'}
              ios_backgroundColor="#3e3e3e"
            />
          </View>
        </View>

        {/* Notifications Group */}
        <Text style={styles.groupTitle}>Notifications</Text>
        <View style={styles.card}>
          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <View style={[styles.iconContainer, { backgroundColor: isDarkMode ? '#2D2D30' : '#E6F4EA' }]}>
                <Ionicons name="notifications-outline" size={20} color={isDarkMode ? '#81C995' : '#137333'} />
              </View>
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingTitle}>Push Notifications</Text>
                <Text style={styles.settingSubtitle}>Get alerts for job matches and status updates</Text>
              </View>
            </View>
            <Switch
              value={true}
              disabled={true}
              trackColor={{ false: '#D1D5DB', true: '#A8DAB5' }}
              thumbColor="#34A853"
            />
          </View>
          <View style={styles.divider} />
          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <View style={[styles.iconContainer, { backgroundColor: isDarkMode ? '#2D2D30' : '#E8F0FE' }]}>
                <Ionicons name="mail-outline" size={20} color={isDarkMode ? '#8AB4F8' : '#1A73E8'} />
              </View>
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingTitle}>Email Alerts</Text>
                <Text style={styles.settingSubtitle}>Receive weekly recommendations in your inbox</Text>
              </View>
            </View>
            <Switch
              value={false}
              disabled={true}
              trackColor={{ false: '#D1D5DB', true: '#D1D5DB' }}
              thumbColor="#F4F3F4"
            />
          </View>
        </View>

        {/* Account & Security Group */}
        <Text style={styles.groupTitle}>Security</Text>
        <View style={styles.card}>
          <TouchableOpacity style={styles.settingRowPressable} activeOpacity={0.6}>
            <View style={styles.settingLeft}>
              <View style={[styles.iconContainer, { backgroundColor: isDarkMode ? '#2D2D30' : '#FEF7E0' }]}>
                <Ionicons name="lock-closed-outline" size={20} color={isDarkMode ? '#FDD663' : '#B06000'} />
              </View>
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingTitle}>Change Password</Text>
                <Text style={styles.settingSubtitle}>Update your login password</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textDim} />
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity style={styles.settingRowPressable} activeOpacity={0.6}>
            <View style={styles.settingLeft}>
              <View style={[styles.iconContainer, { backgroundColor: isDarkMode ? '#2D2D30' : '#FCE8E6' }]}>
                <Ionicons name="shield-checkmark-outline" size={20} color={isDarkMode ? '#F28B82' : '#C5221F'} />
              </View>
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingTitle}>Two-Factor Authentication</Text>
                <Text style={styles.settingSubtitle}>Add an extra layer of protection</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textDim} />
          </TouchableOpacity>
        </View>

        {/* Support & Legal */}
        <Text style={styles.groupTitle}>Support</Text>
        <View style={styles.card}>
          <TouchableOpacity style={styles.settingRowPressable} activeOpacity={0.6}>
            <View style={styles.settingLeft}>
              <View style={[styles.iconContainer, { backgroundColor: isDarkMode ? '#2D2D30' : '#F3F4F6' }]}>
                <Ionicons name="help-circle-outline" size={20} color={colors.text} />
              </View>
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingTitle}>Help Center</Text>
                <Text style={styles.settingSubtitle}>FAQ and troubleshooting guides</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textDim} />
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity style={styles.settingRowPressable} activeOpacity={0.6}>
            <View style={styles.settingLeft}>
              <View style={[styles.iconContainer, { backgroundColor: isDarkMode ? '#2D2D30' : '#F3F4F6' }]}>
                <Ionicons name="document-text-outline" size={20} color={colors.text} />
              </View>
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingTitle}>Privacy Policy</Text>
                <Text style={styles.settingSubtitle}>Read our terms and privacy guidelines</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textDim} />
          </TouchableOpacity>
        </View>

        {/* About info */}
        <View style={styles.aboutContainer}>
          <Text style={styles.aboutText}>Gigzy App</Text>
          <Text style={styles.aboutVersion}>Version 1.0.0 • Production</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const getStyles = (colors: any) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.bg,
      paddingTop: Platform.OS === 'android' ? 25 : 0,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      backgroundColor: colors.card,
    },
    backButton: {
      padding: 8,
      borderRadius: 20,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.text,
    },
    headerPlaceholder: {
      width: 40,
    },
    scrollContent: {
      padding: 16,
      paddingBottom: 40,
    },
    groupTitle: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.textMuted,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginTop: 24,
      marginBottom: 8,
      marginLeft: 4,
    },
    card: {
      backgroundColor: colors.card,
      borderRadius: 16,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: colors.border,
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.05,
          shadowRadius: 4,
        },
        android: {
          elevation: 2,
        },
      }),
    },
    settingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 14,
    },
    settingRowPressable: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 14,
    },
    settingLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
      marginRight: 16,
    },
    iconContainer: {
      width: 38,
      height: 38,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    settingTextContainer: {
      flex: 1,
    },
    settingTitle: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 2,
    },
    settingSubtitle: {
      fontSize: 12,
      color: colors.textMuted,
    },
    divider: {
      height: 1,
      backgroundColor: colors.border,
      marginLeft: 66,
    },
    aboutContainer: {
      alignItems: 'center',
      marginTop: 40,
      marginBottom: 10,
    },
    aboutText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.textMuted,
      marginBottom: 4,
    },
    aboutVersion: {
      fontSize: 12,
      color: colors.textDim,
    },
  });

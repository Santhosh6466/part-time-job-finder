import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { View, StyleSheet, Text, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as themeConst from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';
import { FadeInView } from '../../components/FadeInView';

export default function ProviderChatScreen() {
  const { colors, isDarkMode } = useTheme();
  const theme = { ...themeConst.PROFESSIONAL_THEME, colors };
  const styles = getStyles(theme, isDarkMode);

  return (
    <View style={styles.screen}>
      <FadeInView delay={50}>
        <View style={{ position: 'absolute', top: -1000, left: 0, right: 0, height: 1000, backgroundColor: '#D2C5FC' }} />
        <LinearGradient
          colors={['#D2C5FC', '#EBE7FF', 'rgba(255, 255, 255, 0)']}
          style={styles.gradientHeader}
        >
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Messages</Text>
            <Text style={styles.headerSubtitle}>Connect with applicants</Text>
          </View>
        </LinearGradient>
      </FadeInView>

      <FadeInView delay={150} style={{ flex: 1 }}>
        <View style={styles.content}>
          <View style={styles.emptyIcon}>
            <Ionicons name="chatbubbles-outline" size={48} color={colors.textMuted} />
          </View>
          <Text style={styles.emptyTitle}>No messages yet</Text>
          <Text style={styles.emptyBody}>
            Chat with job seekers who apply to your listings.
          </Text>
        </View>
      </FadeInView>
    </View>
  );
}

function getStyles(theme: any, isDarkMode: boolean) {
  return StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: theme.colors.bg,
    },
    gradientHeader: {
      paddingTop: Platform.OS === 'ios' ? 50 : 35,
    },
    header: {
      paddingHorizontal: 20,
      paddingTop: 20,
      paddingBottom: 16,
      backgroundColor: 'transparent',
    },
    headerTitle: {
      fontSize: 24,
      fontWeight: '800',
      color: theme.colors.text,
      letterSpacing: -0.5,
    },
    headerSubtitle: {
      fontSize: 13,
      color: theme.colors.textMuted,
      marginTop: 2,
    },
    content: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 32,
      paddingBottom: 100,
    },
    emptyIcon: {
      width: 96,
      height: 96,
      borderRadius: 48,
      backgroundColor: theme.colors.cardBackgroundLight,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 20,
    },
    emptyTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: theme.colors.text,
      marginBottom: 8,
      textAlign: 'center',
    },
    emptyBody: {
      fontSize: 14,
      color: theme.colors.textMuted,
      textAlign: 'center',
      lineHeight: 22,
    },
  });
}

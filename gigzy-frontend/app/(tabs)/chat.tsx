import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { FadeInView } from '../../components/FadeInView';
import * as themeConst from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';

export default function ChatScreen() {
  const { colors, isDarkMode } = useTheme();
  const theme = { ...themeConst.PROFESSIONAL_THEME, colors };
  const styles = getStyles(theme, isDarkMode);

  return (
    <View style={styles.container}>
      <View style={{ position: 'absolute', top: -1000, left: 0, right: 0, height: 1000, backgroundColor: '#D2C5FC' }} />
      <LinearGradient
        colors={['#D2C5FC', '#EBE7FF', 'rgba(255, 255, 255, 0)']}
        style={styles.gradientHeader}
      >
        <View style={styles.headerSection}>
          <Text style={styles.headerTitle}>Messages</Text>
        </View>
      </LinearGradient>
      <FadeInView delay={50} style={styles.content}>
        <Text style={styles.title}>Messages Screen</Text>
        <Text style={styles.subtitle}>Chat with connections.</Text>
      </FadeInView>
    </View>
  );
}

function getStyles(theme: any, isDarkMode: boolean) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.bg,
    },
    gradientHeader: {
      paddingTop: Platform.OS === 'ios' ? 50 : 35,
    },
    headerSection: {
      paddingHorizontal: 24,
      paddingTop: 20,
      paddingBottom: 16,
    },
    headerTitle: {
      ...theme.typography.display,
      fontSize: 26,
      color: theme.colors.text,
    },
    content: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingBottom: 100,
    },
    title: {
      ...theme.typography.h1,
      color: theme.colors.text,
    },
    subtitle: {
      ...theme.typography.body,
      color: theme.colors.textMuted,
      marginTop: 8,
    },
  });
}

import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { PROFESSIONAL_THEME as theme } from '../../constants/theme';

export default function NetworkScreen() {
  return (
    <View style={styles.container}>
      <View style={{ position: 'absolute', top: -1000, left: 0, right: 0, height: 1000, backgroundColor: '#D2C5FC' }} />
      <LinearGradient
        colors={['#D2C5FC', '#EBE7FF', 'rgba(255, 255, 255, 0)']}
        style={styles.gradientHeader}
      >
        <View style={styles.headerSection}>
          <Text style={styles.headerTitle}>Network</Text>
        </View>
      </LinearGradient>
      <View style={styles.content}>
        <Text style={styles.title}>Network Screen</Text>
        <Text style={styles.subtitle}>Connect with other professionals.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
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

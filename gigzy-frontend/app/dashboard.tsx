import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Platform, ScrollView, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { getToken, removeToken } from '../services/api';
import { PROFESSIONAL_THEME as theme } from '../constants/theme';

export default function DashboardScreen() {
  const router = useRouter();
  const [tokenPreview, setTokenPreview] = useState('');
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
  }, [fadeAnim]);

  useEffect(() => {
    const checkAuth = async () => {
      const token = await getToken();
      if (!token) {
        router.replace('/login' as any);
      } else {
        setTokenPreview(token.substring(0, 10) + '...');
      }
    };
    checkAuth();
  }, [router]);

  const handleLogout = async () => {
    await removeToken();
    router.replace('/login' as any);
  };

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Animated.View style={{ opacity: fadeAnim }}>

          <View style={styles.headerRow}>
            <View style={styles.logoRow}>
              <View style={styles.logoSquare}>
                <Text style={styles.logoLetter}>J</Text>
              </View>
              <View>
                <Text style={styles.logoName}>Jobspot</Text>
              </View>
            </View>
            <TouchableOpacity onPress={handleLogout} activeOpacity={0.8}>
              <Text style={styles.headerLogoutText}>LOG OUT</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.headerSpacer}>
            <Text style={styles.screenTitle}>Dashboard</Text>
            <Text style={styles.body}>You&apos;re all set. Welcome aboard.</Text>
          </View>

          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.statusDot} />
              <Text style={styles.sectionHeading}>AUTHENTICATED</Text>
            </View>
            
            <View style={styles.dividerLine} />

            <View style={styles.tokenSection}>
              <Text style={styles.tokenLabel}>Secure Token</Text>
              <Text style={styles.tokenValue}>{tokenPreview}</Text>
            </View>
          </View>

          <View style={styles.layoutGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>0</Text>
              <Text style={styles.statLabel}>APPLICATIONS</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>0</Text>
              <Text style={styles.statLabel}>SAVED JOBS</Text>
            </View>
          </View>

          <View style={styles.iconContainerBox}>
            <View style={styles.iconContainer}>
              <Text style={styles.iconPlaceholder}>+</Text>
            </View>
          </View>

        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.bg,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 80,
    paddingBottom: 40,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 64,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoSquare: {
    width: 64,
    height: 64,
    borderWidth: 1,
    borderColor: theme.colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    backgroundColor: 'transparent',
  },
  logoLetter: {
    color: theme.colors.text,
    ...theme.typography.h2,
  },
  logoName: {
    color: theme.colors.text,
    ...theme.typography.h2,
    textTransform: 'uppercase',
  },
  headerLogoutText: {
    color: theme.colors.textMuted,
    ...theme.typography.caption,
    textDecorationLine: 'underline',
  },
  headerSpacer: {
    marginBottom: 48,
  },
  screenTitle: {
    color: theme.colors.text,
    ...theme.typography.display,
    marginBottom: 16,
  },
  body: {
    color: theme.colors.textMuted,
    ...theme.typography.body,
  },
  card: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borders.radius,
    padding: 24,
    marginBottom: 24,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 24,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 0,
    backgroundColor: theme.colors.text,
  },
  sectionHeading: {
    color: theme.colors.text,
    ...theme.typography.caption,
  },
  dividerLine: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginBottom: 24,
    width: '100%',
  },
  tokenSection: {
    marginBottom: 8,
  },
  tokenLabel: {
    color: theme.colors.textMuted,
    ...theme.typography.body,
    marginBottom: 8,
  },
  tokenValue: {
    color: theme.colors.text,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 14,
  },
  layoutGrid: {
    flexDirection: 'row',
    gap: 24,
    marginBottom: 48,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borders.radius,
    padding: 24,
  },
  statNumber: {
    color: theme.colors.text,
    ...theme.typography.h1,
    marginBottom: 16,
  },
  statLabel: {
    color: theme.colors.textMuted,
    ...theme.typography.caption,
  },
  iconContainerBox: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 32,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderWidth: 1,
    borderColor: theme.colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconPlaceholder: {
    color: theme.colors.text,
    ...theme.typography.h2,
  },
});

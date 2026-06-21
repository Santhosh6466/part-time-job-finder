import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Dimensions, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { PROFESSIONAL_THEME as theme } from '../constants/theme';
import { Feather } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

export default function OnboardingScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Top bar */}
        <View style={styles.topNav}>
          <Text style={styles.logoText}>jobspot.</Text>
        </View>

        {/* Illustration Area */}
        <View style={styles.illustrationContainer}>
          <View style={styles.scene}>
            {/* Blob Background */}
            <View style={styles.blob} />
            
            {/* Phone */}
            <View style={styles.phone}>
               <View style={styles.notch} />
               {/* Phone UI Lines */}
               <View style={styles.phoneContent}>
                 <View style={[styles.phoneLine, { width: 30, height: 4, backgroundColor: '#211D42' }]} />
                 <View style={[styles.phoneLine, { width: 70, height: 4, backgroundColor: '#211D42' }]} />
                 <View style={[styles.phoneLine, { width: 70, height: 4, backgroundColor: '#211D42', marginBottom: 12 }]} />
                 
                 {[1, 2, 3, 4].map(i => (
                   <View key={i} style={styles.mockItem}>
                     <View style={[styles.phoneLine, { width: 30, height: 4 }]} />
                     <View style={[styles.phoneLine, { width: 70, height: 4 }]} />
                     <View style={[styles.phoneLine, { width: 70, height: 4 }]} />
                   </View>
                 ))}
               </View>
            </View>

            {/* Magnifying Glass Badge */}
            <View style={styles.magBadge}>
              <Feather name="search" size={28} color="#FFF" />
            </View>

            {/* Person Illustration */}
            <View style={styles.person}>
              <View style={styles.head} />
              <View style={styles.body}>
                <View style={styles.armLeft} />
                <View style={styles.armRight} />
              </View>
              <View style={styles.legs}>
                <View style={styles.legLeft} />
                <View style={styles.legRight} />
              </View>
              {/* Shoes */}
              <View style={styles.shoes}>
                <View style={styles.shoeLeft} />
                <View style={styles.shoeRight} />
              </View>
            </View>
            
            {/* Floor Line */}
            <View style={styles.floorLine} />
          </View>
        </View>

        {/* Text Area */}
        <View style={styles.textArea}>
          <Text style={styles.titleText}>Find Your</Text>
          <View style={styles.highlightWrapper}>
            <Text style={[styles.titleText, styles.highlightText]}>Dream Job</Text>
            <View style={styles.underline} />
          </View>
          <Text style={styles.titleText}>Here!</Text>

          <Text style={styles.subtitleText}>
            Explore all the most exciting job roles based on your interest.
          </Text>
        </View>

        {/* Next Button */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={styles.nextButton}
            onPress={() => router.replace('/login' as any)}
            activeOpacity={0.8}
          >
            <Feather name="arrow-right" size={32} color="#FFF" />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F9FAFB', // Matches main app bg
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 40,
    justifyContent: 'space-between',
  },
  topNav: {
    alignItems: 'flex-end',
    marginBottom: 20,
  },
  logoText: {
    fontSize: 24,
    fontWeight: '900',
    color: '#111827',
    letterSpacing: -1,
  },
  illustrationContainer: {
    height: 380,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    width: '100%',
  },
  scene: {
    width: 320,
    height: 350,
    position: 'relative',
  },
  blob: {
    position: 'absolute',
    width: 320,
    height: 320,
    backgroundColor: '#FDDDBD', // Peach blob color
    borderRadius: 160,
    transform: [{ scaleX: 1.1 }, { rotate: '-15deg' }],
    left: 0,
    top: 10,
  },
  phone: {
    width: 170,
    height: 320,
    backgroundColor: '#FFF',
    borderRadius: 24,
    borderWidth: 6,
    borderColor: '#373A4F',
    position: 'absolute',
    left: 40,
    top: 10,
    alignItems: 'center',
    paddingTop: 12,
  },
  notch: {
    width: 50,
    height: 12,
    backgroundColor: '#373A4F',
    borderRadius: 6,
    marginBottom: 24,
  },
  phoneContent: {
    width: '100%',
    paddingHorizontal: 20,
  },
  phoneLine: {
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    marginBottom: 6,
  },
  mockItem: {
    marginBottom: 16,
  },
  magBadge: {
    position: 'absolute',
    left: 10,
    top: 0,
    width: 70,
    height: 70,
    backgroundColor: '#F49E5D',
    borderRadius: 35,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: '#FFF',
    zIndex: 10,
  },
  person: {
    position: 'absolute',
    right: 30,
    bottom: 30,
    alignItems: 'center',
    zIndex: 5,
  },
  head: {
    width: 34,
    height: 34,
    backgroundColor: '#FFC8B8',
    borderRadius: 17,
    marginBottom: 2,
    borderTopWidth: 10,
    borderTopColor: '#211D42',
    borderRightWidth: 4,
    borderRightColor: '#211D42',
    transform: [{ rotate: '10deg' }],
  },
  body: {
    width: 56,
    height: 66,
    backgroundColor: '#1E1466',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderBottomLeftRadius: 6,
    borderBottomRightRadius: 6,
    position: 'relative',
    zIndex: 2,
  },
  armLeft: {
    position: 'absolute',
    left: -40,
    top: 10,
    width: 50,
    height: 14,
    backgroundColor: '#FFC8B8',
    borderRadius: 7,
    transform: [{ rotate: '-5deg' }],
    zIndex: -1,
  },
  armRight: {
    position: 'absolute',
    right: -10,
    top: 10,
    width: 14,
    height: 50,
    backgroundColor: '#FFC8B8',
    borderRadius: 7,
    transform: [{ rotate: '-15deg' }],
  },
  legs: {
    flexDirection: 'row',
    marginTop: -4,
    zIndex: 1,
  },
  legLeft: {
    width: 18,
    height: 80,
    backgroundColor: '#7A7C8D',
    marginRight: 6,
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
    transform: [{ rotate: '3deg' }],
  },
  legRight: {
    width: 18,
    height: 80,
    backgroundColor: '#7A7C8D',
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
    transform: [{ rotate: '-2deg' }],
  },
  shoes: {
    flexDirection: 'row',
    position: 'absolute',
    bottom: -6,
    width: '100%',
    justifyContent: 'space-around',
    zIndex: 3,
  },
  shoeLeft: {
    width: 24,
    height: 10,
    backgroundColor: '#211D42',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    marginLeft: -10,
  },
  shoeRight: {
    width: 24,
    height: 10,
    backgroundColor: '#211D42',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    marginLeft: 6,
  },
  floorLine: {
    position: 'absolute',
    bottom: 24,
    width: 220,
    height: 2,
    backgroundColor: '#211D42',
    left: 50,
    zIndex: 1,
  },
  textArea: {
    marginTop: 0,
  },
  titleText: {
    fontSize: 48,
    fontWeight: '800',
    color: '#1A1A2E',
    lineHeight: 52,
    letterSpacing: -1,
  },
  highlightWrapper: {
    alignSelf: 'flex-start',
    position: 'relative',
    marginVertical: -2,
  },
  highlightText: {
    color: '#111827',
  },
  underline: {
    position: 'absolute',
    bottom: 8,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: '#FEDF60', // Yellow accent
  },
  subtitleText: {
    marginTop: 16,
    fontSize: 16,
    color: '#687076',
    lineHeight: 24,
    maxWidth: '85%',
  },
  buttonContainer: {
    alignItems: 'flex-end',
    marginTop: 10,
  },
  nextButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#111827', // Black primary button style
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
});

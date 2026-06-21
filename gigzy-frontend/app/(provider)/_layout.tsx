import { Ionicons } from '@expo/vector-icons';
import * as themeConst from '../../constants/theme';
import { Tabs } from 'expo-router';
import React from 'react';
import { Platform, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

const PostJobButton = (props: any) => {
  const { colors, isDarkMode } = useTheme();
  const theme = { ...themeConst.PROFESSIONAL_THEME, colors };
  const styles = getStyles(theme, isDarkMode);
  return (
    <View style={[props.style, styles.addButtonWrapper]}>
      <TouchableOpacity
        style={styles.customAddButton}
        onPress={props.onPress}
        activeOpacity={0.85}
      >
        <Ionicons name="add" size={30} color={isDarkMode ? '#111827' : '#FFFFFF'} />
      </TouchableOpacity>
    </View>
  );
};

export default function ProviderTabLayout() {
  const { colors, isDarkMode } = useTheme();
  const theme = { ...themeConst.PROFESSIONAL_THEME, colors };
  const styles = getStyles(theme, isDarkMode);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          height: Platform.OS === 'ios' ? 84 : 68,
          paddingBottom: Platform.OS === 'ios' ? 24 : 12,
          paddingTop: 10,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.05,
          shadowRadius: 8,
          elevation: 8,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarItemStyle: {
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
        },
      }}
    >
      {/* Tab 1 — My Jobs */}
      <Tabs.Screen
        name="my-jobs"
        options={{
          title: 'My Jobs',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'briefcase' : 'briefcase-outline'}
              size={24}
              color={color}
            />
          ),
        }}
      />

      {/* Tab 2 — Applications */}
      <Tabs.Screen
        name="applications"
        options={{
          title: 'Applicants',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'people' : 'people-outline'}
              size={24}
              color={color}
            />
          ),
        }}
      />

      {/* Tab 3 — Post Job (center floating button) */}
      <Tabs.Screen
        name="post-job"
        options={{
          title: 'Post Job',
          tabBarIcon: () => null,
          tabBarButton: (props) => <PostJobButton {...props} />,
        }}
      />

      {/* Tab 4 — Chat */}
      <Tabs.Screen
        name="chat"
        options={{
          title: 'Chat',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'chatbubble' : 'chatbubble-outline'}
              size={24}
              color={color}
            />
          ),
        }}
      />

      {/* Tab 5 — Profile */}
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'person' : 'person-outline'}
              size={24}
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  );
}

function getStyles(theme: any, isDarkMode: boolean) {
  return StyleSheet.create({
    addButtonWrapper: {
      justifyContent: 'center',
      alignItems: 'center',
      flex: 1,
    },
    customAddButton: {
      marginTop: -16,
      width: 58,
      height: 58,
      borderRadius: 29,
      backgroundColor: theme.colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 3,
      borderColor: theme.colors.card,
      shadowColor: theme.colors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.4,
      shadowRadius: 10,
      elevation: 8,
    },
  });
}

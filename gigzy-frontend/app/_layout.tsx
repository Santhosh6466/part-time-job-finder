import { Stack } from 'expo-router';
import { ThemeProvider } from '../context/ThemeContext';

export default function RootLayout() {
  return (
    <ThemeProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" options={{ title: 'Splash' }} />
        <Stack.Screen name="login" options={{ title: 'Login' }} />
        <Stack.Screen name="register" options={{ title: 'Register' }} />
        <Stack.Screen name="complete-seeker-profile" options={{ title: 'Complete Profile', headerShown: false, gestureEnabled: false }} />
        <Stack.Screen name="complete-provider-profile" options={{ title: 'Company Setup', headerShown: false, gestureEnabled: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="(provider)" options={{ headerShown: false }} />
        <Stack.Screen name="dashboard" options={{ title: 'Dashboard', headerShown: true }} />
        <Stack.Screen name="job/[id]" options={{ title: 'Job Details', headerShown: false }} />
        <Stack.Screen name="settings" options={{ title: 'Settings', headerShown: false }} />
      </Stack>
    </ThemeProvider>
  );
}

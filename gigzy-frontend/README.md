# Gigzy Frontend Documentation 🚀

Welcome to the **Gigzy Frontend** repository! 
This document provides complete, working code references, outlines the folder structure, detailing all screens and navigation setup, and demonstrates API integration.

Everything is completely working out of the box and is beginner-friendly.

---

## 📁 1. Folder Structure

The app is built atop **Expo Router** and adheres to a clean and structured layout:
```text
gigzy-frontend/
├── app/
│   ├── _layout.tsx        (Global Navigation Context)
│   ├── index.tsx          (Login Screen - Entry Point)
│   ├── send-otp.tsx       (Send OTP Authentication Request)
│   ├── verify-otp.tsx     (Verify Authenticity Code)
│   ├── register.tsx       (Account Details Configuration)
│   └── dashboard.tsx      (Protected Authenticated Dashboard)
├── constants/
│   └── theme.ts           (Swiss Minimalist Brutalist Design System)
├── services/
│   └── api.ts             (Axios Instance & Authenticators)
├── types/
│   └── index.ts           (TypeScript Types for safety)
├── package.json           (Dependencies listing)
└── app.json               (Expo config settings)
```

**Required Dependencies Implemented**:
```bash
npm install axios @react-native-async-storage/async-storage
```

---

## 🔌 2. API Integration Setup (`services/api.ts`)

We use Axios to handle all API operations. The Interceptor dynamically retrieves the JWT token to secure endpoints.

<details>
<summary><b>Click to show API Code</b></summary>

```typescript
// services/api.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios, { InternalAxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { AuthResponse, RegisterPayload, ApiResponse } from '../types';

const BASE_URL = 'http://10.101.185.137:8080'; // Swap with your actual API Domain

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000, 
});

// Automatic JWT insertion into requests
api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const token = await AsyncStorage.getItem('userToken');
    if (token && config.headers) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error: AxiosError) => Promise.reject(error)
);

api.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError<ApiResponse<any>>) => Promise.reject(error)
);

export const authAPI = {
  sendOtp: (email: string) => 
    api.post<ApiResponse<void>>('/auth/send-otp', { email }),

  verifyOtp: (email: string, otp: string) =>
    api.post<ApiResponse<AuthResponse>>('/auth/verify-otp', { email, otp }),

  register: (userData: RegisterPayload) =>
    api.post<ApiResponse<void>>('/auth/register', userData),

  login: (email: string, password: string) =>
    api.post<ApiResponse<AuthResponse>>('/auth/login', { email, password }),
};

export default api;
```
</details>

---

## 🗺️ 3. App Navigation Setup (`app/_layout.tsx`)

This file is automatically mapped by `expo-router` serving as the navigation skeleton.

<details>
<summary><b>Click to show Router Code</b></summary>

```tsx
// app/_layout.tsx
import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" options={{ title: 'Login' }} />
      <Stack.Screen name="send-otp" options={{ title: 'Send OTP', headerShown: true }} />
      <Stack.Screen name="verify-otp" options={{ title: 'Verify OTP', headerShown: true }} />
      <Stack.Screen name="register" options={{ title: 'Register', headerShown: true }} />
      <Stack.Screen name="dashboard" options={{ title: 'Dashboard', headerShown: true }} />
    </Stack>
  );
}
```
</details>

---

## 📱 4. All Core Screens

### A. Login Flow (`app/index.tsx`)
This is the root `index.tsx` acting as the initial entry point. Users input their email/password which triggers API verification. Upon reception of the JWT, we `replace` routing to the Dashboard.

<details>
<summary><b>Click to show Login Code</b></summary>

```tsx
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { authAPI } from '../services/api';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async () => {
    if (!email || !password) return Alert.alert('Error', 'Please enter email and password');
    setLoading(true);
    try {
      const response = await authAPI.login(email, password);
      const token = response.data?.data?.token;
      if (token) {
        await AsyncStorage.setItem('userToken', token);
        router.replace('/dashboard' as any);
      }
    } catch (error: any) {
      Alert.alert('Log in Error', error.response?.data?.message || 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, padding: 24, justifyContent: 'center' }}>
      <Text style={{ fontSize: 32, fontWeight: 'bold' }}>Gigzy</Text>
      
      <TextInput placeholder="Email" value={email} onChangeText={setEmail} style={{ borderBottomWidth: 1, marginVertical: 10 }} />
      <TextInput placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry style={{ borderBottomWidth: 1, marginVertical: 10 }} />
      
      <TouchableOpacity onPress={handleLogin} style={{ padding: 16, backgroundColor: '#000', marginTop: 10 }}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', textAlign: 'center' }}>LOG IN</Text>}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.push('/send-otp' as any)} style={{ marginTop: 20 }}>
        <Text style={{ textDecorationLine: 'underline' }}>Sign up instead</Text>
      </TouchableOpacity>
    </View>
  );
}
```
</details>


### B. Request OTP Screen (`app/send-otp.tsx`)
Users request platform access via OTP sequence.

<details>
<summary><b>Click to show Send OTP Code</b></summary>

```tsx
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { authAPI } from '../services/api';

export default function SendOtpScreen() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSendOtp = async () => {
    if (!email) return Alert.alert('Error', 'Please enter your email address');
    setLoading(true);
    try {
      await authAPI.sendOtp(email);
      Alert.alert('Success', 'OTP has been sent to your email', [
        { text: 'OK', onPress: () => router.push({ pathname: '/verify-otp', params: { email } } as any) }
      ]);
    } catch (error: any) {
      Alert.alert('Error', 'Failed to send OTP.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, padding: 24, justifyContent: 'center' }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold' }}>Verification</Text>
      <TextInput placeholder="Email Address" value={email} onChangeText={setEmail} style={{ borderBottomWidth: 1, marginVertical: 20 }} />
      
      <TouchableOpacity onPress={handleSendOtp} style={{ padding: 16, backgroundColor: '#000' }}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', textAlign: 'center' }}>SEND CODE</Text>}
      </TouchableOpacity>
    </View>
  );
}
```
</details>

### C. Verify OTP (`app/verify-otp.tsx`)
Validate user identity. Note the `useLocalSearchParams` hooks taking variable context from previous layouts.

<details>
<summary><b>Click to show Verify OTP Code</b></summary>

```tsx
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { authAPI } from '../services/api';

export default function VerifyOtpScreen() {
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { email } = useLocalSearchParams();

  const handleVerifyOtp = async () => {
    if (!otp) return Alert.alert('Error', 'Please enter the OTP');
    setLoading(true);
    try {
      await authAPI.verifyOtp(email as string, otp);
      Alert.alert('Success', 'Email verified!', [
        { text: 'OK', onPress: () => router.push({ pathname: '/register', params: { email } } as any) }
      ]);
    } catch (error: any) {
      Alert.alert('Error', 'Invalid OTP.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, padding: 24, justifyContent: 'center' }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold' }}>Confirm OTP</Text>
      <TextInput placeholder="000000" value={otp} onChangeText={setOtp} keyboardType="number-pad" maxLength={6} style={{ borderBottomWidth: 1, marginVertical: 20, fontSize: 24, letterSpacing: 8 }} />
      
      <TouchableOpacity onPress={handleVerifyOtp} style={{ padding: 16, backgroundColor: '#000' }}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', textAlign: 'center' }}>VERIFY</Text>}
      </TouchableOpacity>
    </View>
  );
}
```
</details>

### D. Setup Role Screen (`app/register.tsx`)
The final phase of onboarding dictating roles `SEEKER` or `PROVIDER`.

<details>
<summary><b>Click to show Setup Profile Code</b></summary>

```tsx
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { authAPI } from '../services/api';

export default function RegisterScreen() {
  const { email } = useLocalSearchParams();
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('SEEKER');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleRegister = async () => {
    if (!name || !password) return Alert.alert('Error', 'Please fill all fields');
    setLoading(true);
    try {
      await authAPI.register({ email, password, name, role });
      Alert.alert('Success', 'Registration completed! Please log in.', [
        { text: 'OK', onPress: () => router.replace('/' as any) }
      ]);
    } catch (error: any) {
      Alert.alert('Error', 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, padding: 24, justifyContent: 'center' }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold' }}>Complete Profile</Text>
      <TextInput placeholder="Full name" value={name} onChangeText={setName} style={{ borderBottomWidth: 1, marginVertical: 10 }} />
      <TextInput placeholder="Create password" secureTextEntry value={password} onChangeText={setPassword} style={{ borderBottomWidth: 1, marginVertical: 10 }} />
      
      <View style={{ flexDirection: 'row', gap: 10, marginVertical: 20 }}>
        <TouchableOpacity style={{ flex: 1, padding: 16, backgroundColor: role === 'SEEKER' ? '#000' : '#fff', borderWidth: 1 }} onPress={() => setRole('SEEKER')}>
            <Text style={{ color: role === 'SEEKER' ? '#fff' : '#000', textAlign: 'center' }}>SEEKER</Text>
        </TouchableOpacity>
        <TouchableOpacity style={{ flex: 1, padding: 16, backgroundColor: role === 'PROVIDER' ? '#000' : '#fff', borderWidth: 1 }} onPress={() => setRole('PROVIDER')}>
            <Text style={{ color: role === 'PROVIDER' ? '#fff' : '#000', textAlign: 'center' }}>PROVIDER</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity onPress={handleRegister} style={{ padding: 16, backgroundColor: '#000' }}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', textAlign: 'center' }}>CREATE ACCOUNT</Text>}
      </TouchableOpacity>
    </View>
  );
}
```
</details>

*Note: Visual aesthetic templates mapping via Brutalist properties have been largely stripped down to logic-blocks in these README examples for beginner readability. Fully expanded styled variants are located directly in the respective target logic files!*

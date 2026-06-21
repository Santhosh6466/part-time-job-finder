import AsyncStorage from '@react-native-async-storage/async-storage';
import axios, { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { Platform } from 'react-native';
import { ApiResponse, Application, AuthResponse, Job, PostJobPayload, ProviderProfile, RegisterPayload, SeekerProfile } from '../types';

// 🔥 Backend API base URL (React Native Expo)
const BASE_URL = 'http://10.121.116.137:8080';

import { jwtDecode } from 'jwt-decode';

// 🔍 Decode JWT payload for debugging
export function decodeJWT(token: string): Record<string, any> | null {
  try {
    return jwtDecode(token);
  } catch {
    return null;
  }
}

// ═══════════════════════════════════════════════════════
// 🔐 TOKEN STORAGE — with localStorage fallback for web
// AsyncStorage can silently fail on React Native Web!
// ═══════════════════════════════════════════════════════

export async function saveToken(token: string): Promise<void> {
  try {
    await AsyncStorage.setItem('userToken', token);
    console.log("💾 Token saved to AsyncStorage ✅");
  } catch (e) {
    console.log("⚠️ AsyncStorage.setItem failed:", e);
  }
  // Always ALSO save to localStorage on web as fallback
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    try {
      localStorage.setItem('userToken', token);
      console.log("💾 Token saved to localStorage (web fallback) ✅");
    } catch (e) {
      console.log("⚠️ localStorage.setItem failed:", e);
    }
  }
}

export async function getToken(): Promise<string | null> {
  let token: string | null = null;

  // Try AsyncStorage first
  try {
    token = await AsyncStorage.getItem('userToken');
  } catch (e) {
    console.log("⚠️ AsyncStorage.getItem failed:", e);
  }

  // Fallback to localStorage on web if AsyncStorage returned null
  if (!token && Platform.OS === 'web' && typeof window !== 'undefined') {
    try {
      token = localStorage.getItem('userToken');
      if (token) {
        console.log("🔄 Token loaded from localStorage (web fallback)");
      }
    } catch (e) {
      console.log("⚠️ localStorage.getItem failed:", e);
    }
  }

  return token;
}

export async function removeToken(): Promise<void> {
  try {
    await AsyncStorage.removeItem('userToken');
  } catch (e) {
    console.log("⚠️ AsyncStorage.removeItem failed:", e);
  }
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    try {
      localStorage.removeItem('userToken');
    } catch (e) {
      console.log("⚠️ localStorage.removeItem failed:", e);
    }
  }
  console.log("🧹 Token cleared from all storage");
}

// ═══════════════════════════════════════════════════════

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 🔐 Attach JWT token on every request (fresh from storage)
api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    // Always fetch fresh token — never cache in variable
    const token = await getToken();

    if (token) {
      const payload = decodeJWT(token);

      console.log("═══════════════════════════════════════");
      console.log("🔑 JWT TOKEN DEBUG");
      console.log("═══════════════════════════════════════");
      console.log("TOKEN:", token);
      console.log("📋 DECODED:", JSON.stringify(payload, null, 2));
      console.log("👤 sub:", payload?.sub);
      console.log("🎭 role:", payload?.role || payload?.Role || payload?.authorities);

      if (payload?.exp) {
        const now = Math.floor(Date.now() / 1000);
        const expiresIn = payload.exp - now;
        console.log("⏳ Expires:", expiresIn > 0 ? `in ${Math.round(expiresIn / 60)} min` : '⚠️ EXPIRED');

        if (expiresIn <= 0) {
          console.log("🚫 EXPIRED — clearing token");
          await removeToken();
        } else {
          // ✅ Set Authorization header — "Bearer " with capital B and space
          config.headers.Authorization = `Bearer ${token}`;
        }
      } else {
        config.headers.Authorization = `Bearer ${token}`;
      }
      console.log("═══════════════════════════════════════");
    } else {
      console.log("🔑 NO TOKEN found in any storage");
    }

    console.log("➡️ Request:", config.method?.toUpperCase(), config.url);
    console.log("HEADERS:", JSON.stringify(config.headers));
    return config;
  },
  (error: AxiosError) => {
    console.log("❌ Request Error:", error);
    return Promise.reject(error);
  }
);

// 🔥 RESPONSE DEBUG
api.interceptors.response.use(
  (response: AxiosResponse) => {
    console.log("✅ Response:", response.status, response.data);
    return response;
  },
  (error: AxiosError<ApiResponse<any>>) => {
    console.log("❌ Error Status:", error.response?.status);
    console.log("❌ Error Headers:", JSON.stringify(error.response?.headers));
    console.log("❌ Error Response:", error.response?.data);
    console.log("❌ Error Message:", error.message);
    if (error.response?.status === 403) {
      console.log("🔴 403 FORBIDDEN — Check:");
      console.log("   1. Backend CORS: .requestMatchers(HttpMethod.OPTIONS, '/**').permitAll()");
      console.log("   2. Backend CSRF: .csrf(csrf -> csrf.disable())");
      console.log("   3. Token role matches endpoint (SEEKER vs PROVIDER)");
    }
    return Promise.reject(error);
  }
);

// 📦 AUTH APIs
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

// 📦 SEEKER APIs
export const seekerAPI = {
  // GET /seeker/jobs — all available jobs
  getJobs: () =>
    api.get<ApiResponse<Job[]>>('/seeker/jobs'),

  // GET /seeker/jobs/search?keyword=... — search jobs by keyword
  searchJobs: (keyword: string) =>
    api.get<ApiResponse<Job[]>>('/seeker/jobs/search', { params: { keyword } }),

  // GET /seeker/jobs/location?location=... — filter jobs by location
  getJobsByLocation: (location: string) =>
    api.get<ApiResponse<Job[]>>('/seeker/jobs/location', { params: { location } }),

  // GET /seeker/jobs/category/{category} — filter by category
  getJobsByCategory: (category: string) =>
    api.get<ApiResponse<Job[]>>(`/seeker/jobs/category/${category}`),

  // POST /seeker/apply/{jobId} — apply to a job
  applyToJob: (jobId: number) =>
    api.post<ApiResponse<void>>(`/seeker/apply/${jobId}`),

  // GET /seeker/applications — seeker's own applications
  getApplications: () =>
    api.get<ApiResponse<Application[]>>('/seeker/applications'),

  // GET /seeker/profile — get seeker profile
  getProfile: () =>
    api.get<ApiResponse<SeekerProfile>>('/seeker/profile'),

  // POST /seeker/profile — create/update seeker profile
  // Accepts a plain SeekerProfile object (JSON) OR a FormData (multipart, when image included)
  saveProfile: (data: SeekerProfile | FormData) =>
    data instanceof FormData
      ? api.post<ApiResponse<SeekerProfile>>('/seeker/profile', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      : api.post<ApiResponse<SeekerProfile>>('/seeker/profile', data),

  // GET /seeker/provider-profile/{email} — lookup provider profile
  getProviderProfileByEmail: async (email: string) => {
    try {
      return await api.get<ApiResponse<ProviderProfile>>(`/seeker/provider-profile/${encodeURIComponent(email)}/`);
    } catch (err) {
      return await api.get<ApiResponse<ProviderProfile>>(`/seeker/provider-profile/${encodeURIComponent(email)}`);
    }
  },

  // DELETE /seeker/applications/{applicationId} — cancel a pending application
  cancelApplication: (applicationId: number) =>
    api.delete<ApiResponse<void>>(`/seeker/applications/${applicationId}`),

  // GET /seeker/jobs/{jobId} — get a single job by ID
  getJobById: (jobId: number) =>
    api.get<ApiResponse<Job>>(`/seeker/jobs/${jobId}`),

  // DELETE /seeker/profile/image — remove profile image
  deleteImage: () =>
    api.delete<ApiResponse<void>>('/seeker/profile/image'),
};

// 📦 PROVIDER APIs
export const providerAPI = {
  // GET /provider/jobs — provider's own jobs
  getMyJobs: () =>
    api.get<ApiResponse<Job[]>>('/provider/jobs'),

  // GET /provider/jobs/{jobId} — get a single job by ID
  getJobById: (jobId: number) =>
    api.get<ApiResponse<Job>>(`/provider/jobs/${jobId}`),

  // POST /provider/jobs — create a new job
  postJob: (payload: PostJobPayload) =>
    api.post<ApiResponse<Job>>('/provider/jobs', payload),

  // PUT /provider/jobs/{jobId} — update an existing job
  updateJob: (jobId: number, payload: PostJobPayload) =>
    api.put<ApiResponse<Job>>(`/provider/jobs/${jobId}`, payload),

  // DELETE /provider/jobs/{jobId} — delete a job
  deleteJob: (jobId: number) =>
    api.delete<ApiResponse<void>>(`/provider/jobs/${jobId}`),

  // GET /provider/applications — see all applicants
  getApplications: () =>
    api.get<ApiResponse<Application[]>>('/provider/applications'),

  // PUT /provider/applications/{id}?status=ACCEPTED|REJECTED
  updateApplicationStatus: (
    applicationId: number,
    status: 'ACCEPTED' | 'REJECTED'
  ) =>
    api.put<ApiResponse<void>>(
      `/provider/applications/${applicationId}?status=${status}`
    ),

  // GET /provider/profile — get provider profile
  getProfile: () =>
    api.get<ApiResponse<ProviderProfile>>('/provider/profile'),

  // POST /provider/profile — create/update provider profile
  // Accepts a plain ProviderProfile object (JSON) OR a FormData (multipart, when image included)
  saveProfile: (data: ProviderProfile | FormData) =>
    data instanceof FormData
      ? api.post<ApiResponse<ProviderProfile>>('/provider/profile', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      : api.post<ApiResponse<ProviderProfile>>('/provider/profile', data),

  // ✅ GET /provider/profile/seeker-profile/{email}
  getSeekerProfileByEmail: async (email: string) => {
    try {
      return await api.get<ApiResponse<SeekerProfile>>(`/provider/profile/seeker-profile/${encodeURIComponent(email)}/`);
    } catch (err) {
      return await api.get<ApiResponse<SeekerProfile>>(`/provider/profile/seeker-profile/${encodeURIComponent(email)}`);
    }
  },

  // DELETE /provider/profile/image — remove profile image
  deleteImage: () =>
    api.delete<ApiResponse<void>>('/provider/profile/image'),
};

export default api;

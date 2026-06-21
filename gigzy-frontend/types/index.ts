// User details representation
export interface UserProfile {
  name: string;
  email: string;
  role: 'SEEKER' | 'PROVIDER';
}

// Auth API standard response that returns a JWT token
export interface AuthResponse {
  token: string;
  user?: UserProfile;
}

// Generic API response structure from the backend
export interface ApiResponse<T> {
  message?: string;
  data: T;
}

// Payload for user registration
export interface RegisterPayload {
  email?: string | string[];
  password?: string;
  name?: string;
  role?: string;
}

// Job listing from /seeker/jobs or /provider/jobs
export interface Job {
  id: number;
  title: string;
  description: string;
  location: string;
  skillsRequired: string[];
  budget: number;
  category: string;
  providerEmail?: string;
  createdBy?: string;
  companyName?: string;
  providerProfileImageUrl?: string;
}

// Application from /seeker/applications or /provider/applications
export interface Application {
  id: number;
  jobId: number;
  jobTitle?: string;
  jobDescription?: string;
  jobLocation?: string;
  jobBudget?: number;
  jobCategory?: string;
  jobSkillsRequired?: string[];
  jobCompanyName?: string;
  jobProviderName?: string;
  appliedDate?: string;
  seekerName?: string;
  seekerEmail?: string;
  providerEmail?: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  // Enriched seeker profile fields (populated by frontend utility)
  seekerFullName?: string;
  seekerSkills?: string | string[];
  seekerExperience?: string;
  seekerLocation?: string;
  seekerPhone?: string;
  seekerBio?: string;
  seekerProfileImageUrl?: string;
}

// Payload for creating a new job (provider)
export interface PostJobPayload {
  title: string;
  description: string;
  location: string;
  skillsRequired: string[];
  budget: number;
  category: string;
}

// Seeker profile from /seeker/profile
export interface SeekerProfile {
  fullName: string;
  skills: string[];
  experience: string;
  location: string;
  bio: string;
  phoneNumber: string;
  profileImageUrl?: string;
  profileImagePublicId?: string;
}

// Provider profile from /provider/profile
export interface ProviderProfile {
  companyName: string;
  companyDescription: string;
  location: string;
  phoneNumber: string;
  profileImageUrl?: string;
  profileImagePublicId?: string;
}

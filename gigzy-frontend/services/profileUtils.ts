import { Application, SeekerProfile, Job, ProviderProfile } from '../types';
import { providerAPI, seekerAPI } from './api';

/**
 * Profile Completion Utilities
 * - checkProfileComplete: Checks if a user's profile exists
 * - enrichApplicationsWithProfiles: Enriches application cards with seeker profile data
 */

// ═══════════════════════════════════════════════════════
// 🔍 PROFILE COMPLETION CHECK
// ═══════════════════════════════════════════════════════

export interface ProfileCheckResult {
  complete: boolean;
  profile: any | null;
}

/**
 * Check if the current user's profile is complete.
 * Returns { complete: true, profile: data } if profile exists.
 * Returns { complete: false, profile: null } if profile not found (404 or PROFILE_NOT_FOUND).
 */
export async function checkProfileComplete(role: string): Promise<ProfileCheckResult> {
  try {
    const response = role === 'PROVIDER'
      ? await providerAPI.getProfile()
      : await seekerAPI.getProfile();

    const data = response.data?.data || response.data;

    // Check if profile has required fields filled
    if (role === 'PROVIDER') {
      const hasCompanyName = !!(data as any)?.companyName?.trim();
      return { complete: hasCompanyName, profile: data };
    } else {
      const hasFullName = !!(data as any)?.fullName?.trim();
      return { complete: hasFullName, profile: data };
    }
  } catch (error: any) {
    const errorCode = error.response?.data?.error?.code;
    const status = error.response?.status;

    // Profile not found — user needs to complete it
    if (status === 404 || errorCode === 'PROFILE_NOT_FOUND') {
      console.log(`📋 Profile not found for ${role} — needs completion`);
      return { complete: false, profile: null };
    }

    // Other errors (network, server, etc.) — don't block the user
    console.log(`⚠️ Profile check error (${status}):`, error?.message);
    // Assume complete to avoid blocking on transient errors
    return { complete: true, profile: null };
  }
}

// ═══════════════════════════════════════════════════════
// 👤 SEEKER PROFILE ENRICHMENT FOR PROVIDER VIEW
// ═══════════════════════════════════════════════════════

// In-memory cache to avoid re-fetching the same seeker's profile
const profileCache = new Map<string, SeekerProfile | null>();

/**
 * Fetch a single seeker's profile by email.
 * Uses in-memory cache to avoid redundant requests.
 */
async function fetchSeekerProfile(email: string): Promise<SeekerProfile | null> {
  if (!email) return null;

  // Check cache first
  if (profileCache.has(email)) {
    return profileCache.get(email) || null;
  }

  try {
    const response = await providerAPI.getSeekerProfileByEmail(email);
    const data = response.data?.data || response.data;
    if (data) {
      profileCache.set(email, data as SeekerProfile);
      return data as SeekerProfile;
    }
    profileCache.set(email, null);
    return null;
  } catch (error: any) {
    console.log(`⚠️ Could not fetch profile for ${email}:`, error?.response?.status || error?.message);
    profileCache.set(email, null);
    return null;
  }
}

/**
 * Enrich an array of applications with seeker profile data.
 * Fetches profiles in parallel and attaches data to each application.
 * Gracefully handles failures — applications without profile data still render.
 */
export async function enrichApplicationsWithProfiles(
  applications: Application[]
): Promise<Application[]> {
  // Collect unique emails
  const emails = [...new Set(applications.map(app => app.seekerEmail).filter(Boolean))] as string[];

  // Fetch all profiles in parallel
  await Promise.allSettled(emails.map(email => fetchSeekerProfile(email)));

  // Enrich each application
  return applications.map(app => {
    if (!app.seekerEmail) return app;

    const profile = profileCache.get(app.seekerEmail);
    if (!profile) return app;

    return {
      ...app,
      seekerFullName: profile.fullName || app.seekerName || undefined,
      seekerSkills: profile.skills || undefined,
      seekerExperience: profile.experience || undefined,
      seekerLocation: profile.location || undefined,
      seekerPhone: profile.phoneNumber || undefined,
      seekerBio: profile.bio || undefined,
      seekerProfileImageUrl: profile.profileImageUrl || undefined,
    };
  });
}

// ═══════════════════════════════════════════════════════
// 📦 JOB & PROVIDER CACHES & ENRICHMENT HELPERS
// ═══════════════════════════════════════════════════════

const jobCache = new Map<number, Job | null>();
const providerCache = new Map<string, ProviderProfile | null>();

/**
 * Fetch a single job by ID (Seeker) with caching and fallback.
 */
export async function getJobForSeeker(jobId: number): Promise<Job | null> {
  if (jobCache.has(jobId)) {
    return jobCache.get(jobId) || null;
  }
  try {
    const res = await seekerAPI.getJobById(jobId);
    const job = res.data?.data || res.data;
    if (job) {
      jobCache.set(jobId, job);
      return job;
    }
  } catch (err) {
    console.log(`⚠️ Single job fetch failed for seeker job ${jobId}, falling back to list`);
    try {
      const res = await seekerAPI.getJobs();
      const jobs = res.data?.data || res.data;
      if (Array.isArray(jobs)) {
        for (const j of jobs) {
          jobCache.set(j.id, j);
        }
        return jobCache.get(jobId) || null;
      }
    } catch (fallbackErr) {
      console.log(`❌ Seeker fallback jobs fetch failed`);
    }
  }
  jobCache.set(jobId, null);
  return null;
}

/**
 * Fetch provider profile details by email (Seeker) with caching.
 */
export async function getProviderProfileForSeeker(email: string): Promise<ProviderProfile | null> {
  if (!email) return null;
  if (providerCache.has(email)) {
    return providerCache.get(email) || null;
  }
  try {
    const res = await seekerAPI.getProviderProfileByEmail(email);
    const profile = res.data?.data || res.data;
    if (profile) {
      providerCache.set(email, profile);
      return profile;
    }
  } catch (err: any) {
    console.log(`⚠️ Could not fetch provider profile for ${email}:`, err?.response?.status);
  }
  providerCache.set(email, null);
  return null;
}

/**
 * Fetch a single job by ID (Provider) with caching and fallback.
 */
export async function getJobForProvider(jobId: number): Promise<Job | null> {
  if (jobCache.has(jobId)) {
    return jobCache.get(jobId) || null;
  }
  try {
    const res = await providerAPI.getJobById(jobId);
    const job = res.data?.data || res.data;
    if (job) {
      jobCache.set(jobId, job);
      return job;
    }
  } catch (err) {
    console.log(`⚠️ Single job fetch failed for provider job ${jobId}, falling back to list`);
    try {
      const res = await providerAPI.getMyJobs();
      const jobs = res.data?.data || res.data;
      if (Array.isArray(jobs)) {
        for (const j of jobs) {
          jobCache.set(j.id, j);
        }
        return jobCache.get(jobId) || null;
      }
    } catch (fallbackErr) {
      console.log(`❌ Provider fallback jobs fetch failed`);
    }
  }
  jobCache.set(jobId, null);
  return null;
}

export interface EnrichedSeekerApplication extends Application {
  _job?: Job;
  _providerProfile?: ProviderProfile;
}

/**
 * Enrich Seeker's applications with Job details and Provider Profiles.
 */
export async function enrichSeekerApplications(
  applications: Application[]
): Promise<EnrichedSeekerApplication[]> {
  // Fetch all jobs in parallel
  const jobPromises = applications.map(async (app) => {
    const job = await getJobForSeeker(app.jobId);
    return { appId: app.id, job };
  });

  const jobResults = await Promise.allSettled(jobPromises);
  const tempJobMap = new Map<number, Job | null>();
  jobResults.forEach((result) => {
    if (result.status === 'fulfilled') {
      tempJobMap.set(result.value.appId, result.value.job);
    }
  });

  // Collect provider emails to fetch profiles in parallel
  const emails = applications
    .map((app) => {
      const job = tempJobMap.get(app.id);
      return job?.providerEmail || job?.createdBy;
    })
    .filter(Boolean) as string[];

  const uniqueEmails = [...new Set(emails)];
  await Promise.allSettled(uniqueEmails.map((email) => getProviderProfileForSeeker(email)));

  return applications.map((app) => {
    const job = tempJobMap.get(app.id) || null;
    const providerEmail = job?.providerEmail || job?.createdBy || app.providerEmail;
    const providerProfile = providerEmail ? (providerCache.get(providerEmail) || null) : null;

    // Make sure the job object we return has the providerEmail property populated
    const enrichedJob = job ? { ...job, providerEmail } : undefined;

    return {
      ...app,
      jobTitle: job?.title || app.jobTitle,
      jobDescription: job?.description || app.jobDescription,
      jobLocation: job?.location || app.jobLocation,
      jobBudget: job?.budget ?? app.jobBudget,
      jobCategory: job?.category || app.jobCategory,
      jobSkillsRequired: job?.skillsRequired || app.jobSkillsRequired,
      jobCompanyName: job?.companyName || providerProfile?.companyName || app.jobCompanyName,
      _job: enrichedJob,
      _providerProfile: providerProfile || undefined,
    };
  });
}

export interface EnrichedProviderApplication extends Application {
  _job?: Job;
}

/**
 * Enrich Provider's applications with Job details and Seeker Profiles.
 */
export async function enrichProviderApplications(
  applications: Application[]
): Promise<EnrichedProviderApplication[]> {
  // First, enrich with Seeker profiles
  const enrichedWithSeekers = await enrichApplicationsWithProfiles(applications);

  // Fetch all jobs in parallel
  const jobPromises = enrichedWithSeekers.map(async (app) => {
    const job = await getJobForProvider(app.jobId);
    return { appId: app.id, job };
  });

  const jobResults = await Promise.allSettled(jobPromises);
  const tempJobMap = new Map<number, Job | null>();
  jobResults.forEach((result) => {
    if (result.status === 'fulfilled') {
      tempJobMap.set(result.value.appId, result.value.job);
    }
  });

  return enrichedWithSeekers.map((app) => {
    const job = tempJobMap.get(app.id) || null;
    return {
      ...app,
      jobTitle: job?.title || app.jobTitle,
      jobDescription: job?.description || app.jobDescription,
      jobLocation: job?.location || app.jobLocation,
      jobBudget: job?.budget ?? app.jobBudget,
      jobCategory: job?.category || app.jobCategory,
      jobSkillsRequired: job?.skillsRequired || app.jobSkillsRequired,
      _job: job || undefined,
    };
  });
}

/**
 * Enrich an array of jobs with company name from their provider profiles.
 */
export async function enrichJobsWithCompanyNames(jobs: Job[]): Promise<Job[]> {
  if (!Array.isArray(jobs) || jobs.length === 0) return jobs;

  // Collect provider emails to fetch profiles in parallel
  const emails = jobs
    .map((job) => job.providerEmail || job.createdBy)
    .filter(Boolean) as string[];

  const uniqueEmails = [...new Set(emails)];
  await Promise.allSettled(uniqueEmails.map((email) => getProviderProfileForSeeker(email)));

  return jobs.map((job) => {
    const providerEmail = job.providerEmail || job.createdBy;
    const providerProfile = providerEmail ? providerCache.get(providerEmail) : null;
    return {
      ...job,
      companyName: job.companyName || providerProfile?.companyName || undefined,
      providerProfileImageUrl: providerProfile?.profileImageUrl || undefined,
    };
  });
}

/**
 * Clear all cached items (logout / refresh)
 */
export function clearProfileCache() {
  profileCache.clear();
  jobCache.clear();
  providerCache.clear();
}

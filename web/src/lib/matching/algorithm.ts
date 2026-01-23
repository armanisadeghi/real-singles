import type { Profile, UserFilters } from "@/types";

interface CompatibilityScores {
  location: number;
  age: number;
  interests: number;
  lifestyle: number;
  verification: number;
  activity: number;
  total: number;
}

const WEIGHTS = {
  location: 0.25,
  age: 0.15,
  interests: 0.2,
  lifestyle: 0.2,
  verification: 0.1,
  activity: 0.1,
};

/**
 * Calculate compatibility score between two users
 * Score ranges from 0-100
 */
export function calculateCompatibility(
  userProfile: Profile,
  targetProfile: Profile,
  userFilters?: UserFilters
): CompatibilityScores {
  const locationScore = calculateLocationScore(userProfile, targetProfile, userFilters);
  const ageScore = calculateAgeScore(userProfile, targetProfile, userFilters);
  const interestsScore = calculateInterestsScore(userProfile, targetProfile);
  const lifestyleScore = calculateLifestyleScore(userProfile, targetProfile);
  const verificationScore = calculateVerificationScore(targetProfile);
  const activityScore = calculateActivityScore(targetProfile);

  const total =
    locationScore * WEIGHTS.location +
    ageScore * WEIGHTS.age +
    interestsScore * WEIGHTS.interests +
    lifestyleScore * WEIGHTS.lifestyle +
    verificationScore * WEIGHTS.verification +
    activityScore * WEIGHTS.activity;

  return {
    location: Math.round(locationScore),
    age: Math.round(ageScore),
    interests: Math.round(interestsScore),
    lifestyle: Math.round(lifestyleScore),
    verification: Math.round(verificationScore),
    activity: Math.round(activityScore),
    total: Math.round(total),
  };
}

/**
 * Calculate distance between two coordinates using Haversine formula
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 3959; // Earth's radius in miles
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

function calculateLocationScore(
  user: Profile,
  target: Profile,
  filters?: UserFilters
): number {
  if (!user.latitude || !user.longitude || !target.latitude || !target.longitude) {
    return 50; // Default score if location not available
  }

  const distance = calculateDistance(
    user.latitude,
    user.longitude,
    target.latitude,
    target.longitude
  );

  const maxDistance = filters?.max_distance_miles || 100;

  if (distance > maxDistance) {
    return 0;
  }

  // Score decreases as distance increases
  return Math.max(0, 100 - (distance / maxDistance) * 100);
}

function calculateAgeScore(
  user: Profile,
  target: Profile,
  filters?: UserFilters
): number {
  if (!target.date_of_birth) {
    return 50;
  }

  const targetAge = calculateAge(target.date_of_birth);
  const minAge = filters?.min_age || 18;
  const maxAge = filters?.max_age || 99;

  if (targetAge < minAge || targetAge > maxAge) {
    return 0;
  }

  // Perfect score if within preferred range
  return 100;
}

function calculateAge(dateOfBirth: string): number {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

function calculateInterestsScore(user: Profile, target: Profile): number {
  const userInterests = user.interests || [];
  const targetInterests = target.interests || [];

  if (userInterests.length === 0 || targetInterests.length === 0) {
    return 50;
  }

  const commonInterests = userInterests.filter((i) =>
    targetInterests.includes(i)
  );
  const totalUnique = new Set([...userInterests, ...targetInterests]).size;

  return (commonInterests.length / totalUnique) * 100;
}

function calculateLifestyleScore(user: Profile, target: Profile): number {
  let score = 0;
  let factors = 0;

  // Smoking compatibility
  if (user.smoking && target.smoking) {
    factors++;
    if (user.smoking === target.smoking) {
      score += 100;
    } else if (user.smoking === "never" && target.smoking !== "never") {
      score += 20;
    } else {
      score += 60;
    }
  }

  // Drinking compatibility
  if (user.drinking && target.drinking) {
    factors++;
    if (user.drinking === target.drinking) {
      score += 100;
    } else {
      score += 70;
    }
  }

  // Kids compatibility
  if (user.wants_kids && target.wants_kids) {
    factors++;
    if (user.wants_kids === target.wants_kids) {
      score += 100;
    } else if (
      (user.wants_kids === "yes" && target.wants_kids === "no") ||
      (user.wants_kids === "no" && target.wants_kids === "yes")
    ) {
      score += 0;
    } else {
      score += 60;
    }
  }

  // Exercise compatibility
  if (user.exercise && target.exercise) {
    factors++;
    if (user.exercise === target.exercise) {
      score += 100;
    } else {
      score += 70;
    }
  }

  return factors > 0 ? score / factors : 50;
}

function calculateVerificationScore(target: Profile): number {
  return target.is_verified ? 100 : 0;
}

function calculateActivityScore(target: Profile): number {
  // This would typically check last_active_at from the users table
  // For now, return a default score
  // In actual implementation, recent activity would score higher
  return 70;
}

/**
 * Get top matches for a user
 */
export async function getTopMatches(
  userId: string,
  userProfile: Profile,
  candidates: Profile[],
  userFilters?: UserFilters,
  limit: number = 20
): Promise<Array<Profile & { compatibility: number }>> {
  const scoredCandidates = candidates
    .filter((c) => c.user_id !== userId)
    .map((candidate) => ({
      ...candidate,
      compatibility: calculateCompatibility(userProfile, candidate, userFilters).total,
    }))
    .filter((c) => c.compatibility > 0)
    .sort((a, b) => b.compatibility - a.compatibility)
    .slice(0, limit);

  return scoredCandidates;
}

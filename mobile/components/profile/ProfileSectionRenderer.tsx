/**
 * ProfileSectionRenderer Component
 * 
 * Smart component that renders profile sections, hiding empty/prefer-not-to-say fields.
 * Takes profile data and renders only filled sections in an engaging way.
 */

import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import {
  BORDER_RADIUS,
  SPACING,
  TYPOGRAPHY,
  VERTICAL_SPACING,
} from "@/constants/designTokens";
import { User } from "@/types";

// Values to hide - null, undefined, empty, or "prefer not to say" variations
const HIDDEN_VALUES = [
  null,
  undefined,
  "",
  "prefer_not_to_say",
  "Prefer not to say",
  "prefer not to say",
  "PREFER_NOT_TO_SAY",
];

// Helper to check if a value should be displayed
const shouldDisplay = (value: any): boolean => {
  if (HIDDEN_VALUES.includes(value)) return false;
  if (Array.isArray(value) && value.length === 0) return false;
  if (typeof value === "string" && value.trim() === "") return false;
  return true;
};

// Helper to format height from inches to feet/inches
const formatHeight = (heightStr: string | undefined): string | null => {
  if (!heightStr) return null;
  const inches = parseFloat(heightStr);
  if (isNaN(inches)) return null;
  const feet = Math.floor(inches / 12);
  const remainingInches = Math.round(inches % 12);
  return `${feet}'${remainingInches}"`;
};

// Helper to calculate age from DOB
const calculateAge = (dob: string | undefined): number | null => {
  if (!dob) return null;
  const birthDate = new Date(dob);
  if (isNaN(birthDate.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const hasBirthdayOccurred =
    today.getMonth() > birthDate.getMonth() ||
    (today.getMonth() === birthDate.getMonth() && today.getDate() >= birthDate.getDate());
  if (!hasBirthdayOccurred) age--;
  return age;
};

// Helper to capitalize first letter
const capitalize = (str: string): string => {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

// Helper to format option values for display
const formatOptionValue = (value: string | undefined): string | null => {
  if (!value || HIDDEN_VALUES.includes(value)) return null;
  // Convert snake_case to readable format
  return value
    .split("_")
    .map((word) => capitalize(word))
    .join(" ");
};

// Prompt questions mapping
const PROMPT_LABELS: Record<string, string> = {
  IdealFirstDate: "My ideal first date",
  NonNegotiables: "My non-negotiables in a partner",
  WayToHeart: "The way to my heart",
  CraziestTravelStory: "My craziest travel story",
  WorstJob: "Worst job I ever had",
  DreamJob: "My dream job would be",
  AfterWork: "After work you can find me",
  WeirdestGift: "Weirdest gift I've received",
  PetPeeves: "My pet peeves",
  NightclubOrHome: "Friday night: out or staying in?",
  PastEvent: "If I could attend any event in history",
};

interface ProfileSectionRendererProps {
  profile: User;
  /** Show full content (default: true) */
  showFull?: boolean;
}

export default function ProfileSectionRenderer({
  profile,
  showFull = true,
}: ProfileSectionRendererProps) {
  const age = calculateAge(profile?.DOB);
  const height = formatHeight(profile?.Height);
  const interests = profile?.Interest?.split(",").map((i) => i.trim()).filter(Boolean) || [];
  
  // Build location string
  const location = [profile?.City, profile?.State].filter(Boolean).join(", ");
  
  // Collect all available prompts
  const prompts: Array<{ label: string; value: string }> = [];
  Object.entries(PROMPT_LABELS).forEach(([key, label]) => {
    const value = (profile as any)?.[key];
    if (shouldDisplay(value)) {
      prompts.push({ label, value });
    }
  });
  
  // Build lifestyle items
  const lifestyleItems: Array<{ icon: string; label: string; value: string }> = [];
  
  if (height) {
    lifestyleItems.push({ icon: "resize-outline", label: "Height", value: height });
  }
  if (shouldDisplay(profile?.BodyType)) {
    lifestyleItems.push({ icon: "body-outline", label: "Body Type", value: formatOptionValue(profile.BodyType) || "" });
  }
  if (shouldDisplay(profile?.Gender)) {
    lifestyleItems.push({ icon: "person-outline", label: "Gender", value: capitalize(profile.Gender || "") });
  }
  if (shouldDisplay(profile?.HSign)) {
    lifestyleItems.push({ icon: "star-outline", label: "Zodiac", value: capitalize(profile.HSign || "") });
  }
  
  // Build background items
  const backgroundItems: Array<{ icon: string; label: string; value: string }> = [];
  
  if (shouldDisplay(profile?.Education)) {
    backgroundItems.push({ icon: "school-outline", label: "Education", value: formatOptionValue(profile.Education) || "" });
  }
  if (shouldDisplay(profile?.JobTitle)) {
    backgroundItems.push({ icon: "briefcase-outline", label: "Work", value: profile.JobTitle || "" });
  }
  if (shouldDisplay(profile?.Religion)) {
    backgroundItems.push({ icon: "heart-outline", label: "Religion", value: capitalize(profile.Religion || "") });
  }
  if (shouldDisplay(profile?.Ethnicity)) {
    const ethnicity = Array.isArray(profile.Ethnicity) 
      ? profile.Ethnicity.map((e: string) => capitalize(e)).join(", ")
      : capitalize(profile.Ethnicity || "");
    if (ethnicity) {
      backgroundItems.push({ icon: "globe-outline", label: "Ethnicity", value: ethnicity });
    }
  }
  
  // Build family items
  const familyItems: Array<{ icon: string; label: string; value: string }> = [];
  
  if (shouldDisplay(profile?.HaveChild) && profile.HaveChild !== "No") {
    familyItems.push({ icon: "people-outline", label: "Has Kids", value: formatOptionValue(profile.HaveChild) || "" });
  }
  if (shouldDisplay(profile?.WantChild)) {
    familyItems.push({ icon: "heart-circle-outline", label: "Wants Kids", value: formatOptionValue(profile.WantChild) || "" });
  }
  if (shouldDisplay(profile?.Pets)) {
    familyItems.push({ icon: "paw-outline", label: "Pets", value: profile.Pets || "" });
  }
  
  // Build vices items
  const vicesItems: Array<{ icon: string; label: string; value: string }> = [];
  
  if (shouldDisplay(profile?.Smoking)) {
    vicesItems.push({ icon: "flame-outline", label: "Smoking", value: formatOptionValue(profile.Smoking) || "" });
  }
  if (shouldDisplay(profile?.Drinks)) {
    vicesItems.push({ icon: "wine-outline", label: "Drinking", value: formatOptionValue(profile.Drinks) || "" });
  }
  if (shouldDisplay(profile?.Marijuana)) {
    vicesItems.push({ icon: "leaf-outline", label: "Marijuana", value: formatOptionValue(profile.Marijuana) || "" });
  }
  
  return (
    <View style={styles.container}>
      {/* Basic Info Header */}
      <View style={styles.basicInfo}>
        <View style={styles.nameRow}>
          <Text style={styles.name}>
            {profile?.DisplayName || profile?.FirstName || "Anonymous"}
            {age && <Text style={styles.age}>, {age}</Text>}
          </Text>
          {profile?.is_verified && (
            <View style={styles.verifiedBadge}>
              <Ionicons name="checkmark-circle" size={20} color="#3B82F6" />
            </View>
          )}
        </View>
        
        {location && (
          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={16} color="#6B7280" />
            <Text style={styles.locationText}>{location}</Text>
            {profile?.distance_in_km && (
              <Text style={styles.distanceText}>
                • {profile.distance_in_km.toFixed(1)} km away
              </Text>
            )}
          </View>
        )}
        
        {shouldDisplay(profile?.JobTitle) && (
          <View style={styles.jobRow}>
            <Ionicons name="briefcase-outline" size={16} color="#6B7280" />
            <Text style={styles.jobText}>{profile.JobTitle}</Text>
          </View>
        )}
      </View>
      
      {/* About Section */}
      {shouldDisplay(profile?.About) && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About Me</Text>
          <Text style={styles.aboutText}>{profile.About}</Text>
        </View>
      )}
      
      {/* Profile Prompts */}
      {prompts.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Get to Know Me</Text>
          <View style={styles.promptsContainer}>
            {prompts.map((prompt, index) => (
              <View key={index} style={styles.promptCard}>
                <Text style={styles.promptLabel}>{prompt.label}</Text>
                <Text style={styles.promptValue}>{prompt.value}</Text>
              </View>
            ))}
          </View>
        </View>
      )}
      
      {/* Interests */}
      {interests.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Interests</Text>
          <View style={styles.tagsContainer}>
            {interests.map((interest, index) => (
              <View key={index} style={styles.tag}>
                <Text style={styles.tagText}>{capitalize(interest)}</Text>
              </View>
            ))}
          </View>
        </View>
      )}
      
      {/* Lifestyle */}
      {lifestyleItems.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Lifestyle</Text>
          <View style={styles.detailsGrid}>
            {lifestyleItems.map((item, index) => (
              <View key={index} style={styles.detailItem}>
                <Ionicons name={item.icon as any} size={18} color="#B06D1E" />
                <View style={styles.detailTextContainer}>
                  <Text style={styles.detailLabel}>{item.label}</Text>
                  <Text style={styles.detailValue}>{item.value}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      )}
      
      {/* Background */}
      {backgroundItems.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Background</Text>
          <View style={styles.detailsGrid}>
            {backgroundItems.map((item, index) => (
              <View key={index} style={styles.detailItem}>
                <Ionicons name={item.icon as any} size={18} color="#B06D1E" />
                <View style={styles.detailTextContainer}>
                  <Text style={styles.detailLabel}>{item.label}</Text>
                  <Text style={styles.detailValue}>{item.value}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      )}
      
      {/* Family */}
      {familyItems.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Family</Text>
          <View style={styles.detailsGrid}>
            {familyItems.map((item, index) => (
              <View key={index} style={styles.detailItem}>
                <Ionicons name={item.icon as any} size={18} color="#B06D1E" />
                <View style={styles.detailTextContainer}>
                  <Text style={styles.detailLabel}>{item.label}</Text>
                  <Text style={styles.detailValue}>{item.value}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      )}
      
      {/* Vices */}
      {vicesItems.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Habits</Text>
          <View style={styles.detailsGrid}>
            {vicesItems.map((item, index) => (
              <View key={index} style={styles.detailItem}>
                <Ionicons name={item.icon as any} size={18} color="#B06D1E" />
                <View style={styles.detailTextContainer}>
                  <Text style={styles.detailLabel}>{item.label}</Text>
                  <Text style={styles.detailValue}>{item.value}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: SPACING.lg,
    gap: VERTICAL_SPACING.lg,
  },
  basicInfo: {
    gap: VERTICAL_SPACING.xs,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
  },
  name: {
    fontSize: 26,
    fontWeight: "700",
    color: "#111827",
  },
  age: {
    fontWeight: "400",
  },
  verifiedBadge: {
    marginLeft: SPACING.xxs,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xxs,
  },
  locationText: {
    ...TYPOGRAPHY.subheadline,
    color: "#6B7280",
  },
  distanceText: {
    ...TYPOGRAPHY.subheadline,
    color: "#9CA3AF",
    marginLeft: SPACING.xs,
  },
  jobRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xxs,
    marginTop: SPACING.xxs,
  },
  jobText: {
    ...TYPOGRAPHY.subheadline,
    color: "#6B7280",
  },
  section: {
    gap: VERTICAL_SPACING.sm,
  },
  sectionTitle: {
    ...TYPOGRAPHY.bodySemibold,
    color: "#B06D1E",
    marginBottom: SPACING.xs,
  },
  aboutText: {
    ...TYPOGRAPHY.body,
    color: "#374151",
    lineHeight: 24,
  },
  promptsContainer: {
    gap: VERTICAL_SPACING.sm,
  },
  promptCard: {
    backgroundColor: "#FEF3C7",
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    gap: SPACING.xs,
  },
  promptLabel: {
    ...TYPOGRAPHY.caption1,
    color: "#92400E",
    fontStyle: "italic",
  },
  promptValue: {
    ...TYPOGRAPHY.body,
    color: "#78350F",
    lineHeight: 22,
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.sm,
  },
  tag: {
    backgroundColor: "#F3F4F6",
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.full,
  },
  tagText: {
    ...TYPOGRAPHY.caption1,
    color: "#374151",
    fontWeight: "500",
  },
  detailsGrid: {
    gap: VERTICAL_SPACING.sm,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.md,
    backgroundColor: "#F9FAFB",
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
  },
  detailTextContainer: {
    flex: 1,
  },
  detailLabel: {
    ...TYPOGRAPHY.caption2,
    color: "#6B7280",
  },
  detailValue: {
    ...TYPOGRAPHY.subheadline,
    color: "#111827",
    fontWeight: "500",
  },
});

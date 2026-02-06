import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Utility function to merge Tailwind CSS classes with proper conflict resolution
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a date relative to now
 */
export function formatRelativeTime(date: Date | string): string {
  const now = new Date();
  const d = new Date(date);
  const diffMs = now.getTime() - d.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return d.toLocaleDateString();
}

/**
 * Calculate age from date of birth
 */
export function calculateAge(dateOfBirth: string | Date): number {
  const today = new Date();
  const birth = new Date(dateOfBirth);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text: string, length: number): string {
  if (text.length <= length) return text;
  return text.slice(0, length).trim() + "...";
}

/**
 * Format points number with commas
 */
export function formatPoints(points: number): string {
  return points.toLocaleString();
}

/**
 * Height in inches to feet and inches string
 */
export function formatHeight(inches: number): string {
  const feet = Math.floor(inches / 12);
  const remainingInches = inches % 12;
  return `${feet}'${remainingInches}"`;
}

/**
 * Capitalize a display name / first name / last name for proper presentation.
 *
 * Rules:
 *  - If the name is entirely lowercase or entirely UPPERCASE, convert to Title Case
 *    (capitalize first letter of each word segment, lowercase the rest).
 *  - If the name already has mixed casing (e.g. "McDonald", "DeAnna"), leave it as-is
 *    to respect the user's intent.
 *  - Word segments are separated by spaces, hyphens, or apostrophes.
 *    e.g. "claire-marie" → "Claire-Marie", "o'brien" → "O'Brien"
 */
export function capitalizeName(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return trimmed;

  // Extract only alphabetic characters to check casing
  const alphaChars = trimmed.replace(/[^a-zA-Z]/g, "");
  if (!alphaChars) return trimmed; // No alpha chars (e.g. just numbers/symbols)

  const isAllLower = alphaChars === alphaChars.toLowerCase();
  const isAllUpper =
    alphaChars.length > 1 && alphaChars === alphaChars.toUpperCase();

  if (isAllLower || isAllUpper) {
    // Title-case each word segment (split on spaces, hyphens, apostrophes)
    return trimmed
      .toLowerCase()
      .replace(/(^|[\s\-'])([a-z])/g, (_match, separator: string, letter: string) =>
        separator + letter.toUpperCase()
      );
  }

  // Mixed case — user chose this intentionally, preserve it
  return trimmed;
}

/**
 * Debounce function for search inputs
 */
export function debounce<T extends (...args: Parameters<T>) => void>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

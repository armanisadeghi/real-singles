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
      .replace(
        /(^|[\s\-'])([a-z])/g,
        (_match, separator: string, letter: string) =>
          separator + letter.toUpperCase()
      );
  }

  // Mixed case — user chose this intentionally, preserve it
  return trimmed;
}

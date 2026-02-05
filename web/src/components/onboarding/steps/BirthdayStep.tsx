"use client";

/**
 * BirthdayStep
 *
 * Step 2: Date of Birth with age calculation
 * Shows age and zodiac sign on separate lines for clean display.
 */

import { useState, useEffect, useMemo, useRef } from "react";
import { OnboardingStepWrapper } from "../OnboardingStepWrapper";
import { cn } from "@/lib/utils";
import { getZodiacFromDate, getZodiacLabel } from "@/types";

interface BirthdayStepProps {
  dateOfBirth: string;
  onChange: (value: string) => void;
}

// Zodiac emoji map
const ZODIAC_EMOJI: Record<string, string> = {
  aries: "\u2648",
  taurus: "\u2649",
  gemini: "\u264A",
  cancer: "\u264B",
  leo: "\u264C",
  virgo: "\u264D",
  libra: "\u264E",
  scorpio: "\u264F",
  sagittarius: "\u2650",
  capricorn: "\u2651",
  aquarius: "\u2652",
  pisces: "\u2653",
};

// Generate options for month/day/year
const MONTHS = [
  { value: "01", label: "January" },
  { value: "02", label: "February" },
  { value: "03", label: "March" },
  { value: "04", label: "April" },
  { value: "05", label: "May" },
  { value: "06", label: "June" },
  { value: "07", label: "July" },
  { value: "08", label: "August" },
  { value: "09", label: "September" },
  { value: "10", label: "October" },
  { value: "11", label: "November" },
  { value: "12", label: "December" },
];

const DAYS = Array.from({ length: 31 }, (_, i) => ({
  value: String(i + 1).padStart(2, "0"),
  label: String(i + 1),
}));

// Generate years (18-100 years ago)
const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 83 }, (_, i) => ({
  value: String(currentYear - 18 - i),
  label: String(currentYear - 18 - i),
}));

function calculateAge(dateString: string): number | null {
  if (!dateString) return null;
  const birthDate = new Date(dateString);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < birthDate.getDate())
  ) {
    age--;
  }
  return age;
}

export function BirthdayStep({ dateOfBirth, onChange }: BirthdayStepProps) {
  // Parse existing date - initialize from prop
  const initialParts = dateOfBirth?.split("-") || [];
  const [month, setMonth] = useState(initialParts[1] || "");
  const [day, setDay] = useState(initialParts[2] || "");
  const [year, setYear] = useState(initialParts[0] || "");
  
  // Track the last value we sent to parent to avoid infinite loops
  const lastSentValueRef = useRef(dateOfBirth);

  // Sync from parent only if the value changed externally (not from us)
  useEffect(() => {
    if (dateOfBirth && dateOfBirth !== lastSentValueRef.current) {
      const parts = dateOfBirth.split("-");
      if (parts.length === 3) {
        setYear(parts[0]);
        setMonth(parts[1]);
        setDay(parts[2]);
        lastSentValueRef.current = dateOfBirth;
      }
    }
  }, [dateOfBirth]);

  // Handler for when user changes a dropdown
  const handleChange = (newMonth: string, newDay: string, newYear: string) => {
    setMonth(newMonth);
    setDay(newDay);
    setYear(newYear);
    
    // Only call onChange if all parts are set and it's different from last sent
    if (newMonth && newDay && newYear) {
      const dateStr = `${newYear}-${newMonth}-${newDay}`;
      if (dateStr !== lastSentValueRef.current) {
        lastSentValueRef.current = dateStr;
        onChange(dateStr);
      }
    }
  };

  const age = useMemo(() => {
    if (month && day && year) {
      return calculateAge(`${year}-${month}-${day}`);
    }
    return null;
  }, [month, day, year]);

  const zodiacSign = useMemo(() => {
    if (month && day && year) {
      return getZodiacFromDate(`${year}-${month}-${day}`);
    }
    return null;
  }, [month, day, year]);

  const zodiacLabel = zodiacSign ? getZodiacLabel(zodiacSign) : null;
  const zodiacEmoji = zodiacSign ? ZODIAC_EMOJI[zodiacSign] || "" : "";

  const selectClass = cn(
    "flex-1 px-3 py-3.5 rounded-xl appearance-none",
    "text-base text-gray-900 dark:text-gray-100",
    "bg-white dark:bg-neutral-800/90",
    "border border-gray-200 dark:border-neutral-700",
    "focus:outline-none focus:ring-0 focus:border-gray-400 dark:focus:border-neutral-500",
    "transition-colors duration-150"
  );

  return (
    <OnboardingStepWrapper
      title="When's your birthday?"
      subtitle="We'll show your age, not your birthday"
    >
      {/* Date pickers */}
      <div className="flex gap-2">
        {/* Month */}
        <select
          value={month}
          onChange={(e) => handleChange(e.target.value, day, year)}
          className={selectClass}
        >
          <option value="" disabled>
            Month
          </option>
          {MONTHS.map((m) => (
            <option key={m.value} value={m.value}>
              {m.label}
            </option>
          ))}
        </select>

        {/* Day */}
        <select
          value={day}
          onChange={(e) => handleChange(month, e.target.value, year)}
          className={selectClass}
        >
          <option value="" disabled>
            Day
          </option>
          {DAYS.map((d) => (
            <option key={d.value} value={d.value}>
              {d.label}
            </option>
          ))}
        </select>

        {/* Year */}
        <select
          value={year}
          onChange={(e) => handleChange(month, day, e.target.value)}
          className={selectClass}
        >
          <option value="" disabled>
            Year
          </option>
          {YEARS.map((y) => (
            <option key={y.value} value={y.value}>
              {y.label}
            </option>
          ))}
        </select>
      </div>

      {/* Age and zodiac preview — each on its own line */}
      {age !== null && (
        <div className="mt-4 p-4 rounded-xl bg-pink-50 dark:bg-pink-900/20 border border-pink-100 dark:border-pink-800/30 space-y-1">
          <p className="text-center text-sm text-gray-500 dark:text-gray-400">
            Your profile will show
          </p>
          <p className="text-center text-lg font-semibold text-pink-600 dark:text-pink-400">
            {age} years old
          </p>
          {zodiacLabel && (
            <p className="text-center text-base font-medium text-pink-500 dark:text-pink-300">
              {zodiacEmoji} {zodiacLabel}
            </p>
          )}
        </div>
      )}
    </OnboardingStepWrapper>
  );
}

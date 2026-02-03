"use client";

/**
 * BirthdayStep
 *
 * Step 2: Date of Birth with age calculation
 */

import { useState, useEffect, useMemo } from "react";
import { OnboardingStepWrapper } from "../OnboardingStepWrapper";
import { cn } from "@/lib/utils";

interface BirthdayStepProps {
  dateOfBirth: string;
  onChange: (value: string) => void;
}

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
  // Parse existing date
  const [month, setMonth] = useState("");
  const [day, setDay] = useState("");
  const [year, setYear] = useState("");

  useEffect(() => {
    if (dateOfBirth) {
      const parts = dateOfBirth.split("-");
      if (parts.length === 3) {
        setYear(parts[0]);
        setMonth(parts[1]);
        setDay(parts[2]);
      }
    }
  }, [dateOfBirth]);

  // Combine into date string when all parts are set
  useEffect(() => {
    if (month && day && year) {
      const dateStr = `${year}-${month}-${day}`;
      onChange(dateStr);
    }
  }, [month, day, year, onChange]);

  const age = useMemo(() => {
    if (month && day && year) {
      return calculateAge(`${year}-${month}-${day}`);
    }
    return null;
  }, [month, day, year]);

  const selectClass = cn(
    "flex-1 px-3 py-3 rounded-xl appearance-none",
    "text-base text-gray-900 dark:text-gray-100",
    "bg-white/80 dark:bg-neutral-800/80",
    "border border-gray-200 dark:border-neutral-700",
    "focus:outline-none focus:ring-2 focus:ring-pink-500/50 focus:border-pink-500",
    "transition-all duration-200"
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
          onChange={(e) => setMonth(e.target.value)}
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
          onChange={(e) => setDay(e.target.value)}
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
          onChange={(e) => setYear(e.target.value)}
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

      {/* Age preview */}
      {age !== null && (
        <div className="mt-4 p-4 rounded-xl bg-pink-50 dark:bg-pink-900/20 border border-pink-100 dark:border-pink-800/30">
          <p className="text-center text-gray-700 dark:text-gray-300">
            Your profile will show:{" "}
            <span className="font-semibold text-pink-600 dark:text-pink-400">
              {age} years old
            </span>
          </p>
        </div>
      )}
    </OnboardingStepWrapper>
  );
}

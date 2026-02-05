"use client";

/**
 * OnboardingStepWrapper
 *
 * Provides consistent layout for each onboarding step.
 * Title always pinned at top. Content centered vertically for non-keyboard steps.
 */

import { ReactNode, forwardRef } from "react";
import { cn } from "@/lib/utils";

interface OnboardingStepWrapperProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  /** If true, content is positioned for keyboard visibility */
  needsKeyboard?: boolean;
  className?: string;
}

export function OnboardingStepWrapper({
  title,
  subtitle,
  children,
  needsKeyboard = false,
  className,
}: OnboardingStepWrapperProps) {
  return (
    <main
      className={cn(
        "flex-1 flex flex-col min-h-0 px-5 sm:px-6",
        className
      )}
    >
      <div className="w-full max-w-md mx-auto flex flex-col flex-1 min-h-0 py-4 sm:py-6">
        {/* Step header — always pinned at top */}
        <div className="flex-none mb-4 sm:mb-5">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-1.5 text-sm sm:text-base text-gray-600 dark:text-gray-400">
              {subtitle}
            </p>
          )}
        </div>

        {/* Step content — centered vertically for non-keyboard steps */}
        <div
          className={cn(
            "flex-1 min-h-0 flex flex-col",
            needsKeyboard ? "" : "justify-center"
          )}
        >
          <div className={cn(
            "space-y-3 sm:space-y-4",
            needsKeyboard ? "" : "overflow-y-auto"
          )}>
            {children}
          </div>
        </div>
      </div>
    </main>
  );
}

/**
 * Styled input for onboarding forms
 */
interface OnboardingInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const OnboardingInput = forwardRef<HTMLInputElement, OnboardingInputProps>(
  function OnboardingInput({ label, error, hint, className, ...props }, ref) {
    return (
      <div className="space-y-1.5">
        {label && (
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            {label}
          </label>
        )}
        {hint && (
          <p className="text-xs text-gray-500 dark:text-gray-400">{hint}</p>
        )}
        <input
          ref={ref}
          className={cn(
            "w-full px-4 py-3.5 rounded-xl",
            "text-base text-gray-900 dark:text-gray-100", // 16px minimum for iOS
            "bg-white dark:bg-neutral-800/90",
            "border border-gray-200 dark:border-neutral-700",
            "placeholder:text-gray-400 dark:placeholder:text-gray-500",
            "focus:outline-none focus:ring-0 focus:border-gray-400 dark:focus:border-neutral-500",
            "transition-colors duration-150",
            error && "border-red-400 dark:border-red-500",
            className
          )}
          {...props}
        />
        {error && <p className="text-sm text-red-500 dark:text-red-400">{error}</p>}
      </div>
    );
  }
);

/**
 * Styled textarea for onboarding forms
 */
interface OnboardingTextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const OnboardingTextarea = forwardRef<HTMLTextAreaElement, OnboardingTextareaProps>(
  function OnboardingTextarea({ label, error, className, rows = 3, ...props }, ref) {
    return (
      <div className="space-y-1.5">
        {label && (
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          rows={rows}
          className={cn(
            "w-full px-4 py-3.5 rounded-xl resize-none",
            "text-base text-gray-900 dark:text-gray-100", // 16px minimum for iOS
            "bg-white dark:bg-neutral-800/90",
            "border border-gray-200 dark:border-neutral-700",
            "placeholder:text-gray-400 dark:placeholder:text-gray-500",
            "focus:outline-none focus:ring-0 focus:border-gray-400 dark:focus:border-neutral-500",
            "transition-colors duration-150",
            error && "border-red-400 dark:border-red-500",
            className
          )}
          {...props}
        />
        {error && <p className="text-sm text-red-500 dark:text-red-400">{error}</p>}
      </div>
    );
  }
);

/**
 * Styled select for onboarding forms
 */
interface OnboardingSelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: readonly { value: string; label: string }[];
  placeholder?: string;
}

export function OnboardingSelect({
  label,
  error,
  options,
  placeholder = "Select an option",
  className,
  value,
  ...props
}: OnboardingSelectProps) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </label>
      )}
      <select
        value={value || ""}
        className={cn(
          "w-full px-4 py-3.5 rounded-xl appearance-none",
          "text-base", // 16px minimum for iOS
          value ? "text-gray-900 dark:text-gray-100" : "text-gray-400 dark:text-gray-500",
          "bg-white dark:bg-neutral-800/90",
          "border border-gray-200 dark:border-neutral-700",
          "focus:outline-none focus:border-gray-400 dark:focus:border-neutral-500",
          "transition-colors duration-150",
          // Custom arrow
          "bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%239ca3af%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')]",
          "bg-[length:20px] bg-[right_12px_center] bg-no-repeat",
          "pr-10",
          error && "border-red-400 dark:border-red-500",
          className
        )}
        {...props}
      >
        <option value="" disabled>
          {placeholder}
        </option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p className="text-sm text-red-500 dark:text-red-400">{error}</p>}
    </div>
  );
}

/**
 * Multi-select chips for onboarding
 */
interface OnboardingChipsProps {
  label?: string;
  options: readonly { value: string; label: string }[];
  selected: string[];
  onChange: (selected: string[]) => void;
  maxSelection?: number;
  error?: string;
}

export function OnboardingChips({
  label,
  options,
  selected,
  onChange,
  maxSelection,
  error,
}: OnboardingChipsProps) {
  const toggleOption = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter((v) => v !== value));
    } else {
      if (maxSelection && selected.length >= maxSelection) {
        return;
      }
      onChange([...selected, value]);
    }
  };

  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
          {maxSelection && (
            <span className="ml-2 text-gray-400 dark:text-gray-500 font-normal">
              ({selected.length}/{maxSelection})
            </span>
          )}
        </label>
      )}
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => {
          const isSelected = selected.includes(opt.value);
          const isDisabled =
            !isSelected && !!maxSelection && selected.length >= maxSelection;

          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => toggleOption(opt.value)}
              disabled={isDisabled}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-medium",
                "border transition-all duration-200",
                "active:scale-95",
                isSelected
                  ? cn(
                      "bg-pink-500 dark:bg-pink-600",
                      "border-pink-500 dark:border-pink-600",
                      "text-white"
                    )
                  : cn(
                      "bg-white/80 dark:bg-neutral-800/80",
                      "border-gray-200 dark:border-neutral-700",
                      "text-gray-700 dark:text-gray-300",
                      "hover:border-pink-300 dark:hover:border-pink-700",
                      "hover:bg-pink-50 dark:hover:bg-pink-900/20"
                    ),
                isDisabled && "opacity-50 cursor-not-allowed"
              )}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
      {error && <p className="text-sm text-red-500 dark:text-red-400">{error}</p>}
    </div>
  );
}

/**
 * Styled select with "Prefer not to say" option for sensitive fields
 */
interface OnboardingSelectWithPreferNotProps
  extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'onChange'> {
  label?: string;
  error?: string;
  options: readonly { value: string; label: string }[];
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  isPreferNot: boolean;
  onPreferNotChange: (isPreferNot: boolean) => void;
  fieldDbColumn: string;
}

export function OnboardingSelectWithPreferNot({
  label,
  error,
  options,
  placeholder = "Select an option",
  className,
  value,
  onChange,
  isPreferNot,
  onPreferNotChange,
  fieldDbColumn,
  disabled,
  ...props
}: OnboardingSelectWithPreferNotProps) {
  const handleCheckboxChange = (checked: boolean) => {
    onPreferNotChange(checked);
    if (checked) {
      onChange("");
    }
  };

  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </label>
      )}
      <select
        value={isPreferNot ? "" : value || ""}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled || isPreferNot}
        className={cn(
          "w-full px-4 py-3.5 rounded-xl appearance-none",
          "text-base",
          value && !isPreferNot ? "text-gray-900 dark:text-gray-100" : "text-gray-400 dark:text-gray-500",
          "bg-white dark:bg-neutral-800/90",
          "border border-gray-200 dark:border-neutral-700",
          "focus:outline-none focus:border-gray-400 dark:focus:border-neutral-500",
          "transition-colors duration-150",
          "bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%239ca3af%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')]",
          "bg-[length:20px] bg-[right_12px_center] bg-no-repeat",
          "pr-10",
          (disabled || isPreferNot) && "opacity-50 cursor-not-allowed",
          error && "border-red-400 dark:border-red-500",
          className
        )}
        {...props}
      >
        <option value="" disabled>
          {placeholder}
        </option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      <label className="flex items-center gap-2 cursor-pointer group">
        <input
          type="checkbox"
          checked={isPreferNot}
          onChange={(e) => handleCheckboxChange(e.target.checked)}
          className={cn(
            "w-4 h-4 rounded border-gray-300 dark:border-neutral-600",
            "text-pink-500 focus:ring-pink-500 focus:ring-offset-0",
            "cursor-pointer"
          )}
        />
        <span className="text-sm text-gray-600 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300">
          Prefer not to say
        </span>
      </label>

      {error && <p className="text-sm text-red-500 dark:text-red-400">{error}</p>}
    </div>
  );
}

/**
 * Multi-select chips with "Prefer not to say" option for sensitive fields
 */
interface OnboardingChipsWithPreferNotProps {
  label?: string;
  options: readonly { value: string; label: string }[];
  selected: string[];
  onChange: (selected: string[]) => void;
  maxSelection?: number;
  error?: string;
  isPreferNot: boolean;
  onPreferNotChange: (isPreferNot: boolean) => void;
  fieldDbColumn: string;
}

export function OnboardingChipsWithPreferNot({
  label,
  options,
  selected,
  onChange,
  maxSelection,
  error,
  isPreferNot,
  onPreferNotChange,
  fieldDbColumn,
}: OnboardingChipsWithPreferNotProps) {
  const toggleOption = (value: string) => {
    if (isPreferNot) return;
    
    if (selected.includes(value)) {
      onChange(selected.filter((v) => v !== value));
    } else {
      if (maxSelection && selected.length >= maxSelection) {
        return;
      }
      onChange([...selected, value]);
    }
  };

  const handleCheckboxChange = (checked: boolean) => {
    onPreferNotChange(checked);
    if (checked) {
      onChange([]);
    }
  };

  return (
    <div className="space-y-3">
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
          {maxSelection && !isPreferNot && (
            <span className="ml-2 text-gray-400 dark:text-gray-500 font-normal">
              ({selected.length}/{maxSelection})
            </span>
          )}
        </label>
      )}
      <div className={cn("flex flex-wrap gap-2", isPreferNot && "opacity-50")}>
        {options.map((opt) => {
          const isSelected = selected.includes(opt.value);
          const isDisabled =
            isPreferNot || (!isSelected && !!maxSelection && selected.length >= maxSelection);

          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => toggleOption(opt.value)}
              disabled={isDisabled}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-medium",
                "border transition-all duration-200",
                "active:scale-95",
                isSelected
                  ? cn(
                      "bg-pink-500 dark:bg-pink-600",
                      "border-pink-500 dark:border-pink-600",
                      "text-white"
                    )
                  : cn(
                      "bg-white/80 dark:bg-neutral-800/80",
                      "border-gray-200 dark:border-neutral-700",
                      "text-gray-700 dark:text-gray-300",
                      "hover:border-pink-300 dark:hover:border-pink-700",
                      "hover:bg-pink-50 dark:hover:bg-pink-900/20"
                    ),
                isDisabled && "opacity-50 cursor-not-allowed"
              )}
            >
              {opt.label}
            </button>
          );
        })}
      </div>

      <label className="flex items-center gap-2 cursor-pointer group">
        <input
          type="checkbox"
          checked={isPreferNot}
          onChange={(e) => handleCheckboxChange(e.target.checked)}
          className={cn(
            "w-4 h-4 rounded border-gray-300 dark:border-neutral-600",
            "text-pink-500 focus:ring-pink-500 focus:ring-offset-0",
            "cursor-pointer"
          )}
        />
        <span className="text-sm text-gray-600 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300">
          Prefer not to say
        </span>
      </label>

      {error && <p className="text-sm text-red-500 dark:text-red-400">{error}</p>}
    </div>
  );
}

/**
 * Single-select option cards for onboarding
 */
interface OnboardingOptionCardsProps {
  options: readonly { value: string; label: string }[];
  selected: string | null;
  onChange: (value: string) => void;
  error?: string;
}

export function OnboardingOptionCards({
  options,
  selected,
  onChange,
  error,
}: OnboardingOptionCardsProps) {
  return (
    <div className="space-y-2">
      <div className="space-y-2">
        {options.map((opt) => {
          const isSelected = selected === opt.value;

          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange(opt.value)}
              className={cn(
                "w-full px-4 py-3 rounded-xl text-left",
                "border transition-all duration-200",
                "active:scale-[0.99]",
                isSelected
                  ? cn(
                      "bg-pink-50 dark:bg-pink-900/30",
                      "border-pink-500",
                      "text-gray-900 dark:text-gray-100"
                    )
                  : cn(
                      "bg-white/80 dark:bg-neutral-800/80",
                      "border-gray-200 dark:border-neutral-700",
                      "text-gray-700 dark:text-gray-300",
                      "hover:border-pink-300 dark:hover:border-pink-700"
                    )
              )}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium">{opt.label}</span>
                <div
                  className={cn(
                    "w-5 h-5 rounded-full border-2 transition-all",
                    isSelected
                      ? "border-pink-500 bg-pink-500"
                      : "border-gray-300 dark:border-neutral-600"
                  )}
                >
                  {isSelected && (
                    <svg
                      className="w-full h-full text-white p-0.5"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>
      {error && <p className="text-sm text-red-500 dark:text-red-400">{error}</p>}
    </div>
  );
}

/**
 * Multi-select option cards for onboarding (same visual as single-select, but allows multiple)
 */
interface OnboardingOptionCardsMultiProps {
  options: readonly { value: string; label: string }[];
  selected: string[];
  onChange: (selected: string[]) => void;
  maxSelection?: number;
  error?: string;
}

export function OnboardingOptionCardsMulti({
  options,
  selected,
  onChange,
  maxSelection,
  error,
}: OnboardingOptionCardsMultiProps) {
  const toggleOption = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter((v) => v !== value));
    } else {
      if (maxSelection && selected.length >= maxSelection) {
        return;
      }
      onChange([...selected, value]);
    }
  };

  return (
    <div className="space-y-2">
      <div className="space-y-2">
        {options.map((opt) => {
          const isSelected = selected.includes(opt.value);
          const isDisabled =
            !isSelected && !!maxSelection && selected.length >= maxSelection;

          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => toggleOption(opt.value)}
              disabled={isDisabled}
              className={cn(
                "w-full px-4 py-3 rounded-xl text-left",
                "border transition-all duration-200",
                "active:scale-[0.99]",
                isSelected
                  ? cn(
                      "bg-pink-50 dark:bg-pink-900/30",
                      "border-pink-500",
                      "text-gray-900 dark:text-gray-100"
                    )
                  : cn(
                      "bg-white/80 dark:bg-neutral-800/80",
                      "border-gray-200 dark:border-neutral-700",
                      "text-gray-700 dark:text-gray-300",
                      "hover:border-pink-300 dark:hover:border-pink-700"
                    ),
                isDisabled && "opacity-50 cursor-not-allowed"
              )}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium">{opt.label}</span>
                <div
                  className={cn(
                    "w-5 h-5 rounded-md border-2 transition-all flex items-center justify-center",
                    isSelected
                      ? "border-pink-500 bg-pink-500"
                      : "border-gray-300 dark:border-neutral-600"
                  )}
                >
                  {isSelected && (
                    <svg
                      className="w-full h-full text-white p-0.5"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>
      {error && <p className="text-sm text-red-500 dark:text-red-400">{error}</p>}
    </div>
  );
}

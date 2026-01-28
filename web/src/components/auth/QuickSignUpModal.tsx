"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { X, Mail, Lock, Eye, EyeOff, CheckCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface QuickSignUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  // For events
  eventId?: string;
  eventTitle?: string;
  // For speed dating
  speedDatingId?: string;
  speedDatingTitle?: string;
}

interface FormErrors {
  email?: string;
  password?: string;
  confirmPassword?: string;
  general?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function QuickSignUpModal({
  isOpen,
  onClose,
  onSuccess,
  eventId,
  eventTitle,
  speedDatingId,
  speedDatingTitle,
}: QuickSignUpModalProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [success, setSuccess] = useState(false);
  
  const emailInputRef = useRef<HTMLInputElement>(null);

  // Focus email input when modal opens
  useEffect(() => {
    if (isOpen && emailInputRef.current) {
      // Small delay to ensure modal animation has started
      setTimeout(() => emailInputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Handle escape key and body scroll
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isLoading) onClose();
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose, isLoading]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      // Small delay to allow close animation
      setTimeout(() => {
        setEmail("");
        setPassword("");
        setConfirmPassword("");
        setErrors({});
        setSuccess(false);
        setShowPassword(false);
      }, 200);
    }
  }, [isOpen]);

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget && !isLoading) {
        onClose();
      }
    },
    [onClose, isLoading]
  );

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Email validation
    if (!email) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Please enter a valid email";
    }

    // Password validation
    if (!password) {
      newErrors.password = "Password is required";
    } else if (password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    }

    // Confirm password validation
    if (!confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);
    setErrors({});

    try {
      const res = await fetch("/api/auth/quick-register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          event_id: eventId,
          speed_dating_id: speedDatingId,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrors({ general: data.error || "Something went wrong. Please try again." });
        return;
      }

      // Success! Show success state briefly then redirect
      setSuccess(true);
      setTimeout(() => {
        onSuccess();
      }, 1500);
    } catch {
      setErrors({ general: "Network error. Please check your connection and try again." });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  // Determine what we're registering for
  const registeringFor = eventTitle || speedDatingTitle;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={handleBackdropClick}
    >
      <div
        className={cn(
          "bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden",
          "animate-in zoom-in-95 fade-in duration-200"
        )}
      >
        {/* Success State */}
        {success ? (
          <div className="p-8 text-center">
            <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">You're all set!</h3>
            <p className="text-gray-600">
              {registeringFor
                ? `Welcome to RealSingles! You're registered for "${registeringFor}".`
                : "Welcome to RealSingles! Your account has been created."}
            </p>
            <p className="text-sm text-gray-500 mt-3">Redirecting you now...</p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="px-6 py-4 border-b relative">
              <button
                onClick={onClose}
                disabled={isLoading}
                className="absolute right-4 top-4 w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors disabled:opacity-50"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
              <h2 className="text-xl font-semibold text-gray-900">Quick Sign Up</h2>
              {registeringFor && (
                <p className="text-sm text-gray-600 mt-1">
                  Create an account to register for {registeringFor}
                </p>
              )}
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6">
              {/* General Error */}
              {errors.general && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                  {errors.general}
                </div>
              )}

              {/* Email */}
              <div className="mb-4">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    ref={emailInputRef}
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                    className={cn(
                      "w-full pl-10 pr-4 py-3 border rounded-xl text-base outline-none transition-colors",
                      "focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary",
                      errors.email ? "border-red-300 bg-red-50" : "border-gray-200"
                    )}
                    placeholder="your@email.com"
                    autoComplete="email"
                  />
                </div>
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                )}
              </div>

              {/* Password */}
              <div className="mb-4">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                    className={cn(
                      "w-full pl-10 pr-12 py-3 border rounded-xl text-base outline-none transition-colors",
                      "focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary",
                      errors.password ? "border-red-300 bg-red-50" : "border-gray-200"
                    )}
                    placeholder="At least 8 characters"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1 text-sm text-red-600">{errors.password}</p>
                )}
              </div>

              {/* Confirm Password */}
              <div className="mb-6">
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    id="confirmPassword"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={isLoading}
                    className={cn(
                      "w-full pl-10 pr-4 py-3 border rounded-xl text-base outline-none transition-colors",
                      "focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary",
                      errors.confirmPassword ? "border-red-300 bg-red-50" : "border-gray-200"
                    )}
                    placeholder="Re-enter your password"
                    autoComplete="new-password"
                  />
                </div>
                {errors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 bg-brand-primary text-white rounded-xl font-semibold hover:bg-brand-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Creating account...
                  </>
                ) : registeringFor ? (
                  "Sign Up & Register"
                ) : (
                  "Create Account"
                )}
              </button>

              {/* Terms */}
              <p className="mt-4 text-xs text-center text-gray-500">
                By signing up, you agree to our{" "}
                <a href="/terms" className="text-brand-primary hover:underline">Terms of Service</a>
                {" "}and{" "}
                <a href="/privacy" className="text-brand-primary hover:underline">Privacy Policy</a>
              </p>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

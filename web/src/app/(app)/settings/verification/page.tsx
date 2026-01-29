"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Phone,
  CheckCircle,
  AlertCircle,
  Loader2,
  Shield,
  Camera,
  Upload,
  X,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { IMAGE_ACCEPT_STRING } from "@/lib/supabase/storage";

export default function VerificationSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [photoVerified, setPhotoVerified] = useState(false);
  const [selfieUrl, setSelfieUrl] = useState<string | null>(null);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [uploadingSelfie, setUploadingSelfie] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [photoError, setPhotoError] = useState("");
  const [photoSuccess, setPhotoSuccess] = useState("");
  const [demoMode, setDemoMode] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return;

    const { data: userData } = await supabase
      .from("users")
      .select("phone, phone_verified")
      .eq("id", user.id)
      .single();

    const { data: profileData } = await supabase
      .from("profiles")
      .select("is_photo_verified, verification_selfie_url")
      .eq("user_id", user.id)
      .single();

    if (userData) {
      setPhoneNumber(userData.phone || "");
      setPhoneVerified(userData.phone_verified || false);
    }
    
    if (profileData) {
      setPhotoVerified(profileData.is_photo_verified || false);
      setSelfieUrl(profileData.verification_selfie_url || null);
    }

    setLoading(false);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      setPhotoError("Please upload a JPEG, PNG, or WebP image.");
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setPhotoError("Image must be less than 5MB.");
      return;
    }

    // Create preview
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setPhotoError("");
  };

  const handleUploadSelfie = async () => {
    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      setPhotoError("Please select a photo first.");
      return;
    }

    setUploadingSelfie(true);
    setPhotoError("");
    setPhotoSuccess("");

    try {
      const formData = new FormData();
      formData.append("selfie", file);

      const res = await fetch("/api/auth/verify-selfie", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (data.success) {
        setPhotoVerified(true);
        setSelfieUrl(data.data?.selfie_url || null);
        setPreviewUrl(null);
        setPhotoSuccess("Photo verified successfully!");
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      } else {
        setPhotoError(data.msg || "Failed to verify photo.");
      }
    } catch (err) {
      setPhotoError("Failed to upload photo. Please try again.");
    } finally {
      setUploadingSelfie(false);
    }
  };

  const clearPreview = () => {
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSendOtp = async () => {
    setError("");
    setSuccess("");

    if (!phoneNumber) {
      setError("Please enter a phone number");
      return;
    }

    setSendingOtp(true);

    try {
      const res = await fetch("/api/auth/verify-phone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: phoneNumber }),
      });

      const data = await res.json();

      if (data.success) {
        setOtpSent(true);
        setDemoMode(data.demo_mode || false);
        if (data.demo_mode) {
          setSuccess("Demo mode: Use code 123456 to verify");
        } else {
          setSuccess("Verification code sent to your phone");
        }
      } else {
        setError(data.msg || "Failed to send verification code");
      }
    } catch (err) {
      setError("Failed to send verification code");
    } finally {
      setSendingOtp(false);
    }
  };

  const handleVerifyOtp = async () => {
    setError("");
    setSuccess("");

    if (!otpCode) {
      setError("Please enter the verification code");
      return;
    }

    setVerifyingOtp(true);

    try {
      const res = await fetch("/api/auth/confirm-phone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: phoneNumber, otp: otpCode }),
      });

      const data = await res.json();

      if (data.success) {
        setPhoneVerified(true);
        setOtpSent(false);
        setOtpCode("");
        setSuccess("Phone number verified successfully!");
      } else {
        setError(data.msg || "Invalid verification code");
      }
    } catch (err) {
      setError("Failed to verify code");
    } finally {
      setVerifyingOtp(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100dvh-var(--header-height))]">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link
          href="/settings"
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Verification</h1>
      </div>

      <div className="space-y-6">
        {/* Info Banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex gap-3">
            <Shield className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-medium text-blue-900">Why verify?</h3>
              <p className="text-sm text-blue-700 mt-1">
                Verified profiles get more matches and appear more trustworthy to other users.
                Complete your verification to unlock all features.
              </p>
            </div>
          </div>
        </div>

        {/* Phone Verification */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-start gap-4">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
              phoneVerified ? "bg-green-100" : "bg-gray-100"
            }`}>
              {phoneVerified ? (
                <CheckCircle className="w-6 h-6 text-green-600" />
              ) : (
                <Phone className="w-6 h-6 text-gray-600" />
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Phone Verification</h2>
                {phoneVerified && (
                  <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                    Verified
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-500 mt-1">
                Verify your phone number to prove you&apos;re a real person.
              </p>

              {!phoneVerified && (
                <div className="mt-4 space-y-4">
                  {error && (
                    <div className="flex items-center gap-2 text-red-600 text-sm">
                      <AlertCircle className="w-4 h-4" />
                      {error}
                    </div>
                  )}

                  {success && (
                    <div className="flex items-center gap-2 text-green-600 text-sm">
                      <CheckCircle className="w-4 h-4" />
                      {success}
                    </div>
                  )}

                  {!otpSent ? (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Phone Number
                        </label>
                        <input
                          type="tel"
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                          placeholder="+1 (555) 000-0000"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-base"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Include country code (e.g., +1 for US)
                        </p>
                      </div>
                      <button
                        onClick={handleSendOtp}
                        disabled={sendingOtp || !phoneNumber}
                        className="w-full py-2.5 px-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        {sendingOtp ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Sending...
                          </>
                        ) : (
                          "Send Verification Code"
                        )}
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Verification Code
                        </label>
                        <input
                          type="text"
                          value={otpCode}
                          onChange={(e) => setOtpCode(e.target.value)}
                          placeholder="123456"
                          maxLength={6}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-base text-center tracking-widest"
                        />
                        {demoMode && (
                          <p className="text-xs text-amber-600 mt-1">
                            Demo mode: Enter 123456 to verify
                          </p>
                        )}
                      </div>
                      <button
                        onClick={handleVerifyOtp}
                        disabled={verifyingOtp || !otpCode}
                        className="w-full py-2.5 px-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        {verifyingOtp ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Verifying...
                          </>
                        ) : (
                          "Verify Code"
                        )}
                      </button>
                      <button
                        onClick={() => {
                          setOtpSent(false);
                          setOtpCode("");
                          setError("");
                          setSuccess("");
                        }}
                        className="w-full py-2 text-sm text-gray-600 hover:text-gray-800"
                      >
                        Change phone number
                      </button>
                    </div>
                  )}
                </div>
              )}

              {phoneVerified && (
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Verified number:</span> {phoneNumber}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Photo Verification */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-start gap-4">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
              photoVerified ? "bg-green-100" : "bg-gray-100"
            }`}>
              {photoVerified ? (
                <CheckCircle className="w-6 h-6 text-green-600" />
              ) : (
                <Camera className="w-6 h-6 text-gray-600" />
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Photo Verification</h2>
                {photoVerified && (
                  <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                    Verified
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-500 mt-1">
                Upload a clear selfie to verify your identity and get a verification badge.
              </p>

              {!photoVerified && (
                <div className="mt-4 space-y-4">
                  {photoError && (
                    <div className="flex items-center gap-2 text-red-600 text-sm">
                      <AlertCircle className="w-4 h-4" />
                      {photoError}
                    </div>
                  )}

                  {photoSuccess && (
                    <div className="flex items-center gap-2 text-green-600 text-sm">
                      <CheckCircle className="w-4 h-4" />
                      {photoSuccess}
                    </div>
                  )}

                  {/* Instructions */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">For best results:</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Face the camera directly</li>
                      <li>• Ensure good lighting</li>
                      <li>• Remove sunglasses and hats</li>
                      <li>• Make sure your face is clearly visible</li>
                    </ul>
                  </div>

                  {/* Preview or Upload Area */}
                  {previewUrl ? (
                    <div className="relative">
                      <img
                        src={previewUrl}
                        alt="Selfie preview"
                        className="w-full max-w-xs mx-auto rounded-xl border-2 border-gray-200"
                      />
                      <button
                        onClick={clearPreview}
                        className="absolute top-2 right-2 p-1.5 bg-white rounded-full shadow-md hover:bg-gray-100"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/50 transition-colors"
                    >
                      <Upload className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                      <p className="text-sm font-medium text-gray-700">Click to upload a selfie</p>
                      <p className="text-xs text-gray-500 mt-1">JPEG, PNG, or WebP up to 5MB</p>
                    </div>
                  )}

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept={IMAGE_ACCEPT_STRING}
                    onChange={handleFileSelect}
                    className="hidden"
                  />

                  {previewUrl && (
                    <div className="flex gap-3">
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="flex-1 py-2.5 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                      >
                        Choose Different Photo
                      </button>
                      <button
                        onClick={handleUploadSelfie}
                        disabled={uploadingSelfie}
                        className="flex-1 py-2.5 px-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {uploadingSelfie ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Verifying...
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-4 h-4" />
                            Verify Photo
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {photoVerified && selfieUrl && (
                <div className="mt-4">
                  <p className="text-sm text-gray-600 mb-3">Your verification photo:</p>
                  <img
                    src={selfieUrl}
                    alt="Verification selfie"
                    className="w-32 h-32 rounded-xl object-cover border-2 border-green-200"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Verification Status Summary */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Verification Status</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2">
              <span className="text-gray-600">Phone</span>
              {phoneVerified ? (
                <span className="flex items-center gap-1.5 text-green-600">
                  <CheckCircle className="w-4 h-4" />
                  Verified
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-gray-400">
                  <AlertCircle className="w-4 h-4" />
                  Not verified
                </span>
              )}
            </div>
            <div className="flex items-center justify-between py-2 border-t">
              <span className="text-gray-600">Photo</span>
              {photoVerified ? (
                <span className="flex items-center gap-1.5 text-green-600">
                  <CheckCircle className="w-4 h-4" />
                  Verified
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-gray-400">
                  <AlertCircle className="w-4 h-4" />
                  Not verified
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

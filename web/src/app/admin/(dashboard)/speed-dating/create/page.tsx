"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, Upload, X } from "lucide-react";
import { IMAGE_ACCEPT_STRING } from "@/lib/supabase/storage";

interface SessionFormData {
  title: string;
  description: string;
  scheduled_datetime: string;
  duration_minutes: string;
  round_duration_seconds: string;
  min_participants: string;
  max_participants: string;
  gender_preference: string;
  age_min: string;
  age_max: string;
  price: string;
}

export default function AdminCreateSpeedDatingPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [formData, setFormData] = useState<SessionFormData>({
    title: "",
    description: "",
    scheduled_datetime: "",
    duration_minutes: "45",
    round_duration_seconds: "180", // 3 minutes
    min_participants: "6",
    max_participants: "20",
    gender_preference: "mixed",
    age_min: "",
    age_max: "",
    price: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error when field changes
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = "Title is required";
    }
    if (!formData.scheduled_datetime) {
      newErrors.scheduled_datetime = "Date and time is required";
    }

    // Validate age range
    const ageMin = formData.age_min ? parseInt(formData.age_min) : null;
    const ageMax = formData.age_max ? parseInt(formData.age_max) : null;
    if (ageMin !== null && ageMax !== null && ageMin > ageMax) {
      newErrors.age_min = "Min age cannot be greater than max age";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    setIsSubmitting(true);

    try {
      // Create session
      const sessionData = {
        title: formData.title,
        description: formData.description || null,
        image_url: null, // Will update after upload
        scheduled_datetime: formData.scheduled_datetime,
        duration_minutes: parseInt(formData.duration_minutes) || 45,
        round_duration_seconds: parseInt(formData.round_duration_seconds) || 180,
        min_participants: parseInt(formData.min_participants) || 6,
        max_participants: parseInt(formData.max_participants) || 20,
        gender_preference: formData.gender_preference || "mixed",
        age_min: formData.age_min ? parseInt(formData.age_min) : null,
        age_max: formData.age_max ? parseInt(formData.age_max) : null,
        price: formData.price ? parseFloat(formData.price) : null,
      };

      const res = await fetch("/api/admin/speed-dating", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sessionData),
      });

      const data = await res.json();

      if (!data.success) {
        alert(data.msg || "Failed to create session");
        return;
      }

      const sessionId = data.data?.id;

      // Upload image if there is one
      if (imageFile && sessionId) {
        const uploadFormData = new FormData();
        uploadFormData.append("file", imageFile);
        uploadFormData.append("bucket", "events"); // Using events bucket for speed dating images too
        uploadFormData.append("eventId", sessionId); // Use eventId (API param name)
        uploadFormData.append("isSpeedDating", "true"); // Flag for speed dating sessions

        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: uploadFormData,
        });

        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          const imagePath = uploadData.path || "";

          // Update session with image URL
          if (imagePath) {
            await fetch(`/api/admin/speed-dating/${sessionId}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ image_url: imagePath }),
            });
          }
        } else {
          console.error("Failed to upload image:", await uploadRes.json());
        }
      }

      router.push("/admin/speed-dating");
    } catch (err) {
      console.error("Error creating session:", err);
      alert("Failed to create session. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link
          href="/admin/speed-dating"
          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Create Speed Dating Session</h1>
          <p className="text-sm text-gray-500">Schedule a new virtual speed dating event</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-6">
        {/* Image Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Session Image (optional)
          </label>
          {imagePreview ? (
            <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-gray-100">
              <img
                src={imagePreview}
                alt="Preview"
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={removeImage}
                className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <Upload className="w-8 h-8 text-gray-400 mb-2" />
                <p className="text-sm text-gray-500">Click to upload session image</p>
              </div>
              <input
                type="file"
                className="hidden"
                accept={IMAGE_ACCEPT_STRING}
                onChange={handleImageChange}
              />
            </label>
          )}
        </div>

        {/* Title */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
            Title *
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
              errors.title ? "border-red-500" : "border-gray-300"
            }`}
            placeholder="e.g., Friday Night Connections"
          />
          {errors.title && <p className="mt-1 text-sm text-red-500">{errors.title}</p>}
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Describe the speed dating session..."
          />
        </div>

        {/* Date/Time */}
        <div>
          <label htmlFor="scheduled_datetime" className="block text-sm font-medium text-gray-700 mb-1">
            Date & Time *
          </label>
          <input
            type="datetime-local"
            id="scheduled_datetime"
            name="scheduled_datetime"
            value={formData.scheduled_datetime}
            onChange={handleChange}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
              errors.scheduled_datetime ? "border-red-500" : "border-gray-300"
            }`}
          />
          {errors.scheduled_datetime && (
            <p className="mt-1 text-sm text-red-500">{errors.scheduled_datetime}</p>
          )}
        </div>

        {/* Duration Settings */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="duration_minutes" className="block text-sm font-medium text-gray-700 mb-1">
              Total Duration (minutes)
            </label>
            <input
              type="number"
              id="duration_minutes"
              name="duration_minutes"
              value={formData.duration_minutes}
              onChange={handleChange}
              min="15"
              max="180"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div>
            <label htmlFor="round_duration_seconds" className="block text-sm font-medium text-gray-700 mb-1">
              Round Duration (seconds)
            </label>
            <select
              id="round_duration_seconds"
              name="round_duration_seconds"
              value={formData.round_duration_seconds}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="120">2 minutes</option>
              <option value="180">3 minutes</option>
              <option value="240">4 minutes</option>
              <option value="300">5 minutes</option>
            </select>
          </div>
        </div>

        {/* Participant Limits */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="min_participants" className="block text-sm font-medium text-gray-700 mb-1">
              Min Participants
            </label>
            <input
              type="number"
              id="min_participants"
              name="min_participants"
              value={formData.min_participants}
              onChange={handleChange}
              min="2"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div>
            <label htmlFor="max_participants" className="block text-sm font-medium text-gray-700 mb-1">
              Max Participants
            </label>
            <input
              type="number"
              id="max_participants"
              name="max_participants"
              value={formData.max_participants}
              onChange={handleChange}
              min="2"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Gender Preference */}
        <div>
          <label htmlFor="gender_preference" className="block text-sm font-medium text-gray-700 mb-1">
            Gender Preference
          </label>
          <select
            id="gender_preference"
            name="gender_preference"
            value={formData.gender_preference}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="mixed">Mixed (all genders)</option>
            <option value="men_seeking_women">Men seeking Women</option>
            <option value="women_seeking_men">Women seeking Men</option>
            <option value="lgbtq">LGBTQ+</option>
          </select>
        </div>

        {/* Age Range */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="age_min" className="block text-sm font-medium text-gray-700 mb-1">
              Min Age (optional)
            </label>
            <input
              type="number"
              id="age_min"
              name="age_min"
              value={formData.age_min}
              onChange={handleChange}
              min="18"
              max="100"
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                errors.age_min ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="e.g., 25"
            />
            {errors.age_min && <p className="mt-1 text-sm text-red-500">{errors.age_min}</p>}
          </div>
          <div>
            <label htmlFor="age_max" className="block text-sm font-medium text-gray-700 mb-1">
              Max Age (optional)
            </label>
            <input
              type="number"
              id="age_max"
              name="age_max"
              value={formData.age_max}
              onChange={handleChange}
              min="18"
              max="100"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="e.g., 40"
            />
          </div>
        </div>

        {/* Price */}
        <div>
          <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
            Price (USD)
          </label>
          <input
            type="number"
            id="price"
            name="price"
            value={formData.price}
            onChange={handleChange}
            min="0"
            step="0.01"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="0.00 for free sessions"
          />
        </div>

        {/* Submit */}
        <div className="flex justify-end gap-4 pt-4 border-t">
          <Link
            href="/admin/speed-dating"
            className="px-6 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
          >
            {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
            Create Session
          </button>
        </div>
      </form>
    </div>
  );
}

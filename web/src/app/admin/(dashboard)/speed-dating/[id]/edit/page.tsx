"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, Upload, X } from "lucide-react";

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
  status: string;
}

export default function AdminEditSpeedDatingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null);
  const [imageRemoved, setImageRemoved] = useState(false);
  const [formData, setFormData] = useState<SessionFormData>({
    title: "",
    description: "",
    scheduled_datetime: "",
    duration_minutes: "45",
    round_duration_seconds: "180",
    min_participants: "6",
    max_participants: "20",
    gender_preference: "mixed",
    age_min: "",
    age_max: "",
    status: "scheduled",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchSession();
  }, [resolvedParams.id]);

  const fetchSession = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/admin/speed-dating/${resolvedParams.id}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.session) {
          const session = data.session;
          
          // Format datetime for input
          const scheduledDate = session.scheduled_datetime
            ? new Date(session.scheduled_datetime).toISOString().slice(0, 16)
            : "";

          setFormData({
            title: session.title || "",
            description: session.description || "",
            scheduled_datetime: scheduledDate,
            duration_minutes: String(session.duration_minutes || 45),
            round_duration_seconds: String(session.round_duration_seconds || 180),
            min_participants: String(session.min_participants || 6),
            max_participants: String(session.max_participants || 20),
            gender_preference: session.gender_preference || "mixed",
            age_min: session.age_min ? String(session.age_min) : "",
            age_max: session.age_max ? String(session.age_max) : "",
            status: session.status || "scheduled",
          });

          if (session.image_url) {
            setExistingImageUrl(session.image_url);
          }
        }
      }
    } catch (err) {
      console.error("Error fetching session:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

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
      setExistingImageUrl(null);
      setImageRemoved(false); // Reset since we have a new image
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setExistingImageUrl(null);
    setImageRemoved(true); // Track that user explicitly removed the image
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = "Title is required";
    }
    if (!formData.scheduled_datetime) {
      newErrors.scheduled_datetime = "Date and time is required";
    }

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
      // Determine the final image URL
      let finalImageUrl: string | null = existingImageUrl;

      // Upload new image if there is one
      if (imageFile) {
        const uploadFormData = new FormData();
        uploadFormData.append("file", imageFile);
        uploadFormData.append("bucket", "events");
        uploadFormData.append("eventId", resolvedParams.id); // Use eventId (API param name)
        uploadFormData.append("isSpeedDating", "true"); // Flag for speed dating sessions

        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: uploadFormData,
        });

        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          finalImageUrl = uploadData.path || null;
        } else {
          const errorData = await uploadRes.json();
          console.error("Upload failed:", errorData);
          alert(errorData.error || "Failed to upload image");
          setIsSubmitting(false);
          return;
        }
      } else if (imageRemoved) {
        // User explicitly removed the image without uploading a new one
        finalImageUrl = null;
      }

      // Update session with all data including image_url
      const sessionData = {
        title: formData.title,
        description: formData.description || null,
        scheduled_datetime: formData.scheduled_datetime,
        duration_minutes: parseInt(formData.duration_minutes) || 45,
        round_duration_seconds: parseInt(formData.round_duration_seconds) || 180,
        min_participants: parseInt(formData.min_participants) || 6,
        max_participants: parseInt(formData.max_participants) || 20,
        gender_preference: formData.gender_preference || "mixed",
        age_min: formData.age_min ? parseInt(formData.age_min) : null,
        age_max: formData.age_max ? parseInt(formData.age_max) : null,
        status: formData.status,
        image_url: finalImageUrl, // Always include image_url in the update
      };

      const res = await fetch(`/api/admin/speed-dating/${resolvedParams.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sessionData),
      });

      const data = await res.json();

      if (!data.success) {
        alert(data.msg || "Failed to update session");
        return;
      }

      router.push(`/admin/speed-dating/${resolvedParams.id}`);
    } catch (err) {
      console.error("Error updating session:", err);
      alert("Failed to update session. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link
          href={`/admin/speed-dating/${resolvedParams.id}`}
          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Edit Speed Dating Session</h1>
          <p className="text-sm text-gray-500">Update session details</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-6">
        {/* Image Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Session Image
          </label>
          {imagePreview || existingImageUrl ? (
            <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-gray-100">
              <img
                src={imagePreview || existingImageUrl || ""}
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
                accept="image/*"
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
          />
        </div>

        {/* Status */}
        <div>
          <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
            Status
          </label>
          <select
            id="status"
            name="status"
            value={formData.status}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="scheduled">Scheduled</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
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
            />
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end gap-4 pt-4 border-t">
          <Link
            href={`/admin/speed-dating/${resolvedParams.id}`}
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
            Save Changes
          </button>
        </div>
      </form>
    </div>
  );
}

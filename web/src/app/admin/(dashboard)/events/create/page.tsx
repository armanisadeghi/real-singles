"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, Upload, X } from "lucide-react";
import { AdminPageHeader, AdminButton } from "@/components/admin/AdminPageHeader";
import { IMAGE_ACCEPT_STRING } from "@/lib/supabase/storage";

interface EventFormData {
  title: string;
  description: string;
  event_type: string;
  venue_name: string;
  address: string;
  city: string;
  state: string;
  start_datetime: string;
  end_datetime: string;
  max_attendees: string;
  age_min: string;
  age_max: string;
  price: string;
  is_public: boolean;
}

export default function AdminCreateEventPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [formData, setFormData] = useState<EventFormData>({
    title: "",
    description: "",
    event_type: "in_person",
    venue_name: "",
    address: "",
    city: "",
    state: "",
    start_datetime: "",
    end_datetime: "",
    max_attendees: "",
    age_min: "",
    age_max: "",
    price: "",
    is_public: true,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
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
    if (!formData.start_datetime) {
      newErrors.start_datetime = "Start date and time is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    setIsSubmitting(true);

    try {
      // Step 1: Create event first (without image)
      const eventData = {
        title: formData.title,
        description: formData.description || null,
        event_type: formData.event_type,
        image_url: null, // Will update after upload
        venue_name: formData.venue_name || null,
        address: formData.address || null,
        city: formData.city || null,
        state: formData.state || null,
        start_datetime: formData.start_datetime,
        end_datetime: formData.end_datetime || null,
        max_attendees: formData.max_attendees ? parseInt(formData.max_attendees) : null,
        age_min: formData.age_min ? parseInt(formData.age_min) : null,
        age_max: formData.age_max ? parseInt(formData.age_max) : null,
        price: formData.price ? parseFloat(formData.price) : null,
        is_public: formData.is_public,
      };

      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(eventData),
      });

      const data = await res.json();

      if (!data.success) {
        alert(data.msg || "Failed to create event");
        return;
      }

      const eventId = data.data?.EventID;

      // Step 2: Upload image if there is one (now we have eventId)
      if (imageFile && eventId) {
        const uploadFormData = new FormData();
        uploadFormData.append("file", imageFile);
        uploadFormData.append("bucket", "events");
        uploadFormData.append("eventId", eventId);

        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: uploadFormData,
        });

        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          const imagePath = uploadData.path || "";

          // Step 3: Update event with image URL (use path, not full URL)
          if (imagePath) {
            const updateRes = await fetch(`/api/admin/events/${eventId}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ image_url: imagePath }),
            });
            
            if (!updateRes.ok) {
              console.error("Failed to update event with image URL");
              // Event was created but image wasn't saved - still redirect but warn
              alert("Event created but image may not have been saved. Please edit the event to re-upload.");
            }
          }
        } else {
          const errorData = await uploadRes.json();
          console.error("Failed to upload image:", errorData);
          // Event was created but image upload failed - still redirect but warn
          alert("Event created but image upload failed: " + (errorData.error || "Unknown error"));
        }
      }

      router.push("/admin/events");
    } catch (err) {
      console.error("Error creating event:", err);
      alert("Failed to create event. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <AdminPageHeader
        title="Create Event"
        subtitle="Add a new event for users"
        showBack
      />

      <form 
        onSubmit={handleSubmit} 
        className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-6
          opacity-100 translate-y-0
          [transition:opacity_400ms_ease-out,transform_400ms_ease-out]
          [@starting-style]:opacity-0 [@starting-style]:translate-y-4"
      >
        {/* Image Upload */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Event Image
          </label>
          {imagePreview ? (
            <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-slate-100">
              <img
                src={imagePreview}
                alt="Preview"
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={removeImage}
                className="absolute top-3 right-3 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-slate-300 border-dashed rounded-xl cursor-pointer bg-slate-50 hover:bg-slate-100 transition-colors">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <Upload className="w-8 h-8 text-slate-400 mb-2" />
                <p className="text-sm text-slate-500">Click to upload event image</p>
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
          <label htmlFor="title" className="block text-sm font-medium text-slate-700 mb-1">
            Title *
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
              errors.title ? "border-red-500" : "border-slate-300"
            }`}
            placeholder="Event title"
          />
          {errors.title && <p className="mt-1 text-sm text-red-500">{errors.title}</p>}
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-slate-700 mb-1">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={4}
            className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            placeholder="Event description"
          />
        </div>

        {/* Event Type */}
        <div>
          <label htmlFor="event_type" className="block text-sm font-medium text-slate-700 mb-1">
            Event Type
          </label>
          <select
            id="event_type"
            name="event_type"
            value={formData.event_type}
            onChange={handleChange}
            className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          >
            <option value="in_person">In Person</option>
            <option value="virtual">Virtual</option>
            <option value="speed_dating">Speed Dating</option>
          </select>
        </div>

        {/* Date/Time */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="start_datetime" className="block text-sm font-medium text-slate-700 mb-1">
              Start Date & Time *
            </label>
            <input
              type="datetime-local"
              id="start_datetime"
              name="start_datetime"
              value={formData.start_datetime}
              onChange={handleChange}
              className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                errors.start_datetime ? "border-red-500" : "border-slate-300"
              }`}
            />
            {errors.start_datetime && (
              <p className="mt-1 text-sm text-red-500">{errors.start_datetime}</p>
            )}
          </div>
          <div>
            <label htmlFor="end_datetime" className="block text-sm font-medium text-slate-700 mb-1">
              End Date & Time
            </label>
            <input
              type="datetime-local"
              id="end_datetime"
              name="end_datetime"
              value={formData.end_datetime}
              onChange={handleChange}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            />
          </div>
        </div>

        {/* Location */}
        <div>
          <label htmlFor="venue_name" className="block text-sm font-medium text-slate-700 mb-1">
            Venue Name
          </label>
          <input
            type="text"
            id="venue_name"
            name="venue_name"
            value={formData.venue_name}
            onChange={handleChange}
            className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            placeholder="e.g., The Grand Ballroom"
          />
        </div>

        <div>
          <label htmlFor="address" className="block text-sm font-medium text-slate-700 mb-1">
            Address
          </label>
          <input
            type="text"
            id="address"
            name="address"
            value={formData.address}
            onChange={handleChange}
            className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            placeholder="Street address"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="city" className="block text-sm font-medium text-slate-700 mb-1">
              City
            </label>
            <input
              type="text"
              id="city"
              name="city"
              value={formData.city}
              onChange={handleChange}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder="City"
            />
          </div>
          <div>
            <label htmlFor="state" className="block text-sm font-medium text-slate-700 mb-1">
              State
            </label>
            <input
              type="text"
              id="state"
              name="state"
              value={formData.state}
              onChange={handleChange}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder="State"
            />
          </div>
        </div>

        {/* Capacity */}
        <div>
          <label htmlFor="max_attendees" className="block text-sm font-medium text-slate-700 mb-1">
            Max Attendees
          </label>
          <input
            type="number"
            id="max_attendees"
            name="max_attendees"
            value={formData.max_attendees}
            onChange={handleChange}
            min="1"
            className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            placeholder="Leave empty for unlimited"
          />
        </div>

        {/* Age Range */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="age_min" className="block text-sm font-medium text-slate-700 mb-1">
              Minimum Age
            </label>
            <input
              type="number"
              id="age_min"
              name="age_min"
              value={formData.age_min}
              onChange={handleChange}
              min="18"
              max="99"
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder="e.g., 21"
            />
          </div>
          <div>
            <label htmlFor="age_max" className="block text-sm font-medium text-slate-700 mb-1">
              Maximum Age
            </label>
            <input
              type="number"
              id="age_max"
              name="age_max"
              value={formData.age_max}
              onChange={handleChange}
              min="18"
              max="99"
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder="e.g., 35"
            />
          </div>
        </div>

        {/* Price */}
        <div>
          <label htmlFor="price" className="block text-sm font-medium text-slate-700 mb-1">
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
            className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            placeholder="0.00 for free events"
          />
        </div>

        {/* Public */}
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="is_public"
            name="is_public"
            checked={formData.is_public}
            onChange={handleChange}
            className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
          />
          <label htmlFor="is_public" className="text-sm text-slate-700">
            Public event (visible to all users)
          </label>
        </div>

        {/* Submit */}
        <div className="flex justify-end gap-3 pt-6 border-t border-slate-200/80">
          <Link
            href="/admin/events"
            className="px-5 py-2.5 text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 font-medium transition-colors"
          >
            Cancel
          </Link>
          <AdminButton
            type="submit"
            loading={isSubmitting}
          >
            Create Event
          </AdminButton>
        </div>
      </form>
    </div>
  );
}

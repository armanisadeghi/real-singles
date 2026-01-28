"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, Upload, X, CalendarDays } from "lucide-react";
import { AdminPageHeader, AdminButton } from "@/components/admin/AdminPageHeader";

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
  is_public: boolean;
  status: string;
}

export default function AdminEditEventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null);
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
    is_public: true,
    status: "upcoming",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchEvent();
  }, [resolvedParams.id]);

  const fetchEvent = async () => {
    try {
      const res = await fetch(`/api/admin/events/${resolvedParams.id}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.event) {
          const event = data.event;
          setFormData({
            title: event.title || "",
            description: event.description || "",
            event_type: event.event_type || "in_person",
            venue_name: event.venue_name || "",
            address: event.address || "",
            city: event.city || "",
            state: event.state || "",
            start_datetime: event.start_datetime
              ? event.start_datetime.slice(0, 16)
              : "",
            end_datetime: event.end_datetime
              ? event.end_datetime.slice(0, 16)
              : "",
            max_attendees: event.max_attendees?.toString() || "",
            is_public: event.is_public ?? true,
            status: event.status || "upcoming",
          });
          setExistingImageUrl(event.image_url);
          setImagePreview(event.image_url);
        }
      }
    } catch (err) {
      console.error("Error fetching event:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
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
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setExistingImageUrl(null);
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
      let imageUrl = existingImageUrl;

      // Upload new image if there is one
      if (imageFile) {
        const uploadFormData = new FormData();
        uploadFormData.append("file", imageFile);
        uploadFormData.append("bucket", "events");
        uploadFormData.append("eventId", resolvedParams.id);

        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: uploadFormData,
        });

        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          imageUrl = uploadData.path || imageUrl;
        }
      }

      // Update event
      const eventData = {
        title: formData.title,
        description: formData.description || null,
        event_type: formData.event_type,
        image_url: imageUrl,
        venue_name: formData.venue_name || null,
        address: formData.address || null,
        city: formData.city || null,
        state: formData.state || null,
        start_datetime: formData.start_datetime,
        end_datetime: formData.end_datetime || null,
        max_attendees: formData.max_attendees ? parseInt(formData.max_attendees) : null,
        is_public: formData.is_public,
        status: formData.status,
      };

      const res = await fetch(`/api/admin/events/${resolvedParams.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(eventData),
      });

      const data = await res.json();

      if (data.success) {
        router.push(`/admin/events/${resolvedParams.id}`);
      } else {
        alert(data.error || "Failed to update event");
      }
    } catch (err) {
      console.error("Error updating event:", err);
      alert("Failed to update event. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-slate-100 rounded-lg animate-pulse" />
          <div className="space-y-2">
            <div className="h-7 w-32 bg-slate-100 rounded animate-pulse" />
            <div className="h-4 w-48 bg-slate-100 rounded animate-pulse" />
          </div>
        </div>
        <div className="flex items-center justify-center py-12 bg-white rounded-2xl border border-slate-200/80">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <AdminPageHeader
        title="Edit Event"
        subtitle="Update event details"
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
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Event Image
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
                <p className="text-sm text-gray-500">Click to upload event image</p>
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
            placeholder="Event title"
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
            rows={4}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Event description"
          />
        </div>

        {/* Event Type & Status */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="event_type" className="block text-sm font-medium text-gray-700 mb-1">
              Event Type
            </label>
            <select
              id="event_type"
              name="event_type"
              value={formData.event_type}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="in_person">In Person</option>
              <option value="virtual">Virtual</option>
              <option value="speed_dating">Speed Dating</option>
            </select>
          </div>
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
              <option value="draft">Draft</option>
              <option value="upcoming">Upcoming</option>
              <option value="ongoing">Ongoing</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {/* Date/Time */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="start_datetime" className="block text-sm font-medium text-gray-700 mb-1">
              Start Date & Time *
            </label>
            <input
              type="datetime-local"
              id="start_datetime"
              name="start_datetime"
              value={formData.start_datetime}
              onChange={handleChange}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                errors.start_datetime ? "border-red-500" : "border-gray-300"
              }`}
            />
            {errors.start_datetime && (
              <p className="mt-1 text-sm text-red-500">{errors.start_datetime}</p>
            )}
          </div>
          <div>
            <label htmlFor="end_datetime" className="block text-sm font-medium text-gray-700 mb-1">
              End Date & Time
            </label>
            <input
              type="datetime-local"
              id="end_datetime"
              name="end_datetime"
              value={formData.end_datetime}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Location */}
        <div>
          <label htmlFor="venue_name" className="block text-sm font-medium text-gray-700 mb-1">
            Venue Name
          </label>
          <input
            type="text"
            id="venue_name"
            name="venue_name"
            value={formData.venue_name}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="e.g., The Grand Ballroom"
          />
        </div>

        <div>
          <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
            Address
          </label>
          <input
            type="text"
            id="address"
            name="address"
            value={formData.address}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Street address"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
              City
            </label>
            <input
              type="text"
              id="city"
              name="city"
              value={formData.city}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="City"
            />
          </div>
          <div>
            <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-1">
              State
            </label>
            <input
              type="text"
              id="state"
              name="state"
              value={formData.state}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="State"
            />
          </div>
        </div>

        {/* Capacity */}
        <div>
          <label htmlFor="max_attendees" className="block text-sm font-medium text-gray-700 mb-1">
            Max Attendees
          </label>
          <input
            type="number"
            id="max_attendees"
            name="max_attendees"
            value={formData.max_attendees}
            onChange={handleChange}
            min="1"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Leave empty for unlimited"
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
            className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
          />
          <label htmlFor="is_public" className="text-sm text-gray-700">
            Public event (visible to all users)
          </label>
        </div>

        {/* Submit */}
        <div className="flex justify-end gap-3 pt-6 border-t border-slate-200/80">
          <Link
            href={`/admin/events/${resolvedParams.id}`}
            className="px-5 py-2.5 text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 font-medium transition-colors"
          >
            Cancel
          </Link>
          <AdminButton
            type="submit"
            loading={isSubmitting}
          >
            Save Changes
          </AdminButton>
        </div>
      </form>
    </div>
  );
}

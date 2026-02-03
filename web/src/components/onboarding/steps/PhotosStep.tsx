"use client";

/**
 * PhotosStep
 *
 * Step 5: Upload photos (minimum 1 required)
 */

import { useState, useCallback, useEffect } from "react";
import { Camera, Plus, Trash2, Image as ImageIcon } from "lucide-react";
import { OnboardingStepWrapper } from "../OnboardingStepWrapper";
import { cn } from "@/lib/utils";

interface PhotosStepProps {
  photoCount: number;
  onPhotosChange: () => void; // Callback to refresh
}

interface GalleryItem {
  id: string;
  url: string;
  isPrimary: boolean;
}

export function PhotosStep({ photoCount, onPhotosChange }: PhotosStepProps) {
  const [photos, setPhotos] = useState<GalleryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch existing photos
  const fetchPhotos = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/users/me/gallery");
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
          // API returns PascalCase field names: GalleryID, MediaURL, IsPrimary
          setPhotos(
            data.data.map((item: { GalleryID: string; MediaURL: string; IsPrimary: boolean }) => ({
              id: item.GalleryID,
              url: item.MediaURL,
              isPrimary: item.IsPrimary,
            }))
          );
        }
      }
    } catch {
      // Ignore errors on initial load
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchPhotos();
  }, [fetchPhotos]);

  // Handle file upload
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be less than 5MB");
      return;
    }

    try {
      setIsUploading(true);
      setError(null);

      const formData = new FormData();
      formData.append("file", file);
      formData.append("bucket", "gallery");
      formData.append("folder", "");

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.msg || "Upload failed");
      }

      // Refresh photos
      await fetchPhotos();
      onPhotosChange();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload");
    } finally {
      setIsUploading(false);
      // Reset input
      e.target.value = "";
    }
  };

  // Handle delete
  const handleDelete = async (photoId: string) => {
    try {
      const res = await fetch(`/api/users/me/gallery?id=${photoId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        await fetchPhotos();
        onPhotosChange();
      }
    } catch {
      setError("Failed to delete photo");
    }
  };

  // Handle set primary
  const handleSetPrimary = async (photoId: string) => {
    try {
      await fetch("/api/users/me/gallery", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ primary_id: photoId }),
      });

      await fetchPhotos();
    } catch {
      setError("Failed to set primary photo");
    }
  };

  return (
    <OnboardingStepWrapper
      title="Add your photos"
      subtitle="Show your best self — at least 1 photo required"
    >
      {/* Photo grid */}
      <div className="grid grid-cols-3 gap-2">
        {/* Existing photos */}
        {photos.map((photo) => (
          <div
            key={photo.id}
            className={cn(
              "relative aspect-square rounded-xl overflow-hidden",
              "bg-gray-100 dark:bg-neutral-800",
              photo.isPrimary && "ring-2 ring-pink-500"
            )}
          >
            <img
              src={photo.url}
              alt="Profile photo"
              className="w-full h-full object-cover"
            />
            {/* Overlay actions */}
            <div className="absolute inset-0 bg-black/0 hover:bg-black/40 transition-colors group">
              <div className="absolute inset-0 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                {!photo.isPrimary && (
                  <button
                    onClick={() => handleSetPrimary(photo.id)}
                    className="p-2 rounded-full bg-white/90 text-gray-900 hover:bg-white"
                    title="Set as primary"
                  >
                    <Camera className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => handleDelete(photo.id)}
                  className="p-2 rounded-full bg-white/90 text-red-500 hover:bg-white"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            {/* Primary badge */}
            {photo.isPrimary && (
              <div className="absolute top-1 left-1 px-2 py-0.5 rounded-full bg-pink-500 text-white text-xs font-medium">
                Main
              </div>
            )}
          </div>
        ))}

        {/* Add photo button */}
        {photos.length < 10 && (
          <label
            className={cn(
              "aspect-square rounded-xl",
              "border-2 border-dashed border-gray-300 dark:border-neutral-600",
              "flex flex-col items-center justify-center gap-1",
              "cursor-pointer",
              "hover:border-pink-400 dark:hover:border-pink-600",
              "hover:bg-pink-50 dark:hover:bg-pink-900/20",
              "transition-colors",
              isUploading && "opacity-50 cursor-wait"
            )}
          >
            <input
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              disabled={isUploading}
              className="sr-only"
            />
            {isUploading ? (
              <div className="w-6 h-6 border-2 border-pink-500 border-t-transparent rounded-full animate-spin" />
            ) : (
              <Plus className="w-6 h-6 text-gray-400 dark:text-gray-500" />
            )}
            <span className="text-xs text-gray-400 dark:text-gray-500">
              {isUploading ? "Uploading..." : "Add"}
            </span>
          </label>
        )}
      </div>

      {/* Error message */}
      {error && (
        <p className="text-sm text-red-500 dark:text-red-400 text-center">
          {error}
        </p>
      )}

      {/* Photo count info */}
      <div className="flex items-center justify-center gap-2 text-sm text-gray-500 dark:text-gray-400">
        <ImageIcon className="w-4 h-4" />
        <span>
          {photos.length} of 10 photos
          {photos.length === 0 && " (1 required)"}
        </span>
      </div>
    </OnboardingStepWrapper>
  );
}

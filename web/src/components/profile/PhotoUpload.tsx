"use client";

import { useState, useRef } from "react";
import { Upload, Image as ImageIcon, Video, Loader2 } from "lucide-react";
import { PhotoCropper } from "./PhotoCropper";
import { cn } from "@/lib/utils";

interface PhotoUploadProps {
  onUploadComplete: (url: string, type: "image" | "video") => void;
  maxPhotos?: number;
  maxVideos?: number;
  currentPhotoCount?: number;
  currentVideoCount?: number;
  acceptVideo?: boolean;
}

const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50MB

export function PhotoUpload({
  onUploadComplete,
  maxPhotos = 10,
  maxVideos = 1,
  currentPhotoCount = 0,
  currentVideoCount = 0,
  acceptVideo = true,
}: PhotoUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState("");
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<{ name: string; type: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const canUploadPhotos = currentPhotoCount < maxPhotos;
  const canUploadVideos = currentVideoCount < maxVideos;

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    setError("");

    // Validate file type
    const isImage = file.type.startsWith("image/");
    const isVideo = file.type.startsWith("video/");

    if (!isImage && !isVideo) {
      setError("Please select an image or video file");
      return;
    }

    // Check limits
    if (isImage && !canUploadPhotos) {
      setError(`Maximum ${maxPhotos} photos allowed`);
      return;
    }

    if (isVideo && !canUploadVideos) {
      setError(`Maximum ${maxVideos} video allowed`);
      return;
    }

    // Validate file size
    if (isImage && file.size > MAX_IMAGE_SIZE) {
      setError("Image must be less than 5MB");
      return;
    }

    if (isVideo && file.size > MAX_VIDEO_SIZE) {
      setError("Video must be less than 50MB");
      return;
    }

    // For images, show cropper
    if (isImage) {
      const reader = new FileReader();
      reader.onload = () => {
        setImageToCrop(reader.result as string);
        setPendingFile({ name: file.name, type: file.type });
      };
      reader.readAsDataURL(file);
    } else {
      // For videos, upload directly
      await uploadFile(file);
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleCropComplete = async (croppedBlob: Blob) => {
    setImageToCrop(null);
    if (!pendingFile) return;

    // Create file from blob
    const file = new File([croppedBlob], pendingFile.name, {
      type: pendingFile.type,
    });

    await uploadFile(file);
    setPendingFile(null);
  };

  const uploadFile = async (file: File) => {
    setIsUploading(true);
    setUploadProgress(0);
    setError("");

    console.log("[PhotoUpload] Starting upload for file:", file.name, "type:", file.type, "size:", file.size);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("bucket", "gallery");

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      console.log("[PhotoUpload] Response status:", response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error("[PhotoUpload] Upload failed:", errorData);
        throw new Error(errorData.error || "Upload failed");
      }

      const data = await response.json();
      console.log("[PhotoUpload] Upload response data:", JSON.stringify(data, null, 2));
      
      if (data.success) {
        const type = file.type.startsWith("video/") ? "video" : "image";
        // Use publicUrl if available, otherwise use path
        const url = data.publicUrl || data.path;
        console.log("[PhotoUpload] Calling onUploadComplete with url:", url, "type:", type);
        
        // Check if there was a warning about gallery entry
        if (data.warning || data.galleryError) {
          console.warn("[PhotoUpload] Gallery entry warning:", data.warning || data.galleryError);
          setError(data.warning || `Gallery entry failed: ${data.galleryError}`);
        }
        
        onUploadComplete(url, type);
      } else {
        throw new Error(data.error || "Upload failed");
      }
    } catch (err) {
      console.error("[PhotoUpload] Catch error:", err);
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <>
      <div className="space-y-4">
        {/* Upload Button */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading || (!canUploadPhotos && !canUploadVideos)}
          className={cn(
            "w-full border-2 border-dashed rounded-xl p-8 transition-all",
            "hover:border-pink-400 hover:bg-pink-50/50",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            isUploading
              ? "border-pink-500 bg-pink-50"
              : "border-gray-300 bg-gray-50"
          )}
        >
          <div className="flex flex-col items-center gap-3">
            {isUploading ? (
              <>
                <Loader2 className="w-12 h-12 text-pink-500 animate-spin" />
                <p className="text-sm font-medium text-gray-700">
                  Uploading... {uploadProgress}%
                </p>
              </>
            ) : (
              <>
                <div className="flex gap-2">
                  <div className="w-12 h-12 rounded-full bg-pink-100 flex items-center justify-center">
                    <ImageIcon className="w-6 h-6 text-pink-600" />
                  </div>
                  {acceptVideo && (
                    <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
                      <Video className="w-6 h-6 text-purple-600" />
                    </div>
                  )}
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-700">
                    Click to upload or drag and drop
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {canUploadPhotos && `Photos (${currentPhotoCount}/${maxPhotos})`}
                    {canUploadPhotos && acceptVideo && canUploadVideos && " • "}
                    {acceptVideo && canUploadVideos && `Videos (${currentVideoCount}/${maxVideos})`}
                  </p>
                  <p className="text-xs text-gray-400 mt-2">
                    Max 5MB for images, 50MB for videos
                  </p>
                </div>
              </>
            )}
          </div>
        </button>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept={`image/*${acceptVideo ? ",video/*" : ""}`}
          onChange={handleFileSelect}
          className="hidden"
          disabled={isUploading}
        />

        {/* Error message */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Upload limits info */}
        <div className="text-xs text-gray-500 space-y-1">
          <p>• Maximum {maxPhotos} photos and {maxVideos} video(s)</p>
          <p>• Photos will be cropped to square</p>
          <p>• Drag photos to reorder after upload</p>
        </div>
      </div>

      {/* Cropper Modal */}
      {imageToCrop && (
        <PhotoCropper
          imageUrl={imageToCrop}
          onCropComplete={handleCropComplete}
          onCancel={() => {
            setImageToCrop(null);
            setPendingFile(null);
          }}
        />
      )}
    </>
  );
}

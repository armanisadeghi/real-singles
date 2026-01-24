"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, CheckCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { PhotoUpload, GalleryManager, type GalleryItem } from "@/components/profile";
import { cn } from "@/lib/utils";
import { STORAGE_BUCKETS } from "@/lib/supabase/storage";

export default function GalleryPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [isUpdating, setIsUpdating] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    loadGallery();
  }, []);

  const loadGallery = async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      console.log("[Gallery] Auth check - user:", user?.id, "error:", authError);

      if (authError || !user) {
        console.error("[Gallery] Auth error or no user:", authError);
        router.push("/login");
        return;
      }

      console.log("[Gallery] Fetching gallery for user:", user.id);

      const { data, error, count } = await supabase
        .from("user_gallery")
        .select("*", { count: "exact" })
        .eq("user_id", user.id)
        .order("display_order", { ascending: true })
        .order("created_at", { ascending: false });

      console.log("[Gallery] Query result - count:", count, "data length:", data?.length, "error:", error);
      
      if (data && data.length > 0) {
        console.log("[Gallery] First item:", JSON.stringify(data[0], null, 2));
      }

      if (error) {
        console.error("[Gallery] Error loading gallery:", error);
        showMessage("error", `Failed to load gallery: ${error.message}`);
        return;
      }

      // Generate signed URLs for gallery items (gallery bucket may be private)
      const galleryData: GalleryItem[] = await Promise.all(
        (data || []).map(async (item) => {
          let mediaUrl = item.media_url;
          
          // If it's not already a full URL, create a signed URL
          if (!item.media_url.startsWith("http")) {
            console.log("[Gallery] Creating signed URL for:", item.media_url);
            
            const { data: signedData, error: signedError } = await supabase.storage
              .from(STORAGE_BUCKETS.GALLERY)
              .createSignedUrl(item.media_url, 3600); // 1 hour expiry
            
            if (signedError) {
              console.error("[Gallery] Signed URL error:", signedError);
              // Fallback to public URL construction
              const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
              mediaUrl = `${supabaseUrl}/storage/v1/object/public/gallery/${encodeURIComponent(item.media_url)}`;
            } else {
              mediaUrl = signedData.signedUrl;
            }
            
            console.log("[Gallery] Generated URL:", mediaUrl);
          }
          
          return {
            id: item.id,
            media_url: mediaUrl,
            media_type: item.media_type as "image" | "video",
            is_primary: item.is_primary || false,
            display_order: item.display_order || 0,
            thumbnail_url: item.thumbnail_url || null,
            created_at: item.created_at || new Date().toISOString(),
          };
        })
      );

      console.log("[Gallery] Setting gallery state with", galleryData.length, "items");
      setGallery(galleryData);
    } catch (error) {
      console.error("[Gallery] Catch error:", error);
      showMessage("error", "An error occurred loading gallery");
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (type: "success" | "error", text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const handleUploadComplete = async (url: string, type: "image" | "video") => {
    console.log("[Gallery] Upload complete callback - url:", url, "type:", type);
    // Refresh gallery to show new item
    await loadGallery();
    showMessage("success", `${type === "image" ? "Photo" : "Video"} uploaded successfully!`);
  };

  const handleReorder = async (reorderedItems: GalleryItem[]) => {
    setIsUpdating(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      // Update display order for all items
      const updates = reorderedItems.map((item, index) => ({
        id: item.id,
        display_order: index,
      }));

      const response = await fetch("/api/users/me/gallery", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order: updates }),
      });

      if (!response.ok) {
        throw new Error("Failed to reorder items");
      }

      setGallery(reorderedItems);
      showMessage("success", "Gallery reordered");
    } catch (error) {
      console.error("Reorder error:", error);
      showMessage("error", "Failed to reorder gallery");
      // Revert to original order
      await loadGallery();
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSetPrimary = async (itemId: string) => {
    setIsUpdating(true);
    try {
      const response = await fetch("/api/users/me/gallery", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ primary_id: itemId }),
      });

      if (!response.ok) {
        throw new Error("Failed to set primary");
      }

      // Update local state
      setGallery((prev) =>
        prev.map((item) => ({
          ...item,
          is_primary: item.id === itemId,
        }))
      );

      showMessage("success", "Primary photo updated");
    } catch (error) {
      console.error("Set primary error:", error);
      showMessage("error", "Failed to set primary photo");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async (itemId: string) => {
    setIsUpdating(true);
    try {
      const response = await fetch(`/api/users/me/gallery?id=${itemId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete item");
      }

      // Remove from local state
      setGallery((prev) => prev.filter((item) => item.id !== itemId));
      showMessage("success", "Item deleted");
    } catch (error) {
      console.error("Delete error:", error);
      showMessage("error", "Failed to delete item");
    } finally {
      setIsUpdating(false);
    }
  };

  const photoCount = gallery.filter((item) => item.media_type === "image").length;
  const videoCount = gallery.filter((item) => item.media_type === "video").length;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link
              href="/profile/edit"
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ArrowLeft className="w-6 h-6" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Manage Gallery</h1>
              <p className="text-sm text-gray-600 mt-1">
                Upload and manage your photos and videos
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="hidden sm:flex items-center gap-4 px-4 py-2 bg-white rounded-lg shadow-sm border">
            <div className="text-center">
              <p className="text-lg font-bold text-pink-600">{photoCount}/10</p>
              <p className="text-xs text-gray-500">Photos</p>
            </div>
            <div className="w-px h-8 bg-gray-200" />
            <div className="text-center">
              <p className="text-lg font-bold text-purple-600">{videoCount}/1</p>
              <p className="text-xs text-gray-500">Videos</p>
            </div>
          </div>
        </div>

        {/* Success/Error Messages */}
        {message && (
          <div
            className={cn(
              "mb-6 p-4 rounded-lg border flex items-start gap-3",
              message.type === "success"
                ? "bg-green-50 border-green-200 text-green-800"
                : "bg-red-50 border-red-200 text-red-800"
            )}
          >
            {message.type === "success" && <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />}
            <p className="text-sm font-medium">{message.text}</p>
          </div>
        )}

        {/* Upload Section */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Upload New Media</h2>
          <PhotoUpload
            onUploadComplete={handleUploadComplete}
            maxPhotos={10}
            maxVideos={1}
            currentPhotoCount={photoCount}
            currentVideoCount={videoCount}
            acceptVideo={true}
          />
        </div>

        {/* Gallery Section */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Your Gallery</h2>
            {gallery.length > 0 && (
              <p className="text-sm text-gray-600">
                {gallery.length} item{gallery.length !== 1 ? "s" : ""}
              </p>
            )}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-pink-500 animate-spin" />
            </div>
          ) : (
            <GalleryManager
              items={gallery}
              onReorder={handleReorder}
              onSetPrimary={handleSetPrimary}
              onDelete={handleDelete}
              isLoading={isUpdating}
            />
          )}
        </div>

        {/* Mobile Stats */}
        <div className="sm:hidden mt-6 flex justify-center gap-6 py-4 bg-white rounded-lg shadow-sm border">
          <div className="text-center">
            <p className="text-2xl font-bold text-pink-600">{photoCount}/10</p>
            <p className="text-xs text-gray-500">Photos</p>
          </div>
          <div className="w-px bg-gray-200" />
          <div className="text-center">
            <p className="text-2xl font-bold text-purple-600">{videoCount}/1</p>
            <p className="text-xs text-gray-500">Videos</p>
          </div>
        </div>
      </div>
    </div>
  );
}

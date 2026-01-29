"use client";

import { useState, useEffect, useCallback } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { Trash2, Star, Video as VideoIcon, Image as ImageIcon, GripVertical, Loader2, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { BottomSheet } from "@/components/ui/BottomSheet";

export interface GalleryItem {
  id: string;
  media_url: string;
  media_type: "image" | "video";
  is_primary: boolean;
  display_order: number;
  thumbnail_url?: string | null;
  created_at: string;
}

interface GalleryManagerProps {
  items: GalleryItem[];
  onReorder: (items: GalleryItem[]) => Promise<void>;
  onSetPrimary: (itemId: string) => Promise<void>;
  onDelete: (itemId: string) => Promise<void>;
  isLoading?: boolean;
}

function SortableGalleryItem({
  item,
  onSetPrimary,
  onDelete,
  onTapForActions,
  isDeleting,
}: {
  item: GalleryItem;
  onSetPrimary: (id: string) => void;
  onDelete: (id: string) => void;
  onTapForActions: (item: GalleryItem) => void;
  isDeleting: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    transition,
  };

  // Handle tap on the item (for touch devices)
  const handleTap = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    // Don't trigger if we're dragging
    if (isDragging) return;
    
    // Only trigger action sheet on touch devices
    // We detect this by checking if the event is from a touch or if hover isn't supported
    const isTouch = 'touches' in e || window.matchMedia('(hover: none)').matches;
    if (isTouch) {
      e.preventDefault();
      e.stopPropagation();
      onTapForActions(item);
    }
  }, [isDragging, item, onTapForActions]);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "relative group aspect-square rounded-xl overflow-hidden bg-gray-100 border-2",
        isDragging ? "border-pink-500 shadow-xl opacity-50" : "border-transparent",
        item.is_primary && "ring-4 ring-pink-500 ring-offset-2"
      )}
    >
      {/* Tap target for mobile - covers the whole card */}
      <button
        type="button"
        onClick={handleTap}
        className="absolute inset-0 z-10 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 focus-visible:ring-inset
          [@media(hover:hover)]:hidden"
        aria-label={`Manage ${item.media_type}: ${item.is_primary ? 'Primary' : ''}`}
      />

      {/* Media */}
      {item.media_type === "video" ? (
        <video
          src={item.media_url}
          className="w-full h-full object-cover"
          muted
          playsInline
          onError={(e) => console.error("[GalleryManager] Video error for URL:", item.media_url, e)}
        />
      ) : (
        <img
          src={item.media_url}
          alt=""
          className="w-full h-full object-cover"
          onError={(e) => {
            console.error("[GalleryManager] Image error for URL:", item.media_url);
            // Try to show what went wrong
            const img = e.currentTarget;
            console.error("[GalleryManager] Image naturalWidth:", img.naturalWidth, "naturalHeight:", img.naturalHeight);
          }}
        />
      )}

      {/* Primary Badge */}
      {item.is_primary && (
        <div className="absolute top-2 left-2 bg-pink-500 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 z-20">
          <Star className="w-3 h-3 fill-white" />
          Primary
        </div>
      )}

      {/* Media Type Badge */}
      <div className="absolute top-2 right-2 bg-black/60 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 z-20">
        {item.media_type === "video" ? (
          <>
            <VideoIcon className="w-3 h-3" />
            Video
          </>
        ) : (
          <>
            <ImageIcon className="w-3 h-3" />
            Photo
          </>
        )}
      </div>

      {/* Mobile Action Indicator - visible only on touch devices */}
      <div className="absolute bottom-2 right-2 z-20 [@media(hover:hover)]:hidden">
        <div className="bg-black/70 p-2 rounded-full backdrop-blur-sm">
          <MoreHorizontal className="w-4 h-4 text-white" />
        </div>
      </div>

      {/* Drag Handle - desktop hover only */}
      <div
        {...attributes}
        {...listeners}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity cursor-move z-30
          [@media(hover:none)]:hidden"
      >
        <div className="bg-black/70 p-3 rounded-full">
          <GripVertical className="w-6 h-6 text-white" />
        </div>
      </div>

      {/* Action Buttons - desktop hover only */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3 opacity-0 group-hover:opacity-100 transition-opacity z-30
        [@media(hover:none)]:hidden">
        <div className="flex gap-2">
          {!item.is_primary && item.media_type === "image" && (
            <button
              onClick={() => onSetPrimary(item.id)}
              className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg text-xs font-medium transition-colors"
              title="Set as primary photo"
            >
              <Star className="w-3 h-3" />
              Set Primary
            </button>
          )}
          <button
            onClick={() => onDelete(item.id)}
            disabled={isDeleting}
            className="flex items-center justify-center gap-1 px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
            title="Delete"
          >
            <Trash2 className="w-3 h-3" />
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

export function GalleryManager({
  items,
  onReorder,
  onSetPrimary,
  onDelete,
  isLoading,
}: GalleryManagerProps) {
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>(items);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  // State for mobile action sheet
  const [selectedItem, setSelectedItem] = useState<GalleryItem | null>(null);
  const [isActionSheetOpen, setIsActionSheetOpen] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      // Require a bit of movement before drag starts to allow tap on mobile
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    setGalleryItems(items);
  }, [items]);

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = galleryItems.findIndex((item) => item.id === active.id);
      const newIndex = galleryItems.findIndex((item) => item.id === over.id);

      const reordered = arrayMove(galleryItems, oldIndex, newIndex).map(
        (item: GalleryItem, index: number) => ({
          ...item,
          display_order: index,
        })
      );

      setGalleryItems(reordered);
      await onReorder(reordered);
    }
  };

  const handleSetPrimary = async (itemId: string) => {
    setIsActionSheetOpen(false);
    setSelectedItem(null);
    await onSetPrimary(itemId);
  };

  const handleDelete = async (itemId: string) => {
    if (!confirm("Are you sure you want to delete this item?")) {
      return;
    }

    setIsActionSheetOpen(false);
    setSelectedItem(null);
    setDeletingId(itemId);
    try {
      await onDelete(itemId);
    } finally {
      setDeletingId(null);
    }
  };

  // Handle tap on item (opens action sheet on mobile)
  const handleTapForActions = useCallback((item: GalleryItem) => {
    setSelectedItem(item);
    setIsActionSheetOpen(true);
  }, []);

  const closeActionSheet = useCallback(() => {
    setIsActionSheetOpen(false);
    setSelectedItem(null);
  }, []);

  if (galleryItems.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-200 flex items-center justify-center">
          <ImageIcon className="w-8 h-8 text-gray-400" />
        </div>
        <p className="text-gray-600 font-medium">No photos or videos yet</p>
        <p className="text-sm text-gray-500 mt-1">Upload your first photo to get started</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Instructions - different for desktop vs mobile */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800 font-medium mb-2">Gallery Tips:</p>
        <ul className="text-xs text-blue-700 space-y-1">
          <li>• Drag and drop to reorder photos</li>
          <li>• Your first photo will be your main profile picture</li>
          {/* Desktop tip */}
          <li className="hidden [@media(hover:hover)]:block">• Hover over photos to see action buttons</li>
          {/* Mobile tip */}
          <li className="[@media(hover:hover)]:hidden">• Tap any photo to set it as primary or delete it</li>
          <li>• Videos cannot be set as primary (only photos)</li>
        </ul>
      </div>

      {/* Gallery Grid with Drag and Drop */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={galleryItems.map((item) => item.id)} strategy={rectSortingStrategy}>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {galleryItems.map((item) => (
              <SortableGalleryItem
                key={item.id}
                item={item}
                onSetPrimary={handleSetPrimary}
                onDelete={handleDelete}
                onTapForActions={handleTapForActions}
                isDeleting={deletingId === item.id}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {isLoading && (
        <div className="text-center py-4">
          <Loader2 className="w-6 h-6 text-pink-500 animate-spin mx-auto" />
          <p className="text-sm text-gray-600 mt-2">Updating gallery...</p>
        </div>
      )}

      {/* Mobile Action Sheet */}
      <BottomSheet
        isOpen={isActionSheetOpen}
        onClose={closeActionSheet}
        title="Photo Actions"
        showClose={false}
      >
        <div className="px-4 py-2">
          {/* Preview thumbnail */}
          {selectedItem && (
            <div className="flex items-center gap-4 pb-4 mb-4 border-b">
              <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                {selectedItem.media_type === "video" ? (
                  <video
                    src={selectedItem.media_url}
                    className="w-full h-full object-cover"
                    muted
                    playsInline
                  />
                ) : (
                  <img
                    src={selectedItem.media_url}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
              <div>
                <p className="font-medium text-gray-900">
                  {selectedItem.media_type === "video" ? "Video" : "Photo"}
                </p>
                {selectedItem.is_primary && (
                  <p className="text-sm text-pink-600 flex items-center gap-1">
                    <Star className="w-3 h-3 fill-pink-600" />
                    Primary photo
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="space-y-2 pb-4">
            {/* Set as Primary - only for non-primary images */}
            {selectedItem && !selectedItem.is_primary && selectedItem.media_type === "image" && (
              <button
                onClick={() => handleSetPrimary(selectedItem.id)}
                className="w-full flex items-center gap-3 px-4 py-3.5 bg-yellow-50 hover:bg-yellow-100 active:bg-yellow-200 text-yellow-800 rounded-xl font-medium transition-colors min-h-[52px]"
              >
                <Star className="w-5 h-5" />
                Set as Primary Photo
              </button>
            )}

            {/* Delete button */}
            {selectedItem && (
              <button
                onClick={() => handleDelete(selectedItem.id)}
                disabled={deletingId === selectedItem.id}
                className="w-full flex items-center gap-3 px-4 py-3.5 bg-red-50 hover:bg-red-100 active:bg-red-200 text-red-700 rounded-xl font-medium transition-colors disabled:opacity-50 min-h-[52px]"
              >
                <Trash2 className="w-5 h-5" />
                Delete {selectedItem.media_type === "video" ? "Video" : "Photo"}
              </button>
            )}

            {/* Cancel button */}
            <button
              onClick={closeActionSheet}
              className="w-full flex items-center justify-center gap-2 px-4 py-3.5 bg-gray-100 hover:bg-gray-200 active:bg-gray-300 text-gray-700 rounded-xl font-medium transition-colors min-h-[52px]"
            >
              Cancel
            </button>
          </div>
        </div>
      </BottomSheet>
    </div>
  );
}

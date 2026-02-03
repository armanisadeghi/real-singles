"use client";

import { useState, useRef, useCallback } from "react";
import { Plus, X, ArrowUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { IMAGE_AND_VIDEO_ACCEPT_STRING } from "@/lib/supabase/storage";

interface MessageInputProps {
  onSend: (content: string, type?: "text" | "image" | "video", mediaUrl?: string) => void;
  onTyping?: (isTyping: boolean) => void;
  disabled?: boolean;
  placeholder?: string;
}

/**
 * iOS Messages-style floating input
 * 
 * Design:
 * - Glass effect background matching header
 * - Floating above keyboard on mobile
 * - Plus button + input pill (rounded-full)
 * - 16px min font-size (prevents iOS zoom)
 */
export function MessageInput({
  onSend,
  onTyping,
  disabled = false,
  placeholder = "Message",
}: MessageInputProps) {
  const [message, setMessage] = useState("");
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleSubmit = useCallback(
    (e?: React.FormEvent) => {
      e?.preventDefault();

      if (attachedImage) {
        onSend(message.trim(), "image", attachedImage);
        setAttachedImage(null);
        setMessage("");
      } else if (message.trim()) {
        onSend(message.trim(), "text");
        setMessage("");
      }

      // Stop typing indicator
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      setIsTyping(false);
      onTyping?.(false);

      // Reset textarea height
      if (inputRef.current) {
        inputRef.current.style.height = "auto";
      }

      // Focus back on input
      inputRef.current?.focus();
    },
    [message, attachedImage, onSend, onTyping]
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
    
    // Typing indicator logic
    if (!isTyping) {
      setIsTyping(true);
      onTyping?.(true);
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set timeout to stop typing after 3 seconds of no input
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      onTyping?.(false);
    }, 3000);

    // Auto-resize textarea
    const textarea = e.target;
    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) {
      alert("Please select an image or video file");
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert("File size must be less than 10MB");
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", "chat");

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        setAttachedImage(data.url);
      } else {
        alert("Failed to upload file");
      }
    } catch (error) {
      console.error("Upload error:", error);
      alert("Failed to upload file");
    } finally {
      setIsUploading(false);
    }
  };

  const removeAttachment = () => {
    setAttachedImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const canSend = (message.trim() || attachedImage) && !disabled && !isUploading;

  return (
    <div 
      ref={containerRef}
      className="fixed left-0 right-0 bottom-3 pb-safe pointer-events-none px-3"
      style={{ zIndex: 'var(--z-fixed)' }}
    >
      <div className="pointer-events-auto">
        {/* Attached image preview */}
        {attachedImage && (
          <div className="mb-2 ml-[48px]">
            <div className="relative inline-block">
              <img
                src={attachedImage}
                alt="Attached"
                className="h-16 rounded-xl object-cover"
              />
              <button
                onClick={removeAttachment}
                className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-gray-800 text-white rounded-full flex items-center justify-center active:bg-gray-700"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          </div>
        )}

        {/* Input row - floating glass elements */}
        <form 
          onSubmit={handleSubmit} 
          className="flex items-center gap-2"
        >
          {/* Plus button - glass style matching header */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled || isUploading}
            className={cn(
              "w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-all active:scale-95",
              "bg-gray-200/70 dark:bg-neutral-700/70 backdrop-blur-xl",
              "active:bg-gray-300/80 dark:active:bg-neutral-600/80",
              (disabled || isUploading) && "opacity-50"
            )}
          >
            {isUploading ? (
              <div className="w-4 h-4 border-2 border-gray-600 dark:border-gray-300 border-t-transparent rounded-full animate-spin" />
            ) : (
              <Plus className="w-5 h-5 text-gray-700 dark:text-gray-200" strokeWidth={2.5} />
            )}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept={IMAGE_AND_VIDEO_ACCEPT_STRING}
            onChange={handleFileSelect}
            className="hidden"
          />

          {/* Text input pill - glass style, fully rounded */}
          <div className="flex-1 relative flex items-center">
            <textarea
              ref={inputRef}
              value={message}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              disabled={disabled}
              rows={1}
              inputMode="text"
              enterKeyHint="send"
              className={cn(
                "w-full resize-none",
                "bg-transparent dark:bg-transparent",
                "text-gray-900 dark:text-gray-100",
                "disabled:opacity-50",
                "placeholder:text-gray-500 dark:placeholder:text-gray-400",
                "[&::-webkit-scrollbar]:w-0 [&::-webkit-scrollbar]:h-0"
              )}
              style={{ 
                height: "36px",
                minHeight: "36px",
                maxHeight: "120px",
                overflowY: "auto", // Enable vertical scrolling
                // Override global CSS that conflicts with component styles
                padding: "13px 42px 13px 16px", // Increased vertical padding to prevent text clipping
                fontSize: "16px",
                lineHeight: "18px",
                border: "0.5px solid var(--border)",
                borderRadius: "20px", // Use fixed radius instead of pill to prevent text clipping
                outline: "none",
                boxShadow: "none",
                touchAction: "manipulation",
                WebkitAppearance: "none",
                appearance: "none",
                // Hide scrollbar across all browsers
                scrollbarWidth: "none", // Firefox
                msOverflowStyle: "none", // IE/Edge
              } as React.CSSProperties & { scrollbarWidth?: string; msOverflowStyle?: string }}
            />
            
            {/* Send button - inside input, only visible when can send */}
            {canSend && (
              <button
                type="submit"
                className="absolute right-1.5 top-1/2 -translate-y-1/2 w-[28px] h-[28px] rounded-full flex items-center justify-center bg-blue-500 text-white transition-all active:scale-95"
              >
                <ArrowUp className="w-4 h-4" strokeWidth={3} />
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

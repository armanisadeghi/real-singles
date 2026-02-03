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
 * iOS Messages-style input
 * 
 * Design:
 * - Three floating elements: plus button, input pill, send button
 * - No outer container/background wrapping the elements
 * - Input is a standalone rounded pill
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
    <div className="fixed bottom-0 left-0 right-0 z-50 pointer-events-none">
      <div className="pointer-events-auto px-2 pb-[calc(8px+env(safe-area-inset-bottom))] pt-2 bg-white/80 dark:bg-neutral-950/80 backdrop-blur-xl">
        {/* Attached image preview */}
        {attachedImage && (
          <div className="mb-2 ml-11">
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

        {/* Input row - floating elements */}
        <form 
          onSubmit={handleSubmit} 
          className="flex items-end gap-1.5"
        >
          {/* Plus button - floating */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled || isUploading}
            className={cn(
              "w-8 h-8 mb-0.5 rounded-full flex items-center justify-center shrink-0 transition-all active:scale-95",
              "bg-blue-500 text-white",
              (disabled || isUploading) && "opacity-50"
            )}
          >
            {isUploading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Plus className="w-5 h-5" strokeWidth={2.5} />
            )}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept={IMAGE_AND_VIDEO_ACCEPT_STRING}
            onChange={handleFileSelect}
            className="hidden"
          />

          {/* Text input pill - standalone with border */}
          <div className="flex-1 relative">
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
                "w-full min-h-[36px] pl-3 pr-10 py-2 resize-none",
                "bg-gray-100 dark:bg-neutral-800",
                "rounded-[18px] border border-gray-200 dark:border-neutral-700",
                "text-[16px] leading-[20px] text-gray-900 dark:text-gray-100",
                "focus:outline-none focus:border-gray-300 dark:focus:border-neutral-600",
                "disabled:opacity-50",
                "placeholder:text-gray-400 dark:placeholder:text-gray-500"
              )}
              style={{ 
                maxHeight: "120px",
                touchAction: "manipulation",
              }}
            />
            
            {/* Send button - inside input on the right */}
            <button
              type="submit"
              disabled={!canSend}
              className={cn(
                "absolute right-1 bottom-1 w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-all active:scale-95",
                canSend
                  ? "bg-blue-500 text-white"
                  : "bg-transparent text-gray-300 dark:text-gray-600"
              )}
            >
              <ArrowUp className="w-4 h-4" strokeWidth={2.5} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

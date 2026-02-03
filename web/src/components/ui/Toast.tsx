"use client";

import { createContext, useContext, useState, useCallback, useRef } from "react";
import { X, CheckCircle, XCircle, AlertCircle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastType = "success" | "error" | "warning" | "info";

interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastContextType {
  toast: (message: string, type?: ToastType, duration?: number) => void;
  success: (message: string, duration?: number) => void;
  error: (message: string, duration?: number) => void;
  warning: (message: string, duration?: number) => void;
  info: (message: string, duration?: number) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

const toastStyles: Record<ToastType, { bg: string; icon: typeof CheckCircle }> = {
  success: { bg: "bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200", icon: CheckCircle },
  error: { bg: "bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200", icon: XCircle },
  warning: { bg: "bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-800 text-yellow-800 dark:text-yellow-200", icon: AlertCircle },
  info: { bg: "bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200", icon: Info },
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const timeout = timeoutsRef.current.get(id);
    if (timeout) {
      clearTimeout(timeout);
      timeoutsRef.current.delete(id);
    }
  }, []);

  const addToast = useCallback(
    (message: string, type: ToastType = "info", duration = 4000) => {
      const id = Math.random().toString(36).slice(2);
      setToasts((prev) => [...prev, { id, message, type, duration }]);

      if (duration > 0) {
        const timeout = setTimeout(() => removeToast(id), duration);
        timeoutsRef.current.set(id, timeout);
      }
    },
    [removeToast]
  );

  const contextValue: ToastContextType = {
    toast: addToast,
    success: (msg, dur) => addToast(msg, "success", dur),
    error: (msg, dur) => addToast(msg, "error", dur),
    warning: (msg, dur) => addToast(msg, "warning", dur),
    info: (msg, dur) => addToast(msg, "info", dur),
  };

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      {/* Toast container */}
      <div
        className={cn(
          "fixed z-[100] pointer-events-none",
          // Mobile: bottom center
          "bottom-20 left-4 right-4",
          // Desktop: top right
          "md:top-4 md:right-4 md:left-auto md:bottom-auto md:w-96"
        )}
      >
        <div className="flex flex-col gap-2">
          {toasts.map((toast) => {
            const style = toastStyles[toast.type];
            const Icon = style.icon;
            return (
              <div
                key={toast.id}
                className={cn(
                  "pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-lg border shadow-lg",
                  "animate-in slide-in-from-bottom-2 md:slide-in-from-right-2 fade-in duration-300",
                  style.bg
                )}
              >
                <Icon className="w-5 h-5 shrink-0 mt-0.5" />
                <p className="flex-1 text-sm font-medium">{toast.message}</p>
                <button
                  onClick={() => removeToast(toast.id)}
                  className="shrink-0 p-1 -m-1 hover:opacity-70 transition-opacity"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </ToastContext.Provider>
  );
}

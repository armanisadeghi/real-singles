"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface AdminPageHeaderProps {
  title: string;
  subtitle?: string;
  /** Show back button - uses router.back() by default */
  showBack?: boolean;
  /** Custom back URL - if not provided, uses router.back() */
  backHref?: string;
  /** Action buttons or other content */
  children?: React.ReactNode;
  /** Whether to show as a hero section with gradient */
  variant?: "default" | "hero";
  /** Icon to show in hero variant */
  icon?: LucideIcon;
  /** Icon gradient colors for hero variant */
  iconGradient?: string;
  /** Additional stats to show in hero */
  stat?: {
    value: string | number;
    label: string;
  };
}

export function AdminPageHeader({
  title,
  subtitle,
  showBack = false,
  backHref,
  children,
  variant = "default",
  icon: Icon,
  iconGradient = "from-blue-500 to-blue-600",
  stat,
}: AdminPageHeaderProps) {
  const router = useRouter();

  const handleBack = () => {
    if (backHref) {
      router.push(backHref);
    } else {
      router.back();
    }
  };

  if (variant === "hero") {
    return (
      <header
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 sm:p-8
          opacity-100 translate-y-0
          [transition:opacity_400ms_ease-out,transform_400ms_ease-out]
          [@starting-style]:opacity-0 [@starting-style]:translate-y-4"
      >
        {/* Decorative elements */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />
        <div className="absolute top-0 right-0 w-72 h-72 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
        
        <div className="relative flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            {showBack && (
              <button
                onClick={handleBack}
                className="mt-1 p-2 -ml-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                aria-label="Go back"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <div>
              <h1 className="text-[clamp(1.5rem,2vw+0.5rem,2rem)] font-semibold text-white mb-1">
                {title}
              </h1>
              {subtitle && (
                <p className="text-slate-400 text-sm max-w-lg">{subtitle}</p>
              )}
              {children && (
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  {children}
                </div>
              )}
            </div>
          </div>
          
          {(stat || Icon) && (
            <div className="hidden sm:flex items-center gap-3">
              {stat && (
                <div className="text-right">
                  <p className="text-2xl font-bold text-white">{stat.value}</p>
                  <p className="text-sm text-slate-400">{stat.label}</p>
                </div>
              )}
              {Icon && (
                <div className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center shadow-lg bg-gradient-to-br",
                  iconGradient
                )}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              )}
            </div>
          )}
        </div>
      </header>
    );
  }

  // Default variant
  return (
    <div
      className="flex flex-col sm:flex-row sm:items-center justify-between gap-4
        opacity-100 translate-y-0
        [transition:opacity_300ms_ease-out,transform_300ms_ease-out]
        [@starting-style]:opacity-0 [@starting-style]:translate-y-2"
    >
      <div className="flex items-center gap-3">
        {showBack && (
          <button
            onClick={handleBack}
            className="p-2 -ml-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          {subtitle && (
            <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>
          )}
        </div>
      </div>
      
      {children && (
        <div className="flex flex-wrap items-center gap-2">{children}</div>
      )}
    </div>
  );
}

// Styled button components for consistent action buttons
interface AdminButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "success" | "warning";
  size?: "sm" | "md";
  icon?: LucideIcon;
  loading?: boolean;
  children: React.ReactNode;
}

export function AdminButton({
  variant = "primary",
  size = "md",
  icon: Icon,
  loading,
  children,
  className,
  disabled,
  ...props
}: AdminButtonProps) {
  const variantClasses = {
    primary: "bg-blue-600 text-white hover:bg-blue-700 shadow-sm",
    secondary: "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50",
    danger: "bg-red-50 text-red-700 border border-red-200 hover:bg-red-100",
    success: "bg-green-50 text-green-700 border border-green-200 hover:bg-green-100",
    warning: "bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100",
  };

  const sizeClasses = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-sm",
  };

  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-colors",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : Icon ? (
        <Icon className="w-4 h-4" />
      ) : null}
      {children}
    </button>
  );
}

// Link styled as button
interface AdminLinkButtonProps {
  href: string;
  variant?: "primary" | "secondary" | "danger" | "success" | "warning";
  size?: "sm" | "md";
  icon?: LucideIcon;
  children: React.ReactNode;
  className?: string;
}

export function AdminLinkButton({
  href,
  variant = "primary",
  size = "md",
  icon: Icon,
  children,
  className,
}: AdminLinkButtonProps) {
  const variantClasses = {
    primary: "bg-blue-600 text-white hover:bg-blue-700 shadow-sm",
    secondary: "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50",
    danger: "bg-red-50 text-red-700 border border-red-200 hover:bg-red-100",
    success: "bg-green-50 text-green-700 border border-green-200 hover:bg-green-100",
    warning: "bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100",
  };

  const sizeClasses = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-sm",
  };

  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-colors",
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
    >
      {Icon && <Icon className="w-4 h-4" />}
      {children}
    </Link>
  );
}

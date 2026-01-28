import Image from "next/image";
import { Quote } from "lucide-react";

interface TestimonialCardProps {
  quote: string;
  authorName: string;
  authorTitle?: string;
  authorImage?: string;
  variant?: "default" | "featured";
}

export function TestimonialCard({
  quote,
  authorName,
  authorTitle,
  authorImage,
  variant = "default",
}: TestimonialCardProps) {
  const initials = authorName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  if (variant === "featured") {
    return (
      <div className="bg-white rounded-2xl p-8 shadow-lg relative">
        <Quote className="absolute top-6 left-6 w-10 h-10 text-brand-primary/20" />
        
        <blockquote className="relative pt-8">
          <p className="text-lg text-gray-700 italic leading-relaxed">
            &quot;{quote}&quot;
          </p>
        </blockquote>
        
        <div className="mt-8 flex items-center gap-4">
          <div className="relative">
            {authorImage ? (
              <Image
                src={authorImage}
                alt={authorName}
                width={64}
                height={64}
                className="w-16 h-16 rounded-full object-cover border-4 border-brand-primary"
              />
            ) : (
              <div className="w-16 h-16 rounded-full border-4 border-brand-primary bg-gradient-to-br from-brand-primary to-brand-secondary flex items-center justify-center">
                <span className="text-xl font-bold text-white">{initials}</span>
              </div>
            )}
          </div>
          <div>
            <p className="font-semibold text-foreground text-lg">{authorName}</p>
            {authorTitle && (
              <p className="text-brand-primary font-medium">{authorTitle}</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm">
      <Quote className="w-8 h-8 text-brand-primary/30 mb-4" />
      
      <blockquote>
        <p className="text-gray-600 leading-relaxed">
          &quot;{quote}&quot;
        </p>
      </blockquote>
      
      <div className="mt-6 flex items-center gap-3">
        {authorImage ? (
          <Image
            src={authorImage}
            alt={authorName}
            width={48}
            height={48}
            className="w-12 h-12 rounded-full object-cover border-2 border-brand-primary"
          />
        ) : (
          <div className="w-12 h-12 rounded-full border-2 border-brand-primary bg-gradient-to-br from-brand-primary to-brand-secondary flex items-center justify-center">
            <span className="text-sm font-semibold text-white">{initials}</span>
          </div>
        )}
        <div>
          <p className="font-semibold text-foreground">{authorName}</p>
          {authorTitle && (
            <p className="text-sm text-muted-foreground">{authorTitle}</p>
          )}
        </div>
      </div>
    </div>
  );
}

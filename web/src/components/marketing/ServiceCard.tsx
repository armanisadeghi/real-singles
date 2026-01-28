import Image from "next/image";
import Link from "next/link";
import { ArrowRight, LucideIcon } from "lucide-react";

interface ServiceCardProps {
  title: string;
  description: string;
  icon?: string;
  IconComponent?: LucideIcon;
  href?: string;
  variant?: "default" | "compact";
}

export function ServiceCard({
  title,
  description,
  icon,
  IconComponent,
  href,
  variant = "default",
}: ServiceCardProps) {
  const iconElement = (
    <>
      {icon ? (
        <Image src={icon} alt="" width={variant === "compact" ? 28 : 32} height={variant === "compact" ? 28 : 32} />
      ) : IconComponent ? (
        <IconComponent className={variant === "compact" ? "w-6 h-6 text-brand-primary" : "w-7 h-7 text-brand-primary"} />
      ) : null}
    </>
  );

  if (variant === "compact") {
    const compactContent = (
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-xl bg-brand-primary/10 flex items-center justify-center flex-shrink-0">
          {iconElement}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-foreground group-hover:text-brand-primary transition-colors">
            {title}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
            {description}
          </p>
        </div>
      </div>
    );

    if (href) {
      return (
        <Link href={href} className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow group block">
          {compactContent}
        </Link>
      );
    }

    return (
      <div className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow group">
        {compactContent}
      </div>
    );
  }

  const defaultContent = (
    <>
      <div className="w-14 h-14 rounded-xl bg-brand-primary/10 flex items-center justify-center mb-6">
        {iconElement}
      </div>
      
      <h3 className="text-xl font-semibold text-foreground group-hover:text-brand-primary transition-colors">
        {title}
      </h3>
      
      <p className="mt-3 text-muted-foreground leading-relaxed">
        {description}
      </p>
      
      {href && (
        <div className="mt-4 flex items-center gap-1 text-brand-primary font-medium text-sm opacity-0 group-hover:opacity-100 transition-opacity">
          Learn more
          <ArrowRight className="w-4 h-4" />
        </div>
      )}
    </>
  );

  if (href) {
    return (
      <Link href={href} className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow group block">
        {defaultContent}
      </Link>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow group">
      {defaultContent}
    </div>
  );
}

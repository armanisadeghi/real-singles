import Image from "next/image";

interface PageHeroProps {
  title: string;
  subtitle?: string;
  backgroundImage?: string;
  imagePosition?: string; // e.g., "center top", "center 30%", "center bottom"
  backgroundColor?: "beige" | "dark" | "white";
  children?: React.ReactNode;
}

export function PageHero({
  title,
  subtitle,
  backgroundImage,
  imagePosition = "center",
  backgroundColor = "beige",
  children,
}: PageHeroProps) {
  const bgColors = {
    beige: "bg-[#F6EDE1]",
    dark: "bg-gray-900",
    white: "bg-white",
  };

  const textColors = {
    beige: "text-foreground",
    dark: "text-white",
    white: "text-foreground",
  };

  return (
    <section className={`relative ${bgColors[backgroundColor]} py-40 sm:py-56 overflow-hidden`}>
      {backgroundImage && (
        <>
          <Image
            src={backgroundImage}
            alt=""
            fill
            className="object-cover"
            style={{ objectPosition: imagePosition }}
            priority
          />
          <div className="absolute inset-0 bg-black/40" />
        </>
      )}
      
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto">
          <h1 className={`text-4xl sm:text-5xl font-bold ${backgroundImage ? "text-white" : textColors[backgroundColor]}`}>
            <span className={backgroundImage ? "text-white" : "text-brand-primary"}>{title}</span>
          </h1>
          {subtitle && (
            <p className={`mt-6 text-xl ${backgroundImage ? "text-white/90" : "text-gray-600"}`}>
              {subtitle}
            </p>
          )}
          {children}
        </div>
      </div>
    </section>
  );
}

import Image from "next/image";
import Link from "next/link";
import {
  CheckCircle,
  Sparkles,
  Video,
  Shield,
  Users,
  CalendarHeart,
  MessageCircle,
  Star,
  Award,
  Heart,
  UserCheck,
  Gift,
  Zap,
} from "lucide-react";

const mainFeatures = [
  {
    name: "Verified Video Profiles",
    description:
      "Every member creates a video introduction that showcases their personality. Combined with our verification process, you always know you're talking to a real person.",
    icon: "/images/icons/Verification-video-profile.svg",
    benefits: [
      "See personality before matching",
      "No more catfishing",
      "Build trust faster",
    ],
  },
  {
    name: "Reference Checks",
    description:
      "Our unique reference system lets friends and family vouch for members, giving you extra confidence in who you're connecting with.",
    icon: "/images/icons/Reference-Checks.svg",
    benefits: [
      "Peer-validated profiles",
      "Know their reputation",
      "Extra layer of trust",
    ],
  },
  {
    name: "Virtual Speed Dating",
    description:
      "Join our virtual speed dating events from anywhere. Meet multiple compatible singles in one evening without leaving home.",
    icon: "/images/icons/Virtual-speed-date.svg",
    benefits: [
      "Meet from anywhere",
      "Quick, fun format",
      "Facilitated by hosts",
    ],
  },
  {
    name: "In-Person Events",
    description:
      "Skip the endless messaging. Our curated events bring singles together in real life for meaningful connections.",
    icon: "/images/icons/ATTEND-EVENTS.svg",
    benefits: [
      "Real-life chemistry",
      "Organized activities",
      "Safe, vetted venues",
    ],
  },
  {
    name: "Wingman Feature",
    description:
      "Let a trusted friend help you navigate the dating world. Our Wingman feature allows friends to suggest matches and offer advice.",
    icon: "/images/icons/Wingman.svg",
    benefits: [
      "Get a second opinion",
      "Friends can suggest matches",
      "Team effort approach",
    ],
  },
  {
    name: "Safety First",
    description:
      "Built-in safety features including video chat before meeting, location sharing, and emergency contacts keep you protected.",
    icon: "/images/icons/First-Date-Safety.svg",
    benefits: [
      "Video chat first",
      "Share your location",
      "Emergency contacts",
    ],
  },
];

const additionalFeatures = [
  {
    name: "Smart Matching",
    description: "Our algorithm learns your preferences to show you the most compatible matches.",
    icon: Zap,
  },
  {
    name: "Community Groups",
    description: "Join interest-based groups to meet singles who share your passions.",
    icon: Users,
  },
  {
    name: "Coaching Resources",
    description: "Access dating tips, relationship advice, and self-improvement content.",
    icon: Award,
  },
  {
    name: "Rewards Program",
    description: "Earn points for engagement and redeem them for premium features.",
    icon: Gift,
  },
  {
    name: "Reviews & Ratings",
    description: "Leave and read honest reviews about dating experiences.",
    icon: Star,
  },
  {
    name: "Meet Virtually First",
    description: "Video call potential matches before meeting in person.",
    icon: Video,
  },
];

const comparisonFeatures = [
  { feature: "Verified Profiles", us: true, others: false },
  { feature: "Video Introductions", us: true, others: false },
  { feature: "Reference Checks", us: true, others: false },
  { feature: "In-Person Events", us: true, others: false },
  { feature: "Virtual Speed Dating", us: true, others: false },
  { feature: "Wingman Feature", us: true, others: false },
  { feature: "Safety Features", us: true, others: "Limited" },
  { feature: "Community Groups", us: true, others: "Limited" },
];

export default function FeaturesPage() {
  return (
    <>
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-brand-secondary to-brand-secondary-dark py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl sm:text-5xl font-bold text-white">
              Features That Make <span className="text-brand-primary">Real Connections</span> Happen
            </h1>
            <p className="mt-6 text-xl text-gray-300">
              Discover the tools and features designed to help you find authentic, meaningful relationships.
            </p>
            <Link
              href="/register"
              className="mt-8 inline-flex items-center justify-center gap-2 rounded-full bg-brand-primary px-8 py-4 text-lg font-semibold text-white shadow-lg hover:bg-brand-primary-dark transition-all hover:scale-105"
            >
              <Sparkles className="w-5 h-5" />
              Try It Free
            </Link>
          </div>
        </div>
      </section>

      {/* Main Features Section */}
      <section className="bg-white py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
              <span className="text-brand-primary">Powerful</span> Features
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Everything you need to find your perfect match.
            </p>
          </div>

          <div className="space-y-24">
            {mainFeatures.map((feature, index) => (
              <div
                key={feature.name}
                className={`grid lg:grid-cols-2 gap-12 items-center ${
                  index % 2 === 1 ? "lg:flex-row-reverse" : ""
                }`}
              >
                <div className={index % 2 === 1 ? "lg:order-2" : ""}>
                  <div className="w-16 h-16 rounded-2xl bg-brand-primary/10 flex items-center justify-center mb-6">
                    <Image
                      src={feature.icon}
                      alt=""
                      width={40}
                      height={40}
                    />
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-bold text-foreground">
                    {feature.name}
                  </h3>
                  <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                  <ul className="mt-6 space-y-3">
                    {feature.benefits.map((benefit) => (
                      <li key={benefit} className="flex items-center gap-3">
                        <CheckCircle className="w-5 h-5 text-brand-primary flex-shrink-0" />
                        <span className="text-foreground">{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className={`relative ${index % 2 === 1 ? "lg:order-1" : ""}`}>
                  <div className="aspect-[4/3] rounded-2xl bg-gradient-to-br from-brand-primary/10 to-brand-secondary/10 flex items-center justify-center">
                    <Image
                      src={feature.icon}
                      alt={feature.name}
                      width={200}
                      height={200}
                      className="opacity-50"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Additional Features Grid */}
      <section className="bg-muted py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
              And <span className="text-brand-primary">So Much More</span>
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Additional features to enhance your dating experience.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {additionalFeatures.map((feature) => (
              <div
                key={feature.name}
                className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="w-12 h-12 rounded-xl bg-brand-primary/10 flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-brand-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">
                  {feature.name}
                </h3>
                <p className="mt-2 text-muted-foreground text-sm">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison Section */}
      <section className="bg-white py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
              Why We're <span className="text-brand-primary">Different</span>
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              See how Real Singles compares to other dating apps.
            </p>
          </div>

          <div className="max-w-3xl mx-auto">
            <div className="bg-muted rounded-2xl overflow-hidden">
              <div className="grid grid-cols-3 bg-brand-secondary text-white font-semibold">
                <div className="p-4">Feature</div>
                <div className="p-4 text-center">Real Singles</div>
                <div className="p-4 text-center">Other Apps</div>
              </div>
              {comparisonFeatures.map((item, index) => (
                <div
                  key={item.feature}
                  className={`grid grid-cols-3 ${
                    index % 2 === 0 ? "bg-white" : "bg-muted"
                  }`}
                >
                  <div className="p-4 font-medium text-foreground">
                    {item.feature}
                  </div>
                  <div className="p-4 text-center">
                    {item.us === true ? (
                      <CheckCircle className="w-5 h-5 text-green-500 mx-auto" />
                    ) : (
                      <span className="text-muted-foreground">{item.us}</span>
                    )}
                  </div>
                  <div className="p-4 text-center">
                    {item.others === true ? (
                      <CheckCircle className="w-5 h-5 text-green-500 mx-auto" />
                    ) : item.others === false ? (
                      <span className="text-red-400">✕</span>
                    ) : (
                      <span className="text-muted-foreground text-sm">{item.others}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-brand-primary to-brand-primary-dark py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white">
            Ready to Experience Real Dating?
          </h2>
          <p className="mt-4 text-lg text-white/80 max-w-2xl mx-auto">
            Join thousands of singles who've found meaningful connections with our unique features.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/register"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-8 py-4 text-lg font-semibold text-brand-primary shadow-lg hover:bg-gray-100 transition-all hover:scale-105"
            >
              <Heart className="w-5 h-5" />
              Start For Free
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

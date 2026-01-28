import Image from "next/image";
import Link from "next/link";
import { PageHero, ServiceCard } from "@/components/marketing";
import {
  Search,
  Video,
  MapPin,
  Crown,
  Ticket,
  MonitorPlay,
  ArrowRight,
} from "lucide-react";

const membershipFeatures = [
  {
    title: "Access to Search",
    description:
      "With Search, users can unlock our exclusive member base and filter based on their unique tastes. Oh, and did we mention – send out 3 additional likes every single day.",
    icon: Search,
  },
  {
    title: "Video Profiles",
    description:
      "Tired of wondering if they really look like their profile pic? Video is a lot harder to airbrush and not only that– it's an opportunity to let your personality shine!",
    icon: Video,
  },
  {
    title: "Party Scout",
    description:
      "Some people are just better in person. Eliminate aimless bar-hopping and navigate your city more effectively. Party Scout shows when there are users nearby who meet your preferences– without compromising anyone's privacy.",
    icon: MapPin,
  },
  {
    title: "Premium Perks",
    description:
      "With Real Singles Membership, you'll skip the waitlist, see more profiles every day at happy hour, get access to a dating Concierge, enjoy additional profile customization, track and see your profile stats, and enjoy 2x-5x the match rate of non-subscribers.",
    icon: Crown,
  },
  {
    title: "Override the Algorithm",
    description:
      "Subscribers get Real Singles Tickets that let you override the algorithm – use them to Power Move a prospect to ensure you are first in their next Batch, or, use them to Boost your Profile and get seen by 3x the people you normally do.",
    icon: Ticket,
  },
  {
    title: "Video Chat",
    description:
      "Want to take chat flirtations to the next level or just do some more vetting before seeing them in person? Video Chat from our messages tab whenever convenient with your busy schedule.",
    icon: MonitorPlay,
  },
];

export default function MembershipPage() {
  return (
    <>
      {/* Hero Section */}
      <PageHero
        title="Membership"
        backgroundImage="/images/marketing/hero/membership-hero.webp"
      />

      {/* Why Join Section */}
      <section className="bg-white py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* App Screenshot */}
            <div className="flex justify-center lg:justify-end">
              <div className="relative w-full max-w-md">
                <Image
                  src="/images/marketing/app-screenshot.webp"
                  alt="RealSingles app interface showing profile matching"
                  width={400}
                  height={800}
                  className="w-full h-auto"
                  priority
                />
              </div>
            </div>
            
            {/* Text Content */}
            <div className="text-center lg:text-left">
              <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
                WHY JOIN <span className="text-brand-primary">RealSingles.dating?</span>
              </h2>
              <p className="mt-6 text-xl text-muted-foreground">
                If you&apos;re picky, busy, and don&apos;t like wasting time, Membership is for you. Become a Member and see increased speed, quantity, and quality of Matches.
              </p>
              <p className="mt-4 text-lg text-muted-foreground">
                Members support our mission to keep RealSingles a selective and high-quality community of motivated daters looking for meaningful long-term relationships. Is there a more important search in your entire life? We don&apos;t think so. Some things in life are important enough not to leave up to chance, and we believe stacking your odds of meeting The One is the best investment you can make in yourself.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-muted py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {membershipFeatures.map((feature) => (
              <ServiceCard
                key={feature.title}
                title={feature.title}
                description={feature.description}
                IconComponent={feature.icon}
              />
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-brand-primary to-brand-primary-dark py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white">
            Ready to Find Your Match?
          </h2>
          <p className="mt-4 text-lg text-white/90 max-w-2xl mx-auto">
            Join Real Singles today and unlock all premium features to find your perfect match faster.
          </p>
          <Link
            href="/register"
            className="mt-10 inline-flex items-center justify-center gap-2 rounded-full bg-white px-8 py-4 text-lg font-semibold text-brand-primary shadow-lg hover:bg-gray-100 transition-all hover:scale-105"
          >
            Get Started
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>
    </>
  );
}

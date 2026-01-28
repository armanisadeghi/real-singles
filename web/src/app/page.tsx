import Image from "next/image";
import Link from "next/link";
import {
  Shield,
  Video,
  CalendarHeart,
  Star,
  Award,
  Users,
  UserPlus,
  GraduationCap,
  Crown,
  Search,
  MonitorPlay,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { Header, Footer } from "@/components/layout";
import { ServiceCard } from "@/components/marketing";

// Services matching WordPress "Discover Our Unique Services" section
const services = [
  {
    title: "Verification & Video Profile",
    description:
      "To improve safety and combat fake profiles, RealSingles goes over and beyond to verify everyone's identity. We use facial recognition technology, video verification, selfie verification and confirming phone numbers to ensure that users are genuine.",
    icon: Shield,
    href: "/membership",
  },
  {
    title: "Events",
    description:
      "Are you tired of swiping and reading profiles? Our events offer a fresh alternative to just online searches. We hold events in many markets to provide you an opportunity to meet many quality singles in one night.",
    icon: CalendarHeart,
    href: "/events",
  },
  {
    title: "Virtual Speed Dating",
    description:
      "Are you a busy person that does not have time to keep swiping? Would you like to have a live 3 minute conversation with 5-7 potential matches? Once a week you have an opportunity to participate in a 30 minute live virtual speed dating session.",
    icon: Video,
    href: "/membership",
  },
  {
    title: "Rewards",
    description:
      "Real Singles is committed to authenticity and weeding out bad actors. We reward our members as they help us verify accounts and screen out fakes in our effort to build a safe community full of real prospects.",
    icon: Award,
    href: "/membership",
  },
  {
    title: "Reviews",
    description:
      "Wouldn't it be great to get a third party verification by someone that knows your match personally or have met them? Our Reviews offer just that. Write a brief review and get reward points!",
    icon: Star,
    href: "/membership",
  },
  {
    title: "Wingman",
    description:
      "On RealSingles we welcome non-singles to have a limited access account to play wingman for their friends. A wingman assists others to connect with and attract the best potential match, earning rewards for their efforts.",
    icon: UserPlus,
    href: "/community",
  },
  {
    title: "Coaching & Resources",
    description:
      "Dating in the current environment is not easy so we are here to help. Whether you are looking for resources to help improve your profile or you would like to work with a dating coach we got you covered.",
    icon: GraduationCap,
    href: "/matchmaking",
  },
  {
    title: "VIP Matchmakers",
    description:
      "Tired of swiping? We will feature professional matchmakers that you can hire for an additional fee and they will provide you with personalized matches based on your preferences. Stay tuned!",
    icon: Crown,
    href: "/matchmaking",
  },
];

// "Date. Intelligently" features
const intelligentFeatures = [
  {
    title: "Unlock our exclusive member base with Search",
    description:
      "We heard you. You want more control over what users you see and you want to see more of them. Say hello to our brand new Search feature. Take your search for love into your own hands by exploring our member base and filtering profiles based on your unique tastes.",
    icon: Search,
  },
  {
    title: "1:1 Video Chat: Your first step before a first date",
    description:
      "Convenient, cost effective and a safer way to date. Once you match, no need to swap phone numbers, just use our video calling to talk to each other. Click the video button once you agree on a time and fall in love or just enjoy meeting someone new.",
    icon: MonitorPlay,
  },
  {
    title: "Empowerment: Say goodbye to wondering if they look like their profile pictures",
    description:
      "Real Singles users can now add a 10-second video to their dating profile. Stand out from the rest of the pack by being in full-color and moving, get priority in our matching algorithm and increase your like rate.",
    icon: Sparkles,
  },
];

export default function HomePage() {
  return (
    <div className="min-h-dvh flex flex-col">
      <Header />
      <main className="flex-1 pt-[var(--header-height)]">
        {/* Hero Section */}
        <section className="relative bg-gradient-to-br from-[#F6EDE1] to-white py-20 sm:py-28 overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <Image
              src="/images/hero/couple-beach.jpg"
              alt=""
              fill
              className="object-cover"
              priority
            />
          </div>
          
          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="text-center lg:text-left">
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground leading-tight">
                  Find Your <span className="text-brand-primary">True Connection</span>
                </h1>
                <p className="mt-6 text-xl text-gray-600 max-w-xl mx-auto lg:mx-0">
                  Join Real Singles and discover genuine relationships in a supportive community of like-minded individuals.
                </p>
                <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                  <Link
                    href="/register"
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-brand-primary px-8 py-4 text-lg font-semibold text-white shadow-lg hover:bg-brand-primary-dark transition-all hover:scale-105"
                  >
                    Start Your Journey
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                </div>
              </div>
              
              <div className="relative hidden lg:block">
                <div className="relative aspect-[4/5] max-w-md mx-auto">
                  <Image
                    src="/images/app-mockup.png"
                    alt="Real Singles App"
                    fill
                    className="object-contain"
                    priority
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Discover Our Unique Services Section */}
        <section className="bg-white py-20 sm:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto">
              <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
                Discover Our <span className="text-brand-primary">Unique Services</span>
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Explore a variety of offerings designed to help you find love and build relationships within our supportive community.
              </p>
            </div>

            <div className="mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {services.map((service) => (
                <ServiceCard
                  key={service.title}
                  title={service.title}
                  description={service.description}
                  IconComponent={service.icon}
                  href={service.href}
                  variant="compact"
                />
              ))}
            </div>
          </div>
        </section>

        {/* Date. Intelligently Section */}
        <section className="bg-muted py-20 sm:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto">
              <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
                Date. <span className="text-brand-primary">Intelligently</span>
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                For those fatigued with the endless swiping, RealSingles offers members a curated &quot;Batch&quot; of potentials each day, rather than an unlimited stream of profiles. Combined with our Search feature, powerful matching algorithm and 1:1 video chatting, we like to think of ourselves as the most efficient dating platform on the market.
              </p>
            </div>

            <div className="mt-16 space-y-12">
              {intelligentFeatures.map((feature, index) => (
                <div
                  key={feature.title}
                  className={`flex flex-col ${
                    index % 2 === 1 ? "lg:flex-row-reverse" : "lg:flex-row"
                  } gap-8 lg:gap-16 items-center`}
                >
                  <div className="flex-1">
                    <div className="w-16 h-16 rounded-2xl bg-brand-primary/10 flex items-center justify-center mb-6">
                      <feature.icon className="w-8 h-8 text-brand-primary" />
                    </div>
                    <h3 className="text-2xl font-bold text-foreground">
                      {feature.title}
                    </h3>
                    <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                  <div className="flex-1">
                    <div className="aspect-video rounded-2xl bg-gradient-to-br from-brand-primary/20 to-brand-secondary/20 flex items-center justify-center">
                      <feature.icon className="w-24 h-24 text-brand-primary/30" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Text Me the App CTA Section */}
        <section className="bg-gradient-to-r from-brand-primary to-brand-primary-dark py-20 sm:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-white">
              ARE YOU IN?
            </h2>
            <p className="mt-4 text-xl text-white/90 max-w-2xl mx-auto">
              We know your time is valuable, so tell us your preferences and we&apos;ll handle the scouting for you. Get the app now.
            </p>
            
            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="https://apps.apple.com/app/real-singles/id6473915498"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-3 bg-white text-foreground hover:bg-gray-100 transition-colors rounded-xl px-6 py-4"
              >
                <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                </svg>
                <div className="text-left">
                  <p className="text-xs text-gray-500">Download on the</p>
                  <p className="text-base font-semibold">App Store</p>
                </div>
              </Link>
              
              <Link
                href="https://play.google.com/store/apps/details?id=com.realsingles.app"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-3 bg-white text-foreground hover:bg-gray-100 transition-colors rounded-xl px-6 py-4"
              >
                <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 01-.61-.92V2.734a1 1 0 01.609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.198l2.807 1.626a1 1 0 010 1.73l-2.808 1.626L15.206 12l2.492-2.491zM5.864 2.658L16.8 8.99l-2.302 2.302-8.634-8.634z"/>
                </svg>
                <div className="text-left">
                  <p className="text-xs text-gray-500">Get it on</p>
                  <p className="text-base font-semibold">Google Play</p>
                </div>
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

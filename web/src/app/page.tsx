import Image from "next/image";
import Link from "next/link";
import {
  Heart,
  Shield,
  Users,
  Video,
  CalendarHeart,
  Star,
  CheckCircle,
  ArrowRight,
  Sparkles,
  MessageCircle,
  UserCheck,
} from "lucide-react";
import { Header, Footer } from "@/components/layout";

const features = [
  {
    name: "Verified Profiles",
    description:
      "Every member goes through our verification process including video profiles and reference checks.",
    icon: "/images/icons/Verification-Badges.svg",
    iconFallback: UserCheck,
  },
  {
    name: "Video Profiles",
    description:
      "See who you're talking to with authentic video introductions. No more catfishing.",
    icon: "/images/icons/Verification-video-profile.svg",
    iconFallback: Video,
  },
  {
    name: "Real Community",
    description:
      "Join a supportive community of singles who are serious about finding meaningful connections.",
    icon: "/images/icons/Community.svg",
    iconFallback: Users,
  },
  {
    name: "Curated Events",
    description:
      "Meet singles in person at our exclusive events, from speed dating to social mixers.",
    icon: "/images/icons/Events.svg",
    iconFallback: CalendarHeart,
  },
  {
    name: "Virtual Speed Dating",
    description:
      "Can't make it in person? Join our virtual speed dating sessions from anywhere.",
    icon: "/images/icons/Virtual-speed-date.svg",
    iconFallback: MessageCircle,
  },
  {
    name: "Safety First",
    description:
      "Your safety is our priority with built-in safety features and community guidelines.",
    icon: "/images/icons/First-Date-Safety.svg",
    iconFallback: Shield,
  },
];

const howItWorks = [
  {
    step: "01",
    title: "Create Your Profile",
    description:
      "Sign up and build your authentic profile with photos, a video introduction, and details about yourself.",
  },
  {
    step: "02",
    title: "Get Verified",
    description:
      "Complete our verification process to show you're a real person serious about dating.",
  },
  {
    step: "03",
    title: "Discover Matches",
    description:
      "Browse verified profiles and find compatible matches based on your preferences and interests.",
  },
  {
    step: "04",
    title: "Connect & Meet",
    description:
      "Start meaningful conversations, attend events, and meet your matches in person.",
  },
];

const testimonials = [
  {
    content:
      "I was tired of the superficial dating apps. Real Singles actually focuses on genuine connections. I met my partner at one of their events!",
    author: "Sarah M.",
    role: "Engaged after 8 months",
    rating: 5,
  },
  {
    content:
      "The video profiles feature is a game changer. You can tell so much about someone's personality before you even message them.",
    author: "James K.",
    role: "In a relationship",
    rating: 5,
  },
  {
    content:
      "The verification process gave me confidence that I was talking to real people. It's worth the extra step for peace of mind.",
    author: "Michelle T.",
    role: "Dating for 6 months",
    rating: 5,
  },
];

const stats = [
  { value: "50K+", label: "Active Members" },
  { value: "10K+", label: "Successful Matches" },
  { value: "500+", label: "Events Hosted" },
  { value: "98%", label: "Verified Profiles" },
];

export default function HomePage() {
  return (
    <div className="min-h-dvh flex flex-col">
      <Header />
      <main className="flex-1 pt-[var(--header-height)]">
        {/* Hero Section */}
        <section className="relative bg-gradient-to-br from-[#F6EDE1] to-white overflow-hidden">
          <div className="absolute inset-0 bg-[url('/images/hero/homepage-hero.jpg')] bg-cover bg-center opacity-20" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#F6EDE1] via-[#F6EDE1]/90 to-transparent" />
          
          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-24 sm:py-32 lg:py-40">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 bg-brand-primary/10 rounded-full px-4 py-2 mb-6">
                <Sparkles className="w-4 h-4 text-brand-primary" />
                <span className="text-sm text-brand-primary font-medium">
                  Real People. Real Connections.
                </span>
              </div>
              
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground tracking-tight">
                Find Your{" "}
                <span className="text-brand-primary">Real</span>{" "}
                Connection
              </h1>
              
              <p className="mt-6 text-lg sm:text-xl text-gray-600 max-w-lg">
                Join the dating community that prioritizes authenticity. With verified profiles, video introductions, and curated events, find someone who's genuinely looking for what you are.
              </p>
              
              <div className="mt-10 flex flex-col sm:flex-row gap-4">
                <Link
                  href="/register"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-brand-primary px-8 py-4 text-lg font-semibold text-white shadow-lg hover:bg-brand-primary-dark transition-all hover:scale-105"
                >
                  <Heart className="w-5 h-5" />
                  Start Your Journey
                </Link>
                <Link
                  href="/features"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-brand-secondary px-8 py-4 text-lg font-semibold text-white hover:bg-brand-secondary-dark transition-colors"
                >
                  Learn More
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </div>
              
              <div className="mt-12 flex items-center gap-6">
                <div className="flex -space-x-3">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="w-10 h-10 rounded-full border-2 border-white bg-gradient-to-br from-brand-primary to-brand-secondary"
                    />
                  ))}
                </div>
                <div>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star key={i} className="w-4 h-4 text-yellow-500" fill="currentColor" />
                    ))}
                  </div>
                  <p className="text-sm text-gray-600">
                    Trusted by 50,000+ singles
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="bg-white border-b border-border">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
              {stats.map((stat) => (
                <div key={stat.label} className="text-center">
                  <p className="text-3xl sm:text-4xl font-bold text-brand-primary">
                    {stat.value}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="bg-muted py-20 sm:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto">
              <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
                Why Choose <span className="text-brand-primary">Real Singles</span>?
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                We're not just another dating app. We're a community built on authenticity, safety, and real human connections.
              </p>
            </div>

            <div className="mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {features.map((feature) => (
                <div
                  key={feature.name}
                  className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="w-14 h-14 rounded-xl bg-brand-primary/10 flex items-center justify-center mb-6">
                    <Image
                      src={feature.icon}
                      alt=""
                      width={32}
                      height={32}
                      className="text-brand-primary"
                    />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground">
                    {feature.name}
                  </h3>
                  <p className="mt-3 text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="bg-white py-20 sm:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto">
              <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
                How It <span className="text-brand-primary">Works</span>
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Getting started is easy. Here's how you can find your real connection in four simple steps.
              </p>
            </div>

            <div className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {howItWorks.map((step, index) => (
                <div key={step.step} className="relative">
                  {index < howItWorks.length - 1 && (
                    <div className="hidden lg:block absolute top-8 left-full w-full h-0.5 bg-gradient-to-r from-brand-primary to-transparent -translate-x-4" />
                  )}
                  <div className="text-5xl font-bold text-brand-primary/20 mb-4">
                    {step.step}
                  </div>
                  <h3 className="text-xl font-semibold text-foreground">
                    {step.title}
                  </h3>
                  <p className="mt-3 text-muted-foreground">
                    {step.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="bg-[#F6EDE1] py-20 sm:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto">
              <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
                Real <span className="text-brand-primary">Success Stories</span>
              </h2>
              <p className="mt-4 text-lg text-gray-600">
                Thousands of singles have found meaningful connections through Real Singles.
              </p>
            </div>

            <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
              {testimonials.map((testimonial, index) => (
                <div
                  key={index}
                  className="bg-white rounded-2xl p-8 shadow-sm"
                >
                  <div className="flex gap-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 text-yellow-500" fill="currentColor" />
                    ))}
                  </div>
                  <p className="text-gray-600 leading-relaxed">
                    &quot;{testimonial.content}&quot;
                  </p>
                  <div className="mt-6 flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full border-4 border-brand-primary bg-gradient-to-br from-brand-primary to-brand-secondary flex items-center justify-center">
                      <span className="text-white font-semibold">
                        {testimonial.author.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">{testimonial.author}</p>
                      <p className="text-sm text-gray-500">{testimonial.role}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Events Preview Section */}
        <section className="bg-white py-20 sm:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
                  Meet Singles at <span className="text-brand-primary">Exclusive Events</span>
                </h2>
                <p className="mt-4 text-lg text-muted-foreground">
                  Skip the endless swiping. Our curated events bring singles together in real life. From speed dating nights to social mixers, find your connection in person.
                </p>
                
                <ul className="mt-8 space-y-4">
                  {[
                    "Speed Dating Events",
                    "Social Mixers & Parties",
                    "Interest-Based Meetups",
                    "Virtual Speed Dating",
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-brand-primary flex-shrink-0" />
                      <span className="text-foreground">{item}</span>
                    </li>
                  ))}
                </ul>
                
                <Link
                  href="/events"
                  className="mt-8 inline-flex items-center gap-2 text-brand-primary font-semibold hover:underline"
                >
                  View Upcoming Events
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
              
              <div className="relative">
                <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-muted">
                  <Image
                    src="/images/events-party.jpg"
                    alt="Singles event"
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="absolute -bottom-6 -left-6 bg-white rounded-xl shadow-lg p-4 max-w-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-brand-primary/10 flex items-center justify-center">
                      <CalendarHeart className="w-6 h-6 text-brand-primary" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">Next Event</p>
                      <p className="text-sm text-muted-foreground">Saturday Speed Dating</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-gradient-to-r from-brand-primary to-brand-primary-dark py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-white">
              Ready to Find Your Real Connection?
            </h2>
            <p className="mt-4 text-lg text-white/80 max-w-2xl mx-auto">
              Join thousands of singles who have found meaningful relationships through Real Singles. Your perfect match is waiting.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/register"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-8 py-4 text-lg font-semibold text-brand-primary shadow-lg hover:bg-gray-100 transition-all hover:scale-105"
              >
                <Sparkles className="w-5 h-5" />
                Create Free Account
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-white px-8 py-4 text-lg font-semibold text-white hover:bg-white/10 transition-colors"
              >
                Contact Us
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

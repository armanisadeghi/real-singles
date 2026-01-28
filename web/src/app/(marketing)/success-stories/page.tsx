import Link from "next/link";
import { PageHero, ContactForm, ServiceCard } from "@/components/marketing";
import {
  Search,
  MonitorPlay,
  Video,
  ArrowRight,
} from "lucide-react";

const features = [
  {
    title: "Unlock our exclusive member base with Search",
    description:
      "We heard you. You want more control over what users you see and you want to see more of them. Say hello to our brand new Search feature. Take your search for love into your own hands by exploring our member base and filtering profiles based on your unique tastes.",
    icon: Search,
  },
  {
    title: "1:1 Video Chat: Your first step before a first date",
    description:
      "Convenient, cost effective and a safer way to date. Once you match, no need to swap phone numbers, just use our video calling to talk to each other. Click the video button once you agree on a time and –voila– fall in love or just enjoy meeting someone new. Your call.",
    icon: MonitorPlay,
  },
  {
    title: "Say goodbye to wondering if they look like their profile pictures",
    description:
      "Real Singles users can now add a 10-second video to their dating profile. Stand out from the rest of the pack by being in full-color and moving, get priority in our matching algorithm and increase your like rate – video is in!",
    icon: Video,
  },
];

export default function SuccessStoriesPage() {
  return (
    <>
      {/* Hero Section */}
      <PageHero
        title="Success Stories"
        backgroundColor="beige"
      />

      {/* Intro Section */}
      <section className="bg-white py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
              #REALSINGLES <span className="text-brand-primary">SUCCESS STORIES</span>
            </h2>
            <p className="mt-6 text-xl text-muted-foreground">
              RealSingles empowers and rewards members to assist other members to find their perfect match.
            </p>
            <p className="mt-4 text-lg text-muted-foreground">
              Discover why members choose RealSingles to find Real Love!
            </p>
          </div>

          <div className="mt-12 text-center">
            <Link
              href="https://apps.apple.com/app/real-singles/id6473915498"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-brand-primary px-8 py-4 text-lg font-semibold text-white shadow-lg hover:bg-brand-primary-dark transition-all hover:scale-105"
            >
              Download RealSingles
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-muted py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="space-y-16">
            {features.map((feature, index) => (
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

      {/* Never Settle Section */}
      <section className="bg-gradient-to-r from-brand-primary to-brand-primary-dark py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white">
            NEVER SETTLE
          </h2>
          <p className="mt-4 text-lg text-white/90 max-w-2xl mx-auto">
            You can&apos;t find the right one if you settle for the wrong one. Get the app now.
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

      {/* Contact Form Section */}
      <section className="bg-white py-20 sm:py-28">
        <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground">
              Contact <span className="text-brand-primary">Us</span>
            </h2>
          </div>
          <div className="bg-muted rounded-2xl p-8">
            <ContactForm />
          </div>
        </div>
      </section>
    </>
  );
}

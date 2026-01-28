import Link from "next/link";
import { PageHero, ContactForm } from "@/components/marketing";
import {
  Download,
  Users,
  CalendarHeart,
  UserPlus,
  ArrowRight,
} from "lucide-react";

const communityFeatures = [
  {
    title: "Download RealSingles",
    description:
      "Get started by downloading our app on iOS or Android. Create your profile and join our thriving community of singles.",
    icon: Download,
  },
  {
    title: "JOIN GROUPS",
    description:
      "Less into stiff 1:1 coffee dates, and more into meeting socially when you're doing your thing? Whatever your hobbies are, you can participate in local and global Groups to chat with others interested in the same things from live music and comedy to books and baking. You can also see if any of your matches are in these groups. Wish there was a group for Triathletes in your city, but not seeing it on the list? League members can create their own local groups.",
    icon: Users,
  },
  {
    title: "ATTEND EVENTS",
    description:
      "Travel a lot for work, but still want to be social when you're visiting other cities? Or are you looking for a fun date idea or weekend out with the girls? We can help you find events in your city or any of our live cities endorsed by The League or created by League members. And you can chat with those attending in the app– including your matches! League users can also create events and invite groups to attend.",
    icon: CalendarHeart,
  },
  {
    title: "MAKE FRIENDS",
    description:
      "Starting to connect with that guy in the Skiiers & Snowboarders group? You can add him or anyone else as a friend by clicking on their avatar in an event or group chat. Maybe it will turn into a carpool to Heavenly on the weekend. Maybe you'll become ski partners and life-long friends or maybe it will turn into the two of you teaching your kids how to ski one day…!",
    icon: UserPlus,
  },
];

export default function CommunityPage() {
  return (
    <>
      {/* Hero Section */}
      <PageHero
        title="Community"
        backgroundImage="/images/marketing/hero/community-hero.jpg"
      />

      {/* Intro Section */}
      <section className="bg-white py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
              Get offline & <span className="text-brand-primary">meet in the wild</span>
            </h2>
            <p className="mt-6 text-xl text-muted-foreground">
              Serendipity can still be a thing with features to meet up IRL and be more social in your community.
            </p>
          </div>

          <div className="mt-12 text-center">
            <Link
              href="https://apps.apple.com/app/real-singles/id6473915498"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-brand-primary px-8 py-4 text-lg font-semibold text-white shadow-lg hover:bg-brand-primary-dark transition-all hover:scale-105"
            >
              <Download className="w-5 h-5" />
              Download RealSingles
            </Link>
          </div>
        </div>
      </section>

      {/* Description Section */}
      <section className="bg-muted py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <p className="text-lg text-muted-foreground text-center leading-relaxed">
            Are you looking to connect, network, or just be social with like-minded people? Real Singles has interest-based community groups and promotes local events. While Real Singles is known for our killer singles scene, we also have a thriving social community to help you meet new people and explore your city. Discover local events endorsed by Real Singles or created by Real Singles partners and members. Join global groups like &apos;The Real Singles Angel Investors&apos; or local groups like &quot;London Entrepreneurs&quot;, &quot;NYC Runners&quot; or &quot;LA Improv Peeps&quot;. If you are single, the good news is we&apos;ll show you which of your matches are also interested in those things.
          </p>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-white py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="space-y-16">
            {communityFeatures.map((feature, index) => (
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

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-brand-primary to-brand-primary-dark py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white">
            LET&apos;S GET SOCIAL
          </h2>
          <p className="mt-4 text-lg text-white/90 max-w-2xl mx-auto">
            Your new surf buddy or hiking partner could be just a chat away. Get the app now.
          </p>
          <Link
            href="/register"
            className="mt-10 inline-flex items-center justify-center gap-2 rounded-full bg-white px-8 py-4 text-lg font-semibold text-brand-primary shadow-lg hover:bg-gray-100 transition-all hover:scale-105"
          >
            Join the Community
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

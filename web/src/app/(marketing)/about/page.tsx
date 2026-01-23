import Image from "next/image";
import Link from "next/link";
import {
  Heart,
  Shield,
  Users,
  Target,
  Sparkles,
  Award,
  CheckCircle,
} from "lucide-react";

const values = [
  {
    name: "Authenticity",
    description:
      "We believe in real connections between real people. Every profile on our platform is verified to ensure genuine interactions.",
    icon: "/images/icons/Core-Values.svg",
  },
  {
    name: "Community",
    description:
      "More than a dating app, we're a supportive community of singles who uplift and encourage each other on the journey to love.",
    icon: "/images/icons/Community.svg",
  },
  {
    name: "Empowerment",
    description:
      "We empower our members with resources, coaching, and events to help them become the best version of themselves.",
    icon: "/images/icons/Empowerment.svg",
  },
  {
    name: "Safety",
    description:
      "Your safety is our top priority. We've built comprehensive safety features and guidelines to protect our community.",
    icon: "/images/icons/First-Date-Safety.svg",
  },
];

const team = [
  {
    name: "Sarah Johnson",
    role: "Founder & CEO",
    bio: "Former relationship coach with 15 years of experience helping singles find love.",
  },
  {
    name: "Michael Chen",
    role: "Head of Community",
    bio: "Event planner extraordinaire who has organized over 500 singles events.",
  },
  {
    name: "Dr. Emily Rodriguez",
    role: "Chief Psychology Officer",
    bio: "PhD in relationship psychology, specializing in modern dating dynamics.",
  },
];

export default function AboutPage() {
  return (
    <>
      {/* Hero Section */}
      <section className="bg-[#F6EDE1] py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl sm:text-5xl font-bold text-foreground">
              About <span className="text-brand-primary">Real Singles</span>
            </h1>
            <p className="mt-6 text-xl text-gray-600">
              We started Real Singles because we believe everyone deserves to find genuine love. Our mission is to create a space where real connections can flourish.
            </p>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="bg-white py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-brand-primary/10 rounded-full px-4 py-2 mb-6">
                <Target className="w-4 h-4 text-brand-primary" />
                <span className="text-sm text-brand-primary font-medium">
                  Our Mission
                </span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
                Bringing <span className="text-brand-primary">Real People</span> Together
              </h2>
              <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
                In a world of endless swiping and superficial connections, we created Real Singles to be different. We believe that meaningful relationships start with authenticity.
              </p>
              <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
                Our platform combines verified profiles, video introductions, and in-person events to help singles find real connections. We're not about the numbers – we're about the quality of connections you make.
              </p>
              <div className="mt-8 flex items-center gap-4">
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div
                      key={i}
                      className="w-10 h-10 rounded-full border-2 border-white bg-gradient-to-br from-brand-primary to-brand-secondary"
                    />
                  ))}
                </div>
                <p className="text-sm text-muted-foreground">
                  <span className="font-semibold text-foreground">50,000+</span> singles trust us
                </p>
              </div>
            </div>
            <div className="relative">
              <div className="aspect-square rounded-2xl overflow-hidden bg-muted">
                <Image
                  src="/images/hero/couple-celebration.jpg"
                  alt="Happy couple"
                  fill
                  className="object-cover"
                />
              </div>
              <div className="absolute -bottom-6 -right-6 bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-full bg-brand-primary/10 flex items-center justify-center">
                    <Heart className="w-7 h-7 text-brand-primary" fill="currentColor" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-brand-primary">10K+</p>
                    <p className="text-sm text-muted-foreground">Successful matches</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="bg-muted py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
              Our <span className="text-brand-primary">Core Values</span>
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Everything we do is guided by these principles that put our community first.
            </p>
          </div>

          <div className="mt-16 grid grid-cols-1 sm:grid-cols-2 gap-8">
            {values.map((value) => (
              <div
                key={value.name}
                className="bg-white rounded-2xl p-8 shadow-sm"
              >
                <div className="w-14 h-14 rounded-xl bg-brand-primary/10 flex items-center justify-center mb-6">
                  <Image
                    src={value.icon}
                    alt=""
                    width={32}
                    height={32}
                  />
                </div>
                <h3 className="text-xl font-semibold text-foreground">
                  {value.name}
                </h3>
                <p className="mt-3 text-muted-foreground leading-relaxed">
                  {value.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Story Section */}
      <section className="bg-white py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
              Our <span className="text-brand-primary">Story</span>
            </h2>
            <div className="mt-8 space-y-6 text-lg text-muted-foreground text-left">
              <p>
                Real Singles was born out of frustration with the modern dating landscape. Our founder, Sarah, spent years as a relationship coach watching her clients struggle with dating apps that prioritized quantity over quality.
              </p>
              <p>
                "I kept hearing the same complaints," Sarah recalls. "People were tired of fake profiles, ghosting, and surface-level connections. They wanted something real."
              </p>
              <p>
                In 2020, Sarah assembled a team of relationship experts, community builders, and technology innovators to create a different kind of dating platform. One where verification was mandatory, video profiles were standard, and real-life events brought people together.
              </p>
              <p>
                Today, Real Singles has helped thousands of couples find each other. But we're not stopping there – we continue to innovate and improve our platform to serve our community better.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="bg-[#F6EDE1] py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
              Meet Our <span className="text-brand-primary">Team</span>
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Passionate people dedicated to helping you find love.
            </p>
          </div>

          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
            {team.map((member) => (
              <div
                key={member.name}
                className="bg-white rounded-2xl p-8 text-center shadow-sm"
              >
                <div className="w-24 h-24 rounded-full border-4 border-brand-primary bg-gradient-to-br from-brand-primary to-brand-secondary mx-auto flex items-center justify-center">
                  <span className="text-3xl font-bold text-white">
                    {member.name.split(' ').map(n => n[0]).join('')}
                  </span>
                </div>
                <h3 className="mt-6 text-xl font-semibold text-foreground">
                  {member.name}
                </h3>
                <p className="text-brand-primary font-medium">{member.role}</p>
                <p className="mt-4 text-gray-600 text-sm">{member.bio}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-white py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
            Ready to Join Our Community?
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            Become part of a community that values real connections.
          </p>
          <Link
            href="/register"
            className="mt-8 inline-flex items-center justify-center gap-2 rounded-full bg-brand-primary px-8 py-4 text-lg font-semibold text-white shadow-lg hover:bg-brand-primary-dark transition-all hover:scale-105"
          >
            <Sparkles className="w-5 h-5" />
            Get Started Free
          </Link>
        </div>
      </section>
    </>
  );
}

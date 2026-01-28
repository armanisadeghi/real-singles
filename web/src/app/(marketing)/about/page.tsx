import { PageHero } from "@/components/marketing";
import { Heart, Users, Zap } from "lucide-react";

const coreValues = [
  {
    name: "Connection",
    description:
      "We champion authentic interactions that help our members form deep and meaningful relationships with others seeking love and companionship.",
    icon: Heart,
  },
  {
    name: "Community",
    description:
      "Our platform encourages engagement among members, promoting a sense of belonging and camaraderie that transforms the dating experience.",
    icon: Users,
  },
  {
    name: "Empowerment",
    description:
      "We provide resources and support, empowering our members to take charge of their dating journeys and promote personal growth and well-being.",
    icon: Zap,
  },
];

export default function AboutPage() {
  return (
    <>
      {/* Hero Section */}
      <PageHero
        title="About Us"
        backgroundImage="/images/marketing/hero/about-hero.jpg"
        imagePosition="center 20%"
      />

      {/* Our Journey Section */}
      <section className="bg-white py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground text-center">
              Our Journey to <span className="text-brand-primary">Real Connections</span>
            </h2>
            
            <div className="mt-8 space-y-6 text-lg text-muted-foreground">
              <p>
                Real Singles is dedicated to helping individuals embark on their journey toward meaningful relationships. We combine technology with personalized support, creating an interactive community where members thrive together.
              </p>
              <p>
                Founded out of a desire to change the dating landscape, Real Singles began as a small initiative aimed at addressing the common struggles of finding true love online.
              </p>
              <p>
                We have proudly served thousands of singles from diverse backgrounds, guiding them toward building fulfilling relationships and lasting connections.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Core Values Section */}
      <section className="bg-muted py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
              Core <span className="text-brand-primary">Values</span>
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              At Real Singles, we believe in fostering a supportive community built on trust, respect, and empowerment.
            </p>
          </div>

          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
            {coreValues.map((value) => (
              <div
                key={value.name}
                className="bg-white rounded-2xl p-8 shadow-sm text-center"
              >
                <div className="w-16 h-16 rounded-full bg-brand-primary/10 flex items-center justify-center mx-auto mb-6">
                  <value.icon className="w-8 h-8 text-brand-primary" />
                </div>
                <h3 className="text-xl font-semibold text-foreground">
                  {value.name}
                </h3>
                <p className="mt-4 text-muted-foreground leading-relaxed">
                  {value.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

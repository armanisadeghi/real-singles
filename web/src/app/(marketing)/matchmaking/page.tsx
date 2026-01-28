import Link from "next/link";
import { PageHero, TestimonialCard } from "@/components/marketing";
import { ArrowRight } from "lucide-react";

const testimonials = [
  {
    quote:
      "The matchmakers at Real Singles truly understood what I was looking for. After years of unsuccessful dating, they found my perfect match within months.",
    authorName: "Sarah M.",
    authorTitle: "CEO",
  },
  {
    quote:
      "Professional, discreet, and incredibly effective. The team took the time to really understand my preferences and lifestyle.",
    authorName: "Michael T.",
    authorTitle: "Entrepreneur",
  },
  {
    quote:
      "I was skeptical at first, but the personalized attention I received made all the difference. Highly recommend their matchmaking services.",
    authorName: "Jennifer L.",
    authorTitle: "Executive",
  },
];

export default function MatchmakingPage() {
  return (
    <>
      {/* Hero Section */}
      <PageHero
        title="Matchmaking"
        backgroundColor="beige"
      />

      {/* Personal Matchmaking Section */}
      <section className="bg-white py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
              PERSONAL <span className="text-brand-primary">MATCHMAKING</span>
            </h2>
            <p className="mt-6 text-xl text-muted-foreground">
              Ready for love but too busy for dating games? Our Matchmakers are Ivy League educated and understand the needs of ambitious people. They&apos;ll search, screen for compatibility, and arrange dates – you just show up!
            </p>
          </div>
        </div>
      </section>

      {/* About Matchmakers Section */}
      <section className="bg-muted py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h3 className="text-2xl font-bold text-foreground mb-6">
                Let us help you with the most important search of your life.
              </h3>
              <div className="space-y-4 text-lg text-muted-foreground">
                <p>
                  Our Matchmakers have decades of experience (and successful matches) behind them. Prior to dedicating their careers to helping ambitious singles find their life partner, they earned MBAs from places like Harvard and Stanford and held high ranking jobs in the Corporate world. They understand the world you are living in.
                </p>
                <p>
                  Not only will they take the time to get to know you and your relationship history via multiple meetings, but will also guide you to select the right person.
                </p>
                <p>
                  This exclusive program is offered only to a very small group of Real Singles members. If you are ready to invest in your love life, this program is for you. As the Power Real Singles is invite-only and still in private beta, not everyone will receive a response to your application, as our matchmakers must prioritize those they can match most effectively.
                </p>
              </div>
            </div>
            <div className="relative">
              <div className="aspect-[4/3] rounded-2xl bg-gradient-to-br from-brand-primary/20 to-brand-secondary/20 flex items-center justify-center">
                <div className="text-center">
                  <p className="text-6xl font-bold text-brand-primary">VIP</p>
                  <p className="text-xl text-muted-foreground mt-2">Matchmaking Service</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="bg-white py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
              What Our <span className="text-brand-primary">Clients Say</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <TestimonialCard
                key={index}
                quote={testimonial.quote}
                authorName={testimonial.authorName}
                authorTitle={testimonial.authorTitle}
              />
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-brand-primary to-brand-primary-dark py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white">
            Ready for Personalized Matchmaking?
          </h2>
          <p className="mt-4 text-lg text-white/90 max-w-2xl mx-auto">
            Apply now to be considered for our exclusive VIP matchmaking program.
          </p>
          <Link
            href="/register"
            className="mt-10 inline-flex items-center justify-center gap-2 rounded-full bg-white px-8 py-4 text-lg font-semibold text-brand-primary shadow-lg hover:bg-gray-100 transition-all hover:scale-105"
          >
            Apply Now
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>
    </>
  );
}

import { PageHero } from "@/components/marketing";
import { Shield, Eye, AlertTriangle, Phone, Lock, Users } from "lucide-react";

const safetyTips = [
  {
    title: "Protect Your Personal Information",
    description:
      "Never share your home address, workplace, financial information, or other sensitive details with someone you haven't met in person. Keep conversations on the app until you're comfortable.",
    icon: Lock,
  },
  {
    title: "Video Chat First",
    description:
      "Use our built-in video chat feature to verify someone's identity before meeting in person. This helps ensure they look like their photos and gives you a better sense of who they are.",
    icon: Eye,
  },
  {
    title: "Meet in Public Places",
    description:
      "For your first few dates, always meet in a public place with other people around. Choose well-lit, busy locations like cafes, restaurants, or public parks.",
    icon: Users,
  },
  {
    title: "Tell Someone Your Plans",
    description:
      "Let a friend or family member know where you're going, who you're meeting, and when you expect to be back. Share your date's profile with them if possible.",
    icon: Phone,
  },
  {
    title: "Trust Your Instincts",
    description:
      "If something feels off, trust your gut. You're never obligated to continue a date or conversation. It's okay to leave or block someone if you feel uncomfortable.",
    icon: AlertTriangle,
  },
  {
    title: "Report Suspicious Behavior",
    description:
      "If you encounter anyone who makes you uncomfortable, asks for money, or behaves inappropriately, report them immediately through the app. We take all reports seriously.",
    icon: Shield,
  },
];

export default function SafetyPage() {
  return (
    <>
      {/* Hero Section */}
      <PageHero
        title="Safety"
        subtitle="Your safety is our top priority. Here are some tips to help you stay safe while dating."
        backgroundColor="beige"
      />

      {/* Safety Tips Section */}
      <section className="bg-white py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
              Safety <span className="text-brand-primary">Tips</span>
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Dating should be fun and exciting. Follow these guidelines to protect yourself.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {safetyTips.map((tip) => (
              <div
                key={tip.title}
                className="bg-muted rounded-2xl p-8"
              >
                <div className="w-14 h-14 rounded-xl bg-brand-primary/10 flex items-center justify-center mb-6">
                  <tip.icon className="w-7 h-7 text-brand-primary" />
                </div>
                <h3 className="text-xl font-semibold text-foreground">
                  {tip.title}
                </h3>
                <p className="mt-3 text-muted-foreground leading-relaxed">
                  {tip.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Emergency Resources */}
      <section className="bg-muted py-20 sm:py-28">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground">
              Emergency <span className="text-brand-primary">Resources</span>
            </h2>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-sm">
            <p className="text-lg text-muted-foreground mb-6">
              If you or someone you know is in immediate danger, please contact emergency services:
            </p>
            <ul className="space-y-4 text-lg">
              <li className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-brand-primary" />
                <span className="font-semibold">Emergency:</span>
                <span>911</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-brand-primary" />
                <span className="font-semibold">National Domestic Violence Hotline:</span>
                <span>1-800-799-7233</span>
              </li>
            </ul>
            <p className="mt-6 text-muted-foreground">
              For non-emergency concerns or to report a user, please contact us at{" "}
              <a
                href="mailto:support@realsingles.dating"
                className="text-brand-primary hover:underline"
              >
                support@realsingles.dating
              </a>
            </p>
          </div>
        </div>
      </section>
    </>
  );
}

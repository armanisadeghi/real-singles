import { PageHero, ContactForm } from "@/components/marketing";
import { Mail, Clock } from "lucide-react";

export default function ContactPage() {
  return (
    <>
      {/* Hero Section */}
      <PageHero
        title="Contact Us"
        backgroundColor="beige"
      />

      {/* Contact Content */}
      <section className="bg-white py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
              We would love to <span className="text-brand-primary">hear from you</span>
            </h2>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16">
            {/* Contact Information */}
            <div>
              <h3 className="text-2xl font-bold text-foreground mb-8">
                Get In Touch
              </h3>
              
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-brand-primary/10 flex items-center justify-center flex-shrink-0">
                    <Mail className="w-6 h-6 text-brand-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground">Email</h4>
                    <a 
                      href="mailto:support@realsingles.dating"
                      className="text-muted-foreground hover:text-brand-primary transition-colors"
                    >
                      support@realsingles.dating
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-brand-primary/10 flex items-center justify-center flex-shrink-0">
                    <Clock className="w-6 h-6 text-brand-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground">Hours</h4>
                    <p className="text-muted-foreground">Mon-Fri: 9:00AM - 5:00PM</p>
                    <p className="text-muted-foreground">Sat-Sun: Closed</p>
                  </div>
                </div>
              </div>

              <div className="mt-12">
                <h3 className="text-2xl font-bold text-foreground mb-4">
                  Connect With Us
                </h3>
                <p className="text-muted-foreground">
                  Fill out the form and we will contact you as soon as possible!
                </p>
              </div>
            </div>

            {/* Contact Form */}
            <div className="bg-muted rounded-2xl p-8">
              <ContactForm />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

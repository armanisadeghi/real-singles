"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Mail,
  Phone,
  MapPin,
  MessageCircle,
  Clock,
  Send,
  CheckCircle,
  HelpCircle,
  FileText,
  Shield,
} from "lucide-react";

const contactMethods = [
  {
    name: "Email Us",
    description: "Get a response within 24 hours",
    value: "hello@realsingles.com",
    href: "mailto:hello@realsingles.com",
    icon: Mail,
  },
  {
    name: "Call Us",
    description: "Mon-Fri 9am-6pm EST",
    value: "(555) 123-4567",
    href: "tel:+15551234567",
    icon: Phone,
  },
  {
    name: "Live Chat",
    description: "Available 24/7 for members",
    value: "Start a chat",
    href: "#",
    icon: MessageCircle,
  },
];

const faqs = [
  {
    question: "How do I verify my profile?",
    answer: "Profile verification involves uploading a selfie that matches your photos and completing a video introduction. The process takes about 5 minutes.",
  },
  {
    question: "Is my information safe?",
    answer: "Yes! We use bank-level encryption to protect your data. We never sell your personal information and you control what's visible on your profile.",
  },
  {
    question: "Can I get a refund?",
    answer: "We offer a 7-day money-back guarantee on all premium subscriptions. Contact us within 7 days of purchase for a full refund.",
  },
  {
    question: "How do I report someone?",
    answer: "You can report a profile directly from their page using the 'Report' button. Our safety team reviews all reports within 24 hours.",
  },
];

const quickLinks = [
  { name: "Help Center", href: "/help", icon: HelpCircle },
  { name: "Community Guidelines", href: "/guidelines", icon: FileText },
  { name: "Safety Tips", href: "/safety", icon: Shield },
];

export default function ContactPage() {
  const [formState, setFormState] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate form submission
    await new Promise((resolve) => setTimeout(resolve, 1500));
    
    setIsSubmitting(false);
    setIsSubmitted(true);
  };

  return (
    <>
      {/* Hero Section */}
      <section className="bg-[#F6EDE1] py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl sm:text-5xl font-bold text-foreground">
              Get in <span className="text-brand-primary">Touch</span>
            </h1>
            <p className="mt-6 text-xl text-gray-600">
              Have a question or feedback? We'd love to hear from you. Our team is here to help.
            </p>
          </div>
        </div>
      </section>

      {/* Contact Methods */}
      <section className="bg-white py-12 border-b border-border">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {contactMethods.map((method) => (
              <Link
                key={method.name}
                href={method.href}
                className="flex items-center gap-4 p-6 rounded-xl bg-muted hover:bg-muted/80 transition-colors"
              >
                <div className="w-12 h-12 rounded-full bg-brand-primary/10 flex items-center justify-center flex-shrink-0">
                  <method.icon className="w-6 h-6 text-brand-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">{method.name}</h3>
                  <p className="text-sm text-muted-foreground">{method.description}</p>
                  <p className="text-brand-primary font-medium mt-1">{method.value}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Form and FAQ */}
      <section className="bg-muted py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12">
            {/* Contact Form */}
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-6">
                Send Us a Message
              </h2>
              
              {isSubmitted ? (
                <div className="bg-white rounded-2xl p-8 text-center">
                  <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground">
                    Message Sent!
                  </h3>
                  <p className="mt-2 text-muted-foreground">
                    Thank you for reaching out. We'll get back to you within 24 hours.
                  </p>
                  <button
                    onClick={() => {
                      setIsSubmitted(false);
                      setFormState({ name: "", email: "", subject: "", message: "" });
                    }}
                    className="mt-6 text-brand-primary font-medium hover:underline"
                  >
                    Send another message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-8">
                  <div className="space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div>
                        <label htmlFor="name" className="block text-sm font-medium text-foreground mb-1.5">
                          Your Name
                        </label>
                        <input
                          type="text"
                          id="name"
                          required
                          value={formState.name}
                          onChange={(e) => setFormState({ ...formState, name: e.target.value })}
                          className="w-full px-4 py-3 rounded-lg border border-border focus:border-brand-primary focus:ring-1 focus:ring-brand-primary outline-none transition-colors"
                          placeholder="John Doe"
                        />
                      </div>
                      <div>
                        <label htmlFor="email" className="block text-sm font-medium text-foreground mb-1.5">
                          Email Address
                        </label>
                        <input
                          type="email"
                          id="email"
                          required
                          value={formState.email}
                          onChange={(e) => setFormState({ ...formState, email: e.target.value })}
                          className="w-full px-4 py-3 rounded-lg border border-border focus:border-brand-primary focus:ring-1 focus:ring-brand-primary outline-none transition-colors"
                          placeholder="you@example.com"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label htmlFor="subject" className="block text-sm font-medium text-foreground mb-1.5">
                        Subject
                      </label>
                      <select
                        id="subject"
                        required
                        value={formState.subject}
                        onChange={(e) => setFormState({ ...formState, subject: e.target.value })}
                        className="w-full px-4 py-3 rounded-lg border border-border focus:border-brand-primary focus:ring-1 focus:ring-brand-primary outline-none transition-colors bg-white"
                      >
                        <option value="">Select a topic</option>
                        <option value="general">General Inquiry</option>
                        <option value="support">Technical Support</option>
                        <option value="billing">Billing Question</option>
                        <option value="safety">Safety Concern</option>
                        <option value="feedback">Feedback</option>
                        <option value="partnership">Partnership Opportunity</option>
                        <option value="press">Press / Media</option>
                      </select>
                    </div>
                    
                    <div>
                      <label htmlFor="message" className="block text-sm font-medium text-foreground mb-1.5">
                        Message
                      </label>
                      <textarea
                        id="message"
                        required
                        rows={5}
                        value={formState.message}
                        onChange={(e) => setFormState({ ...formState, message: e.target.value })}
                        className="w-full px-4 py-3 rounded-lg border border-border focus:border-brand-primary focus:ring-1 focus:ring-brand-primary outline-none transition-colors resize-none"
                        placeholder="How can we help you?"
                      />
                    </div>
                    
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-3 rounded-full bg-brand-primary text-white font-semibold hover:bg-brand-primary-dark transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send className="w-5 h-5" />
                          Send Message
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* FAQ */}
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-6">
                Frequently Asked Questions
              </h2>
              
              <div className="space-y-4">
                {faqs.map((faq, index) => (
                  <details
                    key={index}
                    className="bg-white rounded-xl p-5 group"
                  >
                    <summary className="flex items-center justify-between cursor-pointer list-none">
                      <span className="font-medium text-foreground pr-4">
                        {faq.question}
                      </span>
                      <span className="text-brand-primary font-bold text-xl group-open:rotate-45 transition-transform">
                        +
                      </span>
                    </summary>
                    <p className="mt-4 text-muted-foreground text-sm leading-relaxed">
                      {faq.answer}
                    </p>
                  </details>
                ))}
              </div>

              {/* Quick Links */}
              <div className="mt-8 p-6 bg-brand-secondary/5 rounded-xl">
                <h3 className="font-semibold text-foreground mb-4">
                  Quick Links
                </h3>
                <div className="space-y-3">
                  {quickLinks.map((link) => (
                    <Link
                      key={link.name}
                      href={link.href}
                      className="flex items-center gap-3 text-muted-foreground hover:text-brand-primary transition-colors"
                    >
                      <link.icon className="w-5 h-5" />
                      <span>{link.name}</span>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Office Location */}
      <section className="bg-white py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-foreground">
              Our Office
            </h2>
            <div className="mt-6 flex flex-col items-center gap-2 text-muted-foreground">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-brand-primary" />
                <span>123 Love Street, Suite 100</span>
              </div>
              <span>New York, NY 10001</span>
            </div>
            <div className="mt-4 flex items-center justify-center gap-2 text-muted-foreground">
              <Clock className="w-5 h-5 text-brand-primary" />
              <span>Monday - Friday: 9:00 AM - 6:00 PM EST</span>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

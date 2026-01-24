"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, HelpCircle, ChevronDown, Search } from "lucide-react";
import { Header, Footer } from "@/components/layout";
import { cn } from "@/lib/utils";

interface FAQItem {
  question: string;
  answer: string;
  category: string;
}

const faqs: FAQItem[] = [
  {
    category: "Getting Started",
    question: "How do I create an account?",
    answer: "Click 'Get Started' on our homepage, enter your email and password, then complete your profile by adding photos, personal details, and preferences. The more complete your profile, the better your matches!",
  },
  {
    category: "Getting Started",
    question: "What is profile verification?",
    answer: "Profile verification helps ensure authenticity. You can verify your profile by uploading a live photo taken in-app. This gives you a verification badge and increases trust with other members.",
  },
  {
    category: "Matching",
    question: "How does matching work?",
    answer: "Our algorithm considers your preferences (age, location, interests, lifestyle) and suggests compatible profiles. When you both like each other, it's a match! You can then start messaging.",
  },
  {
    category: "Matching",
    question: "What's the difference between Like and Super Like?",
    answer: "A Like shows interest in someone. A Super Like shows extra interest and notifies the person immediately. You have unlimited Likes but limited Super Likes per day.",
  },
  {
    category: "Matching",
    question: "Can I undo a pass or like?",
    answer: "Currently, you cannot undo a pass or like. Choose carefully when swiping through profiles!",
  },
  {
    category: "Safety",
    question: "How do I report inappropriate behavior?",
    answer: "You can report any user by visiting their profile and selecting 'Report User'. Provide details about the issue, and our moderation team will review it promptly.",
  },
  {
    category: "Safety",
    question: "How do I block someone?",
    answer: "Visit the user's profile and select 'Block User'. Blocked users cannot see your profile, message you, or interact with you in any way. You can manage blocked users in Settings > Blocked Users.",
  },
  {
    category: "Rewards",
    question: "How do I earn points?",
    answer: "Earn points by: completing your profile, referring friends, getting reviews, attending events, and being an active member of the community. Points can be redeemed for products in our Rewards Shop.",
  },
  {
    category: "Rewards",
    question: "What can I do with my points?",
    answer: "Redeem points for gift cards, merchandise, and exclusive experiences in our Rewards Shop. You can also gift rewards to friends!",
  },
  {
    category: "Events",
    question: "How do I join an event?",
    answer: "Browse events in the Events tab, click on an event you're interested in, and tap 'Register' or 'Mark as Interested'. You'll receive reminders before the event starts.",
  },
  {
    category: "Events",
    question: "Can I create my own event?",
    answer: "Yes! Registered users can create events. Go to Events > Create Event, fill in the details, and submit for approval. Events can be in-person or virtual.",
  },
  {
    category: "Virtual Speed Dating",
    question: "How does virtual speed dating work?",
    answer: "Register for a session, join at the scheduled time, and you'll be paired with other participants for short video chats (usually 3-5 minutes each). After the event, you can match with people you connected with.",
  },
  {
    category: "Account",
    question: "How do I change my password?",
    answer: "Go to Settings > Change Password. You'll need to enter your current password and choose a new one. Passwords must be at least 8 characters.",
  },
  {
    category: "Account",
    question: "How do I delete my account?",
    answer: "Go to Settings > Delete Account. Please note this action is permanent and cannot be undone. All your data will be deleted within 30 days.",
  },
  {
    category: "Account",
    question: "Can I pause my account instead of deleting it?",
    answer: "Yes! Go to Settings > Privacy > Show Profile in Discovery and toggle it off. Your profile will be hidden from search results, but your account and data remain intact.",
  },
];

function FAQAccordion({ faq }: { faq: FAQItem }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-b border-gray-200 last:border-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full text-left py-4 flex items-start justify-between gap-4 hover:bg-gray-50 transition-colors px-4"
      >
        <span className="font-semibold text-gray-900">{faq.question}</span>
        <ChevronDown
          className={cn(
            "w-5 h-5 text-gray-500 shrink-0 transition-transform",
            isOpen && "transform rotate-180"
          )}
        />
      </button>
      {isOpen && (
        <div className="px-4 pb-4 text-gray-600 leading-relaxed">
          {faq.answer}
        </div>
      )}
    </div>
  );
}

export default function FAQPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const categories = Array.from(new Set(faqs.map((faq) => faq.category)));

  const filteredFAQs = faqs.filter((faq) => {
    const matchesSearch =
      searchQuery === "" ||
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = !selectedCategory || faq.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-dvh flex flex-col">
      <Header />
      <main className="flex-1 pt-[var(--header-height)] bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Header */}
          <div className="mb-8">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Link>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-500 to-orange-600 flex items-center justify-center">
                <HelpCircle className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-4xl font-bold text-gray-900">Frequently Asked Questions</h1>
            </div>
            <p className="text-gray-600">Find answers to common questions about RealSingles</p>
          </div>

          {/* Search */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search questions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent bg-white"
              />
            </div>
          </div>

          {/* Category Filter */}
          <div className="mb-6 flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedCategory(null)}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-medium transition-colors",
                !selectedCategory
                  ? "bg-pink-500 text-white"
                  : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
              )}
            >
              All
            </button>
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={cn(
                  "px-4 py-2 rounded-full text-sm font-medium transition-colors",
                  selectedCategory === category
                    ? "bg-pink-500 text-white"
                    : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                )}
              >
                {category}
              </button>
            ))}
          </div>

          {/* FAQ List */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            {filteredFAQs.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <HelpCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>No FAQs found matching your search</p>
              </div>
            ) : (
              filteredFAQs.map((faq, index) => <FAQAccordion key={index} faq={faq} />)
            )}
          </div>

          {/* Contact Box */}
          <div className="mt-8 bg-gradient-to-r from-pink-50 to-purple-50 rounded-xl p-6 border border-pink-200">
            <h3 className="font-semibold text-gray-900 mb-2">Still have questions?</h3>
            <p className="text-gray-600 mb-4">
              Can't find what you're looking for? Our support team is here to help.
            </p>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-medium rounded-lg hover:from-pink-600 hover:to-purple-700 transition-colors"
            >
              Contact Support
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

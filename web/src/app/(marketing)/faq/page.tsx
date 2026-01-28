"use client";

import { useState } from "react";
import { PageHero } from "@/components/marketing";
import { ChevronDown } from "lucide-react";

const faqs = [
  {
    question: "How many people do you have that meet my preferences?",
    answer:
      "This number is entirely dependent on the preferences that you state when you apply for Real Singles and the number of users in your area that have signed up and are looking for people like you! If you set your preferences super narrow, you will have less daily Prospects, and less people will see your profile as well. Once you let us know your preferences during registration, we will let you know if you have a below-average number of Prospects. That being said, it only takes one, remember?",
  },
  {
    question: "How many daily Prospects will I receive?",
    answer:
      "This number is also dependent on your preferences and the makeup of your local community. If you set your preferences super narrow, you will have less daily Prospects, and less people will see your profile as well, resulting in less matches. The wider you set your preferences, the more visibility your profile will get, and the faster you will see Matches.",
  },
  {
    question: "How does matching work on Real Singles?",
    answer: `Every day at Happy Hour (5pm local time), you'll receive Prospects to review on the Scout tab. We do our very best to only show you to people who meet your preferences, AND where you meet theirs, prioritized by those that we think you will have the highest compatibility with–we don't believe in wasting anyone's time! The number of potentials you see daily is calculated largely based on your membership tier, but that number is also dependent on the size of our community in your area.

Behavioral data and years of experience creating successful matches allows Real Singles to make additional recommendations for you based on more than just your preferences. For example, set a goal to become Pickleball World Champion? You just might find your practice partner and soulmate in your next Batch based on that shared goal.

In an ongoing effort to foster a highly engaged community, a user who likes everyone but never messages, will be deprioritized in the matching algorithm. This lack of communication on the app will also impact your flakiness score and 'Flakes' eventually get kicked out! On the other hand, users who log in every day have a higher match rate, so make sure to check the app often.

Want to see your boss on a dating app? We didn't think so. Be sure to sync your LinkedIn and we will block you from your business connections and coworkers.

So now that you know how the algo works, how can you get more matches? First thing's first, make sure you have a complete profile and 6 high-quality photos. Your first photo is your first impression, so make sure it's your best one! Our data shows that users with 4-6 photos in their profile match twice as often as those with fewer.

Next, be open-minded. Your height/age/distance preferences may be causing you to filter out 'THE ONE', not to mention narrowing your dating pool. We recommend being as inclusive as possible. And, the more people you like, the higher your chances of matching.`,
  },
];

function FAQItem({
  question,
  answer,
  isOpen,
  onToggle,
}: {
  question: string;
  answer: string;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="border-b border-gray-200 last:border-0">
      <button
        onClick={onToggle}
        className="w-full py-6 flex items-center justify-between text-left"
      >
        <span className="text-lg font-semibold text-foreground pr-4">
          {question}
        </span>
        <ChevronDown
          className={`w-5 h-5 text-brand-primary flex-shrink-0 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>
      {isOpen && (
        <div className="pb-6">
          <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
            {answer}
          </p>
        </div>
      )}
    </div>
  );
}

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <>
      {/* Hero Section */}
      <PageHero
        title="FAQs"
        backgroundColor="beige"
      />

      {/* FAQ Content */}
      <section className="bg-white py-20 sm:py-28">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground text-center mb-12">
            Frequently Asked <span className="text-brand-primary">Questions</span>
          </h2>

          <div className="bg-muted rounded-2xl p-6 sm:p-8">
            {faqs.map((faq, index) => (
              <FAQItem
                key={index}
                question={faq.question}
                answer={faq.answer}
                isOpen={openIndex === index}
                onToggle={() => setOpenIndex(openIndex === index ? null : index)}
              />
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

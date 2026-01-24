import Link from "next/link";
import { ArrowLeft, FileText } from "lucide-react";
import { Header, Footer } from "@/components/layout";

export default function TermsPage() {
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
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-4xl font-bold text-gray-900">Terms of Service</h1>
            </div>
            <p className="text-gray-600">Last updated: January 24, 2026</p>
          </div>

          {/* Content */}
          <div className="bg-white rounded-xl shadow-sm p-8 prose prose-gray max-w-none">
            <h2>1. Acceptance of Terms</h2>
            <p>
              By accessing and using RealSingles (&quot;the Service&quot;), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to these Terms of Service, please do not use the Service.
            </p>

            <h2>2. Description of Service</h2>
            <p>
              RealSingles is a dating platform that connects singles through verified profiles, events, and virtual speed dating. We provide tools for users to create profiles, browse other members, send messages, and participate in events.
            </p>

            <h2>3. Eligibility</h2>
            <p>
              You must be at least 18 years old to use this Service. By using the Service, you represent and warrant that:
            </p>
            <ul>
              <li>You are at least 18 years of age</li>
              <li>You are legally able to enter into a binding contract</li>
              <li>You are not prohibited by law from using the Service</li>
              <li>You have not previously been banned from the Service</li>
            </ul>

            <h2>4. User Account and Profile</h2>
            <p>
              To use certain features of the Service, you must register for an account. You agree to:
            </p>
            <ul>
              <li>Provide accurate, current, and complete information</li>
              <li>Maintain and update your information to keep it accurate</li>
              <li>Maintain the security of your password</li>
              <li>Be responsible for all activity under your account</li>
              <li>Not impersonate any person or entity</li>
              <li>Not use false information or a false identity</li>
            </ul>

            <h2>5. User Conduct</h2>
            <p>You agree not to use the Service to:</p>
            <ul>
              <li>Harass, abuse, or harm another person</li>
              <li>Post false, inaccurate, or misleading information</li>
              <li>Upload inappropriate photos or content</li>
              <li>Solicit money or personal information from other users</li>
              <li>Use the Service for any commercial purposes without our consent</li>
              <li>Violate any local, state, national, or international law</li>
              <li>Spam, phish, or engage in fraudulent activity</li>
            </ul>

            <h2>6. Verification</h2>
            <p>
              RealSingles offers profile verification features. While we strive to verify user identities, we cannot guarantee the accuracy of all user information. Users are responsible for their own safety and should exercise caution when meeting others.
            </p>

            <h2>7. Content and Intellectual Property</h2>
            <p>
              You retain ownership of content you post. By posting content, you grant RealSingles a worldwide, non-exclusive, royalty-free license to use, copy, reproduce, and display your content in connection with the Service.
            </p>
            <p>
              The RealSingles platform, including all text, graphics, user interfaces, trademarks, and logos are owned by RealSingles and protected by copyright and trademark laws.
            </p>

            <h2>8. Rewards Program</h2>
            <p>
              RealSingles offers a rewards program where users can earn points for various activities. Points have no cash value and cannot be transferred or sold. We reserve the right to modify or discontinue the rewards program at any time.
            </p>

            <h2>9. Termination</h2>
            <p>
              We reserve the right to suspend or terminate your account at any time for any reason, including violation of these Terms. Upon termination, your right to use the Service will immediately cease.
            </p>

            <h2>10. Disclaimer of Warranties</h2>
            <p>
              The Service is provided &quot;as is&quot; and &quot;as available&quot; without warranties of any kind, either express or implied. We do not warrant that the Service will be uninterrupted, secure, or error-free.
            </p>

            <h2>11. Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by law, RealSingles shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of the Service.
            </p>

            <h2>12. Privacy</h2>
            <p>
              Your use of the Service is also governed by our{" "}
              <Link href="/privacy-policy" className="text-pink-600 hover:underline">
                Privacy Policy
              </Link>
              . Please review our Privacy Policy to understand our practices.
            </p>

            <h2>13. Changes to Terms</h2>
            <p>
              We reserve the right to modify these Terms at any time. We will notify users of significant changes via email or through the Service. Your continued use of the Service after changes constitutes acceptance of the modified Terms.
            </p>

            <h2>14. Contact Us</h2>
            <p>
              If you have questions about these Terms, please contact us at{" "}
              <Link href="/contact" className="text-pink-600 hover:underline">
                our contact page
              </Link>
              .
            </p>

            <div className="mt-8 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-sm text-gray-600 mb-0">
                <strong>Effective Date:</strong> January 24, 2026
              </p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

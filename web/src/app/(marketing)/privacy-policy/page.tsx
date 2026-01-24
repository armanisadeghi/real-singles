import Link from "next/link";
import { ArrowLeft, Shield } from "lucide-react";
import { Header, Footer } from "@/components/layout";

export default function PrivacyPolicyPage() {
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
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-4xl font-bold text-gray-900">Privacy Policy</h1>
            </div>
            <p className="text-gray-600">Last updated: January 24, 2026</p>
          </div>

          {/* Content */}
          <div className="bg-white rounded-xl shadow-sm p-8 prose prose-gray max-w-none">
            <h2>1. Information We Collect</h2>
            
            <h3>Personal Information</h3>
            <p>When you create an account, we collect:</p>
            <ul>
              <li>Name, email address, phone number</li>
              <li>Date of birth, gender, location</li>
              <li>Profile photos and videos</li>
              <li>Physical characteristics (height, body type)</li>
              <li>Lifestyle preferences and interests</li>
              <li>Verification documents (if you choose to verify)</li>
            </ul>

            <h3>Usage Information</h3>
            <p>We automatically collect:</p>
            <ul>
              <li>Device information and IP address</li>
              <li>Browser type and operating system</li>
              <li>Pages visited and features used</li>
              <li>Interactions with other users (matches, messages, likes)</li>
              <li>Location data (if you grant permission)</li>
            </ul>

            <h2>2. How We Use Your Information</h2>
            <p>We use your information to:</p>
            <ul>
              <li>Provide and improve the Service</li>
              <li>Match you with compatible users</li>
              <li>Facilitate communication between users</li>
              <li>Send you notifications and updates</li>
              <li>Ensure safety and prevent fraud</li>
              <li>Analyze usage patterns and improve features</li>
              <li>Comply with legal obligations</li>
            </ul>

            <h2>3. Information Sharing</h2>
            
            <h3>With Other Users</h3>
            <p>
              Your profile information, photos, and activity are visible to other users of the Service based on your privacy settings. You can control visibility in your settings.
            </p>

            <h3>With Third Parties</h3>
            <p>We may share information with:</p>
            <ul>
              <li><strong>Service Providers:</strong> Companies that help us operate the Service (hosting, analytics, payment processing)</li>
              <li><strong>Legal Requirements:</strong> When required by law or to protect rights and safety</li>
              <li><strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets</li>
            </ul>

            <p>We do not sell your personal information to third parties.</p>

            <h2>4. Data Security</h2>
            <p>
              We implement appropriate technical and organizational measures to protect your data. However, no internet transmission is completely secure, and we cannot guarantee absolute security.
            </p>

            <h2>5. Your Rights and Choices</h2>
            <p>You have the right to:</p>
            <ul>
              <li>Access and download your data</li>
              <li>Correct inaccurate information</li>
              <li>Delete your account and data</li>
              <li>Control privacy settings and visibility</li>
              <li>Opt-out of marketing communications</li>
              <li>Block or report other users</li>
            </ul>

            <h2>6. Data Retention</h2>
            <p>
              We retain your information for as long as your account is active or as needed to provide services. If you delete your account, we will delete or anonymize your data within 30 days, except where we must retain data for legal purposes.
            </p>

            <h2>7. Children's Privacy</h2>
            <p>
              The Service is not intended for users under 18 years of age. We do not knowingly collect information from children. If we discover we have collected information from a child, we will delete it immediately.
            </p>

            <h2>8. International Users</h2>
            <p>
              If you access the Service from outside the United States, your information may be transferred to and processed in the United States. By using the Service, you consent to such transfer and processing.
            </p>

            <h2>9. Cookies and Tracking</h2>
            <p>
              We use cookies and similar technologies to enhance your experience, remember preferences, and analyze usage. You can control cookies through your browser settings.
            </p>

            <h2>10. Changes to Privacy Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of significant changes via email or through the Service. Continued use after changes constitutes acceptance.
            </p>

            <h2>11. Contact Us</h2>
            <p>
              For questions about this Privacy Policy or our data practices, contact us at{" "}
              <Link href="/contact" className="text-pink-600 hover:underline">
                our contact page
              </Link>
              {" "}or email privacy@realsingles.com.
            </p>

            <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-800 mb-0">
                <strong>Your Privacy Matters:</strong> We are committed to protecting your personal information and giving you control over how it's used. Review your{" "}
                <Link href="/settings/privacy" className="text-blue-600 hover:underline font-semibold">
                  privacy settings
                </Link>
                {" "}anytime.
              </p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

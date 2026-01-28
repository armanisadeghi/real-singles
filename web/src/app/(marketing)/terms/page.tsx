import { PageHero } from "@/components/marketing";

export default function TermsPage() {
  return (
    <>
      {/* Hero Section */}
      <PageHero
        title="Terms"
        backgroundColor="dark"
      />

      {/* Terms Content */}
      <section className="bg-white py-20 sm:py-28">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="prose prose-lg max-w-none">
            <h2 className="text-3xl font-bold text-foreground">
              THE REAL SINGLES TERMS OF SERVICE AGREEMENT
            </h2>
            
            <p className="text-brand-primary font-semibold">
              Effective Date: September 26, 2024
            </p>

            <h3>Introduction</h3>
            <p>
              Welcome to &quot;Real Singles&quot;. We value your privacy and are committed to protecting your personal information. This Privacy Policy outlines how we collect, use, share, and protect your data when you use our app. By using Real Singles, you agree to the terms of this policy.
            </p>

            <h3>1. Information We Collect</h3>
            <p>We collect various types of information to provide and improve our services:</p>
            <ul>
              <li><strong>Cookies and Tracking Technologies:</strong> We use cookies, web beacons, and similar technologies to collect information about your activity within the app.</li>
              <li><strong>Usage Data:</strong> Information on how you use our app, including interaction data, logs, and analytics.</li>
              <li><strong>Location Data:</strong> If you enable location services, we may collect information about your precise location to enhance user matching.</li>
              <li><strong>Profile Information:</strong> Details you choose to include in your profile, such as photos, interests, and preferences.</li>
              <li><strong>Personal Information:</strong> This includes your name, email address, phone number, date of birth, and any other information you provide when creating an account.</li>
            </ul>

            <h3>2. How We Use Your Information</h3>
            <p>We use your information for various purposes, including:</p>
            <ul>
              <li><strong>Security:</strong> To protect against fraudulent activities and enhance user safety.</li>
              <li><strong>Analytics:</strong> To analyze usage patterns and improve our app.</li>
              <li><strong>Matching:</strong> To match you with other users based on your preferences and behavior.</li>
              <li><strong>Communication:</strong> To send you updates, newsletters, marketing communications, and respond to inquiries.</li>
              <li><strong>Personalization:</strong> To personalize your experience and improve our services based on user preferences.</li>
              <li><strong>Account Management:</strong> To create and manage your user account.</li>
            </ul>

            <h3>3. Sharing Your Information</h3>
            <p>We do not sell your personal information. However, we may share your information in the following circumstances:</p>
            <ul>
              <li><strong>Business Transfers:</strong> In the event of a merger, acquisition, or asset sale, your data may be transferred as part of that transaction.</li>
              <li><strong>Legal Compliance:</strong> We may disclose your information if required by law or to respond to legal requests.</li>
              <li><strong>Service Providers:</strong> We may share information with third-party service providers who assist us in operating our app and conducting our business.</li>
              <li><strong>With Other Users:</strong> Your profile information may be visible to other users.</li>
            </ul>

            <h3>4. Your Rights and Choices</h3>
            <p>You have certain rights regarding your personal information:</p>
            <ul>
              <li><strong>Location Data:</strong> You can control location services through your device settings.</li>
              <li><strong>Data Deletion:</strong> You can request the deletion of your account and personal data by contacting us.</li>
              <li><strong>Opt-Out:</strong> You can opt-out of marketing communications by following the unsubscribe instructions provided in our emails.</li>
              <li><strong>Access and Update:</strong> You can access and update your information within the app.</li>
            </ul>

            <h3>5. Data Security</h3>
            <p>
              We implement reasonable security measures to protect your information from unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the Internet or electronic storage is 100% secure.
            </p>

            <h3>6. Data Retention</h3>
            <p>
              We retain your personal information only for as long as necessary to fulfill the purposes for which it was collected or as required by law.
            </p>

            <h3>7. International Data Transfers</h3>
            <p>
              If you are accessing our app from outside USA, your information may be transferred to servers located in country and processed there. We comply with applicable data protection laws regarding international transfers.
            </p>

            <h3>8. Children&apos;s Privacy</h3>
            <p>
              Our app is not intended for children under 18 years of age. We do not knowingly collect personal information from children. If we become aware that we have collected such information, we will take steps to delete it.
            </p>

            <h3>9. Changes to This Privacy Policy</h3>
            <p>
              We may update this Privacy Policy from time to time. Any changes will be posted on this page with an updated effective date. We encourage you to review this policy periodically for any changes.
            </p>

            <h3>10. Contact Us</h3>
            <p>
              If you have any questions or concerns about this Privacy Policy or our data practices, please contact us at{" "}
              <a href="mailto:support@realsingles.dating" className="text-brand-primary hover:underline">
                support@realsingles.dating
              </a>
              .
            </p>
          </div>
        </div>
      </section>
    </>
  );
}

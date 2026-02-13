import Link from "next/link";

export const metadata = {
  title: "Privacy Policy | Before Bedtime Adventures",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="border-b border-gray-100">
        <div className="max-w-3xl mx-auto px-6 py-4">
          <Link href="/" className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors w-fit">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span>Back to Home</span>
          </Link>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-6 py-16">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
        <p className="text-gray-500 mb-12">Last updated: February 11, 2026</p>

        <div className="prose prose-gray max-w-none">
          <p className="text-gray-600 mb-10">
            Before Bedtime Adventures, operated by Slateworks LLC, is committed to protecting your privacy. 
            We build personalized storybooks for families — privacy and trust are at the heart of what we do.
          </p>

          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">1. Information We Collect</h2>
            
            <h3 className="text-lg font-medium text-gray-800 mb-3">Information You Provide</h3>
            <ul className="list-disc list-inside text-gray-600 space-y-2 mb-4">
              <li><strong>Account Information:</strong> Name and email address (via Clerk authentication)</li>
              <li><strong>Shipping Address:</strong> To deliver your printed book</li>
              <li><strong>Photos:</strong> Family photos you upload to create your storybook</li>
              <li><strong>Story Details:</strong> Character names, themes, and customization choices</li>
              <li><strong>Payment Information:</strong> Credit/debit card details (processed by Stripe — we never store full card numbers)</li>
            </ul>

            <h3 className="text-lg font-medium text-gray-800 mb-3">Information Collected Automatically</h3>
            <ul className="list-disc list-inside text-gray-600 space-y-2">
              <li><strong>Usage Data:</strong> Pages visited, features used, time spent on the Service</li>
              <li><strong>Device Information:</strong> Browser type, operating system, device type</li>
              <li><strong>Cookies:</strong> Essential cookies for authentication and optional analytics cookies</li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">2. How We Use Your Information</h2>
            <ul className="list-disc list-inside text-gray-600 space-y-2">
              <li><strong>Create your storybook</strong> — process photos, generate AI illustrations, compose your book</li>
              <li><strong>Fulfill your order</strong> — print and ship your book via Lulu</li>
              <li><strong>Process payment</strong> — charge your card securely via Stripe</li>
              <li><strong>Communicate with you</strong> — order confirmations, shipping updates, support</li>
              <li><strong>Improve the Service</strong> — understand usage patterns, fix bugs, enhance features</li>
              <li><strong>Comply with legal obligations</strong> — tax records, fraud prevention</li>
            </ul>
            <p className="text-gray-600 mt-4 font-medium">We do not sell your personal information. Ever.</p>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">3. Third-Party Services</h2>
            <p className="text-gray-600 mb-4">We share your data only with trusted services necessary to operate:</p>
            <ul className="list-disc list-inside text-gray-600 space-y-2">
              <li><strong>Stripe</strong> — Payment processing (receives payment details and email)</li>
              <li><strong>Lulu</strong> — Book printing & shipping (receives book content, shipping address, name)</li>
              <li><strong>Clerk</strong> — Authentication (receives email and name)</li>
              <li><strong>Convex</strong> — Database & backend (stores account and book data)</li>
              <li><strong>fal.ai</strong> — AI image generation (receives uploaded photos for processing)</li>
            </ul>
            <p className="text-gray-600 mt-3">
              Each service has their own privacy policies and data protection practices. We may also share 
              information when required by law or to protect rights and safety.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">4. Your Photos</h2>
            <p className="text-gray-600 mb-3">Your photos are important, and we treat them with care:</p>
            <ul className="list-disc list-inside text-gray-600 space-y-2">
              <li>Photos are uploaded securely and stored encrypted</li>
              <li>Photos are processed by our AI systems solely to generate your storybook illustrations</li>
              <li>Photos are shared with Lulu only as part of your completed book file for printing</li>
              <li><strong>We do not use your photos to train AI models</strong></li>
              <li>You can request deletion of your photos at any time</li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">5. Children&apos;s Privacy (COPPA)</h2>
            <p className="text-gray-600 mb-3">
              Before Bedtime Adventures is a service for <strong>parents and guardians</strong> to create 
              books for their children. It is <strong>not directed at children under 13</strong>.
            </p>
            <ul className="list-disc list-inside text-gray-600 space-y-2">
              <li>We do not knowingly collect personal information from children under 13</li>
              <li>Account holders must be at least 18 years old</li>
              <li>Photos of children are uploaded by their parents/guardians with consent</li>
              <li>If you believe a child under 13 has provided us personal information, please contact us immediately</li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">6. Cookies</h2>
            <ul className="list-disc list-inside text-gray-600 space-y-2">
              <li><strong>Essential cookies:</strong> Login sessions, security (required for the Service to work)</li>
              <li><strong>Analytics cookies:</strong> Understanding usage to improve the Service (optional)</li>
            </ul>
            <p className="text-gray-600 mt-3">
              You can manage cookie preferences in your browser settings. Disabling essential cookies may 
              prevent the Service from functioning properly.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">7. Data Retention</h2>
            <ul className="list-disc list-inside text-gray-600 space-y-2">
              <li><strong>Account data:</strong> Retained while your account is active; deleted upon request</li>
              <li><strong>Photos:</strong> Retained while active or until you delete them; removed within 30 days of deletion request</li>
              <li><strong>Order history:</strong> Retained for up to 3 years for legal and tax purposes</li>
              <li><strong>Payment records:</strong> Retained by Stripe per their policies</li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">8. Your Rights</h2>
            <p className="text-gray-600 mb-3">You have the right to:</p>
            <ul className="list-disc list-inside text-gray-600 space-y-2">
              <li><strong>Access</strong> your personal data — request a copy of what we have</li>
              <li><strong>Correct</strong> inaccurate information</li>
              <li><strong>Delete</strong> your data — request we remove your personal information</li>
              <li><strong>Port</strong> your data — receive it in a portable format</li>
              <li><strong>Opt out</strong> of marketing communications</li>
            </ul>
            <p className="text-gray-600 mt-3">
              To exercise any of these rights, email us at{" "}
              <a href="mailto:hello@beforebedtimeadventures.com" className="text-purple-600 hover:text-purple-700">
                hello@beforebedtimeadventures.com
              </a>
              . We&apos;ll respond within 30 days.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">9. California Residents (CCPA)</h2>
            <p className="text-gray-600">
              If you&apos;re a California resident, you have additional rights under the CCPA, including the 
              right to know what data we collect and the right to opt out of data sales. We do not sell 
              personal information.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">10. Changes to This Policy</h2>
            <p className="text-gray-600">
              We may update this Privacy Policy from time to time. We&apos;ll notify you of material changes 
              by email or through the Service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">11. Contact Us</h2>
            <p className="text-gray-600">
              Questions about your privacy? Email us at{" "}
              <a href="mailto:hello@beforebedtimeadventures.com" className="text-purple-600 hover:text-purple-700">
                hello@beforebedtimeadventures.com
              </a>
            </p>
            <p className="text-gray-600 mt-2">Slateworks LLC</p>
          </section>
        </div>
      </main>
    </div>
  );
}

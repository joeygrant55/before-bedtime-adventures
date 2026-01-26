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
        <p className="text-gray-500 mb-12">
          Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
        </p>

        <div className="prose prose-gray max-w-none">
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">What We Collect</h2>
            <p className="text-gray-600 mb-4">When you use Before Bedtime Adventures, we collect:</p>
            <ul className="list-disc list-inside text-gray-600 space-y-2">
              <li>Your email address and name (for account creation)</li>
              <li>Photos you upload (to create your storybook)</li>
              <li>Shipping address (to deliver your book)</li>
              <li>Payment information (processed securely by Stripe)</li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">How We Use Your Data</h2>
            <ul className="list-disc list-inside text-gray-600 space-y-2">
              <li>To create and deliver your personalized storybook</li>
              <li>To communicate with you about your order</li>
              <li>To improve our service</li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Your Photos</h2>
            <p className="text-gray-600">
              Your photos are processed securely to generate AI illustrations. We do not share your 
              photos with third parties except as necessary to fulfill your order (e.g., with our 
              printing partner Lulu). Photos are stored securely and you can request deletion at any time.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Third-Party Services</h2>
            <p className="text-gray-600 mb-4">We use trusted third-party services:</p>
            <ul className="list-disc list-inside text-gray-600 space-y-2">
              <li><strong>Clerk</strong> — Authentication</li>
              <li><strong>Stripe</strong> — Payment processing</li>
              <li><strong>Lulu</strong> — Book printing and shipping</li>
              <li><strong>Google AI</strong> — Image transformation</li>
              <li><strong>Convex</strong> — Data storage</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Contact Us</h2>
            <p className="text-gray-600">
              Questions? Email us at{" "}
              <a href="mailto:hello@beforebedtimeadventures.com" className="text-purple-600 hover:text-purple-700">
                hello@beforebedtimeadventures.com
              </a>
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}

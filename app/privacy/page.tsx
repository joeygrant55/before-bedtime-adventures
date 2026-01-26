import Link from "next/link";

export const metadata = {
  title: "Privacy Policy | Before Bedtime Adventures",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="max-w-3xl mx-auto px-4 py-16">
        <Link 
          href="/" 
          className="text-purple-400 hover:text-white transition-colors mb-8 inline-block"
        >
          ← Back to Home
        </Link>
        
        <h1 className="text-4xl font-bold text-white mb-8">Privacy Policy</h1>
        
        <div className="prose prose-invert prose-purple max-w-none">
          <p className="text-purple-200 mb-6">
            Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">What We Collect</h2>
            <p className="text-purple-200 mb-4">
              When you use Before Bedtime Adventures, we collect:
            </p>
            <ul className="list-disc list-inside text-purple-200 space-y-2">
              <li>Your email address and name (for account creation)</li>
              <li>Photos you upload (to create your storybook)</li>
              <li>Shipping address (to deliver your book)</li>
              <li>Payment information (processed securely by Stripe)</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">How We Use Your Data</h2>
            <ul className="list-disc list-inside text-purple-200 space-y-2">
              <li>To create and deliver your personalized storybook</li>
              <li>To communicate with you about your order</li>
              <li>To improve our service</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">Your Photos</h2>
            <p className="text-purple-200 mb-4">
              Your photos are processed securely to generate AI illustrations. We do not share your 
              photos with third parties except as necessary to fulfill your order (e.g., with our 
              printing partner Lulu). Photos are stored securely and you can request deletion at any time.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">Third-Party Services</h2>
            <p className="text-purple-200 mb-4">
              We use trusted third-party services:
            </p>
            <ul className="list-disc list-inside text-purple-200 space-y-2">
              <li><strong>Clerk</strong> - Authentication</li>
              <li><strong>Stripe</strong> - Payment processing</li>
              <li><strong>Lulu</strong> - Book printing and shipping</li>
              <li><strong>Google AI</strong> - Image transformation</li>
              <li><strong>Convex</strong> - Data storage</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">Contact Us</h2>
            <p className="text-purple-200">
              Questions? Email us at{" "}
              <a href="mailto:hello@beforebedtimeadventures.com" className="text-purple-400 hover:text-white">
                hello@beforebedtimeadventures.com
              </a>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

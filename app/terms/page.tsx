import Link from "next/link";

export const metadata = {
  title: "Terms of Service | Before Bedtime Adventures",
};

export default function TermsPage() {
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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Terms of Service</h1>
        <p className="text-gray-500 mb-12">Last updated: February 11, 2026</p>

        <div className="prose prose-gray max-w-none">
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">1. Welcome</h2>
            <p className="text-gray-600">
              Welcome to Before Bedtime Adventures, operated by Slateworks LLC. By using our website and services, 
              you agree to these Terms of Service. If you don&apos;t agree, please don&apos;t use the Service.
            </p>
            <p className="text-gray-600 mt-3">
              We create personalized, AI-illustrated children&apos;s storybooks based on your family photos. 
              It&apos;s a magical product, and we want the experience to be great from start to finish.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">2. Service Description</h2>
            <p className="text-gray-600 mb-3">Before Bedtime Adventures lets you:</p>
            <ul className="list-disc list-inside text-gray-600 space-y-2">
              <li>Upload family photos</li>
              <li>Use AI to transform them into illustrated storybook pages</li>
              <li>Customize your story&apos;s text and theme</li>
              <li>Order a professionally printed hardcover book ($49.99 per book plus shipping)</li>
            </ul>
            <p className="text-gray-600 mt-3">
              Books are printed and fulfilled by our printing partner, Lulu, and shipped directly to your door.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">3. User Accounts</h2>
            <p className="text-gray-600 mb-3">
              To use the Service, you must create an account. You agree to:
            </p>
            <ul className="list-disc list-inside text-gray-600 space-y-2">
              <li>Provide accurate information</li>
              <li>Keep your login credentials secure</li>
              <li>Be responsible for all activity under your account</li>
              <li>Notify us immediately if you suspect unauthorized access</li>
            </ul>
            <p className="text-gray-600 mt-3">
              You must be at least 18 years old to create an account. This is a service for parents and 
              guardians to create books for children — not a service directed at children.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">4. Ordering & Payment</h2>
            <ul className="list-disc list-inside text-gray-600 space-y-2">
              <li><strong>Pricing:</strong> Each personalized storybook is $49.99 plus applicable shipping costs, displayed at checkout before you pay.</li>
              <li><strong>Payment Processing:</strong> Payments are processed securely by Stripe. We never store your full credit card information.</li>
              <li><strong>Order Confirmation:</strong> After payment, you&apos;ll receive a confirmation constituting a binding agreement to produce and ship your book.</li>
              <li><strong>Currency:</strong> All prices are in US Dollars (USD).</li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">5. Your Content — Photos & Uploads</h2>
            <p className="text-gray-600 mb-3">
              <strong>You retain full ownership</strong> of all photos you upload. By uploading photos, you grant us a 
              limited, non-exclusive license to process and transform them solely for creating your storybook.
            </p>
            <p className="text-gray-600 mb-3">
              You represent that you have the right to use all photos you upload, including the right to use 
              the likeness of any individuals depicted.
            </p>
            <p className="text-gray-600 mb-3">You agree not to upload content that:</p>
            <ul className="list-disc list-inside text-gray-600 space-y-2">
              <li>Violates any laws or regulations</li>
              <li>Infringes on others&apos; intellectual property rights</li>
              <li>Contains inappropriate or harmful content</li>
              <li>You don&apos;t have the right to use</li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">6. AI-Generated Content</h2>
            <p className="text-gray-600 mb-3">
              We use artificial intelligence to transform your photos into illustrated storybook images. 
              The AI generates new artistic interpretations — it doesn&apos;t simply filter or edit your photos.
            </p>
            <p className="text-gray-600 mb-3">
              The AI-generated illustrations in your book are created for you as part of our service. You 
              receive a personal, non-exclusive license to use your completed book for personal, non-commercial purposes.
            </p>
            <p className="text-gray-600">
              While we strive for beautiful results, AI-generated content may vary in style and quality. 
              We recommend reviewing your book preview carefully before ordering.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">7. Print Fulfillment & Shipping</h2>
            <ul className="list-disc list-inside text-gray-600 space-y-2">
              <li>Books are printed by Lulu, a third-party print-on-demand service</li>
              <li>Production typically takes 3-5 business days</li>
              <li>Standard US shipping is 5-7 business days after production</li>
              <li>International shipping times vary by destination</li>
              <li>You&apos;ll receive tracking information once your book ships</li>
            </ul>
            <p className="text-gray-600 mt-3">
              We are not responsible for delays caused by shipping carriers, customs, weather, or other 
              events beyond our control.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">8. Refunds & Returns</h2>
            <p className="text-gray-600">
              Due to the personalized nature of our products, our refund policy has specific conditions. 
              Please see our full{" "}
              <Link href="/refund" className="text-purple-600 hover:text-purple-700">
                Refund Policy
              </Link>{" "}
              for details. In summary: books cannot be returned once printed, but we will replace or 
              refund books with quality defects.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">9. Intellectual Property</h2>
            <p className="text-gray-600 mb-3">
              The Before Bedtime Adventures name, logo, website design, AI models, story templates, and 
              all related intellectual property belong to Slateworks LLC.
            </p>
            <p className="text-gray-600">
              You may not copy, modify, distribute, or reverse-engineer any part of our Service, 
              technology, or AI systems.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">10. Limitation of Liability</h2>
            <p className="text-gray-600 mb-3">
              The Service is provided &quot;as is&quot; and &quot;as available&quot; without warranties of any kind. 
              Slateworks LLC shall not be liable for any indirect, incidental, special, consequential, or 
              punitive damages arising from your use of the Service.
            </p>
            <p className="text-gray-600">
              Our total liability for any claim shall not exceed the amount you paid us in the 12 months 
              preceding the claim.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">11. Termination</h2>
            <p className="text-gray-600 mb-3">
              You can stop using the Service at any time. Contact us to delete your account.
            </p>
            <p className="text-gray-600">
              We may suspend or terminate your account if you violate these Terms. Upon termination, 
              your right to use the Service ceases and we may delete your data per our Privacy Policy.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">12. Changes to These Terms</h2>
            <p className="text-gray-600">
              We may update these Terms from time to time. If we make material changes, we&apos;ll notify 
              you by email or through the Service. Continued use after changes constitutes acceptance.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">13. Governing Law</h2>
            <p className="text-gray-600">
              These Terms are governed by the laws of the State of Massachusetts, without regard to 
              conflict of law principles.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">14. Contact Us</h2>
            <p className="text-gray-600">
              Questions about these Terms? Email us at{" "}
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

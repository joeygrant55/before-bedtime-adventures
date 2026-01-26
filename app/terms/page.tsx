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
        <p className="text-gray-500 mb-12">
          Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
        </p>

        <div className="prose prose-gray max-w-none">
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Service Description</h2>
            <p className="text-gray-600">
              Before Bedtime Adventures allows you to upload family photos, transform them into 
              illustrated storybook pages using AI, and order printed hardcover books.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Your Content</h2>
            <p className="text-gray-600">
              You retain ownership of photos you upload. By using our service, you grant us a license 
              to process your photos to create your storybook. You represent that you have the right 
              to use all photos you upload.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Acceptable Use</h2>
            <p className="text-gray-600 mb-4">You agree not to upload content that:</p>
            <ul className="list-disc list-inside text-gray-600 space-y-2">
              <li>Violates any laws or regulations</li>
              <li>Infringes on others' intellectual property rights</li>
              <li>Contains inappropriate or harmful content</li>
              <li>You don't have the right to use</li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Pricing & Refunds</h2>
            <p className="text-gray-600">
              Book pricing is displayed at checkout and includes the base book price plus shipping. 
              Due to the personalized nature of our products, refunds are handled on a case-by-case 
              basis. If you receive a defective product, we'll replace it at no charge.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Delivery</h2>
            <p className="text-gray-600">
              Books are printed and shipped by Lulu. Standard delivery is 5-7 business days 
              within the US. International shipping times vary. We are not responsible for 
              delays caused by shipping carriers.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Limitation of Liability</h2>
            <p className="text-gray-600">
              Our service is provided "as is." We are not liable for any indirect, incidental, 
              or consequential damages arising from your use of the service.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Changes to Terms</h2>
            <p className="text-gray-600">
              We may update these terms from time to time. Continued use of the service after 
              changes constitutes acceptance of the new terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Contact</h2>
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

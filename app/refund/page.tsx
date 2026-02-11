import Link from "next/link";

export const metadata = {
  title: "Refund Policy | Before Bedtime Adventures",
};

export default function RefundPage() {
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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Refund Policy</h1>
        <p className="text-gray-500 mb-12">
          Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
        </p>

        <div className="prose prose-gray max-w-none">
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Custom Products</h2>
            <p className="text-gray-600">
              Each Before Bedtime Adventures book is a one-of-a-kind creation made just for your family.
              Because every book is custom printed with your photos and personalized story, we are unable
              to accept returns or issue refunds for change-of-mind purchases once printing has begun.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">When We Will Help</h2>
            <p className="text-gray-600 mb-4">We stand behind the quality of every book. We&apos;ll gladly replace or refund your order if:</p>
            <ul className="list-disc list-inside text-gray-600 space-y-2">
              <li><strong>Print quality issue</strong> — Pages are misprinted, blurry, or colors are significantly off</li>
              <li><strong>Shipping damage</strong> — Your book arrived damaged during transit</li>
              <li><strong>Wrong order</strong> — You received someone else&apos;s book (rare, but we&apos;ll fix it immediately)</li>
              <li><strong>Missing pages</strong> — Your book is missing content that was in your preview</li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Cancellations</h2>
            <p className="text-gray-600">
              If you need to cancel your order <strong>before it has been sent to print</strong>, we&apos;ll
              issue a full refund. Once a book enters production, cancellation is no longer possible
              as printing begins immediately.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">How to Request a Refund</h2>
            <p className="text-gray-600 mb-4">To request a replacement or refund:</p>
            <ol className="list-decimal list-inside text-gray-600 space-y-2">
              <li>Email us at <a href="mailto:hello@beforebedtimeadventures.com" className="text-purple-600 hover:text-purple-700">hello@beforebedtimeadventures.com</a></li>
              <li>Include your order number and a description of the issue</li>
              <li>For quality or damage issues, please include a photo</li>
            </ol>
            <p className="text-gray-600 mt-4">
              We aim to respond within 24 hours and resolve all issues within 3-5 business days.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Timeframe</h2>
            <p className="text-gray-600">
              Refund and replacement requests must be made within <strong>30 days</strong> of
              receiving your book. After 30 days, we may not be able to process your request.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Our Promise</h2>
            <p className="text-gray-600">
              We want every family to love their book. If something isn&apos;t right, reach out —
              we&apos;ll make it right.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}

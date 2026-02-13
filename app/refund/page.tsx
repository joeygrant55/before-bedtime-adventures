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
        <p className="text-gray-500 mb-12">Last updated: February 11, 2026</p>

        <div className="prose prose-gray max-w-none">
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Our Promise</h2>
            <p className="text-gray-600">
              We want you to love your storybook. Every book is custom-made just for your family, which 
              means we can&apos;t accept general returns — but we absolutely stand behind the quality of our product.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Custom & Personalized Products</h2>
            <p className="text-gray-600">
              Each Before Bedtime Adventures book is a one-of-a-kind creation made specifically for you. 
              Because of this, <strong>books that have been printed are generally non-refundable</strong> — 
              they&apos;re personalized with your photos and story and can&apos;t be resold.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">When We&apos;ll Make It Right</h2>
            <p className="text-gray-600 mb-6">We believe in doing right by our customers.</p>

            <div className="space-y-6">
              <div className="bg-gray-50 rounded-lg p-5">
                <h3 className="font-semibold text-gray-900 mb-2">🖨️ Print Quality Issues</h3>
                <p className="text-gray-600">
                  If your book arrives with print defects — blurry pages, color issues, binding problems, 
                  missing pages — we&apos;ll send you a <strong>free replacement</strong> or issue a{" "}
                  <strong>full refund</strong>, your choice.
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-5">
                <h3 className="font-semibold text-gray-900 mb-2">📦 Shipping Damage</h3>
                <p className="text-gray-600">
                  If your book arrives damaged due to shipping (crushed, water damage, etc.), we&apos;ll send a{" "}
                  <strong>free replacement</strong>. Just send us a photo of the damage so we can file a claim 
                  with the carrier.
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-5">
                <h3 className="font-semibold text-gray-900 mb-2">❌ Wrong Order</h3>
                <p className="text-gray-600">
                  If you receive someone else&apos;s book or your book is substantially different from what you 
                  ordered, we&apos;ll send a <strong>free replacement</strong> right away.
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-5">
                <h3 className="font-semibold text-gray-900 mb-2">⏸️ Cancellation Before Printing</h3>
                <p className="text-gray-600">
                  If you cancel your order <strong>before it enters production</strong>, we&apos;ll issue a{" "}
                  <strong>full refund</strong>. Orders typically enter production within 24 hours, so act 
                  quickly if you need to cancel.
                </p>
              </div>
            </div>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">How to Request a Refund or Replacement</h2>
            <ol className="list-decimal list-inside text-gray-600 space-y-3">
              <li>
                <strong>Email us</strong> at{" "}
                <a href="mailto:hello@beforebedtimeadventures.com" className="text-purple-600 hover:text-purple-700">
                  hello@beforebedtimeadventures.com
                </a>{" "}
                within <strong>30 days</strong> of receiving your order
              </li>
              <li><strong>Include:</strong> Your order number, a description of the issue, and photos if applicable</li>
              <li><strong>We&apos;ll respond</strong> within 2 business days with next steps</li>
            </ol>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Timeline</h2>
            <ul className="list-disc list-inside text-gray-600 space-y-2">
              <li>Requests must be made within <strong>30 days</strong> of delivery</li>
              <li>Refunds are processed to your original payment method within <strong>5-10 business days</strong></li>
              <li>Replacement books follow standard production and shipping (typically 7-12 business days)</li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">What&apos;s Not Covered</h2>
            <ul className="list-disc list-inside text-gray-600 space-y-2">
              <li>Dissatisfaction with AI-generated art style (we recommend previewing carefully before ordering)</li>
              <li>Minor color variations between screen and print (this is normal in printing)</li>
              <li>Orders where incorrect shipping information was provided</li>
              <li>Delivery delays caused by shipping carriers, customs, or weather</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Contact Us</h2>
            <p className="text-gray-600">
              We&apos;re a small team that cares about every book we make. If something&apos;s not right, just tell 
              us — we&apos;ll work with you to find a solution.
            </p>
            <p className="text-gray-600 mt-3">
              Email:{" "}
              <a href="mailto:hello@beforebedtimeadventures.com" className="text-purple-600 hover:text-purple-700">
                hello@beforebedtimeadventures.com
              </a>
            </p>
            <p className="text-gray-600 mt-1">Response time: Within 2 business days</p>
            <p className="text-gray-600 mt-1">Slateworks LLC</p>
          </section>
        </div>
      </main>
    </div>
  );
}

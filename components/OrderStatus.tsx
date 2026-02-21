"use client";

// Order status types — must match convex/schema.ts printOrders.status union
export type OrderStatusType =
  | "pending_payment"
  | "payment_received"
  | "generating_pdfs"
  | "submitting_to_lulu"
  | "submitted"
  | "in_production"
  | "shipped"
  | "delivered"
  | "failed";

interface OrderStatusProps {
  status: OrderStatusType;
  compact?: boolean;
}

// Status configuration with labels, icons, and colors
const STATUS_CONFIG: Record<
  OrderStatusType,
  { label: string; icon: string; color: string; bgColor: string }
> = {
  pending_payment: {
    label: "Awaiting Payment",
    icon: "💳",
    color: "text-yellow-700",
    bgColor: "bg-yellow-100",
  },
  payment_received: {
    label: "Payment Received",
    icon: "✅",
    color: "text-green-700",
    bgColor: "bg-green-100",
  },
  generating_pdfs: {
    label: "Creating Your Book",
    icon: "📄",
    color: "text-blue-700",
    bgColor: "bg-blue-100",
  },
  submitting_to_lulu: {
    label: "Submitting to Printer",
    icon: "📤",
    color: "text-purple-700",
    bgColor: "bg-purple-100",
  },
  submitted: {
    label: "Sent to Printer",
    icon: "🖨️",
    color: "text-purple-700",
    bgColor: "bg-purple-100",
  },
  in_production: {
    label: "Printing",
    icon: "📖",
    color: "text-indigo-700",
    bgColor: "bg-indigo-100",
  },
  shipped: {
    label: "Shipped",
    icon: "📦",
    color: "text-teal-700",
    bgColor: "bg-teal-100",
  },
  delivered: {
    label: "Delivered",
    icon: "🎉",
    color: "text-green-700",
    bgColor: "bg-green-100",
  },
  failed: {
    label: "Issue with Order",
    icon: "⚠️",
    color: "text-red-700",
    bgColor: "bg-red-100",
  },
};

// Progress steps for the timeline — matches schema status flow
const PROGRESS_STEPS: OrderStatusType[] = [
  "payment_received",
  "generating_pdfs",
  "submitting_to_lulu",
  "submitted",
  "in_production",
  "shipped",
  "delivered",
];

export function OrderStatusBadge({ status, compact }: OrderStatusProps) {
  const config = STATUS_CONFIG[status];

  if (compact) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-sm font-medium ${config.bgColor} ${config.color}`}
      >
        <span>{config.icon}</span>
        <span>{config.label}</span>
      </span>
    );
  }

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 rounded-xl ${config.bgColor}`}
    >
      <span className="text-2xl">{config.icon}</span>
      <div>
        <p className={`font-semibold ${config.color}`}>{config.label}</p>
        <p className="text-sm text-gray-600">
          {getStatusDescription(status)}
        </p>
      </div>
    </div>
  );
}

function getStatusDescription(status: OrderStatusType): string {
  switch (status) {
    case "pending_payment":
      return "Complete your payment to start the printing process";
    case "payment_received":
      return "Thank you! We're preparing your book";
    case "generating_pdfs":
      return "Creating a print-ready version of your book";
    case "submitting_to_lulu":
      return "Sending your book to our print partner";
    case "submitted":
      return "Your book has been sent to our print partner";
    case "in_production":
      return "Your book is being printed with care";
    case "shipped":
      return "Your book is on its way to you!";
    case "delivered":
      return "Your book has arrived. Enjoy!";
    case "failed":
      return "Something went wrong. Please contact support.";
  }
}

export function OrderStatusTimeline({ status }: { status: OrderStatusType }) {
  const currentIndex = PROGRESS_STEPS.indexOf(status);
  const isFailed = status === "failed";
  const isPending = status === "pending_payment";

  return (
    <div className="py-4">
      <div className="relative">
        {/* Progress line */}
        <div className="absolute top-4 left-4 right-4 h-1 bg-gray-200 rounded-full" />
        <div
          className="absolute top-4 left-4 h-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-500"
          style={{
            width: isPending
              ? "0%"
              : `${Math.max(0, (currentIndex / (PROGRESS_STEPS.length - 1)) * 100)}%`,
          }}
        />

        {/* Steps */}
        <div className="relative flex justify-between">
          {PROGRESS_STEPS.map((step, index) => {
            const isComplete = !isPending && currentIndex >= index;
            const isCurrent = step === status;
            const stepConfig = STATUS_CONFIG[step];

            return (
              <div key={step} className="flex flex-col items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm transition-all ${
                    isFailed && isCurrent
                      ? "bg-red-500 text-white"
                      : isComplete
                        ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                        : "bg-gray-200 text-gray-500"
                  }`}
                >
                  {isComplete ? "✓" : index + 1}
                </div>
                <p
                  className={`mt-2 text-xs text-center max-w-16 ${
                    isCurrent ? "font-semibold text-purple-700" : "text-gray-500"
                  }`}
                >
                  {stepConfig.label.split(" ")[0]}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function OrderStatusCard({
  status,
  trackingNumber,
  estimatedDelivery,
}: {
  status: OrderStatusType;
  trackingNumber?: string;
  estimatedDelivery?: string;
}) {
  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-4">
        <h2 className="text-white font-bold text-lg">Order Status</h2>
      </div>

      {/* Status badge */}
      <div className="p-6">
        <OrderStatusBadge status={status} />

        {/* Timeline */}
        {status !== "pending_payment" && status !== "failed" && (
          <div className="mt-6">
            <OrderStatusTimeline status={status} />
          </div>
        )}

        {/* Tracking info */}
        {trackingNumber && status === "shipped" && (
          <div className="mt-6 p-4 bg-teal-50 rounded-xl">
            <p className="text-sm text-teal-700 font-medium">Tracking Number</p>
            <p className="text-teal-900 font-mono text-lg">{trackingNumber}</p>
          </div>
        )}

        {/* Estimated delivery */}
        {estimatedDelivery && ["in_production", "shipped"].includes(status) && (
          <div className="mt-4 p-4 bg-purple-50 rounded-xl">
            <p className="text-sm text-purple-700 font-medium">
              Estimated Delivery
            </p>
            <p className="text-purple-900 font-semibold">{estimatedDelivery}</p>
          </div>
        )}

        {/* Failed state action */}
        {status === "failed" && (
          <div className="mt-6">
            <button className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 rounded-xl transition-colors">
              Contact Support
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

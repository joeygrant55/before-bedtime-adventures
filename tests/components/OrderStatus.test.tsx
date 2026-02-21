import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { OrderStatusBadge, OrderStatusTimeline, OrderStatusCard } from "@/components/OrderStatus";

describe("OrderStatusBadge", () => {
  it("renders pending payment status", () => {
    render(<OrderStatusBadge status="pending_payment" />);
    expect(screen.getByText("Awaiting Payment")).toBeInTheDocument();
    expect(screen.getByText("💳")).toBeInTheDocument();
  });

  it("renders payment received status", () => {
    render(<OrderStatusBadge status="payment_received" />);
    expect(screen.getByText("Payment Received")).toBeInTheDocument();
    expect(screen.getByText("✅")).toBeInTheDocument();
  });

  it("renders generating pdfs status", () => {
    render(<OrderStatusBadge status="generating_pdfs" />);
    expect(screen.getByText("Creating Your Book")).toBeInTheDocument();
    expect(screen.getByText("📄")).toBeInTheDocument();
  });

  it("renders submitting to lulu status", () => {
    render(<OrderStatusBadge status="submitting_to_lulu" />);
    expect(screen.getByText("Submitting to Printer")).toBeInTheDocument();
    expect(screen.getByText("📤")).toBeInTheDocument();
  });

  it("renders submitted status", () => {
    render(<OrderStatusBadge status="submitted" />);
    expect(screen.getByText("Sent to Printer")).toBeInTheDocument();
    expect(screen.getByText("🖨️")).toBeInTheDocument();
  });

  it("renders in_production status", () => {
    render(<OrderStatusBadge status="in_production" />);
    expect(screen.getByText("Printing")).toBeInTheDocument();
    expect(screen.getByText("📖")).toBeInTheDocument();
  });

  it("renders shipped status", () => {
    render(<OrderStatusBadge status="shipped" />);
    expect(screen.getByText("Shipped")).toBeInTheDocument();
    expect(screen.getByText("📦")).toBeInTheDocument();
  });

  it("renders delivered status", () => {
    render(<OrderStatusBadge status="delivered" />);
    expect(screen.getByText("Delivered")).toBeInTheDocument();
    expect(screen.getByText("🎉")).toBeInTheDocument();
  });

  it("renders failed status", () => {
    render(<OrderStatusBadge status="failed" />);
    expect(screen.getByText("Issue with Order")).toBeInTheDocument();
    expect(screen.getByText("⚠️")).toBeInTheDocument();
  });

  it("renders compact variant", () => {
    const { container } = render(<OrderStatusBadge status="shipped" compact />);
    // Compact variant uses inline-flex
    expect(container.querySelector(".inline-flex")).toBeInTheDocument();
  });

  it("renders full variant with description", () => {
    render(<OrderStatusBadge status="shipped" />);
    expect(screen.getByText("Your book is on its way to you!")).toBeInTheDocument();
  });
});

describe("OrderStatusTimeline", () => {
  it("renders all progress steps", () => {
    render(<OrderStatusTimeline status="payment_received" />);
    // Should show step numbers or checkmarks
    expect(screen.getByText("✓")).toBeInTheDocument();
  });

  it("shows checkmarks for completed steps", () => {
    render(<OrderStatusTimeline status="shipped" />);
    // Multiple completed steps should show checkmarks
    const checkmarks = screen.getAllByText("✓");
    expect(checkmarks.length).toBeGreaterThanOrEqual(1);
  });

  it("highlights current step", () => {
    render(<OrderStatusTimeline status="in_production" />);
    // The "Printing" label should be present
    expect(screen.getByText("Printing")).toBeInTheDocument();
  });
});

describe("OrderStatusCard", () => {
  it("renders order status header", () => {
    render(<OrderStatusCard status="payment_received" />);
    expect(screen.getByText("Order Status")).toBeInTheDocument();
  });

  it("shows tracking info when shipped", () => {
    render(
      <OrderStatusCard
        status="shipped"
        trackingNumber="1Z999AA10123456784"
      />
    );
    expect(screen.getByText("Tracking Number")).toBeInTheDocument();
    expect(screen.getByText("1Z999AA10123456784")).toBeInTheDocument();
  });

  it("does not show tracking when not shipped", () => {
    render(
      <OrderStatusCard
        status="in_production"
        trackingNumber="1Z999AA10123456784"
      />
    );
    expect(screen.queryByText("Tracking Number")).not.toBeInTheDocument();
  });

  it("shows estimated delivery when printing or shipped", () => {
    render(
      <OrderStatusCard
        status="in_production"
        estimatedDelivery="January 15, 2025"
      />
    );
    expect(screen.getByText("Estimated Delivery")).toBeInTheDocument();
    expect(screen.getByText("January 15, 2025")).toBeInTheDocument();
  });

  it("shows contact support button when failed", () => {
    render(<OrderStatusCard status="failed" />);
    expect(screen.getByText("Contact Support")).toBeInTheDocument();
  });

  it("hides timeline for pending_payment", () => {
    const { container } = render(<OrderStatusCard status="pending_payment" />);
    // Timeline steps shouldn't be visible for pending payment
    expect(screen.queryByText("✓")).not.toBeInTheDocument();
  });

  it("hides timeline for failed status", () => {
    const { container } = render(<OrderStatusCard status="failed" />);
    // Timeline shouldn't show completed steps for failed orders
    expect(screen.queryByText("✓")).not.toBeInTheDocument();
  });
});

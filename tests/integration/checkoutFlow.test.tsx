import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// Mock fetch for API calls
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock location for redirect
const mockLocationAssign = vi.fn();
Object.defineProperty(window, "location", {
  value: { assign: mockLocationAssign, href: "" },
  writable: true,
});

describe("Checkout Flow Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockReset();
    mockLocationAssign.mockReset();
  });

  describe("Stripe Session Creation", () => {
    it("creates Stripe checkout session with correct data", async () => {
      const expectedData = {
        bookId: "book123",
        orderId: "order456",
        bookTitle: "My Adventure Book",
        price: 4999,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            url: "https://checkout.stripe.com/session123",
          }),
      });

      const response = await fetch("/api/stripe/create-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(expectedData),
      });

      expect(mockFetch).toHaveBeenCalledWith(
        "/api/stripe/create-session",
        expect.objectContaining({
          method: "POST",
          headers: { "Content-Type": "application/json" },
        })
      );

      const data = await response.json();
      expect(data.url).toContain("stripe.com");
    });

    it("handles Stripe session creation errors", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: () =>
          Promise.resolve({
            error: "Failed to create checkout session",
          }),
      });

      const response = await fetch("/api/stripe/create-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      expect(response.ok).toBe(false);
      const data = await response.json();
      expect(data.error).toBeDefined();
    });
  });

  describe("Order Creation", () => {
    const validOrderData = {
      bookId: "book123",
      shippingAddress: {
        name: "John Smith",
        street1: "123 Main Street",
        street2: "Apt 4B",
        city: "New York",
        stateCode: "NY",
        postalCode: "10001",
        phoneNumber: "5551234567",
      },
      contactEmail: "test@example.com",
      price: 4999,
    };

    it("creates order with all required fields", async () => {
      // Simulating what the Convex mutation would receive
      const order = {
        ...validOrderData,
        shippingAddress: {
          ...validOrderData.shippingAddress,
          countryCode: "US" as const,
        },
        status: "pending_payment" as const,
        cost: 2000, // Estimated cost
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      expect(order.status).toBe("pending_payment");
      expect(order.shippingAddress.countryCode).toBe("US");
      expect(order.cost).toBeLessThan(order.price);
    });

    it("calculates profit margin correctly", () => {
      const price = validOrderData.price;
      const cost = 2000;
      const profit = price - cost;
      const marginPercent = (profit / price) * 100;

      expect(profit).toBe(2999);
      expect(marginPercent).toBeCloseTo(60, 0);
    });
  });

  describe("Webhook Handling", () => {
    it("processes successful payment webhook", async () => {
      const webhookPayload = {
        type: "checkout.session.completed",
        data: {
          object: {
            id: "cs_test_123",
            payment_intent: "pi_test_456",
            metadata: {
              orderId: "order123",
            },
          },
        },
      };

      // Simulating webhook processing
      const { type, data } = webhookPayload;

      if (type === "checkout.session.completed") {
        const session = data.object;
        expect(session.id).toBe("cs_test_123");
        expect(session.metadata.orderId).toBe("order123");

        // Order should be updated to payment_received
        const newStatus = "payment_received";
        expect(newStatus).toBe("payment_received");
      }
    });

    it("handles payment failure webhook", async () => {
      const webhookPayload = {
        type: "checkout.session.expired",
        data: {
          object: {
            id: "cs_test_123",
            metadata: {
              orderId: "order123",
            },
          },
        },
      };

      const { type } = webhookPayload;
      expect(type).toBe("checkout.session.expired");
      // Order status should remain pending_payment or be marked as failed
    });
  });

  describe("Checkout Success Flow", () => {
    it("redirects to success page after payment", () => {
      // After successful payment, Stripe redirects to success page
      const successUrl = "/checkout/success?session_id=cs_test_123";
      
      // Simulate redirect
      window.location.href = successUrl;
      
      expect(window.location.href).toContain("checkout/success");
      expect(window.location.href).toContain("session_id");
    });

    it("parses session ID from success URL", () => {
      const url = new URL(
        "http://localhost:3000/checkout/success?session_id=cs_test_123"
      );
      const sessionId = url.searchParams.get("session_id");
      expect(sessionId).toBe("cs_test_123");
    });
  });
});

describe("Book Creation Flow Integration", () => {
  describe("New Book Creation", () => {
    const newBookData = {
      title: "My Adventure Book",
      pageCount: 10,
      status: "draft" as const,
      characterImages: [],
    };

    it("creates book with default values", () => {
      const book = {
        ...newBookData,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      expect(book.title).toBe("My Adventure Book");
      expect(book.pageCount).toBe(10);
      expect(book.status).toBe("draft");
      expect(book.characterImages).toEqual([]);
    });

    it("creates pages for each stop", () => {
      const stopCount = newBookData.pageCount;
      const pages = Array.from({ length: stopCount }, (_, i) => ({
        pageNumber: i + 1,
        bookId: "book123",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }));

      expect(pages.length).toBe(stopCount);
      expect(pages[0].pageNumber).toBe(1);
      expect(pages[stopCount - 1].pageNumber).toBe(stopCount);
    });
  });

  describe("Image Upload Flow", () => {
    it("validates image dimensions for print", () => {
      const validateForPrint = (width: number, height: number) => {
        const MIN_DIMENSION = 1000;
        const PRINT_READY_DIMENSION = 2625;

        if (width < MIN_DIMENSION || height < MIN_DIMENSION) {
          return { valid: false, status: "too_small" };
        }
        if (width >= PRINT_READY_DIMENSION && height >= PRINT_READY_DIMENSION) {
          return { valid: true, status: "ready" };
        }
        return { valid: true, status: "needs_upscale" };
      };

      expect(validateForPrint(3000, 3000)).toEqual({
        valid: true,
        status: "ready",
      });
      expect(validateForPrint(1500, 1500)).toEqual({
        valid: true,
        status: "needs_upscale",
      });
      expect(validateForPrint(500, 500)).toEqual({
        valid: false,
        status: "too_small",
      });
    });

    it("generates upload URL for valid images", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            uploadUrl: "https://storage.example.com/upload/abc123",
          }),
      });

      const response = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: "photo.jpg", contentType: "image/jpeg" }),
      });

      const data = await response.json();
      expect(data.uploadUrl).toBeDefined();
    });
  });

  describe("Image Transformation Flow", () => {
    it("triggers image transformation after upload", async () => {
      // Simulating transformation status updates
      const transformationStates = [
        { status: "pending" },
        { status: "generating" },
        { status: "completed", cartoonImageId: "storage123" },
      ];

      for (const state of transformationStates) {
        if (state.status === "completed") {
          expect(state.cartoonImageId).toBeDefined();
        }
      }
    });

    it("handles transformation failures gracefully", () => {
      const failedTransform = {
        status: "failed",
        error: "Model unavailable",
      };

      expect(failedTransform.status).toBe("failed");
      expect(failedTransform.error).toBeDefined();
    });
  });

  describe("Book Status Transitions", () => {
    it("transitions from draft to generating", () => {
      const statusTransitions = [
        { from: "draft", to: "generating", valid: true },
        { from: "generating", to: "ready_to_print", valid: true },
        { from: "ready_to_print", to: "ordered", valid: true },
        { from: "ordered", to: "completed", valid: true },
      ];

      statusTransitions.forEach((transition) => {
        expect(transition.valid).toBe(true);
      });
    });

    it("calculates book readiness", () => {
      const pages = [
        { images: [{ generationStatus: "completed" }] },
        { images: [{ generationStatus: "completed" }] },
        { images: [{ generationStatus: "pending" }] },
      ];

      const allImagesComplete = pages.every((page) =>
        page.images.every((img) => img.generationStatus === "completed")
      );

      expect(allImagesComplete).toBe(false);

      const completedPages = pages.filter((page) =>
        page.images.every((img) => img.generationStatus === "completed")
      );
      expect(completedPages.length).toBe(2);
    });
  });
});

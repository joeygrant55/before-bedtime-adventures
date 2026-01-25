import { describe, it, expect } from "vitest";

// Order status types matching the schema
type OrderStatusType =
  | "pending_payment"
  | "payment_received"
  | "generating_pdf"
  | "submitted_to_lulu"
  | "printing"
  | "shipped"
  | "delivered"
  | "failed";

// Status helpers that could be extracted to a utility file
const STATUS_ORDER: Record<OrderStatusType, number> = {
  pending_payment: 0,
  payment_received: 1,
  generating_pdf: 2,
  submitted_to_lulu: 3,
  printing: 4,
  shipped: 5,
  delivered: 6,
  failed: -1,
};

const PROGRESS_STEPS: OrderStatusType[] = [
  "payment_received",
  "generating_pdf",
  "submitted_to_lulu",
  "printing",
  "shipped",
  "delivered",
];

function isStatusComplete(
  currentStatus: OrderStatusType,
  checkStatus: OrderStatusType
): boolean {
  if (currentStatus === "failed") return false;
  return STATUS_ORDER[currentStatus] >= STATUS_ORDER[checkStatus];
}

function getStatusProgress(status: OrderStatusType): number {
  if (status === "pending_payment" || status === "failed") return 0;
  const index = PROGRESS_STEPS.indexOf(status);
  if (index === -1) return 0;
  return ((index + 1) / PROGRESS_STEPS.length) * 100;
}

function canTrackShipment(status: OrderStatusType): boolean {
  return status === "shipped" || status === "delivered";
}

function isOrderFinished(status: OrderStatusType): boolean {
  return status === "delivered" || status === "failed";
}

function getNextStatus(status: OrderStatusType): OrderStatusType | null {
  if (status === "failed" || status === "delivered") return null;
  if (status === "pending_payment") return "payment_received";
  const index = PROGRESS_STEPS.indexOf(status);
  if (index === -1 || index >= PROGRESS_STEPS.length - 1) return null;
  return PROGRESS_STEPS[index + 1];
}

describe("Order Status Helpers", () => {
  describe("isStatusComplete", () => {
    it("returns true for completed steps", () => {
      expect(isStatusComplete("shipped", "payment_received")).toBe(true);
      expect(isStatusComplete("shipped", "printing")).toBe(true);
      expect(isStatusComplete("delivered", "shipped")).toBe(true);
    });

    it("returns false for incomplete steps", () => {
      expect(isStatusComplete("payment_received", "shipped")).toBe(false);
      expect(isStatusComplete("printing", "delivered")).toBe(false);
    });

    it("returns false for failed status", () => {
      expect(isStatusComplete("failed", "payment_received")).toBe(false);
    });

    it("returns true for same status", () => {
      expect(isStatusComplete("printing", "printing")).toBe(true);
    });
  });

  describe("getStatusProgress", () => {
    it("returns 0 for pending_payment", () => {
      expect(getStatusProgress("pending_payment")).toBe(0);
    });

    it("returns 0 for failed", () => {
      expect(getStatusProgress("failed")).toBe(0);
    });

    it("returns increasing progress for each step", () => {
      const progress1 = getStatusProgress("payment_received");
      const progress2 = getStatusProgress("printing");
      const progress3 = getStatusProgress("delivered");

      expect(progress1).toBeGreaterThan(0);
      expect(progress2).toBeGreaterThan(progress1);
      expect(progress3).toBe(100);
    });
  });

  describe("canTrackShipment", () => {
    it("returns true for shipped status", () => {
      expect(canTrackShipment("shipped")).toBe(true);
    });

    it("returns true for delivered status", () => {
      expect(canTrackShipment("delivered")).toBe(true);
    });

    it("returns false for other statuses", () => {
      expect(canTrackShipment("pending_payment")).toBe(false);
      expect(canTrackShipment("printing")).toBe(false);
      expect(canTrackShipment("failed")).toBe(false);
    });
  });

  describe("isOrderFinished", () => {
    it("returns true for delivered", () => {
      expect(isOrderFinished("delivered")).toBe(true);
    });

    it("returns true for failed", () => {
      expect(isOrderFinished("failed")).toBe(true);
    });

    it("returns false for in-progress statuses", () => {
      expect(isOrderFinished("pending_payment")).toBe(false);
      expect(isOrderFinished("payment_received")).toBe(false);
      expect(isOrderFinished("printing")).toBe(false);
      expect(isOrderFinished("shipped")).toBe(false);
    });
  });

  describe("getNextStatus", () => {
    it("returns next status in sequence", () => {
      expect(getNextStatus("pending_payment")).toBe("payment_received");
      expect(getNextStatus("payment_received")).toBe("generating_pdf");
      expect(getNextStatus("printing")).toBe("shipped");
      expect(getNextStatus("shipped")).toBe("delivered");
    });

    it("returns null for terminal states", () => {
      expect(getNextStatus("delivered")).toBe(null);
      expect(getNextStatus("failed")).toBe(null);
    });
  });
});

describe("Price Calculations", () => {
  const BOOK_PRICE_CENTS = 4999; // $49.99
  const ESTIMATED_COST_CENTS = 2000; // $20.00 (print + shipping)

  it("calculates profit margin correctly", () => {
    const profit = BOOK_PRICE_CENTS - ESTIMATED_COST_CENTS;
    expect(profit).toBe(2999); // $29.99 margin
  });

  it("formats price for display correctly", () => {
    const formatted = (BOOK_PRICE_CENTS / 100).toFixed(2);
    expect(formatted).toBe("49.99");
  });

  it("calculates margin percentage", () => {
    const marginPercent = ((BOOK_PRICE_CENTS - ESTIMATED_COST_CENTS) / BOOK_PRICE_CENTS) * 100;
    expect(marginPercent).toBeCloseTo(60, 0); // ~60% margin
  });
});

describe("Shipping Address Validation", () => {
  const validateZipCode = (zip: string): boolean => {
    return /^\d{5}(-\d{4})?$/.test(zip.trim());
  };

  const validatePhoneNumber = (phone: string): boolean => {
    const digits = phone.replace(/\D/g, "");
    return digits.length >= 10;
  };

  const formatPhoneNumber = (phone: string): string => {
    const digits = phone.replace(/\D/g, "");
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
  };

  describe("validateZipCode", () => {
    it("accepts valid 5-digit zip codes", () => {
      expect(validateZipCode("10001")).toBe(true);
      expect(validateZipCode("90210")).toBe(true);
    });

    it("accepts valid 5+4 zip codes", () => {
      expect(validateZipCode("10001-1234")).toBe(true);
    });

    it("rejects invalid zip codes", () => {
      expect(validateZipCode("1234")).toBe(false);
      expect(validateZipCode("123456")).toBe(false);
      expect(validateZipCode("ABCDE")).toBe(false);
      expect(validateZipCode("")).toBe(false);
    });
  });

  describe("validatePhoneNumber", () => {
    it("accepts valid phone numbers", () => {
      expect(validatePhoneNumber("(555) 123-4567")).toBe(true);
      expect(validatePhoneNumber("5551234567")).toBe(true);
      expect(validatePhoneNumber("555-123-4567")).toBe(true);
    });

    it("rejects invalid phone numbers", () => {
      expect(validatePhoneNumber("123456789")).toBe(false);
      expect(validatePhoneNumber("")).toBe(false);
    });
  });

  describe("formatPhoneNumber", () => {
    it("formats phone numbers correctly", () => {
      expect(formatPhoneNumber("5551234567")).toBe("(555) 123-4567");
      expect(formatPhoneNumber("555")).toBe("555");
      expect(formatPhoneNumber("555123")).toBe("(555) 123");
    });
  });
});

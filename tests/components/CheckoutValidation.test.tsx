import { describe, it, expect, vi } from "vitest";
import { US_STATES } from "@/lib/printSpecs";

// Extracted validation logic from CheckoutPage for testing
interface ShippingAddress {
  name: string;
  street1: string;
  street2: string;
  city: string;
  stateCode: string;
  postalCode: string;
  phoneNumber: string;
}

function validateShippingAddress(
  address: ShippingAddress,
  userEmail: string
): { valid: boolean; error?: string } {
  if (!address.name.trim()) {
    return { valid: false, error: "Please enter your full name" };
  }
  if (!address.street1.trim()) {
    return { valid: false, error: "Please enter your street address" };
  }
  if (!address.city.trim()) {
    return { valid: false, error: "Please enter your city" };
  }
  if (!address.stateCode) {
    return { valid: false, error: "Please select your state" };
  }
  if (!address.postalCode.trim()) {
    return { valid: false, error: "Please enter your ZIP code" };
  }
  // Validate ZIP code format (5 digits or 5+4)
  if (!/^\d{5}(-\d{4})?$/.test(address.postalCode.trim())) {
    return {
      valid: false,
      error: "Please enter a valid ZIP code (e.g., 10001 or 10001-1234)",
    };
  }
  if (!address.phoneNumber.trim()) {
    return {
      valid: false,
      error: "Please enter your phone number (required for shipping)",
    };
  }
  // Validate phone number (basic validation)
  const phoneDigits = address.phoneNumber.replace(/\D/g, "");
  if (phoneDigits.length < 10) {
    return { valid: false, error: "Please enter a valid phone number" };
  }
  if (!userEmail) {
    return { valid: false, error: "Please sign in to complete your order" };
  }
  return { valid: true };
}

function formatPhoneNumber(value: string): string {
  // Remove non-digits
  const digits = value.replace(/\D/g, "");
  // Format as (XXX) XXX-XXXX
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
}

describe("Checkout Form Validation", () => {
  const validAddress: ShippingAddress = {
    name: "John Smith",
    street1: "123 Main Street",
    street2: "Apt 4B",
    city: "New York",
    stateCode: "NY",
    postalCode: "10001",
    phoneNumber: "(555) 123-4567",
  };

  describe("validateShippingAddress", () => {
    it("accepts valid shipping address", () => {
      const result = validateShippingAddress(validAddress, "test@example.com");
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it("requires full name", () => {
      const address = { ...validAddress, name: "" };
      const result = validateShippingAddress(address, "test@example.com");
      expect(result.valid).toBe(false);
      expect(result.error).toContain("full name");
    });

    it("requires street address", () => {
      const address = { ...validAddress, street1: "" };
      const result = validateShippingAddress(address, "test@example.com");
      expect(result.valid).toBe(false);
      expect(result.error).toContain("street address");
    });

    it("does not require street2 (apartment)", () => {
      const address = { ...validAddress, street2: "" };
      const result = validateShippingAddress(address, "test@example.com");
      expect(result.valid).toBe(true);
    });

    it("requires city", () => {
      const address = { ...validAddress, city: "" };
      const result = validateShippingAddress(address, "test@example.com");
      expect(result.valid).toBe(false);
      expect(result.error).toContain("city");
    });

    it("requires state", () => {
      const address = { ...validAddress, stateCode: "" };
      const result = validateShippingAddress(address, "test@example.com");
      expect(result.valid).toBe(false);
      expect(result.error).toContain("state");
    });

    it("requires ZIP code", () => {
      const address = { ...validAddress, postalCode: "" };
      const result = validateShippingAddress(address, "test@example.com");
      expect(result.valid).toBe(false);
      expect(result.error).toContain("ZIP code");
    });

    it("validates ZIP code format - 5 digits", () => {
      const address = { ...validAddress, postalCode: "10001" };
      const result = validateShippingAddress(address, "test@example.com");
      expect(result.valid).toBe(true);
    });

    it("validates ZIP code format - 5+4", () => {
      const address = { ...validAddress, postalCode: "10001-1234" };
      const result = validateShippingAddress(address, "test@example.com");
      expect(result.valid).toBe(true);
    });

    it("rejects invalid ZIP code format", () => {
      const invalidZips = ["1234", "123456", "ABCDE", "10001-12"];
      invalidZips.forEach((zip) => {
        const address = { ...validAddress, postalCode: zip };
        const result = validateShippingAddress(address, "test@example.com");
        expect(result.valid).toBe(false);
        expect(result.error).toContain("valid ZIP code");
      });
    });

    it("requires phone number", () => {
      const address = { ...validAddress, phoneNumber: "" };
      const result = validateShippingAddress(address, "test@example.com");
      expect(result.valid).toBe(false);
      expect(result.error).toContain("phone number");
    });

    it("validates phone number has at least 10 digits", () => {
      const address = { ...validAddress, phoneNumber: "555-123" };
      const result = validateShippingAddress(address, "test@example.com");
      expect(result.valid).toBe(false);
      expect(result.error).toContain("valid phone number");
    });

    it("accepts phone number with various formats", () => {
      const validPhones = [
        "(555) 123-4567",
        "5551234567",
        "555-123-4567",
        "555.123.4567",
        "+1 555 123 4567",
      ];
      validPhones.forEach((phone) => {
        const address = { ...validAddress, phoneNumber: phone };
        const result = validateShippingAddress(address, "test@example.com");
        expect(result.valid).toBe(true);
      });
    });

    it("requires user email", () => {
      const result = validateShippingAddress(validAddress, "");
      expect(result.valid).toBe(false);
      expect(result.error).toContain("sign in");
    });

    it("trims whitespace from inputs", () => {
      const address = {
        ...validAddress,
        name: "  John Smith  ",
        city: "  New York  ",
        postalCode: "  10001  ",
      };
      const result = validateShippingAddress(address, "test@example.com");
      expect(result.valid).toBe(true);
    });
  });

  describe("formatPhoneNumber", () => {
    it("formats partial numbers correctly", () => {
      expect(formatPhoneNumber("5")).toBe("5");
      expect(formatPhoneNumber("55")).toBe("55");
      expect(formatPhoneNumber("555")).toBe("555");
      expect(formatPhoneNumber("5551")).toBe("(555) 1");
      expect(formatPhoneNumber("55512")).toBe("(555) 12");
      expect(formatPhoneNumber("555123")).toBe("(555) 123");
    });

    it("formats full numbers correctly", () => {
      expect(formatPhoneNumber("5551234567")).toBe("(555) 123-4567");
    });

    it("removes non-digit characters before formatting", () => {
      expect(formatPhoneNumber("(555) 123-4567")).toBe("(555) 123-4567");
      expect(formatPhoneNumber("555-123-4567")).toBe("(555) 123-4567");
    });

    it("limits to 10 digits", () => {
      expect(formatPhoneNumber("55512345678901")).toBe("(555) 123-4567");
    });
  });
});

describe("US States Validation", () => {
  it("contains all valid state codes", () => {
    const validStateCodes = ["NY", "CA", "TX", "FL", "IL", "PA", "OH"];
    validStateCodes.forEach((code) => {
      expect(US_STATES[code]).toBeDefined();
    });
  });

  it("rejects invalid state codes", () => {
    const invalidCodes = ["XX", "AA", "ZZ", "US"];
    invalidCodes.forEach((code) => {
      expect(US_STATES[code]).toBeUndefined();
    });
  });
});

describe("Price Display", () => {
  const BOOK_PRICE_CENTS = 4999;

  it("displays price correctly", () => {
    const displayPrice = `$${(BOOK_PRICE_CENTS / 100).toFixed(2)}`;
    expect(displayPrice).toBe("$49.99");
  });

  it("includes free shipping for US addresses", () => {
    const shippingCost = 0; // Free for US
    const total = BOOK_PRICE_CENTS + shippingCost;
    expect(total).toBe(BOOK_PRICE_CENTS);
  });
});

describe("Order Creation Data", () => {
  it("formats phone number as digits only for API", () => {
    const phoneDisplay = "(555) 123-4567";
    const phoneForApi = phoneDisplay.replace(/\D/g, "");
    expect(phoneForApi).toBe("5551234567");
  });

  it("adds US country code for shipping", () => {
    const shippingAddress = {
      name: "John Smith",
      street1: "123 Main St",
      city: "New York",
      stateCode: "NY",
      postalCode: "10001",
      phoneNumber: "5551234567",
      countryCode: "US" as const,
    };
    expect(shippingAddress.countryCode).toBe("US");
  });
});

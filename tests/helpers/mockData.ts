/**
 * Test Helpers and Mock Data
 * Shared utilities for testing Before Bedtime Adventures
 */

import type { Doc, Id } from "@/convex/_generated/dataModel";

// Type helpers - create mock IDs for testing
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const createMockId = <T extends string>(table: T, suffix: string = "123"): Id<any> => {
  return `mock_${table}_${suffix}` as Id<any>;
};

// Mock User
export const mockUser: Doc<"users"> = {
  _id: createMockId("users", "user123"),
  _creationTime: Date.now(),
  clerkId: "clerk_test_user_123",
  email: "test@example.com",
  name: "Test User",
  createdAt: Date.now(),
};

// Mock Book
export const mockBook: Doc<"books"> = {
  _id: createMockId("books", "book123"),
  _creationTime: Date.now(),
  userId: createMockId("users", "user123"),
  title: "Test Adventure Book",
  pageCount: 10,
  status: "ready_to_print",
  characterImages: [],
  coverDesign: {
    title: "Test Adventure Book",
    subtitle: "A magical journey",
    theme: "purple-magic",
    dedication: "For our little explorer",
  },
  printFormat: "SQUARE_85_HARDCOVER",
  printStatus: "pdfs_ready",
  printedPageCount: 24,
  createdAt: Date.now(),
  updatedAt: Date.now(),
};

// Mock Page
export const createMockPage = (
  pageNumber: number,
  bookId: Id<"books"> = createMockId("books", "book123")
): Doc<"pages"> => ({
  _id: createMockId("pages", `page${pageNumber}`),
  _creationTime: Date.now(),
  bookId,
  pageNumber,
  sortOrder: pageNumber,
  title: `Stop ${pageNumber}`,
  storyText: `This is the story for stop ${pageNumber}...`,
  spreadType: "single_image",
  createdAt: Date.now(),
  updatedAt: Date.now(),
});

// Mock Image
export const createMockImage = (
  pageId: Id<"pages">,
  status: "pending" | "generating" | "completed" | "failed" = "completed"
): Doc<"images"> => ({
  _id: createMockId("images", `img_${Date.now()}`),
  _creationTime: Date.now(),
  pageId,
  originalImageId: createMockId("_storage", "orig123"),
  cartoonImageId: status === "completed" ? createMockId("_storage", "cartoon123") : undefined,
  generationStatus: status,
  order: 1,
  createdAt: Date.now(),
  updatedAt: Date.now(),
});

// Mock Order
export const mockOrder: Doc<"printOrders"> = {
  _id: createMockId("printOrders", "order123"),
  _creationTime: Date.now(),
  bookId: createMockId("books", "book123"),
  status: "payment_received",
  cost: 2000,
  price: 4999,
  shippingAddress: {
    name: "John Smith",
    street1: "123 Main Street",
    street2: "Apt 4B",
    city: "New York",
    stateCode: "NY",
    postalCode: "10001",
    countryCode: "US",
    phoneNumber: "5551234567",
  },
  contactEmail: "test@example.com",
  createdAt: Date.now(),
  updatedAt: Date.now(),
};

// Create a full mock book with pages and images
export const createMockBookWithPages = (stopCount: number = 10) => {
  const book = { ...mockBook, pageCount: stopCount };
  const pages = Array.from({ length: stopCount }, (_, i) =>
    createMockPage(i + 1, book._id)
  );
  const pagesWithImages = pages.map((page) => ({
    ...page,
    images: [
      {
        ...createMockImage(page._id, "completed"),
        originalUrl: `https://example.com/original${page.pageNumber}.jpg`,
        cartoonUrl: `https://example.com/cartoon${page.pageNumber}.jpg`,
      },
    ],
  }));

  return { book, pages: pagesWithImages };
};

// Shipping address variations for testing
export const validShippingAddresses = [
  {
    name: "John Smith",
    street1: "123 Main Street",
    street2: "",
    city: "New York",
    stateCode: "NY",
    postalCode: "10001",
    phoneNumber: "(555) 123-4567",
  },
  {
    name: "Jane Doe",
    street1: "456 Oak Avenue",
    street2: "Suite 200",
    city: "Los Angeles",
    stateCode: "CA",
    postalCode: "90210-1234",
    phoneNumber: "555-987-6543",
  },
];

export const invalidShippingAddresses = [
  { reason: "missing name", address: { ...validShippingAddresses[0], name: "" } },
  { reason: "missing street", address: { ...validShippingAddresses[0], street1: "" } },
  { reason: "missing city", address: { ...validShippingAddresses[0], city: "" } },
  { reason: "missing state", address: { ...validShippingAddresses[0], stateCode: "" } },
  { reason: "invalid zip", address: { ...validShippingAddresses[0], postalCode: "1234" } },
  { reason: "invalid phone", address: { ...validShippingAddresses[0], phoneNumber: "123" } },
];

// Order status flow for testing
export const orderStatusFlow = [
  "pending_payment",
  "payment_received",
  "generating_pdfs",
  "submitting_to_lulu",
  "submitted",
  "in_production",
  "shipped",
  "delivered",
] as const;

// Test utilities
export const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const waitForCondition = async (
  condition: () => boolean,
  timeout: number = 5000,
  interval: number = 100
): Promise<boolean> => {
  const startTime = Date.now();
  while (Date.now() - startTime < timeout) {
    if (condition()) return true;
    await delay(interval);
  }
  return false;
};

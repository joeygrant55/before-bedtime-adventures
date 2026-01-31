/**
 * Test Book Fixture
 * 
 * Creates a test book with sample data for e2e tests.
 * This is the foundation for all BBA testing - creates a real book
 * that tests can interact with.
 */

import { ConvexHttpClient } from 'convex/browser';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL || 'https://cheery-bison-804.convex.cloud';

let testBookId: Id<"books"> | null = null;
let testUserId: string | null = null;

/**
 * Create a test book with sample data
 */
export async function createTestBook(): Promise<Id<"books">> {
  if (testBookId) {
    return testBookId;
  }

  const client = new ConvexHttpClient(CONVEX_URL);
  
  // For e2e tests, we use a test user ID
  // In production tests, you'd authenticate properly
  testUserId = 'test-user-playwright';

  try {
    // Create a book via Convex
    testBookId = await client.mutation(api.books.createBook, {
      clerkId: testUserId,
      title: 'Playwright Test Book',
      description: 'A test book for automated testing',
    });

    // Add some test pages
    await client.mutation(api.pages.createPage, {
      bookId: testBookId,
      pageNumber: 1,
      storyText: 'Once upon a time, there was a test...',
    });

    await client.mutation(api.pages.createPage, {
      bookId: testBookId,
      pageNumber: 2,
      storyText: 'The test continued with automation...',
    });

    // Initialize cover design
    await client.mutation(api.books.updateCoverDesign, {
      clerkId: testUserId,
      bookId: testBookId,
      coverDesign: {
        title: 'Test Book',
        subtitle: 'Playwright Edition',
        theme: 'purple-magic',
      },
    });

    console.log(`✅ Created test book: ${testBookId}`);
    return testBookId;
  } catch (error) {
    console.error('Failed to create test book:', error);
    throw error;
  }
}

/**
 * Get existing test book ID
 */
export function getTestBookId(): Id<"books"> | null {
  return testBookId;
}

/**
 * Clean up test book after tests
 */
export async function cleanupTestBook(): Promise<void> {
  if (!testBookId) return;

  const client = new ConvexHttpClient(CONVEX_URL);

  try {
    // Delete the test book
    // Note: Convex doesn't have a built-in delete, you'd need to add this mutation
    // For now, we'll leave it (test books can be cleaned up manually or via a cleanup script)
    console.log(`🧹 Test book ${testBookId} cleanup (manual cleanup required)`);
    testBookId = null;
    testUserId = null;
  } catch (error) {
    console.error('Failed to cleanup test book:', error);
  }
}

/**
 * Create test book with mock data (doesn't hit real API)
 * Use this for faster tests that don't need real backend
 */
export function getMockTestBook() {
  return {
    id: 'mock-test-book-id',
    title: 'Mock Test Book',
    description: 'A mocked book for fast testing',
    clerkId: 'mock-user',
    coverDesign: {
      title: 'Mock Book',
      subtitle: 'Fast Tests',
      theme: 'purple-magic',
      titleFont: 'fredoka',
      titleSize: 3,
      titleColor: '#FFFFFF',
      subtitleFont: 'poppins',
      subtitleSize: 2,
      subtitleColor: '#FFF8DC',
      textPosition: 'bottom',
    },
  };
}

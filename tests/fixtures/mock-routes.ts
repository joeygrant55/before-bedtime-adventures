/**
 * Mock Routes for Playwright Tests
 * 
 * Intercepts API calls and returns mock data.
 * This allows testing UI without real backend dependencies.
 */

import type { Page, Route } from '@playwright/test';

/**
 * Mock book data
 */
export const mockBook = {
  _id: 'test-book-id-123',
  _creationTime: Date.now(),
  clerkId: 'test-user',
  title: 'Test Adventure Book',
  description: 'A test book for Playwright',
  status: 'draft',
  coverDesign: {
    title: 'Test Adventure',
    subtitle: 'Our Amazing Journey',
    authorLine: 'By the Test Family',
    theme: 'purple-magic',
    dedication: 'For our automated tests',
    titleFont: 'fredoka',
    titleSize: 3,
    titleColor: '#FFFFFF',
    subtitleFont: 'poppins',
    subtitleSize: 2,
    subtitleColor: '#FFF8DC',
    textPosition: 'bottom',
  },
};

/**
 * Mock pages with images
 */
export const mockPages = [
  {
    _id: 'page-1',
    _creationTime: Date.now(),
    bookId: 'test-book-id-123',
    pageNumber: 1,
    storyText: 'Once upon a time...',
    images: [
      {
        _id: 'img-1',
        _creationTime: Date.now(),
        pageId: 'page-1',
        generationStatus: 'completed',
        originalStorageId: 'storage-1',
        cartoonStorageId: 'storage-2',
        originalUrl: '/test-images/original-1.jpg',
        cartoonUrl: '/test-images/cartoon-1.jpg',
      },
    ],
  },
  {
    _id: 'page-2',
    _creationTime: Date.now(),
    bookId: 'test-book-id-123',
    pageNumber: 2,
    storyText: 'And they lived happily ever after.',
    images: [
      {
        _id: 'img-2',
        _creationTime: Date.now(),
        pageId: 'page-2',
        generationStatus: 'completed',
        originalStorageId: 'storage-3',
        cartoonStorageId: 'storage-4',
        originalUrl: '/test-images/original-2.jpg',
        cartoonUrl: '/test-images/cartoon-2.jpg',
      },
    ],
  },
];

/**
 * Setup page with mocked Convex API responses
 */
export async function setupMockRoutes(page: Page) {
  // Mock Convex query for getBook
  await page.route('**/api/convex/**', async (route: Route) => {
    const request = route.request();
    const postData = request.postDataJSON();

    // Convex query routing
    if (postData?.path === 'books:getBook') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ value: mockBook }),
      });
    } else if (postData?.path === 'pages:getBookPages') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ value: mockPages }),
      });
    } else if (postData?.path === 'books:updateCoverDesign') {
      // Mock successful save
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ value: null }),
      });
    } else {
      // Pass through other requests
      await route.continue();
    }
  });

  // Mock Clerk authentication
  await page.addInitScript(() => {
    // Mock Clerk user
    (window as any).__clerk_user = {
      id: 'test-user',
      emailAddresses: [{ emailAddress: 'test@example.com' }],
      firstName: 'Test',
      lastName: 'User',
    };
  });

  console.log('✅ Mock routes configured');
}

/**
 * Navigate to cover designer with mocked data
 */
export async function navigateToCoverDesigner(page: Page) {
  await setupMockRoutes(page);
  await page.goto('http://localhost:3000/books/test-book-id-123/cover');
}

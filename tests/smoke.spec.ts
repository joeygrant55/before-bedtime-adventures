import { test, expect } from '@playwright/test';

test.describe('Smoke Tests', () => {
  test('landing page loads successfully', async ({ page }) => {
    const response = await page.goto('/');
    expect(response?.status()).toBe(200);
  });

  test('sign-in page loads', async ({ page }) => {
    const response = await page.goto('/sign-in');
    expect(response?.status()).toBe(200);
  });

  test('sign-up page loads', async ({ page }) => {
    const response = await page.goto('/sign-up');
    expect(response?.status()).toBe(200);
  });

  test('protected routes redirect to sign-in', async ({ page }) => {
    // Dashboard should redirect unauthenticated users
    await page.goto('/dashboard');

    // Should be redirected to sign-in or landing
    await expect(page).toHaveURL(/sign-in|\/$/);
  });

  test('404 page handles unknown routes gracefully', async ({ page }) => {
    await page.goto('/this-page-does-not-exist-12345');

    // Should show some kind of not found or redirect
    const content = await page.content();
    const is404 = content.includes('404') || content.includes('not found') || content.includes('Not Found');
    const isRedirected = page.url().includes('sign-in') || page.url() === 'http://localhost:3000/';

    expect(is404 || isRedirected).toBeTruthy();
  });
});

test.describe('Performance', () => {
  test('landing page loads within acceptable time', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    const loadTime = Date.now() - startTime;

    // Should load DOM within 5 seconds
    expect(loadTime).toBeLessThan(5000);
  });
});

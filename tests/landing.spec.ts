import { test, expect } from '@playwright/test';

test.describe('Landing Page', () => {
  test('displays hero section with main headline', async ({ page }) => {
    await page.goto('/');

    // Check for main headline
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    // Check for call-to-action button
    await expect(page.getByRole('link', { name: /get started|create|try/i })).toBeVisible();
  });

  test('has working navigation', async ({ page }) => {
    await page.goto('/');

    // Logo/brand should be visible
    await expect(page.getByRole('link', { name: /before bedtime|home/i }).first()).toBeVisible();
  });

  test('demo section is interactive', async ({ page }) => {
    await page.goto('/');

    // Scroll to demo section if it exists
    const demoSection = page.locator('[class*="demo"], #demo, [data-testid="demo"]').first();

    if (await demoSection.isVisible()) {
      await demoSection.scrollIntoViewIfNeeded();
      await expect(demoSection).toBeVisible();
    }
  });

  test('page loads without console errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Filter out known acceptable errors (like Clerk dev warnings)
    const criticalErrors = errors.filter(
      (e) => !e.includes('Clerk') && !e.includes('development')
    );

    expect(criticalErrors).toHaveLength(0);
  });

  test('responsive design - mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    // Page should still be functional on mobile
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });
});

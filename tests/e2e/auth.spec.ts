import { test, expect } from "@playwright/test";

/**
 * E2E Test Stubs: User Authentication
 * These tests will need Clerk test mode or mocking to run properly.
 */

test.describe("User Signup", () => {
  test.skip("navigates to signup page", async ({ page }) => {
    await page.goto("/");
    // TODO: Click sign up button when Clerk is properly mocked
    // await page.click('[data-testid="signup-button"]');
    // await expect(page).toHaveURL(/sign-up/);
  });

  test.skip("completes signup flow with email", async ({ page }) => {
    await page.goto("/sign-up");
    // TODO: Fill out Clerk signup form
    // await page.fill('[name="email"]', 'test@example.com');
    // await page.fill('[name="password"]', 'SecurePassword123!');
    // await page.click('[type="submit"]');
    // await expect(page).toHaveURL('/dashboard');
  });

  test.skip("shows validation errors for invalid email", async ({ page }) => {
    await page.goto("/sign-up");
    // TODO: Test Clerk validation
    // await page.fill('[name="email"]', 'invalid-email');
    // await page.click('[type="submit"]');
    // await expect(page.locator('.error')).toBeVisible();
  });
});

test.describe("User Login", () => {
  test.skip("navigates to login page", async ({ page }) => {
    await page.goto("/");
    // TODO: Click sign in button
    // await page.click('[data-testid="signin-button"]');
    // await expect(page).toHaveURL(/sign-in/);
  });

  test.skip("logs in with valid credentials", async ({ page }) => {
    await page.goto("/sign-in");
    // TODO: Fill Clerk login form
    // await page.fill('[name="email"]', 'test@example.com');
    // await page.fill('[name="password"]', 'SecurePassword123!');
    // await page.click('[type="submit"]');
    // await expect(page).toHaveURL('/dashboard');
  });

  test.skip("shows error for invalid credentials", async ({ page }) => {
    await page.goto("/sign-in");
    // TODO: Test invalid login
    // await page.fill('[name="email"]', 'test@example.com');
    // await page.fill('[name="password"]', 'WrongPassword');
    // await page.click('[type="submit"]');
    // await expect(page.locator('.error')).toBeVisible();
  });

  test.skip("redirects to dashboard after login", async ({ page }) => {
    // TODO: Complete login flow
    // await expect(page).toHaveURL('/dashboard');
    // await expect(page.locator('h1')).toContainText('Dashboard');
  });
});

test.describe("User Logout", () => {
  test.skip("logs out successfully", async ({ page }) => {
    // TODO: Login first, then logout
    // await page.click('[data-testid="user-menu"]');
    // await page.click('[data-testid="logout-button"]');
    // await expect(page).toHaveURL('/');
  });
});

test.describe("Protected Routes", () => {
  test.skip("redirects unauthenticated users from dashboard", async ({ page }) => {
    await page.goto("/dashboard");
    // Should redirect to sign-in
    // await expect(page).toHaveURL(/sign-in/);
  });

  test.skip("redirects unauthenticated users from book creation", async ({ page }) => {
    await page.goto("/books/new");
    // Should redirect to sign-in
    // await expect(page).toHaveURL(/sign-in/);
  });
});

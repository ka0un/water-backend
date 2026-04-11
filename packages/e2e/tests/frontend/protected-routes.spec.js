import { test, expect } from '@playwright/test';
import { setupAuthMock, MOCK_USERS } from '../../helpers/frontend-mocks.js';

test.describe('Frontend — Protected Routes', () => {

  // ── Unauthenticated redirects ──────────────────────────────────

  test.describe('Unauthenticated access redirects to /login', () => {
    const protectedPaths = [
      '/app',
      '/app/moderator/water-tests',
      '/app/moderation/logs',
      '/app/laboratory',
      '/app/water-inventory',
      '/app/lab-tests',
      '/app/users',
      '/app/water-resource-approval',
    ];

    for (const path of protectedPaths) {
      test(`should redirect ${path} → /login when unauthenticated`, async ({ page }) => {
        // Make sure no token is in storage
        await page.addInitScript(() => {
          window.localStorage.removeItem('token');
          window.localStorage.removeItem('user');
        });

        // Auth check will fail
        await page.route('**/api/v1/auth/me', async (route) => {
          await route.fulfill({
            status: 401,
            contentType: 'application/json',
            body: JSON.stringify({ status: 'fail', message: 'Not authenticated' }),
          });
        });

        await page.goto(path);
        await expect(page).toHaveURL(/\/login/, { timeout: 10000 });
      });
    }
  });

  // ── Authenticated access ───────────────────────────────────────

  test('should allow authenticated ADMIN to access /app', async ({ page }) => {
    await setupAuthMock(page, 'admin');
    // Catch-all for dashboard data
    await page.route('**/api/v1/**', async (route) => {
      if (!route.request().url().includes('/auth/')) {
        await route.fulfill({
          status: 200, contentType: 'application/json',
          body: JSON.stringify({ status: 'success', data: {} }),
        });
      } else {
        await route.continue();
      }
    });

    await page.goto('/app');
    await expect(page).toHaveURL(/\/app/, { timeout: 10000 });
    // Should NOT be on login page
    await expect(page).not.toHaveURL(/\/login/);
  });

  test('should preserve intended URL in state when redirecting to /login', async ({ page }) => {
    await page.addInitScript(() => window.localStorage.removeItem('token'));
    await page.route('**/api/v1/auth/me', async (route) => {
      await route.fulfill({
        status: 401, contentType: 'application/json',
        body: JSON.stringify({ status: 'fail', message: 'Not authenticated' }),
      });
    });

    await page.goto('/app/users');
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 });
  });
});

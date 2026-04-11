import { test, expect } from '@playwright/test';
import { DashboardPage } from '../../page-objects/frontend/DashboardPage.js';
import { setupAuthMock } from '../../helpers/frontend-mocks.js';

/** Mock all dashboard-level API calls to prevent unhandled errors */
async function mockDashboardApis(page) {
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
}

test.describe('Frontend — Sidebar Navigation', () => {

  // ── ADMIN navigation ───────────────────────────────────────────

  test.describe('ADMIN role menu items', () => {
    let dash;

    test.beforeEach(async ({ page }) => {
      await setupAuthMock(page, 'admin');
      await mockDashboardApis(page);
      dash = new DashboardPage(page);
      await dash.goto();
    });

    test('should show Dashboard link', async () => {
      await expect(dash.dashboardLink).toBeVisible();
    });

    test('should show Water Inventory link', async () => {
      await expect(dash.waterInventoryLink).toBeVisible();
    });

    test('should show Resource Approval link', async () => {
      await expect(dash.resourceApprovalLink).toBeVisible();
    });

    test('should show Moderator link', async () => {
      await expect(dash.moderatorLink).toBeVisible();
    });

    test('should show Moderation Logs link', async () => {
      await expect(dash.moderationLogsLink).toBeVisible();
    });

    test('should show Laboratory link', async () => {
      await expect(dash.laboratoryLink).toBeVisible();
    });

    test('should show Users link (ADMIN only)', async () => {
      await expect(dash.usersLink).toBeVisible();
    });

    test('should show Logout button', async () => {
      await expect(dash.logoutButton).toBeVisible();
    });

    test('should navigate to /login after logout', async ({ page }) => {
      await dash.logout();
      await expect(page).toHaveURL(/\/login/, { timeout: 5000 });
    });
  });

  // ── MODERATOR navigation ───────────────────────────────────────

  test.describe('MODERATOR role menu items', () => {
    let dash;

    test.beforeEach(async ({ page }) => {
      await setupAuthMock(page, 'moderator');
      await mockDashboardApis(page);
      dash = new DashboardPage(page);
      await dash.goto();
    });

    test('should show Dashboard link', async () => {
      await expect(dash.dashboardLink).toBeVisible();
    });

    test('should show Moderator link', async () => {
      await expect(dash.moderatorLink).toBeVisible();
    });

    test('should NOT show Users link (admin-only)', async () => {
      await expect(dash.usersLink).not.toBeVisible();
    });
  });

  // ── LAB_STAFF navigation ───────────────────────────────────────

  test.describe('LAB_STAFF role menu items', () => {
    let dash;

    test.beforeEach(async ({ page }) => {
      await setupAuthMock(page, 'labStaff');
      await mockDashboardApis(page);
      dash = new DashboardPage(page);
      await dash.goto();
    });

    test('should show Dashboard link', async () => {
      await expect(dash.dashboardLink).toBeVisible();
    });

    test('should show Lab Tests link', async () => {
      await expect(dash.labTestsLink).toBeVisible();
    });

    test('should NOT show Users link (admin-only)', async () => {
      await expect(dash.usersLink).not.toBeVisible();
    });

    test('should NOT show Moderator link (not applicable to lab staff)', async () => {
      await expect(dash.moderatorLink).not.toBeVisible();
    });
  });

  // ── USER navigation ────────────────────────────────────────────

  test.describe('USER role menu items', () => {
    let dash;

    test.beforeEach(async ({ page }) => {
      await setupAuthMock(page, 'regularUser');
      await mockDashboardApis(page);
      dash = new DashboardPage(page);
      await dash.goto();
    });

    test('should show Water Inventory link', async () => {
      await expect(dash.waterInventoryLink).toBeVisible();
    });

    test('should NOT show Dashboard link (regular users see Inventory)', async () => {
      await expect(dash.dashboardLink).not.toBeVisible();
    });

    test('should NOT show Users link', async () => {
      await expect(dash.usersLink).not.toBeVisible();
    });
  });
});

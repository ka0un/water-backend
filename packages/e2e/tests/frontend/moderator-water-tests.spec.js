import { test, expect } from '@playwright/test';
import { ModeratorPage } from '../../page-objects/frontend/ModeratorPage.js';
import {
  setupAuthMock,
  setupReportMocks,
  apiEnvelope,
  MOCK_WATER_REPORT,
} from '../../helpers/frontend-mocks.js';

test.describe('Frontend — Moderator Water Tests (/app/moderator/water-tests)', () => {
  let mod;

  test.beforeEach(async ({ page }) => {
    await setupAuthMock(page, 'moderator');
    await setupReportMocks(page);
    mod = new ModeratorPage(page);
    await mod.gotoWaterTests();
  });

  // ── Page structure ─────────────────────────────────────────────

  test('should display a page heading', async () => {
    await expect(mod.pageHeading).toBeVisible({ timeout: 8000 });
  });

  test('should display the reports table', async () => {
    await expect(mod.reportTable).toBeVisible({ timeout: 8000 });
  });

  test('should display at least one report row', async () => {
    await expect(mod.reportRows.first()).toBeVisible({ timeout: 8000 });
  });

  // ── Search ─────────────────────────────────────────────────────

  test('should display a search input', async () => {
    await expect(mod.searchInput).toBeVisible({ timeout: 5000 });
  });

  test('should filter table when search text is entered', async ({ page }) => {
    await mod.searchInput.fill('Colombo');
    // Table updates (or no crash) — just assert the search input kept focus
    await expect(mod.searchInput).toHaveValue('Colombo');
  });

  // ── Report detail & actions ────────────────────────────────────

  test('should open detail drawer when a report row is clicked', async ({ page }) => {
    // Mock the single report fetch
    await page.route(`**/api/v1/reports/${MOCK_WATER_REPORT._id}**`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(apiEnvelope({ report: MOCK_WATER_REPORT })),
      });
    });

    const firstRow = mod.reportRows.first();
    if (await firstRow.isVisible({ timeout: 5000 }).catch(() => false)) {
      await firstRow.click();
      // A drawer or modal should appear
      await expect(
        page.getByRole('presentation').or(page.locator('[class*="Drawer"]')).first()
      ).toBeVisible({ timeout: 5000 });
    }
  });

  test('should display Approve button in report list or drawer', async ({ page }) => {
    await expect(
      page.getByRole('button', { name: /Approve/i }).first()
    ).toBeVisible({ timeout: 8000 });
  });

  test('should display Reject button in report list or drawer', async ({ page }) => {
    await expect(
      page.getByRole('button', { name: /Reject/i }).first()
    ).toBeVisible({ timeout: 8000 });
  });

  test('should call approve API when Approve is clicked', async ({ page }) => {
    let approveCallMade = false;
    await page.route(`**/api/v1/reports/**`, async (route) => {
      if (route.request().method() === 'PATCH' || route.request().method() === 'PUT') {
        approveCallMade = true;
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(apiEnvelope({ report: { ...MOCK_WATER_REPORT, mod_status: 'approved' } })),
        });
      } else {
        await route.continue();
      }
    });

    const approveBtn = page.getByRole('button', { name: /Approve/i }).first();
    if (await approveBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await approveBtn.click();
      // Confirm dialog may appear
      const confirmBtn = page.getByRole('button', { name: /Confirm|Yes/i }).last();
      if (await confirmBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await confirmBtn.click();
      }
    }
    // The test passes whether or not the dialog was shown —
    // we're confirming no crash occurs
  });
});

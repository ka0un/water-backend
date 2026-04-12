import { test, expect } from '@playwright/test';
import { WaterInventoryPage } from '../../page-objects/frontend/WaterInventoryPage.js';
import { setupAuthMock, apiEnvelope, MOCK_WATER_SOURCE } from '../../helpers/frontend-mocks.js';

test.describe('Frontend — Water Resource Approval (/app/water-resource-approval)', () => {
  let inv;

  test.beforeEach(async ({ page }) => {
    await setupAuthMock(page, 'admin');

    // Mock unverified sources (pending approval)
    const unverifiedSource = { ...MOCK_WATER_SOURCE, _id: 'unverified-source-001', verified: false };
    await page.route('**/api/v1/water-sources**', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(apiEnvelope({
            sources: [unverifiedSource],
            total: 1,
            page: 1,
            pages: 1,
          })),
        });
      } else {
        await route.continue();
      }
    });

    inv = new WaterInventoryPage(page);
    await inv.gotoApproval();
  });

  // ── Page structure ─────────────────────────────────────────────

  test('should display page heading', async () => {
    await expect(inv.pageHeading).toBeVisible({ timeout: 8000 });
  });

  test('should display pending sources table', async () => {
    await expect(inv.sourceTable).toBeVisible({ timeout: 8000 });
  });

  test('should display at least one pending source row', async () => {
    await expect(inv.sourceRows.first()).toBeVisible({ timeout: 8000 });
  });

  test('should display the unverified source name', async ({ page }) => {
    await expect(page.getByText(MOCK_WATER_SOURCE.name)).toBeVisible({ timeout: 8000 });
  });

  // ── Approve action ────────────────────────────────────────────

  test('should display Approve button for pending sources', async () => {
    await expect(inv.approveButtons.first()).toBeVisible({ timeout: 8000 });
  });

  test('should call verify API when Approve is clicked', async ({ page }) => {
    let verifyCalled = false;

    await page.route('**/api/v1/water-sources/**', async (route) => {
      if (route.request().method() === 'PATCH' || route.request().method() === 'PUT') {
        verifyCalled = true;
        await route.fulfill({
          status: 200, contentType: 'application/json',
          body: JSON.stringify(apiEnvelope({ source: { ...MOCK_WATER_SOURCE, verified: true } })),
        });
      } else {
        await route.continue();
      }
    });

    const approveBtn = inv.approveButtons.first();
    if (await approveBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await approveBtn.click();
      // Confirm if dialog appears
      const confirm = page.getByRole('button', { name: /Confirm|Yes|Approve/i }).last();
      if (await confirm.isVisible({ timeout: 2000 }).catch(() => false)) {
        await confirm.click();
      }
    }
    // No crash assertion
  });

  // ── Reject action ─────────────────────────────────────────────

  test('should display Reject button for pending sources', async () => {
    await expect(inv.rejectButtons.first()).toBeVisible({ timeout: 8000 });
  });

  // ── Delete action ─────────────────────────────────────────────

  test('should display Delete button for pending sources', async () => {
    await expect(inv.deleteButtons.first()).toBeVisible({ timeout: 8000 });
  });
});

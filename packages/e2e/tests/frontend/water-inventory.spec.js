import { test, expect } from '@playwright/test';
import { WaterInventoryPage } from '../../page-objects/frontend/WaterInventoryPage.js';
import { setupAuthMock, setupWaterSourceMocks, MOCK_WATER_SOURCE } from '../../helpers/frontend-mocks.js';

test.describe('Frontend — Water Inventory (/app/water-inventory)', () => {
  let inv;

  test.beforeEach(async ({ page }) => {
    await setupAuthMock(page, 'admin');
    await setupWaterSourceMocks(page);
    inv = new WaterInventoryPage(page);
    await inv.gotoInventory();
  });

  // ── Page structure (map mode) ──────────────────────────────────

  test('should display page heading', async () => {
    await expect(inv.pageHeading).toBeVisible({ timeout: 8000 });
  });

  test('should render the Leaflet map', async () => {
    await expect(inv.mapContainer).toBeVisible({ timeout: 10000 });
  });

  // ── Table mode (switch required) ───────────────────────────────

  test('should display water source table or list', async () => {
    await inv.switchToTableMode();
    await expect(inv.sourceTable).toBeVisible({ timeout: 8000 });
  });

  test('should display the mock water source name', async ({ page }) => {
    await inv.switchToTableMode();
    await expect(
      page.getByText(MOCK_WATER_SOURCE.name)
    ).toBeVisible({ timeout: 8000 });
  });

  // ── Add source (FAB is in map mode — no need to switch views) ─

  test('should display Add Source FAB button', async () => {
    // The Add Source button is a floating action button (FAB) in map mode
    await expect(inv.addSourceButton).toBeVisible({ timeout: 5000 });
  });

  test('should open add source modal when Add FAB is clicked', async () => {
    await inv.clickAddSource();
    await expect(inv.sourceModal).toBeVisible({ timeout: 5000 });
  });

  test('should display Name field in add source modal', async ({ page }) => {
    await inv.clickAddSource();
    await expect(inv.sourceModal.getByLabel(/Name/i).first()).toBeVisible({ timeout: 5000 });
  });

  // ── Edit & Delete ─────────────────────────────────────────────

  test('should display Edit buttons for existing sources', async () => {
    await inv.switchToTableMode();
    await expect(inv.editButtons.first()).toBeVisible({ timeout: 8000 });
  });

  test('should display Delete buttons for existing sources', async () => {
    await inv.switchToTableMode();
    await expect(inv.deleteButtons.first()).toBeVisible({ timeout: 8000 });
  });

  // ── Status filter ─────────────────────────────────────────────

  test('should display a search or status filter', async ({ page }) => {
    await inv.switchToTableMode();
    // In table mode the search input is visible
    await expect(
      page.locator('input[placeholder*="Search"]').or(page.getByPlaceholder(/search/i)).first()
    ).toBeVisible({ timeout: 5000 });
  });
});

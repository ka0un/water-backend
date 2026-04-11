import { test, expect } from '@playwright/test';
import { WizardPage } from '../../page-objects/lp/WizardPage.js';
import {
  setupLpMocks,
  MOCK_NIC,
  MOCK_REPORT_IN_PROGRESS,
  MOCK_REPORT_COMPLETED,
} from '../../helpers/lp-mocks.js';

test.describe('LP — Wizard Welcome Step (NIC entry & report check)', () => {
  let wizard;

  test.beforeEach(async ({ page }) => {
    wizard = new WizardPage(page);
    await setupLpMocks(page);
    await wizard.goto();
  });

  // ── Page structure ────────────────────────────────────────────────

  test('should display the report wizard heading', async ({ page }) => {
    await expect(
      page.getByRole('heading', { name: /Report a Water Quality Issue/i })
    ).toBeVisible();
  });

  test('should display the NIC input field', async () => {
    await expect(wizard.nicInput).toBeVisible();
  });

  test('should display the Get Started button', async () => {
    await expect(wizard.getStartedButton).toBeVisible();
  });

  test('should disable Get Started when NIC input is empty', async () => {
    await expect(wizard.getStartedButton).toBeDisabled();
  });

  test('should enable Get Started once NIC is entered', async () => {
    await wizard.enterNic(MOCK_NIC);
    await expect(wizard.getStartedButton).toBeEnabled();
  });

  // ── NIC validation ────────────────────────────────────────────────

  test('should show validation error for an invalid NIC format', async ({ page }) => {
    await wizard.enterNic('INVALID_NIC');
    await wizard.clickGetStarted();
    await expect(page.getByText(/valid NIC/i)).toBeVisible();
  });

  test('should accept old-format NIC (9 digits + V)', async ({ page }) => {
    await setupLpMocks(page); // already done in beforeEach but ensures fresh route
    await wizard.enterNic('901234567V');
    await wizard.clickGetStarted();
    // Should advance past welcome step — water source heading appears
    await expect(
      page.getByRole('heading', { name: /What type of water source/i })
    ).toBeVisible({ timeout: 10000 });
  });

  test('should accept new-format NIC (12 digits)', async ({ page }) => {
    await wizard.enterNic('200012345678');
    await wizard.clickGetStarted();
    await expect(
      page.getByRole('heading', { name: /What type of water source/i })
    ).toBeVisible({ timeout: 10000 });
  });

  // ── Existing reports detection ────────────────────────────────────

  test('should show in-progress reports when NIC has incomplete submissions', async ({ page }) => {
    // Override mock to return an in-progress report
    await page.route('**/api/v1/public-reports/by-nic/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 'success',
          data: { reports: [MOCK_REPORT_IN_PROGRESS] },
        }),
      });
    });

    await wizard.enterNic(MOCK_NIC);
    await wizard.clickGetStarted();
    await expect(wizard.inProgressSection).toBeVisible({ timeout: 5000 });
    await expect(wizard.resumeChip).toBeVisible();
  });

  test('should show past submissions when NIC has completed reports', async ({ page }) => {
    await page.route('**/api/v1/public-reports/by-nic/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 'success',
          data: { reports: [MOCK_REPORT_COMPLETED] },
        }),
      });
    });

    await wizard.enterNic(MOCK_NIC);
    await wizard.clickGetStarted();
    await expect(wizard.pastSubmissions).toBeVisible({ timeout: 5000 });
  });

  test('should show Start a New Report button when prior reports exist', async ({ page }) => {
    await page.route('**/api/v1/public-reports/by-nic/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 'success',
          data: { reports: [MOCK_REPORT_COMPLETED] },
        }),
      });
    });

    await wizard.enterNic(MOCK_NIC);
    await wizard.clickGetStarted();
    await expect(wizard.startNewReportButton).toBeVisible({ timeout: 5000 });
  });

  test('should advance to water source step when starting a new report after prior exists', async ({ page }) => {
    await page.route('**/api/v1/public-reports/by-nic/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 'success',
          data: { reports: [MOCK_REPORT_COMPLETED] },
        }),
      });
    });

    await wizard.enterNic(MOCK_NIC);
    await wizard.clickGetStarted();
    await wizard.startNewReportButton.waitFor({ state: 'visible', timeout: 5000 });
    await wizard.startNewReportButton.click();
    await expect(
      page.getByRole('heading', { name: /What type of water source/i })
    ).toBeVisible({ timeout: 10000 });
  });
});

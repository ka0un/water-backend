import { test, expect } from '@playwright/test';
import { LabTestPage } from '../../page-objects/frontend/LabTestPage.js';
import { setupAuthMock, setupLabTestMocks, MOCK_LAB_TEST } from '../../helpers/frontend-mocks.js';

test.describe('Frontend — Lab Tests & Lab Staff Dashboard', () => {

  // ── Lab Staff Dashboard ────────────────────────────────────────

  test.describe('Lab Staff Dashboard (/app)', () => {
    let labPage;

    test.beforeEach(async ({ page }) => {
      await setupAuthMock(page, 'labStaff');
      await setupLabTestMocks(page);
      labPage = new LabTestPage(page);
      await labPage.gotoLabDashboard();
    });

    test('should display Pending stat card', async () => {
      await expect(labPage.pendingTestsStat).toBeVisible();
    });

    test('should display Completed Today stat card', async () => {
      await expect(labPage.completedTodayStat).toBeVisible({ timeout: 8000 });
    });

    test('should display Total Completed stat card', async () => {
      await expect(labPage.totalCompletedStat).toBeVisible({ timeout: 8000 });
    });

    test('should display recent lab test requests table or list', async ({ page }) => {
      // Recent requests section heading
      await expect(
        page.getByText(/Recent|Lab Test|Requests/i).first()
      ).toBeVisible({ timeout: 8000 });
    });
  });

  // ── Lab Test Management ────────────────────────────────────────

  test.describe('Lab Test Management (/app/lab-tests)', () => {
    let labPage;

    test.beforeEach(async ({ page }) => {
      await setupAuthMock(page, 'labStaff');
      await setupLabTestMocks(page);
      labPage = new LabTestPage(page);
      await labPage.gotoLabTests();
    });

    test('should display the lab tests page heading', async ({ page }) => {
      await expect(
        page.getByRole('heading', { name: /Lab Test|Laboratory Test/i })
      ).toBeVisible({ timeout: 8000 });
    });

    test('should display the test table', async () => {
      await expect(labPage.testTable).toBeVisible({ timeout: 8000 });
    });

    test('should display test request number in the table', async ({ page }) => {
      await expect(
        page.getByText(MOCK_LAB_TEST.requestNumber).or(page.getByText(/LT-/i))
      ).toBeVisible({ timeout: 8000 });
    });

    test('should show status filter', async ({ page }) => {
      // Status filter is typically a MUI Select or a native select
      const filter = page.getByLabel(/Status/i).or(page.locator('select')).first();
      await expect(filter).toBeVisible({ timeout: 5000 });
    });

    test('should open view details dialog when View button is clicked', async ({ page }) => {
      await setupLabTestMocks(page); // ensure mock is fresh
      // Mock single lab test detail
      await page.route('**/api/v1/lab-tests/**', async (route) => {
        if (route.request().method() === 'GET') {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              status: 'success',
              data: { request: MOCK_LAB_TEST },
            }),
          });
        } else {
          await route.continue();
        }
      });

      const viewBtn = page.getByRole('button', { name: /View|Details/i }).first();
      if (await viewBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await viewBtn.click();
        await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5000 });
      }
    });
  });
});

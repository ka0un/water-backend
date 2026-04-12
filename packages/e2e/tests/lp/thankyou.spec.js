import { test, expect } from '@playwright/test';
import { ThankYouPage } from '../../page-objects/lp/ThankYouPage.js';

test.describe('LP — Thank You Page', () => {
  let ty;

  test.beforeEach(async ({ page }) => {
    ty = new ThankYouPage(page);
  });

  test('should display the Thank You heading', async () => {
    await ty.goto();
    await expect(ty.heading).toBeVisible();
  });

  test('should display the success check icon', async ({ page }) => {
    await ty.goto();
    // CheckCircleIcon SVG is rendered — check by its data-testid or role
    const icon = page.locator('[data-testid="CheckCircleIcon"]');
    await expect(icon).toBeVisible();
  });

  test('should display the pending review status badge', async () => {
    await ty.goto();
    await expect(ty.pendingBadge).toBeVisible();
  });

  test('should display Report ID when id param is provided', async ({ page }) => {
    await ty.goto('test-report-id-999');
    await expect(ty.reportIdText).toBeVisible();
    await expect(page.getByText('test-report-id-999')).toBeVisible();
  });

  test('should not display Report ID when id param is absent', async ({ page }) => {
    await ty.goto();
    await expect(page.getByText(/Report ID:/i)).not.toBeVisible();
  });

  test('should display Back to Home button', async () => {
    await ty.goto();
    await expect(ty.backHomeButton).toBeVisible();
    await expect(ty.backHomeButton).toBeEnabled();
  });

  test('should display Submit Another Report button', async () => {
    await ty.goto();
    await expect(ty.anotherButton).toBeVisible();
    await expect(ty.anotherButton).toBeEnabled();
  });

  test('should navigate to / when Back to Home is clicked', async ({ page }) => {
    await ty.goto();
    await ty.clickBackToHome();
    await expect(page).toHaveURL('/');
  });

  test('should navigate to /report when Submit Another is clicked', async ({ page }) => {
    await ty.goto();
    await ty.clickSubmitAnother();
    await expect(page).toHaveURL(/\/report/);
  });
});

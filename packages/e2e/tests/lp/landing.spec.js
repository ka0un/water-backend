import { test, expect } from '@playwright/test';
import { LandingPage } from '../../page-objects/lp/LandingPage.js';

test.describe('LP — Landing Page', () => {
  let lp;

  test.beforeEach(async ({ page }) => {
    lp = new LandingPage(page);
    await lp.goto();
  });

  // ── Brand & header ───────────────────────────────────────────────

  test('should display the brand name in the header', async () => {
    await expect(lp.brandName.first()).toBeVisible();
  });

  // ── Hero section ─────────────────────────────────────────────────

  test('should display the hero heading', async () => {
    await expect(lp.heroHeading).toBeVisible();
    await expect(lp.heroHeading).toContainText('Is Your Water Safe');
  });

  test('should display the hero subtitle text', async () => {
    await expect(lp.heroSubtitle).toBeVisible();
  });

  test('should display the "no account needed" note', async () => {
    await expect(lp.noAccountNote).toBeVisible();
  });

  test('should display the main CTA button', async () => {
    await expect(lp.ctaButton).toBeVisible();
    await expect(lp.ctaButton).toBeEnabled();
  });

  // ── Feature cards ────────────────────────────────────────────────

  test('should display all four feature card titles', async () => {
    const visible = await lp.getVisibleFeatureTitles();
    expect(visible).toContain('Report Issues');
    expect(visible).toContain('Expert Review');
    expect(visible).toContain('Quick & Simple');
    expect(visible).toContain('Community Driven');
  });

  test('should display feature card descriptions', async ({ page }) => {
    await expect(page.getByText(/No login needed/i)).toBeVisible();
    await expect(page.getByText(/trained moderators/i)).toBeVisible();
  });

  // ── CTA navigation ───────────────────────────────────────────────

  test('should navigate to /report when CTA is clicked', async ({ page }) => {
    await lp.clickReportIssue();
    await expect(page).toHaveURL(/\/report/);
  });

  // ── Footer ───────────────────────────────────────────────────────

  test('should display the footer with copyright text', async () => {
    await expect(lp.footer).toBeVisible();
  });

  // ── Page title ───────────────────────────────────────────────────

  test('should have a non-empty page title', async ({ page }) => {
    const title = await page.title();
    expect(title.length).toBeGreaterThan(0);
  });
});

import { test, expect } from '@playwright/test';
import { PublicPage } from '../../page-objects/frontend/PublicPage.js';

test.describe('Frontend — Public Pages (unauthenticated)', () => {

  // ── Landing Page (/) ───────────────────────────────────────────

  test.describe('Landing Page (/)', () => {
    let pp;

    test.beforeEach(async ({ page }) => {
      pp = new PublicPage(page);
      await pp.gotoLanding();
    });

    test('should display AquaMonitor brand name', async () => {
      await expect(pp.brandName.first()).toBeVisible();
    });

    test('should display the hero heading', async () => {
      await expect(pp.heroHeading).toBeVisible();
    });

    test('should display Submit a Report button', async ({ page }) => {
      await expect(page.getByRole('button', { name: /Submit a Report/i })).toBeVisible();
    });

    test('should display Explore Map button', async () => {
      await expect(pp.exploreMapButton).toBeVisible();
    });

    test('should display Track Status button', async () => {
      await expect(pp.trackStatusButton).toBeVisible();
    });

    test('should display Sign In button for unauthenticated users', async () => {
      await expect(pp.signInButton).toBeVisible();
    });

    test('should display Register button for unauthenticated users', async () => {
      await expect(pp.registerButton).toBeVisible();
    });

    test('should display Platform Features section', async () => {
      await expect(pp.platformFeatures).toBeVisible();
    });

    test('should show Community Reporting feature card', async ({ page }) => {
      await expect(page.getByText('Community Reporting')).toBeVisible();
    });

    test('should show Laboratory Testing feature card', async ({ page }) => {
      await expect(page.getByText('Laboratory Testing')).toBeVisible();
    });

    test('should show Trusted Moderation feature card', async ({ page }) => {
      await expect(page.getByText('Trusted Moderation')).toBeVisible();
    });

    test('should show Interactive Dashboards feature card', async ({ page }) => {
      await expect(page.getByText('Interactive Dashboards')).toBeVisible();
    });

    test('should navigate to /login when Sign In is clicked', async ({ page }) => {
      await pp.signInButton.click();
      await expect(page).toHaveURL(/\/login/);
    });

    test('should navigate to /register when Register is clicked', async ({ page }) => {
      await pp.registerButton.click();
      await expect(page).toHaveURL(/\/register/);
    });

    test('should navigate to /map when Explore Map is clicked', async ({ page }) => {
      await pp.exploreMapButton.click();
      await expect(page).toHaveURL(/\/map/);
    });

    test('should navigate to /track when Track Status is clicked', async ({ page }) => {
      await pp.trackStatusButton.click();
      await expect(page).toHaveURL(/\/track/);
    });
  });

  // ── Public Map (/map) ──────────────────────────────────────────

  test.describe('Public Map (/map)', () => {
    let pp;

    test.beforeEach(async ({ page }) => {
      // Mock water sources and stats API
      await page.route('**/api/v1/water-sources**', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            status: 'success',
            data: { sources: [], total: 0 },
          }),
        });
      });
      await page.route('**/api/v1/water-sources/stats**', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            status: 'success',
            data: { verified: 5, total: 10 },
          }),
        });
      });

      pp = new PublicPage(page);
      await pp.gotoMap();
    });

    test('should display Public Water Resources Map heading', async () => {
      await expect(pp.mapHeading).toBeVisible();
    });

    test('should display Total Verified Sources stat card', async () => {
      await expect(pp.totalVerified).toBeVisible();
    });

    test('should render the Leaflet map container', async () => {
      await expect(pp.mapContainer).toBeVisible({ timeout: 10000 });
    });

    test('should display Submit Report button', async ({ page }) => {
      await expect(page.getByRole('button', { name: /Submit Report/i })).toBeVisible();
    });

    test('should display Sign In button', async ({ page }) => {
      await expect(page.getByRole('button', { name: /Sign In/i })).toBeVisible();
    });

    test('should navigate back to / when back button is clicked', async ({ page }) => {
      await page.getByRole('button', { name: /back/i }).click();
      await expect(page).toHaveURL('/');
    });
  });

  // ── Report Tracker (/track) ────────────────────────────────────

  test.describe('Report Tracker (/track)', () => {
    let pp;

    test.beforeEach(async ({ page }) => {
      pp = new PublicPage(page);
      await pp.gotoTracker();
    });

    test('should display Track Water Reports heading', async () => {
      await expect(pp.trackHeading).toBeVisible();
    });

    test('should display NIC search input', async () => {
      await expect(pp.nicSearchInput).toBeVisible();
    });

    test('should display Track button', async () => {
      await expect(pp.trackButton).toBeVisible();
    });

    test('should show no reports message when NIC has no reports', async ({ page }) => {
      // The tracker calls GET /api/v1/public-reports/by-nic/{nic}
      await page.route('**/api/v1/public-reports/by-nic/**', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ status: 'success', data: { reports: [] } }),
        });
      });

      await pp.searchByNic('000000000V');
      await expect(page.getByText(/No reports found/i)).toBeVisible({ timeout: 5000 });
    });

    test('should show error for empty NIC submission', async ({ page }) => {
      await pp.trackButton.click();
      // Use role='alert' to avoid matching the paragraph instruction text
      await expect(page.getByRole('alert').first()).toBeVisible({ timeout: 3000 });
    });

    test('should display Submit New Report button', async ({ page }) => {
      await expect(page.getByRole('button', { name: /Submit New Report/i })).toBeVisible();
    });
  });
});

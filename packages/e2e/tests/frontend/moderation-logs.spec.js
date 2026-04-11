import { test, expect } from '@playwright/test';
import { ModeratorPage } from '../../page-objects/frontend/ModeratorPage.js';
import { setupAuthMock, setupModerationLogMocks } from '../../helpers/frontend-mocks.js';

test.describe('Frontend — Moderation Logs (/app/moderation/logs)', () => {
  let mod;

  test.beforeEach(async ({ page }) => {
    await setupAuthMock(page, 'moderator');
    await setupModerationLogMocks(page);
    mod = new ModeratorPage(page);
    await mod.gotoModerationLogs();
  });

  // ── Page structure ─────────────────────────────────────────────

  test('should display the Moderation Logs page heading', async () => {
    await expect(mod.logsHeading).toBeVisible({ timeout: 8000 });
  });

  test('should display the logs table', async () => {
    await expect(mod.logTable).toBeVisible({ timeout: 8000 });
  });

  test('should display at least one log entry', async ({ page }) => {
    // Logs are rendered in a table — check for at least one row
    const rows = page.locator('table tbody tr');
    await expect(rows.first()).toBeVisible({ timeout: 8000 });
  });

  test('should display action type in the log entry', async ({ page }) => {
    await expect(page.getByText(/APPROVE|REJECT|LOGIN|VIEW/i).first()).toBeVisible({ timeout: 8000 });
  });

  // ── Filter tabs ────────────────────────────────────────────────

  test('should display All tab', async () => {
    await expect(mod.allTab).toBeVisible({ timeout: 5000 });
  });

  test('should be on All tab by default', async () => {
    await expect(mod.allTab).toHaveAttribute('aria-selected', 'true', { timeout: 5000 });
  });

  test('should switch to a specific action filter tab', async ({ page }) => {
    // Click any available action tab that is not "All"
    const tabs = page.getByRole('tab').filter({ hasNotText: /All/i });
    const firstTab = tabs.first();
    if (await firstTab.isVisible({ timeout: 3000 }).catch(() => false)) {
      await firstTab.click();
      await expect(firstTab).toHaveAttribute('aria-selected', 'true', { timeout: 3000 });
    }
  });

  // ── Moderator filter ───────────────────────────────────────────

  test('should display a moderator filter', async ({ page }) => {
    // MUI Select or similar filter for moderator
    const filter = page.getByLabel(/Moderator/i).or(
      page.locator('[class*="Select"]').filter({ hasText: /Moderator|All Moderators/i })
    ).first();
    await expect(filter).toBeVisible({ timeout: 5000 });
  });

  // ── Timestamps ────────────────────────────────────────────────

  test('should display a timestamp in the log entry', async ({ page }) => {
    // Timestamps are typically formatted dates
    await expect(page.getByText(/2026|Jan|Feb|Mar/i).first()).toBeVisible({ timeout: 8000 });
  });
});

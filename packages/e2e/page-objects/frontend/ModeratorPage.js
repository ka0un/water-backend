/**
 * Page Object — Moderator Water Tests (/app/moderator/water-tests) and
 *               Moderation Logs (/app/moderation/logs)
 */
export class ModeratorPage {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    this.page = page;

    // ── Water Tests list ──────────────────────────────────────────
    this.pageHeading        = page.getByRole('heading', { name: /Reports|Water Tests/i }).first();
    this.searchInput        = page.locator('input[placeholder*="Search"]').or(
      page.getByPlaceholder(/search/i)
    ).first();
    this.reportTable        = page.locator('table').first();
    this.reportRows         = page.locator('table tbody tr');

    // ── Report detail drawer ──────────────────────────────────────
    this.detailDrawer       = page.locator('[role="presentation"]').filter({ hasText: /Water Source|Location/i });
    this.approveButton      = page.getByRole('button', { name: /Approve/i }).first();
    this.rejectButton       = page.getByRole('button', { name: /Reject/i }).first();
    this.closeDrawerButton  = page.getByRole('button', { name: /Close/i }).last();

    // ── Confirmation dialogs ──────────────────────────────────────
    this.confirmDialog      = page.getByRole('dialog');
    this.confirmActionButton = page.getByRole('button', { name: /Confirm|Yes/i }).last();

    // ── Moderation Logs ───────────────────────────────────────────
    this.logsHeading        = page.getByRole('heading', { name: /Moderation Logs|Audit/i });
    this.logTable           = page.locator('table').first();
    this.allTab             = page.getByRole('tab', { name: /All/i });
    this.approveTab         = page.getByRole('tab', { name: /Approve/i });
    this.rejectTab          = page.getByRole('tab', { name: /Reject/i });
    this.loginTab           = page.getByRole('tab', { name: /Login/i });
    this.moderatorFilter    = page.getByLabel(/Moderator/i).or(page.locator('select')).first();
  }

  async gotoWaterTests() {
    await this.page.goto('/app/moderator/water-tests');
    await this.page.waitForLoadState('networkidle');
  }

  async gotoModerationLogs() {
    await this.page.goto('/app/moderation/logs');
    await this.page.waitForLoadState('networkidle');
  }

  async searchReports(query) {
    await this.searchInput.fill(query);
  }

  async openFirstReport() {
    await this.reportRows.first().click();
  }
}

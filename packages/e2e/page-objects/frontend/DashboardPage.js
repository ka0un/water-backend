/**
 * Page Object — Frontend App Layout & Dashboard (/app/*)
 *
 * Covers the sidebar navigation, role-based menu items, and logout.
 */
export class DashboardPage {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    this.page = page;

    // ── Sidebar navigation links ──────────────────────────────────
    this.dashboardLink         = page.getByRole('button', { name: /Dashboard/i });
    this.labTestsLink          = page.getByRole('button', { name: /Lab Tests/i });
    this.waterInventoryLink    = page.getByRole('button', { name: /Water Inventory/i });
    this.moderatorLink         = page.getByRole('button', { name: /Moderator/i });
    this.moderationLogsLink    = page.getByRole('button', { name: /Moderation Logs/i });
    this.laboratoryLink        = page.getByRole('button', { name: /Laboratory/i });
    this.resourceApprovalLink  = page.getByRole('button', { name: /Resource Approval/i });
    this.usersLink             = page.getByRole('button', { name: /Users/i });
    this.logoutButton          = page.getByRole('button', { name: /Logout/i });

    // ── Mobile hamburger ──────────────────────────────────────────
    this.menuToggle = page.getByRole('button', { name: /menu/i });

    // ── Brand ─────────────────────────────────────────────────────
    this.brandName = page.getByText('AquaMonitor').or(page.getByText('Water Quality Monitor')).first();
  }

  async goto() {
    await this.page.goto('/app');
    await this.page.waitForLoadState('networkidle');
  }

  async navigateTo(path) {
    await this.page.goto(path);
    await this.page.waitForLoadState('networkidle');
  }

  async logout() {
    await this.logoutButton.click();
  }
}

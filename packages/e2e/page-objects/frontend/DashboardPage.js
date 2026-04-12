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
    // Scope to the <nav> element so dashboard card buttons don't interfere.
    const nav = page.locator('nav');
    this.dashboardLink         = nav.getByRole('button', { name: /Dashboard/i }).first();
    this.labTestsLink          = nav.getByRole('button', { name: /Lab Tests/i }).first();
    this.waterInventoryLink    = nav.getByRole('button', { name: /Water Inventory/i }).first();
    this.moderatorLink         = nav.getByRole('button', { name: /^Moderator$/i }).first();
    this.moderationLogsLink    = nav.getByRole('button', { name: /^Moderation Logs$/i }).first();
    this.laboratoryLink        = nav.getByRole('button', { name: /Laboratory/i }).first();
    this.resourceApprovalLink  = nav.getByRole('button', { name: /Resource Approval/i }).first();
    this.usersLink             = nav.getByRole('button', { name: /^Users$/i }).first();
    this.logoutButton          = nav.getByRole('button', { name: /Logout/i }).first();

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

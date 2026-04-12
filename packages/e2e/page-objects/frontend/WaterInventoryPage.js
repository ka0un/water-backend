/**
 * Page Object — Water Inventory (/app/water-inventory) and
 *               Water Resource Approval (/app/water-resource-approval)
 */
export class WaterInventoryPage {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    this.page = page;

    // ── Map ───────────────────────────────────────────────────────
    this.mapContainer       = page.locator('.leaflet-container').first();

    // ── Source table / list ───────────────────────────────────────
    this.pageHeading        = page.getByRole('heading', { name: /Water|Inventory|Approval/i }).first();
    this.sourceTable        = page.locator('table').first();
    this.sourceRows         = page.locator('table tbody tr');
    this.addSourceButton    = page.getByRole('button', { name: /Add|New Source/i }).first();
    this.searchInput        = page.locator('input[placeholder*="Search"]').or(
      page.getByPlaceholder(/search/i)
    ).first();

    // ── Add/Edit source modal ─────────────────────────────────────
    this.sourceModal        = page.getByRole('dialog');
    this.sourceNameInput    = page.getByLabel(/Name/i).first();
    this.sourceTypeSelect   = page.getByLabel(/Type/i).first();
    this.saveSourceButton   = page.getByRole('button', { name: /Save|Add Source|Create/i }).last();
    this.cancelButton       = page.getByRole('button', { name: /Cancel/i }).last();

    // ── Add Source (FAB — map mode only, no text label) ──────────
    this.addSourceButton    = page.locator('button.MuiFab-root').first();

    // ── Source actions (table mode — IconButton with Tooltip) ────
    this.editButtons        = page.getByRole('button', { name: /Edit/i });
    this.deleteButtons      = page.getByRole('button', { name: /Delete/i });
    this.approveButtons     = page.getByRole('button', { name: /Approve|Verify/i });
    this.rejectButtons      = page.getByRole('button', { name: /Reject/i });

    // ── Confirmation ──────────────────────────────────────────────
    this.confirmButton      = page.getByRole('button', { name: /Confirm|Yes/i }).last();
  }

  async gotoInventory() {
    await this.page.goto('/app/water-inventory');
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * WaterInventory defaults to map view. Click the view toggle switch
   * to switch to table view so the data table becomes visible.
   */
  async switchToTableMode() {
    // The MUI Switch in the header toggles between map and table view
    const viewSwitch = this.page.locator('input[type="checkbox"]').first();
    if (await viewSwitch.isVisible({ timeout: 3000 }).catch(() => false)) {
      await viewSwitch.click({ force: true });
      await this.page.waitForTimeout(300);
    }
  }

  async gotoApproval() {
    await this.page.goto('/app/water-resource-approval');
    await this.page.waitForLoadState('networkidle');
  }

  async gotoUserInventory() {
    await this.page.goto('/app/water-inventory-user');
    await this.page.waitForLoadState('networkidle');
  }

  async clickAddSource() {
    await this.addSourceButton.click();
  }

  async fillSourceForm(name, type = 'well') {
    await this.sourceNameInput.fill(name);
    // MUI Select — click to open, then pick option
    await this.sourceTypeSelect.click().catch(() => {});
    await this.page.getByRole('option', { name: new RegExp(type, 'i') }).first().click().catch(() => {});
  }
}

/**
 * Page Object — Lab Test Management (/app/lab-tests) and
 *               Lab Staff Dashboard (/app)
 */
export class LabTestPage {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    this.page = page;

    // ── Lab Staff Dashboard stats ─────────────────────────────────
    this.pendingTestsStat    = page.getByText(/Pending/i).first();
    this.inProgressStat      = page.getByText(/In.Progress/i).first();
    this.completedTodayStat  = page.getByText(/Completed Today/i).first();
    this.totalCompletedStat  = page.getByText(/Total Completed/i).first();

    // ── Lab Test Management table ─────────────────────────────────
    this.testTable           = page.locator('table');
    this.statusFilter        = page.getByLabel(/Status/i).or(page.locator('select')).first();
    this.viewDetailButtons   = page.getByRole('button', { name: /View|Details/i });

    // ── Action dialogs ────────────────────────────────────────────
    this.viewDetailsDialog   = page.getByRole('dialog').filter({ hasText: /Request Details/i });
    this.rejectDialog        = page.getByRole('dialog').filter({ hasText: /Reject/i });
    this.scheduleDialog      = page.getByRole('dialog').filter({ hasText: /Schedule/i });
    this.resultsDialog       = page.getByRole('dialog').filter({ hasText: /Results/i });
    this.verdictDialog       = page.getByRole('dialog').filter({ hasText: /Verdict/i });

    // ── Dialog action buttons ─────────────────────────────────────
    this.closeDialogButton   = page.getByRole('button', { name: /Close|Cancel/i }).last();
    this.confirmButton       = page.getByRole('button', { name: /Confirm|Accept|Submit/i }).last();
  }

  async gotoLabTests() {
    await this.page.goto('/app/lab-tests');
    await this.page.waitForLoadState('networkidle');
  }

  async gotoLabDashboard() {
    await this.page.goto('/app');
    await this.page.waitForLoadState('networkidle');
  }

  async openFirstRowDetails() {
    await this.viewDetailButtons.first().click();
  }
}

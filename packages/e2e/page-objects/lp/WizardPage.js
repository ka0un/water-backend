/**
 * Page Object — LP Wizard (/report)
 *
 * Covers every step of the 24-step multi-step report wizard.
 */
export class WizardPage {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    this.page = page;

    // ── Shared navigation buttons ────────────────────────────────
    // "Continue" is used for most steps; "Skip" is shown on optional steps
    // (Images, Contact) when no data has been entered.
    // Matches "Continue", "Skip", "Continue (N photos)", "Skip — No Test Results", etc.
    this.continueButton      = page.getByRole('button', { name: /^(Continue|Skip)/i }).first();
    this.backButton          = page.getByRole('button', { name: /^Back$/i });
    this.submitButton        = page.getByRole('button', { name: /Submit Report/i });
    this.skipButton          = page.getByRole('button', { name: /^Skip$/i });

    // ── Welcome step ─────────────────────────────────────────────
    this.nicInput            = page.getByLabel(/National ID Card Number/i);
    this.getStartedButton    = page.getByRole('button', { name: /Get Started/i });
    this.startNewReportButton = page.getByRole('button', { name: /Start a New Report/i });
    this.inProgressSection   = page.getByText('In-Progress Reports');
    this.pastSubmissions     = page.getByText('Past Submissions');
    this.resumeChip          = page.getByText('Resume').first();
  }

  async goto() {
    await this.page.goto('/report');
    await this.page.waitForLoadState('networkidle');
  }

  // ── Welcome step ───────────────────────────────────────────────

  async enterNic(nic) {
    await this.nicInput.fill(nic);
  }

  async clickGetStarted() {
    await this.getStartedButton.click();
  }

  async startReport(nic) {
    await this.enterNic(nic);
    await this.clickGetStarted();
    // If existing reports panel shows, click "Start a New Report"
    const visible = await this.startNewReportButton
      .isVisible({ timeout: 2000 })
      .catch(() => false);
    if (visible) await this.startNewReportButton.click();
  }

  // ── OptionGrid helper ──────────────────────────────────────────
  // OptionGrid renders cards with exact label text

  async selectOption(labelText) {
    await this.page.getByText(labelText, { exact: true }).click();
  }

  // ── Location step ──────────────────────────────────────────────

  async setLocation(district = 'Colombo', city = 'Colombo City') {
    // Native <select> for District
    await this.page.locator('select').selectOption(district);
    // Text field for City / Town
    await this.page.getByLabel(/City \/ Town/i).fill(city);
    await this.continueButton.click();
  }

  // ── Contact step ───────────────────────────────────────────────

  async fillContact({ email = '', phone = '' } = {}) {
    if (email) await this.page.locator('input[type="email"]').fill(email);
    if (phone) await this.page.locator('input[type="tel"]').fill(phone);
  }

  // ── Generic navigation ─────────────────────────────────────────

  async goNext() {
    await this.continueButton.click();
  }

  async goBack() {
    await this.backButton.click();
  }

  async submitReport() {
    await this.submitButton.click();
  }

  // ── Step heading helpers ───────────────────────────────────────

  stepHeading(name) {
    return this.page.getByRole('heading', { name, exact: false });
  }

  async waitForStep(headingText) {
    await this.page
      .getByRole('heading', { name: headingText, exact: false })
      .first()
      .waitFor({ state: 'visible', timeout: 10000 });
  }
}

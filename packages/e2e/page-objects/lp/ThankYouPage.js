/**
 * Page Object — LP Thank You Page (/thank-you)
 */
export class ThankYouPage {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    this.page = page;

    this.heading        = page.getByRole('heading', { name: /Thank You/i });
    this.successIcon    = page.locator('svg[data-testid="CheckCircleIcon"]');
    this.reportIdText   = page.getByText(/Report ID/i);
    this.pendingBadge   = page.getByText(/pending review/i);
    this.backHomeButton = page.getByRole('button', { name: /Back to Home/i });
    this.anotherButton  = page.getByRole('button', { name: /Submit Another Report/i });
  }

  async goto(reportId = '') {
    const url = reportId ? `/thank-you?id=${reportId}` : '/thank-you';
    await this.page.goto(url);
    await this.page.waitForLoadState('networkidle');
  }

  async clickBackToHome() {
    await this.backHomeButton.click();
  }

  async clickSubmitAnother() {
    await this.anotherButton.click();
  }
}

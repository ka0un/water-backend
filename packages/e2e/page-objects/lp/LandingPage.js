/**
 * Page Object — LP Landing Page (/)
 */
export class LandingPage {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    this.page = page;

    // Header / brand
    this.brandName     = page.getByText('Water Quality Monitor');

    // Hero section
    this.heroHeading   = page.getByRole('heading', { name: /Is Your Water Safe/i });
    this.heroSubtitle  = page.getByText(/Report water quality issues in your area/i);
    this.ctaButton     = page.getByRole('button', { name: /Report a Water Issue/i });
    this.reportButton  = this.ctaButton; // alias kept for backward compat
    this.noAccountNote = page.getByText(/No account needed/i);

    // Feature card titles
    this.featureReportIssues    = page.getByText('Report Issues');
    this.featureExpertReview    = page.getByText('Expert Review');
    this.featureQuickSimple     = page.getByText('Quick & Simple');
    this.featureCommunityDriven = page.getByText('Community Driven');

    // Footer
    this.footer = page.getByText(/Water Quality Monitoring System/i);
  }

  async goto() {
    await this.page.goto('/');
    await this.page.waitForLoadState('networkidle');
  }

  async clickReportIssue() {
    await this.ctaButton.click();
  }

  /** Returns visible feature card title strings */
  async getVisibleFeatureTitles() {
    const titles = ['Report Issues', 'Expert Review', 'Quick & Simple', 'Community Driven'];
    const visible = [];
    for (const t of titles) {
      if (await this.page.getByText(t).first().isVisible()) visible.push(t);
    }
    return visible;
  }
}

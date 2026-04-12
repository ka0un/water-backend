/**
 * Page Object — Frontend Public Pages
 *
 * Covers:
 *   / (LandingPage)
 *   /map (PublicMap)
 *   /track (PublicReportTracker)
 *   /report (PublicReportSubmit — simplified 4-step wizard)
 */
export class PublicPage {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    this.page = page;

    // ── Main landing (/) ──────────────────────────────────────────
    this.brandName          = page.getByText('AquaMonitor');
    this.submitReportButton = page.getByRole('button', { name: /Submit a Report/i })
      .or(page.getByRole('button', { name: /Enter Dashboard/i }));
    this.exploreMapButton   = page.getByRole('button', { name: /Explore Map/i });
    this.trackStatusButton  = page.getByRole('button', { name: /Track Status/i });
    this.signInButton       = page.getByRole('button', { name: /Sign In/i });
    this.registerButton     = page.getByRole('button', { name: /Register/i });
    this.heroHeading        = page.getByRole('heading', { name: /Safeguard Your/i });
    this.platformFeatures   = page.getByRole('heading', { name: /Platform Features/i });

    // ── /map ──────────────────────────────────────────────────────
    this.mapHeading       = page.getByRole('heading', { name: /Public Water Resources Map/i });
    this.mapBackButton    = page.getByRole('button', { name: /back/i });
    this.mapContainer     = page.locator('.leaflet-container');
    this.totalVerified    = page.getByText(/Total Verified Sources/i);

    // ── /track ────────────────────────────────────────────────────
    this.trackHeading     = page.getByRole('heading', { name: /Track Water Reports/i });
    this.nicSearchInput   = page.getByPlaceholder(/Enter your NIC/i);
    this.trackButton      = page.getByRole('button', { name: /^Track$/i });
    this.trackResults     = page.getByText(/Found \d+ report/i);

    // ── /report (PublicReportSubmit) ──────────────────────────────
    this.reportStepper    = page.getByRole('progressbar').or(page.locator('[class*="stepper"], [class*="Stepper"]')).first();
  }

  async gotoLanding() {
    await this.page.goto('/');
    await this.page.waitForLoadState('networkidle');
  }

  async gotoMap() {
    await this.page.goto('/map');
    await this.page.waitForLoadState('networkidle');
  }

  async gotoTracker() {
    await this.page.goto('/track');
    await this.page.waitForLoadState('networkidle');
  }

  async gotoPublicReport() {
    await this.page.goto('/report');
    await this.page.waitForLoadState('networkidle');
  }

  async searchByNic(nic) {
    await this.nicSearchInput.fill(nic);
    await this.trackButton.click();
  }
}

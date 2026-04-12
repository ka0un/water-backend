/**
 * Page Object — Frontend Auth Pages (/login and /register)
 */
export class AuthPage {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    this.page = page;

    // ── Login page ────────────────────────────────────────────────
    this.emailInput       = page.getByLabel(/Email Address/i);
    this.passwordInput    = page.getByLabel('Password', { exact: true });
    this.loginButton      = page.getByRole('button', { name: /Sign In/i });
    this.showPasswordBtn  = page.locator('button[aria-label*="assword"]').or(
      page.locator('[data-testid="VisibilityIcon"]').locator('..')
    );
    this.loginErrorAlert  = page.getByRole('alert');
    this.loginHeading     = page.getByRole('heading', { name: /Admin Dashboard/i });
    this.registerLink     = page.getByRole('button', { name: /Register here/i });

    // ── Register page ─────────────────────────────────────────────
    this.nameInput           = page.getByLabel(/Full Name/i);
    this.confirmPasswordInput = page.getByLabel(/Confirm Password/i);
    this.roleSelect          = page.locator('[id*="role"]').or(page.getByLabel(/Role/i));
    this.registerButton      = page.getByRole('button', { name: /Create Account/i });
    this.registerHeading     = page.getByRole('heading', { name: /Create Account/i });
    this.signInLink          = page.getByText(/Sign in/i).last();
    this.registerErrorAlert  = page.getByRole('alert');
  }

  async gotoLogin() {
    await this.page.goto('/login');
    await this.page.waitForLoadState('networkidle');
  }

  async gotoRegister() {
    await this.page.goto('/register');
    await this.page.waitForLoadState('networkidle');
  }

  async login(email, password) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
  }

  async register(name, email, password, confirmPassword = password, role = 'USER') {
    await this.nameInput.fill(name);
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.confirmPasswordInput.fill(confirmPassword);
    // Select role from MUI Select (opens dropdown)
    await this.page.getByLabel('Role').click();
    await this.page.getByRole('option', { name: role }).click();
    await this.registerButton.click();
  }
}

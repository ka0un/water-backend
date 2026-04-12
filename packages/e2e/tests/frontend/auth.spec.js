import { test, expect } from '@playwright/test';
import { AuthPage } from '../../page-objects/frontend/AuthPage.js';
import { apiError, MOCK_USERS, MOCK_TOKEN } from '../../helpers/frontend-mocks.js';

test.describe('Frontend — Authentication', () => {

  // ── Login Page ─────────────────────────────────────────────────

  test.describe('Login Page', () => {
    let auth;

    test.beforeEach(async ({ page }) => {
      auth = new AuthPage(page);
      await auth.gotoLogin();
    });

    test('should display Admin Dashboard heading', async () => {
      await expect(auth.loginHeading).toBeVisible();
    });

    test('should display Email Address input', async () => {
      await expect(auth.emailInput).toBeVisible();
    });

    test('should display Password input', async () => {
      await expect(auth.passwordInput).toBeVisible();
    });

    test('should display Sign In button', async () => {
      await expect(auth.loginButton).toBeVisible();
      await expect(auth.loginButton).toBeEnabled();
    });

    test('should display Register Here link', async () => {
      await expect(auth.registerLink).toBeVisible();
    });

    test('should display "only moderators/admins" notice', async ({ page }) => {
      await expect(page.getByText(/moderators|admins|lab staff/i)).toBeVisible();
    });

    test('should navigate to /register when Register Here is clicked', async ({ page }) => {
      await auth.registerLink.click();
      await expect(page).toHaveURL(/\/register/);
    });

    test('should show an error alert for invalid credentials', async ({ page }) => {
      // Use 400 (not 401) — the Axios interceptor redirects on 401 before the error can be displayed
      await page.route('**/api/v1/auth/login', async (route) => {
        await route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify(apiError('Invalid email or password', 400)),
        });
      });

      await auth.login('wrong@example.com', 'WrongPassword1!');
      await expect(auth.loginErrorAlert).toBeVisible({ timeout: 5000 });
    });

    test('should show error when submitting empty form', async ({ page }) => {
      await auth.loginButton.click();
      await expect(
        auth.loginErrorAlert.or(page.getByText(/Please enter/i)).first()
      ).toBeVisible({ timeout: 3000 });
    });

    test('should redirect to /app after successful login as ADMIN', async ({ page }) => {
      // Register in LIFO order: catch-all first (lowest priority), specific mocks last (highest priority)

      // 1. Catch-all for any other API calls (dashboard, etc.) — registered first = lowest priority
      await page.route('**/api/v1/**', async (route) => {
        await route.fulfill({
          status: 200, contentType: 'application/json',
          body: JSON.stringify({ status: 'success', data: {} }),
        });
      });

      // 2. /auth/me for session verification after redirect
      await page.route('**/api/v1/auth/me', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ status: 'success', data: { user: MOCK_USERS.admin } }),
        });
      });

      // 3. Login endpoint — registered last = highest priority
      // Response structure must match AuthContext: `const { token, user } = data.data`
      await page.route('**/api/v1/auth/login', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            status: 'success',
            data: { token: MOCK_TOKEN, user: MOCK_USERS.admin },
          }),
        });
      });

      await auth.login('admin@example.com', 'Admin123!');
      await expect(page).toHaveURL(/\/app/, { timeout: 10000 });
    });
  });

  // ── Register Page ──────────────────────────────────────────────

  test.describe('Register Page', () => {
    let auth;

    test.beforeEach(async ({ page }) => {
      auth = new AuthPage(page);
      await auth.gotoRegister();
    });

    test('should display Create Account heading', async () => {
      await expect(auth.registerHeading).toBeVisible();
    });

    test('should display Full Name input', async () => {
      await expect(auth.nameInput).toBeVisible();
    });

    test('should display Email Address input', async () => {
      await expect(auth.emailInput).toBeVisible();
    });

    test('should display Password input', async () => {
      await expect(auth.passwordInput).toBeVisible();
    });

    test('should display Confirm Password input', async () => {
      await expect(auth.confirmPasswordInput).toBeVisible();
    });

    test('should display Role selector', async ({ page }) => {
      await expect(page.getByLabel('Role')).toBeVisible();
    });

    test('should display Create Account button', async () => {
      await expect(auth.registerButton).toBeVisible();
    });

    test('should display Sign In link', async () => {
      await expect(auth.signInLink).toBeVisible();
    });

    test('should show password mismatch error', async ({ page }) => {
      await auth.nameInput.fill('Test User');
      await auth.emailInput.fill('test@example.com');
      await auth.passwordInput.fill('Password123!');
      await auth.confirmPasswordInput.fill('DifferentPassword123!');
      await auth.registerButton.click();
      await expect(page.getByText(/do not match/i)).toBeVisible({ timeout: 3000 });
    });

    test('should show error when fields are empty', async ({ page }) => {
      await auth.registerButton.click();
      await expect(
        page.getByText(/fill in all/i).or(auth.registerErrorAlert).first()
      ).toBeVisible({ timeout: 3000 });
    });

    test('should redirect to /login after successful registration', async ({ page }) => {
      await page.route('**/api/v1/auth/register', async (route) => {
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({ status: 'success', data: { user: MOCK_USERS.regularUser } }),
        });
      });

      await auth.nameInput.fill('New User');
      await auth.emailInput.fill('newuser@example.com');
      await auth.passwordInput.fill('SecurePass123!');
      await auth.confirmPasswordInput.fill('SecurePass123!');
      await auth.registerButton.click();
      await expect(page).toHaveURL(/\/login/, { timeout: 8000 });
    });

    test('should navigate to /login when Sign In is clicked', async ({ page }) => {
      await auth.signInLink.click();
      await expect(page).toHaveURL(/\/login/);
    });
  });
});

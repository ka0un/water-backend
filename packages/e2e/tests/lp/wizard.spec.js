/**
 * Wizard smoke tests — basic navigation entry points
 *
 * Covers the LP landing page → wizard entry flow and a few
 * non-observation-specific checks (page title, URL routing).
 * Full wizard flows are covered in wizard-observation.spec.js.
 */
import { test, expect } from '@playwright/test';
import { LandingPage } from '../../page-objects/lp/LandingPage.js';
import { WizardPage } from '../../page-objects/lp/WizardPage.js';
import { setupLpMocks, MOCK_NIC } from '../../helpers/lp-mocks.js';

test.describe('LP — Wizard: Smoke Tests', () => {
  let landingPage;
  let wizard;

  test.beforeEach(async ({ page }) => {
    landingPage = new LandingPage(page);
    wizard = new WizardPage(page);
    await setupLpMocks(page);
  });

  test('should reach the wizard from the landing page CTA', async ({ page }) => {
    await landingPage.goto();
    await expect(landingPage.heroHeading).toBeVisible();
    await landingPage.clickReportIssue();
    await expect(page).toHaveURL(/\/report/);
    await expect(wizard.nicInput).toBeVisible();
  });

  test('should show NIC input on the wizard welcome step', async ({ page }) => {
    await wizard.goto();
    await expect(wizard.nicInput).toBeVisible();
    await expect(wizard.getStartedButton).toBeVisible();
  });

  test('should advance from Welcome to Water Source after entering NIC', async ({ page }) => {
    await wizard.goto();
    await wizard.startReport(MOCK_NIC);
    await wizard.waitForStep('What type of water source');
  });

  test('should advance from Water Source to Location after selecting a source', async ({ page }) => {
    await wizard.goto();
    await wizard.startReport(MOCK_NIC);
    await wizard.waitForStep('What type of water source');
    await wizard.selectOption('River / Stream');
    await wizard.goNext();
    await wizard.waitForStep('Where is this water source');
  });

  test('should advance from Location to Testing Method', async ({ page }) => {
    await wizard.goto();
    await wizard.startReport(MOCK_NIC);
    await wizard.waitForStep('What type of water source');
    await wizard.selectOption('River / Stream');
    await wizard.goNext();
    await wizard.waitForStep('Where is this water source');
    await wizard.setLocation('Colombo', 'Colombo City');
    await wizard.waitForStep('Have you tested this water');
  });

  test('should advance from Testing Method to Appearance (Observation Only)', async ({ page }) => {
    await wizard.goto();
    await wizard.startReport(MOCK_NIC);
    await wizard.waitForStep('What type of water source');
    await wizard.selectOption('River / Stream');
    await wizard.goNext();
    await wizard.waitForStep('Where is this water source');
    await wizard.setLocation('Colombo', 'Colombo City');
    await wizard.waitForStep('Have you tested this water');
    await wizard.selectOption('Observation Only');
    await wizard.goNext();
    await wizard.waitForStep('What color is the water');
  });
});

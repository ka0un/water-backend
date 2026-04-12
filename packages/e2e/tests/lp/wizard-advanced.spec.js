/**
 * Wizard flow: Advanced Tests step
 *
 * When the user selects any testing method OTHER than "Observation Only",
 * the advanced water quality parameters step is shown.
 *
 * Tests that the advanced step renders, accepts numeric input,
 * and allows proceeding to subsequent steps.
 */
import { test, expect } from '@playwright/test';
import { WizardPage } from '../../page-objects/lp/WizardPage.js';
import { setupLpMocks, MOCK_NIC } from '../../helpers/lp-mocks.js';

test.describe('LP — Wizard: Advanced Tests Step', () => {
  let wizard;

  test.beforeEach(async ({ page }) => {
    wizard = new WizardPage(page);
    await setupLpMocks(page);
    await wizard.goto();
    // Advance to Testing Method step
    await wizard.startReport(MOCK_NIC);
    await wizard.waitForStep('What type of water source');
    await wizard.selectOption('River / Stream');
    await wizard.goNext();
    await wizard.waitForStep('Where is this water source');
    await wizard.setLocation('Colombo', 'Colombo City');
    await wizard.waitForStep('Have you tested this water');
  });

  test('should show Advanced Tests step when Test Strips is selected', async ({ page }) => {
    await wizard.selectOption('Test Strips');
    await wizard.goNext();
    await wizard.waitForStep('Test Results');
    // Should see at least one numeric input for test parameters
    await expect(page.locator('input[type="number"]').first()).toBeVisible();
  });

  test('should show Advanced Tests step when Home Lab Kit is selected', async ({ page }) => {
    await wizard.selectOption('Home Lab Kit');
    await wizard.goNext();
    await wizard.waitForStep('Test Results');
    await expect(page.locator('input[type="number"]').first()).toBeVisible();
  });

  test('should show Advanced Tests step when Professional Lab is selected', async ({ page }) => {
    await wizard.selectOption('Professional Lab');
    await wizard.goNext();
    await wizard.waitForStep('Test Results');
    await expect(page.locator('input[type="number"]').first()).toBeVisible();
  });

  test('should SKIP Advanced Tests step when Observation Only is selected', async ({ page }) => {
    await wizard.selectOption('Observation Only');
    await wizard.goNext();
    // After Observation Only, next step should be Appearance (color) — NOT advanced tests
    await wizard.waitForStep('What color is the water');
  });

  test('should allow entering pH value in Advanced Tests step', async ({ page }) => {
    await wizard.selectOption('Test Strips');
    await wizard.goNext();
    await wizard.waitForStep('Test Results');

    // Fill pH input (first number input is typically pH)
    const inputs = page.locator('input[type="number"]');
    await inputs.first().fill('7.2');
    await expect(inputs.first()).toHaveValue('7.2');
  });

  test('should allow proceeding from Advanced Tests with some values filled', async ({ page }) => {
    await wizard.selectOption('Test Strips');
    await wizard.goNext();
    await wizard.waitForStep('Test Results');

    // Fill at least one parameter value
    const inputs = page.locator('input[type="number"]');
    await inputs.first().fill('7');
    await wizard.goNext();

    // Should advance to Appearance step
    await wizard.waitForStep('What color is the water');
  });

  test('should allow proceeding from Advanced Tests with no values filled', async ({ page }) => {
    await wizard.selectOption('Test Strips');
    await wizard.goNext();
    await wizard.waitForStep('Test Results');

    // Click Continue without filling any values
    await wizard.goNext();
    await wizard.waitForStep('What color is the water');
  });
});

/**
 * Full happy-path wizard flow using "Observation Only" testing method
 * (the most common user journey — no advanced tests required).
 *
 * IMPORTANT — Step behaviour:
 *   • Regular steps (OptionGrid + Continue): select option, then goNext()
 *   • ObservationStep in phase-0 (Yes/No card): clicking "No" automatically
 *     calls onNext() internally — do NOT call goNext() after selectOption('No').
 *
 * Steps exercised:
 *   Welcome → Water Source → Location → Testing Method →
 *   Appearance → Smell → Taste → Turbidity → Sediment →
 *   Oil/Grease → Foam → Algae → Trash → Mud →
 *   Insects → Plants → Wildlife → Water Flow →
 *   Temperature → Images (skip) → Contact → Review → Submit → Thank You
 */
import { test, expect } from '@playwright/test';
import { WizardPage } from '../../page-objects/lp/WizardPage.js';
import { setupLpMocks, MOCK_NIC } from '../../helpers/lp-mocks.js';

test.describe('LP — Wizard: Observation-Only Full Flow (River)', () => {
  let wizard;

  test.beforeEach(async ({ page }) => {
    wizard = new WizardPage(page);
    await setupLpMocks(page);
    await wizard.goto();
  });

  test('should complete the full observation flow and land on Thank You page', async ({ page }) => {
    // ── Step 1: Welcome ───────────────────────────────────────────
    await wizard.startReport(MOCK_NIC);

    // ── Step 2: Water Source ──────────────────────────────────────
    await wizard.waitForStep('What type of water source');
    await wizard.selectOption('River / Stream');
    await wizard.goNext();

    // ── Step 3: Location ──────────────────────────────────────────
    await wizard.waitForStep('Where is this water source');
    await wizard.setLocation('Colombo', 'Colombo City');
    // setLocation() calls goNext() internally

    // ── Step 4: Testing Method ────────────────────────────────────
    await wizard.waitForStep('Have you tested this water');
    await wizard.selectOption('Observation Only');
    await wizard.goNext();

    // Advanced tests step is SKIPPED for Observation Only

    // ── Step 5: Appearance ────────────────────────────────────────
    await wizard.waitForStep('What color is the water');
    await wizard.selectOption('Clear');
    await wizard.goNext();

    // ── Step 6: Smell (ObservationStep — "No" auto-advances) ──────
    await wizard.waitForStep('smell');
    await wizard.selectOption('No');
    // No goNext() — clicking "No" triggers saveStepData + onNext() automatically

    // ── Step 7: Taste (ObservationStep — auto-advance) ────────────
    await wizard.waitForStep('taste');
    await wizard.selectOption('No');

    // ── Step 8: Turbidity (regular OptionGrid step) ───────────────
    await wizard.waitForStep('clear');  // "How clear is the water?"
    await wizard.selectOption('Clear');
    await wizard.goNext();

    // ── Step 9: Sediment (ObservationStep — auto-advance) ─────────
    await wizard.waitForStep('sediment');
    await wizard.selectOption('No');

    // ── Step 10: Oil/Grease (ObservationStep — auto-advance) ──────
    await wizard.waitForStep('oil');
    await wizard.selectOption('No');

    // ── Step 11: Foam (ObservationStep — auto-advance) ────────────
    await wizard.waitForStep('foam');
    await wizard.selectOption('No');

    // River source includes: Algae, Trash, Mud, Insects, Plants, Wildlife

    // ── Step 12: Algae (ObservationStep — auto-advance) ──────────
    await wizard.waitForStep('algae');
    await wizard.selectOption('No');

    // ── Step 13: Trash (ObservationStep — auto-advance) ──────────
    await wizard.waitForStep('trash');
    await wizard.selectOption('No');

    // ── Step 14: Mud (ObservationStep — auto-advance) ─────────────
    await wizard.waitForStep('mud');
    await wizard.selectOption('No');

    // ── Step 15: Insects (ObservationStep — auto-advance) ─────────
    await wizard.waitForStep('insect');
    await wizard.selectOption('No');

    // ── Step 16: Plant Matter (ObservationStep — auto-advance) ────
    await wizard.waitForStep('plant');
    await wizard.selectOption('No');

    // ── Step 17: Wildlife (ObservationStep — auto-advance) ────────
    await wizard.waitForStep('animal');  // "Have you seen dead animals..."
    await wizard.selectOption('No');

    // River: no pipes step

    // ── Step 18: Water Flow (regular OptionGrid step) ─────────────
    await wizard.waitForStep('flowing');  // "How is the water flowing?"
    await wizard.selectOption('Normal');
    await wizard.goNext();

    // ── Step 19: Temperature (regular OptionGrid step) ───────────────────────
    await wizard.waitForStep('temperature');
    await wizard.selectOption('Normal');
    await wizard.goNext();

    // ── Step 20: Images (regular step — skip) ────────────────────
    await wizard.waitForStep('Photos');  // "Upload Photos (Optional)"
    await wizard.goNext();

    // ── Step 21: Contact (regular step — skip) ────────────────────
    await wizard.waitForStep('Updated');  // "Stay Updated (Optional)"
    await wizard.goNext();

    // ── Step 22: Review ───────────────────────────────────────────
    await wizard.waitForStep('Review');
    await expect(page.getByText(/Water Source/i)).toBeVisible();
    await wizard.submitReport();

    // ── Thank You page ────────────────────────────────────────────
    await expect(page).toHaveURL(/\/thank-you/, { timeout: 15000 });
    await expect(page.getByRole('heading', { name: /Thank You/i })).toBeVisible();
  });

  test('should allow navigating back from Water Source to Welcome', async ({ page }) => {
    await wizard.startReport(MOCK_NIC);
    await wizard.waitForStep('What type of water source');
    await wizard.goBack();
    await expect(wizard.nicInput).toBeVisible();
  });

  test('should keep Continue disabled until a source is selected', async ({ page }) => {
    await wizard.startReport(MOCK_NIC);
    await wizard.waitForStep('What type of water source');
    await expect(wizard.continueButton).toBeDisabled();
    await wizard.selectOption('Well');
    await expect(wizard.continueButton).toBeEnabled();
  });

  test('should require district and city before advancing from Location step', async ({ page }) => {
    await wizard.startReport(MOCK_NIC);
    await wizard.waitForStep('What type of water source');
    await wizard.selectOption('River / Stream');
    await wizard.goNext();
    await wizard.waitForStep('Where is this water source');
    // Continue should be disabled until district + city are filled
    await expect(wizard.continueButton).toBeDisabled();
    await page.locator('select').selectOption('Colombo');
    await page.getByLabel(/City \/ Town/i).fill('Colombo City');
    await expect(wizard.continueButton).toBeEnabled();
  });
});

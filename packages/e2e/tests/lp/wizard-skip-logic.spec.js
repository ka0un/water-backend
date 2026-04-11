/**
 * Wizard skip logic tests
 *
 * Skip map (from WizardPage.jsx):
 *   tap       → skip: algae, trash, wildlife, plants, mud
 *   borehole  → skip: pipes, algae, trash, wildlife, plants, mud, foam
 *   river     → skip: pipes
 *   rainwater → skip: algae, trash, wildlife, plants, mud, oil, foam, pipes
 */
import { test, expect } from '@playwright/test';
import { WizardPage } from '../../page-objects/lp/WizardPage.js';
import { setupLpMocks, MOCK_NIC } from '../../helpers/lp-mocks.js';

// Clicking a "No" button by role is more reliable than getByText
// because getByRole uses accessible name (aria-label / textContent)
// and strict mode violations are more obvious.
async function clickNo(page) {
  await page.getByRole('button', { name: /^No$/i }).first().click();
}

/**
 * Advance through the common initial steps up to (and including) the
 * Testing Method step, leaving the wizard ready for Appearance.
 */
async function setupWizardToAppearance(page, wizard, sourceLabel) {
  await setupLpMocks(page);
  await wizard.goto();
  await wizard.startReport(MOCK_NIC);

  await wizard.waitForStep('What type of water source');
  await wizard.selectOption(sourceLabel);
  await wizard.goNext();

  await wizard.waitForStep('Where is this water source');
  await wizard.setLocation('Colombo', 'Colombo City');

  await wizard.waitForStep('Have you tested this water');
  await wizard.selectOption('Observation Only');
  await wizard.goNext();

  // Now on Appearance step
  await wizard.waitForStep('What color is the water');
}

/**
 * Advance through the shared pre-foam steps (Appearance→Sediment).
 * Leaves the wizard ready for Oil or Foam depending on source.
 */
async function advanceThroughToOil(page, wizard) {
  // Appearance (regular step)
  await wizard.selectOption('Clear');
  await wizard.goNext();

  // Smell (ObservationStep — No auto-advances)
  await wizard.waitForStep('smell');
  await clickNo(page);

  // Taste (ObservationStep)
  await wizard.waitForStep('taste');
  await clickNo(page);

  // Turbidity (regular OptionGrid)
  await wizard.waitForStep('clear');
  await wizard.selectOption('Clear');
  await wizard.goNext();

  // Sediment (ObservationStep)
  await wizard.waitForStep('sediment');
  await clickNo(page);

  // After Sediment, next is Oil (for most sources)
}

test.describe('LP — Wizard: Skip Logic by Water Source', () => {
  let wizard;

  test.beforeEach(async ({ page }) => {
    wizard = new WizardPage(page);
  });

  // ── Tap Water ─────────────────────────────────────────────────

  test('Tap Water — should skip Algae step', async ({ page }) => {
    await setupWizardToAppearance(page, wizard, 'Tap Water');
    await advanceThroughToOil(page, wizard);

    // Oil — present for Tap Water
    await wizard.waitForStep('oil');
    await clickNo(page);

    // Foam — present for Tap Water
    await wizard.waitForStep('foam');
    await clickNo(page);

    // After Foam: tap skips algae, trash, wildlife, plants, mud
    // Next should be Insects (NOT Algae)
    await expect(
      page.getByRole('heading', { name: /insect/i }).first()
    ).toBeVisible({ timeout: 8000 });
    const heading = await page.getByRole('heading').first().textContent();
    expect(heading?.toLowerCase()).not.toContain('algae');
  });

  test('Tap Water — should skip Trash step', async ({ page }) => {
    await setupWizardToAppearance(page, wizard, 'Tap Water');
    await advanceThroughToOil(page, wizard);

    await wizard.waitForStep('oil');
    await clickNo(page);

    await wizard.waitForStep('foam');
    await clickNo(page);

    // Insects step (NOT Trash, which is skipped)
    await wizard.waitForStep('insect');
    await clickNo(page);

    // After Insects for tap: Pipe Condition (trash is skipped)
    const heading = await page.getByRole('heading').first().textContent();
    expect(heading?.toLowerCase()).not.toContain('trash');
    await expect(
      page.getByRole('heading', { name: /pipe/i }).first()
    ).toBeVisible({ timeout: 8000 });
  });

  test('Tap Water — should show Pipe Condition step', async ({ page }) => {
    await setupWizardToAppearance(page, wizard, 'Tap Water');
    await advanceThroughToOil(page, wizard);

    await wizard.waitForStep('oil');
    await clickNo(page);

    await wizard.waitForStep('foam');
    await clickNo(page);

    // Tap Water: after foam, skip algae/trash/wildlife/plants/mud → show insects, then pipes
    await wizard.waitForStep('insect');
    await clickNo(page);

    // Pipe Condition should now be visible for Tap Water
    await expect(
      page.getByRole('heading', { name: /pipe/i }).first()
    ).toBeVisible({ timeout: 8000 });
  });

  // ── River ─────────────────────────────────────────────────────

  test('River — should skip Pipe Condition step', async ({ page }) => {
    await setupWizardToAppearance(page, wizard, 'River / Stream');
    await advanceThroughToOil(page, wizard);

    await wizard.waitForStep('oil');
    await clickNo(page);

    await wizard.waitForStep('foam');
    await clickNo(page);

    // River: shows algae, trash, mud, insects, plants, wildlife — then Water Flow (NO pipes)
    // Use explicit waitForStep to avoid clicking AnimatePresence exit-animation buttons
    await wizard.waitForStep('algae');
    await clickNo(page);

    await wizard.waitForStep('trash');
    await clickNo(page);

    await wizard.waitForStep('mud');
    await clickNo(page);

    await wizard.waitForStep('insect');
    await clickNo(page);

    await wizard.waitForStep('plant');
    await clickNo(page);

    await wizard.waitForStep('animal');
    await clickNo(page);

    // Water Flow should appear WITHOUT a pipe step in between
    await expect(
      page.getByRole('heading', { name: /flowing/i }).first()
    ).toBeVisible({ timeout: 8000 });

    const heading = await page.getByRole('heading').first().textContent();
    expect(heading?.toLowerCase()).not.toContain('pipe');
  });

  test('River — should show Algae step', async ({ page }) => {
    await setupWizardToAppearance(page, wizard, 'River / Stream');
    await advanceThroughToOil(page, wizard);

    await wizard.waitForStep('oil');
    await clickNo(page);

    await wizard.waitForStep('foam');
    await clickNo(page);

    // River: Algae should be the very next step after Foam
    await expect(
      page.getByRole('heading', { name: /algae/i }).first()
    ).toBeVisible({ timeout: 8000 });
  });

  // ── Borehole ──────────────────────────────────────────────────

  test('Borehole — should skip Algae, Trash, Foam, and Pipe steps', async ({
    page,
  }) => {
    await setupWizardToAppearance(page, wizard, 'Borehole');
    await advanceThroughToOil(page, wizard);

    // Oil — present for Borehole
    await wizard.waitForStep('oil');
    await clickNo(page);

    // Foam is SKIPPED for Borehole — next step should NOT be Foam
    await page.waitForTimeout(500); // let animation complete
    const foamHeading = page.getByRole('heading', { name: /foam/i }).first();
    const foamVisible = await foamHeading.isVisible({ timeout: 1500 }).catch(() => false);
    expect(foamVisible).toBe(false);

    // Algae, Trash are also SKIPPED for Borehole
    // Advance through any remaining observation steps (Insects, Wildlife)
    for (const kw of ['insect', 'animal']) {
      const step = page.getByRole('heading', { name: new RegExp(kw, 'i') }).first();
      if (await step.isVisible({ timeout: 2000 }).catch(() => false)) {
        await clickNo(page);
      }
    }

    // Water Flow or similar step should appear — not Pipe, Algae, or Trash
    await page.waitForTimeout(300);
    const heading = await page.getByRole('heading').first().textContent();
    expect(heading?.toLowerCase()).not.toContain('pipe');
    expect(heading?.toLowerCase()).not.toContain('algae');
    expect(heading?.toLowerCase()).not.toContain('trash');
  });

  // ── Rainwater ─────────────────────────────────────────────────

  test('Rainwater — should skip Algae, Oil, and Pipe steps', async ({ page }) => {
    await setupWizardToAppearance(page, wizard, 'Rainwater');
    await advanceThroughToOil(page, wizard);

    // After Sediment for Rainwater: Oil AND Foam are SKIPPED
    await page.waitForTimeout(500); // let animation settle

    const oilHeading = page.getByRole('heading', { name: /oil/i }).first();
    const oilVisible = await oilHeading.isVisible({ timeout: 1500 }).catch(() => false);
    expect(oilVisible).toBe(false);

    const foamHeading = page.getByRole('heading', { name: /foam/i }).first();
    const foamVisible = await foamHeading.isVisible({ timeout: 1500 }).catch(() => false);
    expect(foamVisible).toBe(false);

    // Current step should NOT contain algae, oil, or pipe
    const heading = await page.getByRole('heading').first().textContent();
    expect(heading?.toLowerCase()).not.toContain('algae');
    expect(heading?.toLowerCase()).not.toContain('oil');
    expect(heading?.toLowerCase()).not.toContain('pipe');
  });
});

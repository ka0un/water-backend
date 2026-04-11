# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: lp/wizard-skip-logic.spec.js >> LP — Wizard: Skip Logic by Water Source >> Rainwater — should skip Algae, Oil, and Pipe steps
- Location: tests/lp/wizard-skip-logic.spec.js:240:3

# Error details

```
Error: locator.waitFor: Test ended.
Call log:
  - waiting for getByRole('heading', { name: 'sediment' }).first() to be visible

```

# Test source

```ts
  2   |  * Page Object — LP Wizard (/report)
  3   |  *
  4   |  * Covers every step of the 24-step multi-step report wizard.
  5   |  */
  6   | export class WizardPage {
  7   |   /** @param {import('@playwright/test').Page} page */
  8   |   constructor(page) {
  9   |     this.page = page;
  10  | 
  11  |     // ── Shared navigation buttons ────────────────────────────────
  12  |     // "Continue" is used for most steps; "Skip" is shown on optional steps
  13  |     // (Images, Contact) when no data has been entered.
  14  |     // Matches "Continue", "Skip", "Continue (N photos)", "Skip — No Test Results", etc.
  15  |     this.continueButton      = page.getByRole('button', { name: /^(Continue|Skip)/i }).first();
  16  |     this.backButton          = page.getByRole('button', { name: /^Back$/i });
  17  |     this.submitButton        = page.getByRole('button', { name: /Submit Report/i });
  18  |     this.skipButton          = page.getByRole('button', { name: /^Skip$/i });
  19  | 
  20  |     // ── Welcome step ─────────────────────────────────────────────
  21  |     this.nicInput            = page.getByLabel(/National ID Card Number/i);
  22  |     this.getStartedButton    = page.getByRole('button', { name: /Get Started/i });
  23  |     this.startNewReportButton = page.getByRole('button', { name: /Start a New Report/i });
  24  |     this.inProgressSection   = page.getByText('In-Progress Reports');
  25  |     this.pastSubmissions     = page.getByText('Past Submissions');
  26  |     this.resumeChip          = page.getByText('Resume').first();
  27  |   }
  28  | 
  29  |   async goto() {
  30  |     await this.page.goto('/report');
  31  |     await this.page.waitForLoadState('networkidle');
  32  |   }
  33  | 
  34  |   // ── Welcome step ───────────────────────────────────────────────
  35  | 
  36  |   async enterNic(nic) {
  37  |     await this.nicInput.fill(nic);
  38  |   }
  39  | 
  40  |   async clickGetStarted() {
  41  |     await this.getStartedButton.click();
  42  |   }
  43  | 
  44  |   async startReport(nic) {
  45  |     await this.enterNic(nic);
  46  |     await this.clickGetStarted();
  47  |     // If existing reports panel shows, click "Start a New Report"
  48  |     const visible = await this.startNewReportButton
  49  |       .isVisible({ timeout: 2000 })
  50  |       .catch(() => false);
  51  |     if (visible) await this.startNewReportButton.click();
  52  |   }
  53  | 
  54  |   // ── OptionGrid helper ──────────────────────────────────────────
  55  |   // OptionGrid renders cards with exact label text
  56  | 
  57  |   async selectOption(labelText) {
  58  |     await this.page.getByText(labelText, { exact: true }).click();
  59  |   }
  60  | 
  61  |   // ── Location step ──────────────────────────────────────────────
  62  | 
  63  |   async setLocation(district = 'Colombo', city = 'Colombo City') {
  64  |     // Native <select> for District
  65  |     await this.page.locator('select').selectOption(district);
  66  |     // Text field for City / Town
  67  |     await this.page.getByLabel(/City \/ Town/i).fill(city);
  68  |     await this.continueButton.click();
  69  |   }
  70  | 
  71  |   // ── Contact step ───────────────────────────────────────────────
  72  | 
  73  |   async fillContact({ email = '', phone = '' } = {}) {
  74  |     if (email) await this.page.locator('input[type="email"]').fill(email);
  75  |     if (phone) await this.page.locator('input[type="tel"]').fill(phone);
  76  |   }
  77  | 
  78  |   // ── Generic navigation ─────────────────────────────────────────
  79  | 
  80  |   async goNext() {
  81  |     await this.continueButton.click();
  82  |   }
  83  | 
  84  |   async goBack() {
  85  |     await this.backButton.click();
  86  |   }
  87  | 
  88  |   async submitReport() {
  89  |     await this.submitButton.click();
  90  |   }
  91  | 
  92  |   // ── Step heading helpers ───────────────────────────────────────
  93  | 
  94  |   stepHeading(name) {
  95  |     return this.page.getByRole('heading', { name, exact: false });
  96  |   }
  97  | 
  98  |   async waitForStep(headingText) {
  99  |     await this.page
  100 |       .getByRole('heading', { name: headingText, exact: false })
  101 |       .first()
> 102 |       .waitFor({ state: 'visible', timeout: 10000 });
      |        ^ Error: locator.waitFor: Test ended.
  103 |   }
  104 | }
  105 | 
```
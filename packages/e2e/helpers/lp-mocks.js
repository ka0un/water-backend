/**
 * LP (Landing Page / Wizard) API mock helpers
 *
 * All wizard API calls are intercepted via page.route() so tests run
 * without a live backend.
 */

export const MOCK_NIC = '901234567V';
export const MOCK_REPORT_ID = 'mock-report-id-abc123';

/** A fresh (incomplete) wizard report returned by POST /public-reports */
export const MOCK_REPORT_NEW = {
  _id: MOCK_REPORT_ID,
  nic: MOCK_NIC,
  waterSource: null,
  currentStep: 1,
  wizardCompleted: false,
  mod_status: 'pending',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

/** A completed report returned in "past submissions" */
export const MOCK_REPORT_COMPLETED = {
  _id: 'mock-report-completed-xyz',
  nic: MOCK_NIC,
  waterSource: 'river',
  currentStep: 24,
  wizardCompleted: true,
  mod_status: 'pending',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-02T00:00:00.000Z',
  completedAt: '2026-01-02T00:00:00.000Z',
};

/** An in-progress (incomplete) report for resume tests */
export const MOCK_REPORT_IN_PROGRESS = {
  _id: 'mock-report-inprog-456',
  nic: MOCK_NIC,
  waterSource: 'well',
  currentStep: 3,
  wizardCompleted: false,
  mod_status: 'pending',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T12:00:00.000Z',
};

/**
 * Wraps a value in the standard API envelope used by the backend.
 */
export function apiEnvelope(data) {
  return { status: 'success', data };
}

/**
 * Sets up all LP wizard API route interceptors on the given page.
 *
 * IMPORTANT — Playwright route matching is LIFO (last registered = first matched).
 * We register the broadest catch-all FIRST and the most specific patterns LAST,
 * so the specific ones take priority.
 *
 * The PATCH handler is STATEFUL: it accumulates all patch bodies for the duration
 * of the test so that subsequent PATCH calls return all previously saved fields
 * (e.g. waterSource is preserved after testingMethod is saved).
 *
 * Also: axios uses baseURL '/api/v1/public-reports' + path '/', so the actual
 * request URL is '/api/v1/public-reports/' (with trailing slash). We use regex
 * patterns to match both with and without trailing slash safely.
 *
 * @param {import('@playwright/test').Page} page
 * @param {{ existingReports?: object[] }} options
 */
export async function setupLpMocks(page, { existingReports = [] } = {}) {
  // Clear the session cookie so the WizardContext doesn't try to load a stale report
  await page.context().clearCookies();

  // Stateful accumulator — merges every PATCH body so each response reflects
  // the full report state built up across all wizard steps.
  let accumulatedReport = { ...MOCK_REPORT_NEW };

  // ─── 1. Broadest catch-all (registered first = lowest priority) ──────────
  // Handles GET / PATCH for any report ID not specifically intercepted above
  await page.route(/\/api\/v1\/public-reports\/[^/]/, async (route) => {
    const url = route.request().url();
    const method = route.request().method();

    if (/\/submit$/.test(url) && method === 'POST') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(apiEnvelope({ report: { ...accumulatedReport, wizardCompleted: true } })),
      });
    } else if (/\/images$/.test(url) && method === 'POST') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(apiEnvelope({ images: [] })),
      });
    } else if (/\/by-nic\//.test(url)) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(apiEnvelope({ reports: existingReports })),
      });
    } else if (method === 'PATCH') {
      // Merge the PATCH body into our accumulated state, then return the full
      // accumulated report. This ensures WizardContext.saveStepData receives
      // back ALL previously saved fields (e.g. waterSource after testingMethod
      // is saved), preventing stale-data issues in skip-logic.
      try {
        const patchBody = JSON.parse(route.request().postData() || '{}');
        accumulatedReport = { ...accumulatedReport, ...patchBody };
      } catch {}
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(apiEnvelope({ report: { ...accumulatedReport } })),
      });
    } else if (method === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(apiEnvelope({ report: { ...accumulatedReport } })),
      });
    } else {
      await route.continue();
    }
  });

  // ─── 2. POST to create a new report (no ID in path) ──────────────────────
  // Matches: /api/v1/public-reports  OR  /api/v1/public-reports/
  await page.route(/\/api\/v1\/public-reports\/?$/, async (route) => {
    if (route.request().method() === 'POST') {
      // Reset accumulator for the fresh report
      accumulatedReport = { ...MOCK_REPORT_NEW };
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify(apiEnvelope({ report: { ...accumulatedReport } })),
      });
    } else {
      await route.continue();
    }
  });
}

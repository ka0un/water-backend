/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  k6 Load Test — Water Test Submission Flow                  ║
 * ║                                                              ║
 * ║  Simulates the full public wizard flow:                      ║
 * ║    1. POST /public-reports        — create report (NIC)     ║
 * ║    2. PATCH /public-reports/{id}  — update water source     ║
 * ║    3. PATCH /public-reports/{id}  — update location         ║
 * ║    4. PATCH /public-reports/{id}  — update appearance       ║
 * ║    5. PATCH /public-reports/{id}  — update testing method   ║
 * ║    6. POST  /public-reports/{id}/submit — final submit      ║
 * ║                                                              ║
 * ║  Scenarios:                                                  ║
 * ║    smoke    — 5 VUs × 1 min  (sanity check)                ║
 * ║    load     — ramp to 50 VUs × 5 min (steady load)         ║
 * ║    stress   — ramp to 150 VUs × 3 min (stress)             ║
 * ║    spike    — instant 200 VUs × 30 s (spike)               ║
 * ║                                                              ║
 * ║  Run:                                                        ║
 * ║    k6 run scripts/water-submission.js                       ║
 * ║    k6 run -e SCENARIO=smoke scripts/water-submission.js     ║
 * ║    k6 run -e BASE_URL=http://api.prod:3000/api/v1 ...       ║
 * ╚══════════════════════════════════════════════════════════════╝
 */

import http         from 'k6/http';
import { check, sleep, group } from 'k6';
import { SharedArray } from 'k6/data';

import {
  BASE_URL,
  COMMON_THRESHOLDS,
  randomNic,
  pick,
  WATER_SOURCES,
  DISTRICTS,
  CITIES,
  APPEARANCE_VALUES,
  TESTING_METHODS,
  TURBIDITY_VALUES,
} from '../utils/config.js';

import {
  jsonHeaders,
  parseJSON,
  assertOk,
  wizardThink,
  reportCreateDuration,
  reportUpdateDuration,
  reportSubmitDuration,
  submissionErrors,
  submissionSuccessRate,
} from '../utils/helpers.js';

// ── Scenario selector (override with -e SCENARIO=stress) ────────
const SCENARIO = __ENV.SCENARIO || 'load';

// ── Scenario definitions ─────────────────────────────────────────
const SCENARIOS = {
  smoke: {
    executor:    'constant-vus',
    vus:         5,
    duration:    '1m',
    tags:        { scenario: 'smoke' },
  },
  load: {
    executor:    'ramping-vus',
    startVUs:    0,
    stages: [
      { duration: '1m',  target: 20  },  // ramp up
      { duration: '5m',  target: 50  },  // hold steady
      { duration: '1m',  target: 0   },  // ramp down
    ],
    tags: { scenario: 'load' },
  },
  stress: {
    executor:    'ramping-vus',
    startVUs:    0,
    stages: [
      { duration: '1m',  target: 50  },
      { duration: '2m',  target: 100 },
      { duration: '2m',  target: 150 },
      { duration: '2m',  target: 0   },
    ],
    tags: { scenario: 'stress' },
  },
  spike: {
    executor:    'ramping-vus',
    startVUs:    0,
    stages: [
      { duration: '10s', target: 200 },  // instant spike
      { duration: '30s', target: 200 },  // hold
      { duration: '20s', target: 0   },  // recover
    ],
    tags: { scenario: 'spike' },
  },
};

// ── k6 options ───────────────────────────────────────────────────
export const options = {
  scenarios: {
    water_submission: SCENARIOS[SCENARIO] || SCENARIOS.load,
  },
  thresholds: {
    ...COMMON_THRESHOLDS,
    // Submission-specific thresholds
    'report_create_duration':  ['p(95)<1500'],  // create must be fast
    'report_update_duration':  ['p(95)<1000'],  // auto-save must be snappy
    'report_submit_duration':  ['p(95)<2000'],  // final submit
    'submission_success_rate': ['rate>0.99'],   // 99 % success required
    // Step-specific named request thresholds
    'http_req_duration{name:create_report}':   ['p(95)<1500'],
    'http_req_duration{name:update_step}':     ['p(95)<1000'],
    'http_req_duration{name:submit_report}':   ['p(95)<2000'],
    'http_req_duration{name:get_by_nic}':      ['p(95)<800' ],
  },
};

// ── Wizard step payloads ──────────────────────────────────────────
function buildWaterSourcePayload() {
  return {
    waterSource: pick(WATER_SOURCES),
  };
}

function buildLocationPayload() {
  const district = pick(DISTRICTS);
  const city     = pick(CITIES);
  return {
    location: {
      district,
      city,
      address: `${Math.floor(Math.random() * 200) + 1} Main Street, ${city}`,
      coordinates: {
        lat: 6.9 + Math.random() * 2.1,   // Sri Lanka lat range ~6.9 – 9.0
        lng: 79.8 + Math.random() * 1.7,  // Sri Lanka lng range ~79.8 – 81.5
      },
    },
  };
}

function buildAppearancePayload() {
  // Backend schema: appearance: { value: string, notes: string }
  //                 turbidity:  { value: string }
  return {
    appearance: {
      value: pick(APPEARANCE_VALUES),
      notes: '',
    },
    turbidity: {
      value: pick(TURBIDITY_VALUES),
    },
  };
}

function buildTestingMethodPayload() {
  // Valid values: 'observation' | 'test_strips' | 'lab_kit' | 'professional_lab'
  const method = pick(TESTING_METHODS);
  return { testingMethod: method };
}

function buildAdvancedTestsPayload() {
  return {
    advancedTests: {
      ph:       { value: 6 + Math.random() * 3, unit: '' },
      chlorine: { value: Math.random() * 5,     unit: 'mg/L' },
      tds:      { value: 100 + Math.random() * 500, unit: 'mg/L' },
    },
  };
}

// ── Main VU scenario ─────────────────────────────────────────────
export default function () {
  const nic = randomNic();
  let reportId = null;

  // ── Step 0: Check prior submissions (optional, simulates real user) ──
  // 404 is expected for brand-new NICs — mark it as an expected status
  // so k6 does not count it as http_req_failed.
  group('0. Check prior reports by NIC', () => {
    const res = http.get(
      `${BASE_URL}/public-reports/by-nic/${nic}`,
      {
        headers: jsonHeaders(),
        tags: { name: 'get_by_nic' },
        responseCallback: http.expectedStatuses(200, 404),
      }
    );
    check(res, { 'get_by_nic: 200 or 404': (r) => r.status === 200 || r.status === 404 });
  });

  wizardThink();

  // ── Step 1: Create report ─────────────────────────────────────
  group('1. Create report', () => {
    const start = Date.now();
    const res = http.post(
      `${BASE_URL}/public-reports`,
      JSON.stringify({ nic }),
      { headers: jsonHeaders(), tags: { name: 'create_report' } }
    );
    reportCreateDuration.add(Date.now() - start);

    const ok = assertOk(res, 'create_report', submissionErrors);
    if (!ok) {
      submissionSuccessRate.add(false);
      sleep(1 + Math.random() * 2);
      return;
    }

    // Response shape: { success: true, data: { report: { _id: "..." } } }
    const body = parseJSON(res);
    check(body, {
      'create_report: has _id': (b) => !!(b && b.data && b.data.report && b.data.report._id),
    });
    reportId = body?.data?.report?._id;
  });

  if (!reportId) {
    submissionSuccessRate.add(false);
    sleep(1 + Math.random() * 2);
    return;
  }

  wizardThink();

  // ── Step 2: Select water source ───────────────────────────────
  group('2. Set water source', () => {
    const start = Date.now();
    const res = http.patch(
      `${BASE_URL}/public-reports/${reportId}`,
      JSON.stringify(buildWaterSourcePayload()),
      { headers: jsonHeaders(), tags: { name: 'update_step' } }
    );
    reportUpdateDuration.add(Date.now() - start);
    assertOk(res, 'set_water_source', submissionErrors);
  });

  wizardThink();

  // ── Step 3: Enter location ────────────────────────────────────
  group('3. Set location', () => {
    const start = Date.now();
    const res = http.patch(
      `${BASE_URL}/public-reports/${reportId}`,
      JSON.stringify(buildLocationPayload()),
      { headers: jsonHeaders(), tags: { name: 'update_step' } }
    );
    reportUpdateDuration.add(Date.now() - start);
    assertOk(res, 'set_location', submissionErrors);
  });

  wizardThink();

  // ── Step 4: Select testing method ────────────────────────────
  group('4. Set testing method', () => {
    const start = Date.now();
    const res = http.patch(
      `${BASE_URL}/public-reports/${reportId}`,
      JSON.stringify(buildTestingMethodPayload()),
      { headers: jsonHeaders(), tags: { name: 'update_step' } }
    );
    reportUpdateDuration.add(Date.now() - start);
    assertOk(res, 'set_testing_method', submissionErrors);
  });

  wizardThink();

  // ── Step 5: Record appearance ─────────────────────────────────
  group('5. Set appearance', () => {
    const start = Date.now();
    const res = http.patch(
      `${BASE_URL}/public-reports/${reportId}`,
      JSON.stringify(buildAppearancePayload()),
      { headers: jsonHeaders(), tags: { name: 'update_step' } }
    );
    reportUpdateDuration.add(Date.now() - start);
    assertOk(res, 'set_appearance', submissionErrors);
  });

  wizardThink();

  // ── Step 6: Advanced tests (50 % chance — skipped for obs-only) ─
  if (Math.random() > 0.5) {
    group('6. Set advanced tests', () => {
      const start = Date.now();
      const res = http.patch(
        `${BASE_URL}/public-reports/${reportId}`,
        JSON.stringify(buildAdvancedTestsPayload()),
        { headers: jsonHeaders(), tags: { name: 'update_step' } }
      );
      reportUpdateDuration.add(Date.now() - start);
      assertOk(res, 'set_advanced_tests', submissionErrors);
    });
    wizardThink();
  }

  // ── Step 7: Final submit ──────────────────────────────────────
  group('7. Submit report', () => {
    const start = Date.now();
    const res = http.post(
      `${BASE_URL}/public-reports/${reportId}/submit`,
      null,
      { headers: jsonHeaders(), tags: { name: 'submit_report' } }
    );
    reportSubmitDuration.add(Date.now() - start);

    const ok = check(res, {
      'submit_report: status 200': (r) => r.status === 200,
      'submit_report: status is success': (r) => {
        const b = parseJSON(r);
        return b && (b.status === 'success' || r.status === 200);
      },
    });

    submissionSuccessRate.add(ok);
    if (!ok) submissionErrors.add(1);
  });

  // Brief cool-down before next iteration
  sleep(1 + Math.random() * 2);
}

// ── Lifecycle hooks ───────────────────────────────────────────────
export function setup() {
  // Verify the API is reachable — /auth/me returns 401 without a token, which is fine.
  const res = http.get(`${BASE_URL}/auth/me`, {
    headers: { 'Content-Type': 'application/json' },
    // 401 is expected (no token) — don't count as http_req_failed
    responseCallback: http.expectedStatuses(200, 401),
  });
  if (res.status === 0) {
    throw new Error(`Cannot reach ${BASE_URL} — is the backend running?`);
  }
  console.log(`✓ Backend reachable at ${BASE_URL} (scenario: ${SCENARIO})`);
}

export function handleSummary(data) {
  const passed  = data.metrics?.submission_success_rate?.values?.rate ?? 0;
  const p95     = data.metrics?.report_submit_duration?.values?.['p(95)'] ?? '?';
  const total   = data.metrics?.http_reqs?.values?.count ?? 0;
  const errors  = data.metrics?.submission_errors?.values?.count ?? 0;

  console.log('\n═══════════════════════════════════════════════════');
  console.log('  Water Submission Load Test — Summary');
  console.log('═══════════════════════════════════════════════════');
  console.log(`  Scenario          : ${SCENARIO}`);
  console.log(`  Total HTTP reqs   : ${total}`);
  console.log(`  Submission errors : ${errors}`);
  console.log(`  Success rate      : ${(passed * 100).toFixed(2)} %`);
  console.log(`  Submit p95        : ${typeof p95 === 'number' ? p95.toFixed(0) + ' ms' : p95}`);
  console.log('═══════════════════════════════════════════════════\n');

  return {
    'results/water-submission-summary.json': JSON.stringify(data, null, 2),
  };
}

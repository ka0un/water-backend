/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  k6 Load Test — Combined: Submission + Moderation           ║
 * ║                                                              ║
 * ║  Runs both workloads concurrently to simulate realistic      ║
 * ║  mixed traffic:                                              ║
 * ║    • 80 % public users submitting water test reports        ║
 * ║    • 20 % moderators reviewing and acting on reports        ║
 * ║                                                              ║
 * ║  Scenarios run in parallel:                                  ║
 * ║    public_users  — ramp to 40 VUs (submitters)              ║
 * ║    moderators    — ramp to 10 VUs (moderator workload)      ║
 * ║                                                              ║
 * ║  Run:                                                        ║
 * ║    k6 run scripts/combined.js                               ║
 * ║    k6 run -e MOD_EMAIL=mod@test.com \                       ║
 * ║           -e MOD_PASSWORD=secret    \                       ║
 * ║           scripts/combined.js                               ║
 * ╚══════════════════════════════════════════════════════════════╝
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';

import {
  BASE_URL,
  MODERATOR_EMAIL,
  MODERATOR_PASSWORD,
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
  login,
  wizardThink,
  moderatorThink,
  reportCreateDuration,
  reportUpdateDuration,
  reportSubmitDuration,
  moderateActionDuration,
  logsFetchDuration,
  submissionErrors,
  moderationErrors,
  submissionSuccessRate,
  moderationSuccessRate,
} from '../utils/helpers.js';

// ── k6 options ───────────────────────────────────────────────────
export const options = {
  scenarios: {
    // 80 % — public users submitting water tests
    public_users: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 20 },
        { duration: '1m', target: 40 },
        { duration: '30s', target: 0 },
      ],
      exec: 'submitterScenario',
      tags: { role: 'submitter' },
    },
    // 20 % — moderators reviewing reports
    moderators: {
      executor: 'constant-vus',
      vus: 5,
      duration: '2m',
      exec: 'moderatorScenario',
      tags: { role: 'moderator' },
    },
  },
  thresholds: {
    ...COMMON_THRESHOLDS,
    'report_create_duration': ['p(95)<1500'],
    'report_submit_duration': ['p(95)<2000'],
    'moderate_action_duration': ['p(95)<1500'],
    'logs_fetch_duration': ['p(95)<1000'],
    'submission_success_rate': ['rate>0.98'],
    'moderation_success_rate': ['rate>0.99'],
    // Per-role HTTP duration splits
    'http_req_duration{role:submitter}': ['p(95)<2000'],
    'http_req_duration{role:moderator}': ['p(95)<1500'],
  },
};

// ── Global setup — login moderator once ──────────────────────────
export function setup() {
  const ping = http.get(`${BASE_URL}/auth/me`, {
    headers: { 'Content-Type': 'application/json' },
  });
  if (ping.status === 0) {
    throw new Error(`Cannot reach ${BASE_URL} — is the backend running?`);
  }

  const token = login(BASE_URL, MODERATOR_EMAIL, MODERATOR_PASSWORD);
  if (!token) {
    console.warn(
      `[WARN] Moderator login failed — moderator VUs will skip moderation steps. ` +
      'Set MOD_EMAIL and MOD_PASSWORD env vars for full test coverage.'
    );
  }
  return { token: token || null };
}

// ── k6 requires a default export — scenarios use named exec functions ──
// This function is never called directly; the scenarios use exec: 'submitterScenario'
// and exec: 'moderatorScenario' instead.
export default function () { }

// ── Submitter VU (public users) ───────────────────────────────────
export function submitterScenario() {
  const nic = randomNic();
  let reportId = null;

  group('create_report', () => {
    const start = Date.now();
    const res = http.post(
      `${BASE_URL}/public-reports`,
      JSON.stringify({ nic }),
      { headers: jsonHeaders(), tags: { name: 'create_report' } }
    );
    reportCreateDuration.add(Date.now() - start);

    if (assertOk(res, 'create_report', submissionErrors)) {
      // Response shape: { data: { report: { _id: "..." } } }
      reportId = parseJSON(res)?.data?.report?._id;
    }
  });

  if (!reportId) { submissionSuccessRate.add(false); sleep(1 + Math.random() * 2); return; }
  wizardThink();

  // Patch each wizard step
  const steps = [
    { waterSource: pick(WATER_SOURCES) },
    {
      location: {
        district: pick(DISTRICTS),
        city: pick(CITIES),
        coordinates: { lat: 6.9 + Math.random() * 2.1, lng: 79.8 + Math.random() * 1.7 },
      },
    },
    { testingMethod: pick(TESTING_METHODS) },
    { appearance: { value: pick(APPEARANCE_VALUES), notes: '' }, turbidity: { value: pick(TURBIDITY_VALUES) } },
  ];

  for (const payload of steps) {
    group('update_step', () => {
      const start = Date.now();
      const res = http.patch(
        `${BASE_URL}/public-reports/${reportId}`,
        JSON.stringify(payload),
        { headers: jsonHeaders(), tags: { name: 'update_step' } }
      );
      reportUpdateDuration.add(Date.now() - start);
      assertOk(res, 'update_step', submissionErrors);
    });
    wizardThink();
  }

  group('submit_report', () => {
    const start = Date.now();
    const res = http.post(
      `${BASE_URL}/public-reports/${reportId}/submit`,
      null,
      { headers: jsonHeaders(), tags: { name: 'submit_report' } }
    );
    reportSubmitDuration.add(Date.now() - start);

    const ok = check(res, { 'submit: status 200': (r) => r.status === 200 });
    submissionSuccessRate.add(ok);
    if (!ok) submissionErrors.add(1);
  });

  sleep(1 + Math.random() * 2);
}

// ── Moderator VU ─────────────────────────────────────────────────
export function moderatorScenario({ token }) {
  if (!token) { sleep(5); return; }

  let reports = [];

  group('list_reports', () => {
    const res = http.get(
      `${BASE_URL}/public-reports-admin?status=pending&limit=20`,
      { headers: jsonHeaders(token), tags: { name: 'list_reports' } }
    );
    if (assertOk(res, 'list_reports', moderationErrors)) {
      reports = parseJSON(res)?.data?.reports || [];
    }
  });

  moderatorThink();

  if (reports.length > 0) {
    const report = pick(reports);
    const reportId = report._id;

    group('moderate', () => {
      const action = Math.random() > 0.2 ? 'approve' : 'reject';
      const start = Date.now();
      const res = http.patch(
        `${BASE_URL}/public-reports-admin/${reportId}/moderate`,
        JSON.stringify(action === 'reject' ? { action, reason: 'Quality check failed' } : { action }),
        { headers: jsonHeaders(token), tags: { name: 'moderate' } }
      );
      moderateActionDuration.add(Date.now() - start);
      const ok = check(res, { 'moderate: 200': (r) => r.status === 200 });
      moderationSuccessRate.add(ok);
      if (!ok) moderationErrors.add(1);
    });

    moderatorThink();
  }

  group('get_logs', () => {
    const start = Date.now();
    const res = http.get(
      `${BASE_URL}/moderation/logs?page=1&limit=25`,
      { headers: jsonHeaders(token), tags: { name: 'get_logs' } }
    );
    logsFetchDuration.add(Date.now() - start);
    check(res, { 'logs: 200': (r) => r.status === 200 });
  });

  sleep(3 + Math.random() * 2);
}

// ── Summary ───────────────────────────────────────────────────────
export function handleSummary(data) {
  const subRate = ((data.metrics?.submission_success_rate?.values?.rate ?? 0) * 100).toFixed(2);
  const modRate = ((data.metrics?.moderation_success_rate?.values?.rate ?? 0) * 100).toFixed(2);
  const subP95 = data.metrics?.report_submit_duration?.values?.['p(95)'];
  const modP95 = data.metrics?.moderate_action_duration?.values?.['p(95)'];
  const totalReq = data.metrics?.http_reqs?.values?.count ?? 0;

  console.log('\n═══════════════════════════════════════════════════');
  console.log('  Combined Load Test — Summary');
  console.log('═══════════════════════════════════════════════════');
  console.log(`  Total HTTP reqs        : ${totalReq}`);
  console.log(`  Submission success     : ${subRate} %`);
  console.log(`  Moderation success     : ${modRate} %`);
  console.log(`  Submission submit p95  : ${subP95 ? subP95.toFixed(0) + ' ms' : 'N/A'}`);
  console.log(`  Moderation action p95  : ${modP95 ? modP95.toFixed(0) + ' ms' : 'N/A'}`);
  console.log('═══════════════════════════════════════════════════\n');

  return {
    'results/combined-summary.json': JSON.stringify(data, null, 2),
  };
}

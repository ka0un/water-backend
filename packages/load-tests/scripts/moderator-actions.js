/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  k6 Load Test — Moderator Actions & Logs                    ║
 * ║                                                              ║
 * ║  Simulates the moderator dashboard workflow:                 ║
 * ║    Setup:  POST /auth/login  (once per VU)                  ║
 * ║    1. GET  /public-reports-admin         — list reports     ║
 * ║    2. GET  /public-reports-admin/{id}    — view detail      ║
 * ║    3. PATCH /public-reports-admin/{id}/moderate             ║
 * ║              — approve or reject                            ║
 * ║    4. GET  /moderation/logs              — fetch audit log  ║
 * ║    5. GET  /moderation/logs?action=...   — filtered log     ║
 * ║    6. GET  /public-reports-admin/stats   — dashboard stats  ║
 * ║                                                              ║
 * ║  Scenarios:                                                  ║
 * ║    smoke   — 3 VUs × 1 min                                  ║
 * ║    load    — ramp to 30 VUs × 5 min                         ║
 * ║    stress  — ramp to 80 VUs × 5 min                         ║
 * ║                                                              ║
 * ║  Requirements:                                               ║
 * ║    • A MODERATOR or ADMIN account must exist in the DB.     ║
 * ║      Set credentials via env vars:                          ║
 * ║        -e MOD_EMAIL=mod@test.com                            ║
 * ║        -e MOD_PASSWORD=YourPassword                         ║
 * ║    • Some reports should already exist for moderation.      ║
 * ║                                                              ║
 * ║  Run:                                                        ║
 * ║    k6 run scripts/moderator-actions.js                      ║
 * ║    k6 run -e SCENARIO=stress scripts/moderator-actions.js   ║
 * ╚══════════════════════════════════════════════════════════════╝
 */

import http             from 'k6/http';
import { check, sleep, group } from 'k6';

import {
  BASE_URL,
  MODERATOR_EMAIL,
  MODERATOR_PASSWORD,
  COMMON_THRESHOLDS,
  pick,
} from '../utils/config.js';

import {
  jsonHeaders,
  parseJSON,
  assertOk,
  login,
  moderatorThink,
  wizardThink,
  moderateActionDuration,
  logsFetchDuration,
  moderationErrors,
  moderationSuccessRate,
  loginFailures,
} from '../utils/helpers.js';

// ── Scenario selector ────────────────────────────────────────────
const SCENARIO = __ENV.SCENARIO || 'load';

const SCENARIOS = {
  smoke: {
    executor: 'constant-vus',
    vus:      3,
    duration: '1m',
    tags:     { scenario: 'smoke' },
  },
  load: {
    executor: 'ramping-vus',
    startVUs: 0,
    stages: [
      { duration: '1m',  target: 10 },
      { duration: '5m',  target: 30 },
      { duration: '1m',  target: 0  },
    ],
    tags: { scenario: 'load' },
  },
  stress: {
    executor: 'ramping-vus',
    startVUs: 0,
    stages: [
      { duration: '1m',  target: 30 },
      { duration: '2m',  target: 60 },
      { duration: '2m',  target: 80 },
      { duration: '2m',  target: 0  },
    ],
    tags: { scenario: 'stress' },
  },
};

// ── k6 options ───────────────────────────────────────────────────
export const options = {
  scenarios: {
    moderator_actions: SCENARIOS[SCENARIO] || SCENARIOS.load,
  },
  thresholds: {
    ...COMMON_THRESHOLDS,
    // Moderator-specific thresholds
    'moderate_action_duration':  ['p(95)<1500'],  // approve/reject must be fast
    'logs_fetch_duration':       ['p(95)<1000'],  // log fetch must be responsive
    'moderation_success_rate':   ['rate>0.99'],
    'login_failures':            ['count<5'],     // allow at most 5 login failures
    // Named request thresholds
    'http_req_duration{name:list_reports}':   ['p(95)<1000'],
    'http_req_duration{name:report_detail}':  ['p(95)<1500'],
    'http_req_duration{name:moderate}':       ['p(95)<1500'],
    'http_req_duration{name:get_logs}':       ['p(95)<1000'],
    'http_req_duration{name:get_stats}':      ['p(95)<2000'],
  },
};

// ── Per-VU setup: login once and reuse token throughout ──────────
export function setup() {
  // 1. Verify connectivity
  const ping = http.get(`${BASE_URL}/auth/me`, {
    headers: { 'Content-Type': 'application/json' },
  });
  if (ping.status === 0) {
    throw new Error(`Cannot reach ${BASE_URL} — is the backend running?`);
  }

  // 2. Login
  const token = login(BASE_URL, MODERATOR_EMAIL, MODERATOR_PASSWORD);
  if (!token) {
    throw new Error(
      `Moderator login failed for ${MODERATOR_EMAIL}. ` +
      'Ensure the account exists and credentials are correct ' +
      '(set via -e MOD_EMAIL and -e MOD_PASSWORD).'
    );
  }

  console.log(`✓ Moderator login successful (scenario: ${SCENARIO})`);
  console.log(`  Using token: ${token.slice(0, 20)}...`);
  return { token };
}

// ── Main VU scenario ─────────────────────────────────────────────
export default function ({ token }) {
  if (!token) return;  // login failed in setup — skip

  // ── 1. List pending reports ───────────────────────────────────
  let reports = [];
  group('1. List reports', () => {
    // Vary the query to exercise different filters
    const status = pick(['pending', '', 'approved', 'pending']);
    const query  = status ? `?completed=true&status=${status}&limit=20&sort=-createdAt` : '?completed=true&limit=20&sort=-createdAt';

    const res = http.get(
      `${BASE_URL}/public-reports-admin${query}`,
      { headers: jsonHeaders(token), tags: { name: 'list_reports' } }
    );

    const ok = assertOk(res, 'list_reports', moderationErrors);
    if (ok) {
      const body = parseJSON(res);
      reports = body?.data?.reports || [];
      check(body, {
        'list_reports: has reports array': (b) => Array.isArray(b?.data?.reports),
      });
    }
  });

  moderatorThink();

  // ── 2. Dashboard stats (background polling) ───────────────────
  group('2. Fetch dashboard stats', () => {
    const res = http.get(
      `${BASE_URL}/public-reports-admin/stats`,
      { headers: jsonHeaders(token), tags: { name: 'get_stats' } }
    );
    check(res, {
      'stats: status 200':       (r) => r.status === 200,
      'stats: has overview':     (r) => {
        const b = parseJSON(r);
        return !!(b?.data?.overview);
      },
    });
  });

  wizardThink();

  // ── 3. Open a specific report detail ─────────────────────────
  if (reports.length === 0) {
    // No reports available — still fetch logs and continue
    console.warn('No reports returned from list — skipping detail & moderate steps');
  } else {
    const report   = pick(reports);
    const reportId = report._id;

    group('3. View report detail', () => {
      const res = http.get(
        `${BASE_URL}/public-reports-admin/${reportId}`,
        { headers: jsonHeaders(token), tags: { name: 'report_detail' } }
      );
      assertOk(res, 'report_detail', moderationErrors);
      check(parseJSON(res), {
        'report_detail: has _id': (b) => !!(b?.data?._id || b?.data?.report?._id),
      });
    });

    moderatorThink();

    // ── 4. Moderate the report (approve OR reject) ──────────────
    // Only moderate reports that are still pending to avoid re-moderation errors
    if (report.mod_status === 'pending' || report.mod_status == null) {
      group('4. Moderate report', () => {
        const action = Math.random() > 0.2 ? 'approve' : 'reject';
        const body   = action === 'reject'
          ? { action: 'reject', reason: 'Does not meet quality standards' }
          : { action: 'approve' };

        const start = Date.now();
        const res   = http.patch(
          `${BASE_URL}/public-reports-admin/${reportId}/moderate`,
          JSON.stringify(body),
          { headers: jsonHeaders(token), tags: { name: 'moderate' } }
        );
        moderateActionDuration.add(Date.now() - start);

        const ok = check(res, {
          'moderate: status 200': (r) => r.status === 200,
          'moderate: action recorded': (r) => {
            const b = parseJSON(r);
            return b?.status === 'success' || r.status === 200;
          },
        });

        moderationSuccessRate.add(ok);
        if (!ok) moderationErrors.add(1);
      });

      wizardThink();
    }
  }

  // ── 5. Fetch moderation logs (main log view) ──────────────────
  group('5. Fetch moderation logs', () => {
    const start  = Date.now();
    const res    = http.get(
      `${BASE_URL}/moderation/logs?page=1&limit=50`,
      { headers: jsonHeaders(token), tags: { name: 'get_logs' } }
    );
    logsFetchDuration.add(Date.now() - start);

    const ok = assertOk(res, 'get_logs', moderationErrors);
    check(parseJSON(res), {
      'get_logs: has logs array': (b) => {
        const logs = b?.data?.logs || b?.message?.logs;
        return Array.isArray(logs);
      },
    });
  });

  wizardThink();

  // ── 6. Fetch filtered moderation logs ────────────────────────
  group('6. Fetch filtered logs', () => {
    const action = pick(['APPROVE', 'REJECT', 'LOGIN', 'VIEW_PUBLIC_REPORT']);
    const start  = Date.now();
    const res    = http.get(
      `${BASE_URL}/moderation/logs?action=${action}&page=1&limit=25`,
      { headers: jsonHeaders(token), tags: { name: 'get_logs' } }
    );
    logsFetchDuration.add(Date.now() - start);

    check(res, {
      'filtered_logs: status 200': (r) => r.status === 200,
    });
  });

  // Moderator session cool-down
  sleep(2 + Math.random() * 3);
}

// ── Summary ───────────────────────────────────────────────────────
export function handleSummary(data) {
  const successRate   = data.metrics?.moderation_success_rate?.values?.rate ?? 0;
  const moderateP95   = data.metrics?.moderate_action_duration?.values?.['p(95)'] ?? '?';
  const logsP95       = data.metrics?.logs_fetch_duration?.values?.['p(95)'] ?? '?';
  const totalReqs     = data.metrics?.http_reqs?.values?.count ?? 0;
  const errors        = data.metrics?.moderation_errors?.values?.count ?? 0;
  const loginFails    = data.metrics?.login_failures?.values?.count ?? 0;

  console.log('\n═══════════════════════════════════════════════════');
  console.log('  Moderator Actions Load Test — Summary');
  console.log('═══════════════════════════════════════════════════');
  console.log(`  Scenario           : ${SCENARIO}`);
  console.log(`  Total HTTP reqs    : ${totalReqs}`);
  console.log(`  Moderation errors  : ${errors}`);
  console.log(`  Login failures     : ${loginFails}`);
  console.log(`  Success rate       : ${(successRate * 100).toFixed(2)} %`);
  console.log(`  Moderate p95       : ${typeof moderateP95 === 'number' ? moderateP95.toFixed(0) + ' ms' : moderateP95}`);
  console.log(`  Logs fetch p95     : ${typeof logsP95 === 'number' ? logsP95.toFixed(0) + ' ms' : logsP95}`);
  console.log('═══════════════════════════════════════════════════\n');

  return {
    'results/moderator-actions-summary.json': JSON.stringify(data, null, 2),
  };
}

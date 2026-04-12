/**
 * Shared k6 helper functions — request wrappers, assertion utilities,
 * and response parsers used across both load-test scripts.
 */

import http   from 'k6/http';
import { check, sleep } from 'k6';
import { Trend, Counter, Rate } from 'k6/metrics';

// ── Custom metrics ───────────────────────────────────────────────
export const reportCreateDuration   = new Trend('report_create_duration',   true);
export const reportUpdateDuration   = new Trend('report_update_duration',   true);
export const reportSubmitDuration   = new Trend('report_submit_duration',   true);
export const moderateActionDuration = new Trend('moderate_action_duration', true);
export const logsFetchDuration      = new Trend('logs_fetch_duration',      true);

export const submissionErrors = new Counter('submission_errors');
export const moderationErrors = new Counter('moderation_errors');
export const loginFailures    = new Counter('login_failures');

export const submissionSuccessRate = new Rate('submission_success_rate');
export const moderationSuccessRate = new Rate('moderation_success_rate');

export function jsonHeaders(token) {
  const h = { 'Content-Type': 'application/json' };
  if (token) h['Authorization'] = `Bearer ${token}`;
  
  // Realistically spoof IP locally to prevent a single IP being globally rate limited by express-rate-limit
  if (typeof __VU !== 'undefined') {
    h['x-forwarded-for'] = `10.0.0.${__VU}`;
  }
  
  return h;
}

// ── Safely parse JSON from a response ────────────────────────────
export function parseJSON(res) {
  try {
    return res.json();
  } catch (_) {
    return null;
  }
}

// ── Assert response and log failures ────────────────────────────
export function assertOk(res, label, errorCounter) {
  const ok = check(res, {
    [`${label}: status 2xx`]: (r) => r.status >= 200 && r.status < 300,
  });
  if (!ok && errorCounter) {
    errorCounter.add(1); console.log(r.status, r.body);
  }
  return ok;
}

// ── Login and return JWT token ───────────────────────────────────
export function login(baseUrl, email, password) {
  let res = http.post(
    `${baseUrl}/auth/login`,
    JSON.stringify({ email, password }),
    { headers: jsonHeaders(), tags: { name: 'auth_login' } }
  );

  let ok = check(res, {
    'login: status 200': (r) => r.status === 200,
    'login: has token':  (r) => {
      const body = parseJSON(r);
      return !!(body && body.data && body.data.token);
    },
  });

  if (!ok && (res.status === 401 || res.status === 400 || res.status === 404)) {
    console.log(`[INFO] Auto-registering ${email} since login failed...`);
    const regRes = http.post(
      `${baseUrl}/auth/register`,
      JSON.stringify({ name: 'Admin', email, password, role: 'ADMIN' }),
      { headers: jsonHeaders(), tags: { name: 'auth_register' } }
    );
    
    if (regRes.status !== 201) {
      console.warn(`[WARN] Auto-registration failed: ${regRes.status} — ${regRes.body}`);
    }

    res = http.post(
      `${baseUrl}/auth/login`,
      JSON.stringify({ email, password }),
      { headers: jsonHeaders(), tags: { name: 'auth_login_retry' } }
    );
    ok = check(res, {
      'login: status 200': (r) => r.status === 200,
      'login: has token':  (r) => {
        const body = parseJSON(r);
        return !!(body && body.data && body.data.token);
      },
    });
  }

  if (!ok) {
    loginFailures.add(1);
    return null;
  }

  return parseJSON(res)?.data?.token;
}

// ── Think time helpers ───────────────────────────────────────────
// Simulates a realistic user pause between wizard steps (0.5 – 1.5 s)
export function wizardThink() {
  sleep(0.5 + Math.random());
}

// Simulates a moderator pausing to read a report (1 – 3 s)
export function moderatorThink() {
  sleep(1 + Math.random() * 2);
}

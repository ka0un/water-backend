/**
 * Shared k6 configuration — base URL, credentials, and scenario helpers.
 *
 * Override BASE_URL at runtime:
 *   k6 run -e BASE_URL=https://api.example.com scripts/water-submission.js
 */

export const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000/api/v1';

// ── Moderator credentials (must exist in the target DB) ─────────
export const MODERATOR_EMAIL    = __ENV.MOD_EMAIL    || 'mod@example.com';
let pwd = __ENV.MOD_PASSWORD || 'Password123!';
if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(pwd)) {
  if (typeof __VU === 'undefined' || __VU === 0) {
    console.warn(`[WARN] Provided MOD_PASSWORD '${pwd}' is too weak for backend validation. Forcing to 'Secret123!' for this run.`);
  }
  pwd = 'Secret123!';
}
export const MODERATOR_PASSWORD = pwd;

// ── Thresholds shared by both scripts ────────────────────────────
export const COMMON_THRESHOLDS = {
  // 95 % of all requests must complete under 2 s
  http_req_duration: ['p(95)<2000'],
  // At most 1 % of requests may fail
  http_req_failed:   ['rate<0.01'],
};

// ── NIC generator — produces valid Sri Lankan NICs ───────────────
// Old format: exactly 9 digits + V    (e.g. 901234567V)
// New format: exactly 12 digits       (e.g. 200012345678)
//   Pattern: /^([0-9]{9}[VvXx]|[0-9]{12})$/
export function randomNic() {
  const useNew = Math.random() > 0.5;
  if (useNew) {
    // 4-digit birth year (1960–2004) + 8-digit serial = 12 digits total
    const year   = 1960 + Math.floor(Math.random() * 45);              // 1960–2004
    const serial = String(Math.floor(Math.random() * 99_999_999)).padStart(8, '0');
    return `${year}${serial}`;   // e.g. "199012345678"
  }
  // Old format: exactly 9 digits + V
  const digits = String(Math.floor(Math.random() * 999_999_999)).padStart(9, '0');
  return `${digits}V`;           // e.g. "901234567V"
}

// ── Random helpers ───────────────────────────────────────────────
export function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

export const WATER_SOURCES      = ['well', 'river', 'lake', 'tap', 'tank', 'spring', 'borehole'];
export const DISTRICTS          = ['Colombo', 'Gampaha', 'Kandy', 'Galle', 'Jaffna', 'Matara'];
export const CITIES             = ['Nugegoda', 'Moratuwa', 'Kadawatha', 'Peradeniya', 'Hikkaduwa'];
// Appearance: { value, notes } matches backend Joi schema
export const APPEARANCE_VALUES  = ['clear', 'slightly_discolored', 'discolored', 'turbid'];
// Exact valid values from backend validation (publicReport.validation.js)
export const TESTING_METHODS    = ['observation', 'test_strips', 'lab_kit', 'professional_lab'];
export const TURBIDITY_VALUES   = ['clear', 'slightly_cloudy', 'cloudy', 'very_cloudy'];
export const ODOURS         = ['none', 'chlorine', 'musty', 'sulphur'];

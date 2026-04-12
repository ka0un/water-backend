/**
 * Frontend (Admin Dashboard) API mock helpers.
 *
 * Use setupAuthMock() in beforeEach to inject a mock user session,
 * then add page-specific mocks as needed.
 */

// ─── Mock users ───────────────────────────────────────────────────

export const MOCK_USERS = {
  admin: {
    _id: 'user-admin-001',
    name: 'Admin User',
    email: 'admin@example.com',
    role: 'ADMIN',
    status: 'active',
  },
  moderator: {
    _id: 'user-mod-001',
    name: 'Moderator User',
    email: 'mod@example.com',
    role: 'MODERATOR',
    status: 'active',
  },
  labStaff: {
    _id: 'user-lab-001',
    name: 'Lab Staff User',
    email: 'lab@example.com',
    role: 'LAB_STAFF',
    status: 'active',
  },
  regularUser: {
    _id: 'user-reg-001',
    name: 'Regular User',
    email: 'user@example.com',
    role: 'USER',
    status: 'active',
  },
};

export const MOCK_TOKEN = 'mock-jwt-token-for-testing';

// ─── Standard API envelope ────────────────────────────────────────

export function apiEnvelope(data) {
  return { status: 'success', data };
}

export function apiError(message, statusCode = 400) {
  return { status: 'fail', message, statusCode };
}

// ─── Auth mock setup ──────────────────────────────────────────────

/**
 * Injects a mock authenticated session for the given role.
 * Sets the token in localStorage and intercepts /auth/me.
 *
 * @param {import('@playwright/test').Page} page
 * @param {'admin'|'moderator'|'labStaff'|'regularUser'} role
 */
export async function setupAuthMock(page, role = 'admin') {
  const user = MOCK_USERS[role];

  // Inject token into localStorage before page loads.
  // Keys must match AuthContext: TOKEN_KEY='wq_admin_token', USER_KEY='wq_admin_user'
  await page.addInitScript(
    ({ token, userData }) => {
      window.localStorage.setItem('wq_admin_token', token);
      window.localStorage.setItem('wq_admin_user', JSON.stringify(userData));
    },
    { token: MOCK_TOKEN, userData: user }
  );

  // Intercept auth verify endpoint
  await page.route('**/api/v1/auth/me', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(apiEnvelope({ user })),
    });
  });

  // Intercept login.
  // Response structure must match AuthContext: `const { token, user } = data.data`
  await page.route('**/api/v1/auth/login', async (route) => {
    const body = JSON.parse(route.request().postData() || '{}');
    if (body.email && body.password) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ status: 'success', data: { token: MOCK_TOKEN, user } }),
      });
    } else {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify(apiError('Invalid email or password', 400)),
      });
    }
  });

  // Intercept logout
  await page.route('**/api/v1/auth/logout', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ status: 'success' }) });
  });
}

// ─── Mock data factories ──────────────────────────────────────────

export const MOCK_WATER_REPORT = {
  _id: 'report-001',
  nic: '901234567V',
  waterSource: 'river',
  mod_status: 'pending',
  location: { district: 'Colombo', city: 'Colombo City', address: 'Near bridge' },
  appearance: { value: 'clear' },
  testingMethod: 'observation',
  wizardCompleted: true,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T12:00:00.000Z',
};

export const MOCK_LAB_TEST = {
  _id: 'lab-test-001',
  requestNumber: 'LT-2026-001',
  waterSource: { name: 'Kelani River Sample', type: 'river' },
  location: { district: 'Colombo', city: 'Colombo' },
  status: 'pending_acceptance',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T12:00:00.000Z',
};

export const MOCK_LABORATORY = {
  _id: 'lab-001',
  name: 'National Water Testing Lab',
  location: 'Colombo',
  email: 'nwtl@example.com',
  phone: '0112345678',
  address: '123 Lab Street',
  city: 'Colombo',
  status: 'active',
  capacity: 50,
  certifications: ['ISO 17025'],
  equipment: ['pH meter', 'turbidity meter'],
  createdAt: '2026-01-01T00:00:00.000Z',
};

export const MOCK_WATER_SOURCE = {
  _id: 'source-001',
  name: 'Community Well',
  type: 'well',
  access_type: 'Public',
  operational_status: 'Functional',
  verified: true,
  location: { type: 'Point', coordinates: [80.0, 7.5] },
  createdAt: '2026-01-01T00:00:00.000Z',
};

export const MOCK_MOD_LOG = {
  _id: 'log-001',
  moderator: { _id: 'user-mod-001', name: 'Moderator User', email: 'mod@example.com' },
  moderatorId: { _id: 'user-mod-001', name: 'Moderator User', email: 'mod@example.com' },
  action: 'APPROVE',
  targetType: 'report',
  targetId: 'report-001',
  createdAt: '2026-01-01T10:00:00.000Z',
  timestamp: '2026-01-01T10:00:00.000Z',
};

// ─── Page-specific mock setup ──────────────────────────────────────

/**
 * Mock the admin Dashboard page's data endpoints.
 * Dashboard.jsx destructures `stats.overview`, `stats.photoStats` etc.
 * Sending the wrong shape (e.g. photoStats:{}) causes a React crash.
 * Register BEFORE setupAuthMock so auth mocks win in LIFO ordering.
 */
export async function setupAdminDashboardMock(page) {
  await page.route('**/api/v1/public-reports-admin**', async (route) => {
    const url = route.request().url();
    if (url.includes('/stats')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 'success',
          data: {
            overview: { total: 0, pending: 0, completed: 0, rejected: 0 },
            byStatus: {}, bySource: [], byDistrict: [], dailySubmissions: [],
            weeklyTrend: [], testingMethods: [], observationFreqs: [],
            mapPoints: [], turbidityLevels: [], appearanceDist: [],
            hourlyPattern: [], photoStats: null, waterFlowDist: [], totalImages: 0,
          },
        }),
      });
    } else {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ status: 'success', data: { reports: [], total: 0 } }),
      });
    }
  });
}

/**
 * Mock dashboard data endpoints
 */
export async function setupDashboardMocks(page) {
  await page.route('**/api/v1/reports/stats**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(apiEnvelope({
        total: 42, pending: 10, approved: 28, rejected: 4,
      })),
    });
  });

  await page.route('**/api/v1/water-sources/stats**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(apiEnvelope({ total: 15, verified: 12 })),
    });
  });

  // Catch-all dashboard data
  await page.route('**/api/v1/dashboard**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(apiEnvelope({
        totalReports: 42,
        pendingTests: 5,
        completedToday: 3,
        totalCompleted: 28,
        recentRequests: [],
      })),
    });
  });
}

/**
 * Mock water sources endpoints
 */
export async function setupWaterSourceMocks(page) {
  await page.route('**/api/v1/water-sources**', async (route) => {
    const method = route.request().method();
    if (method === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(apiEnvelope({
          sources: [MOCK_WATER_SOURCE],
          total: 1,
          page: 1,
          pages: 1,
        })),
      });
    } else if (method === 'POST') {
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify(apiEnvelope({ source: MOCK_WATER_SOURCE })),
      });
    } else {
      await route.continue();
    }
  });
}

/**
 * Mock moderation (public-reports-admin) endpoints.
 * ModeratorWaterTests.jsx calls /api/v1/public-reports-admin, not /api/v1/reports.
 */
export async function setupReportMocks(page) {
  await page.route('**/api/v1/public-reports-admin**', async (route) => {
    const method = route.request().method();
    if (method === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(apiEnvelope({
          reports: [MOCK_WATER_REPORT],
          total: 1,
          page: 1,
          pages: 1,
        })),
      });
    } else {
      await route.continue();
    }
  });
}

/**
 * Mock lab tests endpoints.
 * LabTestManagement.jsx calls /api/v1/lab-staff/requests (not /lab-tests).
 * LabStaffDashboard.jsx calls /api/v1/lab-staff/dashboard.
 */
export async function setupLabTestMocks(page) {
  // Broad catch-all FIRST (lower LIFO priority)
  await page.route('**/api/v1/lab-staff/**', async (route) => {
    const method = route.request().method();
    if (method === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(apiEnvelope({
          requests: [MOCK_LAB_TEST],
          laboratories: [],
          total: 1,
          // LabTestManagement.jsx reads data.data.pagination, so include it:
          pagination: { page: 1, total: 1, pages: 1 },
        })),
      });
    } else {
      await route.continue();
    }
  });

  // Dashboard-specific response LAST (highest LIFO priority)
  await page.route('**/api/v1/lab-staff/dashboard**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(apiEnvelope({
        pendingTests: 3,
        inProgressTests: 2,
        completedToday: 1,
        totalCompleted: 14,
        recentRequests: [MOCK_LAB_TEST],
      })),
    });
  });
}

/**
 * Mock laboratories endpoints.
 * LaboratoryManagement.jsx calls /api/v1/admin/laboratories (not /laboratories).
 * Response shape: response.data.data.laboratories
 */
export async function setupLaboratoryMocks(page) {
  await page.route('**/api/v1/admin/laboratories**', async (route) => {
    const method = route.request().method();
    if (method === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(apiEnvelope({
          laboratories: [MOCK_LABORATORY],
          total: 1,
          page: 1,
          pages: 1,
        })),
      });
    } else if (method === 'POST') {
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify(apiEnvelope({ laboratory: MOCK_LABORATORY })),
      });
    } else {
      await route.continue();
    }
  });
}

/**
 * Mock moderation logs endpoints.
 * ModerationLogs.jsx uses fetch('/api/v1/moderation/logs') — note the slash (not hyphen).
 * Also mocks /api/v1/users (for the moderator filter dropdown).
 */
export async function setupModerationLogMocks(page) {
  await page.route('**/api/v1/users**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(apiEnvelope({ users: Object.values(MOCK_USERS), total: 4 })),
    });
  });

  await page.route('**/api/v1/moderation/logs**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(apiEnvelope({
        logs: [MOCK_MOD_LOG],
        total: 1,
        page: 1,
        pages: 1,
      })),
    });
  });
}

/**
 * Mock users management endpoints.
 * UsersManagement.jsx calls /api/v1/admin/users (not /users).
 * Response shape: res.data.data.users and res.data.data.pagination.total
 */
export async function setupUsersMocks(page) {
  await page.route('**/api/v1/admin/users**', async (route) => {
    const method = route.request().method();
    if (method === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(apiEnvelope({
          users: Object.values(MOCK_USERS),
          pagination: { total: 4, page: 1, pages: 1 },
          total: 4,
        })),
      });
    } else {
      await route.continue();
    }
  });
}

# Water Quality System — Testing Instruction Report

This report outlines all the automated testing frameworks present in this project and serves as a simple guide to running your full development and testing environments.

---

## 1. Prerequisites: Starting the Local Environment

Most testing suites (Integration, E2E, and Load Tests) require your core backend and frontend infrastructures to be actively running. 

### Configuration Setup
Ensure your local backend environment variables are established before booting the application. Create a `.env` file within `packages/backend/.env`:
\`\`\`properties
# Example /packages/backend/.env
JWT_SECRET=super_secret_local_key
JWT_EXPIRES_IN=7d
RATE_LIMIT_MAX_REQUESTS=300
\`\`\`

### Starting the Servers
Open three separate terminal windows in the root of the project to initialize the environments:
1. **Backend Server**: `npm run dev:backend`
2. **Main Frontend App**: `npm run dev:frontend`
3. **Landing Page (LP)**: `npm run dev:lp`

*(Ensure these processes run simultaneously and without errors before attempting integration testing)*

---

## 2. Unit & API Tests

Unit and API tests systematically test individual backend functions, logic processes, and dedicated REST routes in isolation. This project leverages **Jest** and **Supertest** to execute these locally or within CI/CD pipelines.

**Location:** `packages/backend`

**Execution Commands:**
Navigate into the backend package first (`cd packages/backend`) or run them functionally from root using workspace flags.
- **Run standard tests**: 
  \`npm run test\`
- **Run tests continuously** (watches for code changes):
  \`npm run test:watch\`
- **Generate a test coverage summary**:
  \`npm run test:coverage\`

---

## 3. Integration & End-to-End (E2E) Tests

End-to-End testing drives a real web browser to interact seamlessly across your Frontend, Landing Page, and Backend layers automatically, validating total user journey completion. This project uses **Playwright** for robust E2E verification.

> **CRITICAL:** The Backend, Frontend, and Landing Page must be concurrently running (Step 1) before E2E specs will pass!

**Location:** `packages/e2e`

**Execution Commands:**
Navigate into the e2e package (`cd packages/e2e`).
- **Run E2E tests headless** (fast setup, silent in background): 
  \`npm run test\`
- **Run tests visibly in a browser window** (Headed mode):
  \`npm run test:headed\`
- **Open Playwright's interactive debugging UI**:
  \`npm run test:ui\`

---

## 4. Load & Performance Tests

These tests bombard the system API under extreme conditions to simulate hundreds of concurrent real users checking database integrity, response stability, and API limits. 

The project has two distinct performance strategies configured: **K6** (Scenario-driven flows) and **Artillery** (Raw throughput performance).

> **WARNING:** Both load tests pound your locally running backend API aggressively. Expect high CPU usages while these are executing. 

### A. System Simulation Scenarios (K6)
**Location:** `packages/load-tests`

This framework uses scripts evaluating heavy load across multi-endpoint workflows (like registering, creating a ticket, and submitting a wizard).
*Navigate to `packages/load-tests` and run any of the permutations:*
- **Smoke Tests** (Light configuration to test pipeline validity):
  \`npm run smoke:combined\`
- **Real Load Generation** (High virtual user volumes over 2+ minutes):
  \`npm run load:combined\`    # Tests both public users and moderators
  \`npm run load:submission\`  # Tests strictly public user payloads
- **Stress & Spike Handling** (Max system throttle over 80+ VUs):
  \`npm run stress:combined\` 
  \`npm run spike:submission\`

### B. Pure API Throughput (Artillery)
**Location:** `packages/backend`

Pushes sustained heavy throughput directly against specific critical local endpoints (e.g., retrieving report collections). 
*Navigate to `packages/backend`:*
- **Run standard throughput barrage**:
  \`npm run test:performance\`
- **Generate comprehensive JSON outputs**:
  \`npm run test:performance:report\`

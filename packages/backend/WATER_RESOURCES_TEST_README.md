# Water Resources Module — Test Documentation

## Overview

This document covers the integration test suite for the Water Source API module. The tests validate all 9 endpoints including CRUD operations, geospatial queries, role-based permissions, and data integrity.

## Prerequisites

- Node.js v18+
- npm

## Running Tests

```bash
# Run water source tests only
npm run test -- src/tests/waterSource.test.js --verbose

# Or with cross-env
npx cross-env NODE_ENV=test npx jest src/tests/waterSource.test.js --verbose --runInBand
```

## Test Architecture

| Component | Technology |
|---|---|
| Framework | Jest |
| HTTP Client | Supertest |
| Database | mongodb-memory-server (in-memory MongoDB) |
| Setup | `src/tests/setup.js` — connect, clear, close |

**Key setup notes:**
- 2dsphere geospatial indexes are created via `WaterSource.createIndexes()` in `beforeAll`
- Rate limiter is disabled in test environment to prevent 429 errors
- Each test gets a clean database via `clearDatabase()` in `afterEach`
- Unique emails are generated per user registration to avoid collisions

---

## Test Cases

### 1. Create Water Source — `POST /api/v1/water-sources`

| ID | Description | Expected |
|---|---|---|
| TC-WS-001 | Create with valid data | 201, source returned with GeoJSON coordinates |
| TC-WS-002 | Missing auth token | 401 Unauthorized |
| TC-WS-003 | Missing required field (name) | 400, validation error with field name |
| TC-WS-004 | Invalid water source type | 400, validation error |
| TC-WS-005 | Latitude out of range (100°) | 400 |
| TC-WS-006 | Longitude out of range (200°) | 400 |
| TC-WS-007 | Missing location entirely | 400 |
| TC-WS-008 | Duplicate within 20 meters | 409 Conflict |
| TC-WS-009 | Create at distant location (no duplicate) | 201 |
| TC-WS-010 | All valid types (Well, Public Tap, River, Lake, Bowser Point) | 201 for each |

### 2. List Water Sources — `GET /api/v1/water-sources`

| ID | Description | Expected |
|---|---|---|
| TC-WS-011 | Empty database | 200, empty sources array, total = 0 |
| TC-WS-012 | Return all sources | 200, correct count in pagination |
| TC-WS-013 | Filter by type (Well) | 200, only matching type returned |
| TC-WS-014 | Filter by operational_status (Broken) | 200, only matching status |
| TC-WS-015 | Pagination (page=1, limit=2 of 5) | 200, correct totalPages, hasNextPage |
| TC-WS-016 | Exclude soft-deleted sources | 200, deleted sources not returned |

### 3. Nearby Search — `GET /api/v1/water-sources/nearby`

| ID | Description | Expected |
|---|---|---|
| TC-WS-017 | Find source within 5km radius | 200, source found |
| TC-WS-018 | No sources within 1km (search Jaffna, source in Colombo) | 200, empty array |
| TC-WS-019 | Missing required coordinates | 400 validation error |
| TC-WS-020 | Radius exceeds maximum (100km) | 400 validation error |

### 4. Get By ID — `GET /api/v1/water-sources/:id`

| ID | Description | Expected |
|---|---|---|
| TC-WS-021 | Valid ID | 200, full source with populated creator |
| TC-WS-022 | Non-existent ObjectId | 404 Not Found |
| TC-WS-023 | Invalid ID format | 400 validation error |
| TC-WS-024 | Soft-deleted source | 404 Not Found |

### 5. Update Status — `PATCH /api/v1/water-sources/:id/status`

| ID | Description | Expected |
|---|---|---|
| TC-WS-025 | Change Functional → Broken | 200, status updated, message shows transition |
| TC-WS-026 | Invalid status value | 400 validation error |
| TC-WS-027 | Missing auth token | 401 Unauthorized |

### 6. Update Details — `PATCH /api/v1/water-sources/:id`

| ID | Description | Expected |
|---|---|---|
| TC-WS-028 | Creator updates name and description | 200, fields updated |
| TC-WS-029 | Non-creator, non-moderator attempt | 403 Forbidden |
| TC-WS-030 | Moderator updates any source | 200, allowed |
| TC-WS-031 | Empty update body | 400 validation error |

### 7. Verify Source — `PATCH /api/v1/water-sources/:id/verify`

| ID | Description | Expected |
|---|---|---|
| TC-WS-032 | Moderator verifies source | 200, verified = true, verified_by populated |
| TC-WS-033 | Admin verifies source | 200, verified = true |
| TC-WS-034 | Regular user attempt | 403 Forbidden |
| TC-WS-035 | Already verified source | 400, "already verified" |

### 8. Soft Delete — `DELETE /api/v1/water-sources/:id`

| ID | Description | Expected |
|---|---|---|
| TC-WS-036 | Creator soft deletes | 200, source no longer returned in GET |
| TC-WS-037 | Non-creator, non-moderator attempt | 403 Forbidden |
| TC-WS-038 | Admin deletes any source | 200 |
| TC-WS-039 | Delete already-deleted source | 404 Not Found |

### 9. Statistics — `GET /api/v1/water-sources/stats`

| ID | Description | Expected |
|---|---|---|
| TC-WS-040 | Empty database | 200, total = 0 |
| TC-WS-041 | Statistics with mixed data | 200, correct byType, byStatus, byAccessType counts |
| TC-WS-042 | Exclude soft-deleted from stats | 200, total = 0 after delete |

---

## Permission Matrix

| Endpoint | Public | User | Moderator | Admin |
|---|---|---|---|---|
| Create | ✗ | ✓ | ✓ | ✓ |
| List | ✓ | ✓ | ✓ | ✓ |
| Nearby | ✓ | ✓ | ✓ | ✓ |
| Get by ID | ✓ | ✓ | ✓ | ✓ |
| Update Status | ✗ | ✓ | ✓ | ✓ |
| Update Details | ✗ | Creator only | ✓ | ✓ |
| Verify | ✗ | ✗ | ✓ | ✓ |
| Delete | ✗ | Creator only | ✓ | ✓ |
| Stats | ✓ | ✓ | ✓ | ✓ |

## Bugs Found & Fixed During Testing

1. **Validate middleware** — Did not support `{body, query, params}` schema objects
2. **WaterTest import** — Not destructured, causing `find is not a function`
3. **HTTP status codes** — `http-status` package exports were undefined, causing all errors to return 500
4. **Rate limiter** — Blocked test requests with 429 errors

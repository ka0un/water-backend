# 🌊 Public Reports API Reference

Complete API reference for the Water Quality Public Reports system.

**Base URL:** `http://localhost:3000/api/v1`

---

## Authentication

Admin/Moderator endpoints require a Bearer token:

```
Authorization: Bearer <jwt_token>
```

Get a token via `POST /api/v1/auth/login`.

---

## Public Endpoints (No Auth)

These endpoints are used by the public wizard UI. No authentication needed.

### Create Report

```
POST /public-reports
```

Start a new wizard session.

| Body Field | Type | Required | Description |
|---|---|---|---|
| `nic` | string | ✅ | Sri Lankan NIC (e.g., `901234567V` or `200012345678`) |

**Response:** `201 Created`

```json
{
  "success": true,
  "data": {
    "report": {
      "_id": "abc123",
      "nic": "901234567V",
      "currentStep": 1,
      "wizardCompleted": false,
      "mod_status": "pending",
      ...
    }
  }
}
```

---

### Update Report (Auto-Save)

```
PATCH /public-reports/:id
```

Save wizard step data. All fields are optional — send only what changed.

| Body Field | Type | Description |
|---|---|---|
| `waterSource` | string | `well`, `river`, `lake`, `tap`, `tank`, `canal`, `spring`, `rainwater`, `borehole`, `other` |
| `location` | object | `{ district, city, address }` |
| `appearance` | object | `{ value, notes }` |
| `smell` | object | `{ detected, type, severity, amount, notes }` |
| `taste` | object | Same as smell |
| `turbidity` | object | `{ value }` |
| `sediment` | object | Same as smell |
| `oilGrease` | object | Same as smell |
| `foamBubbles` | object | Same as smell |
| `algae` | object | `{ detected, color, coverage, notes }` |
| `trashDebris` | object | Same as smell |
| `mudSilt` | object | Same as smell |
| `insectsLarvae` | object | Same as smell |
| `plantMatter` | object | Same as smell |
| `deadWildlife` | object | Same as smell |
| `pipeCondition` | object | Same as smell |
| `waterFlow` | string | Flow rate description |
| `temperature` | string | Temperature description |
| `testingMethod` | string | `observation`, `test_strips`, `lab_kit`, `professional_lab` |
| `advancedTests` | object | `{ ph: { value, unit }, hardness: { value, unit }, ... }` |
| `email` | string | Optional contact email |
| `phone` | string | Optional contact phone |
| `currentStep` | number | Current wizard step index |

**Response:** `200 OK` — returns updated report

---

### Get Report by ID

```
GET /public-reports/:id
```

**Response:** `200 OK` — full report document

---

### Lookup Reports by NIC

```
GET /public-reports/by-nic/:nic
```

Returns all reports (in-progress + completed) for the given NIC.

**Response:** `200 OK`

```json
{
  "data": {
    "reports": [
      {
        "_id": "abc123",
        "waterSource": "well",
        "currentStep": 5,
        "wizardCompleted": false,
        "mod_status": "pending",
        "createdAt": "2026-02-23T14:13:41.550Z"
      }
    ]
  }
}
```

---

### Submit Report

```
POST /public-reports/:id/submit
```

Marks the wizard as completed. Sets `wizardCompleted: true` and `mod_status: pending`.

**Response:** `200 OK`

---

### Upload Images

```
POST /public-reports/:id/images
```

Upload images as base64. Max 5MB per image, max 10 per report.

```json
{
  "images": [
    {
      "imageType": "water_source",
      "data": "<base64_string>",
      "contentType": "image/jpeg",
      "filename": "photo1.jpg"
    }
  ]
}
```

| Field | Type | Values |
|---|---|---|
| `imageType` | string | `water_source`, `water_sample`, `other` |
| `data` | string | Base64-encoded image data |
| `contentType` | string | MIME type (e.g., `image/jpeg`) |
| `filename` | string | Original filename (optional) |

**Response:** `200 OK` — returns `{ imageCount: 3 }`

---

### Get Full Report

```
GET /public-reports/:id/full
```

Returns full report with image metadata (without binary data).

---

## Moderator Endpoints (Auth + MODERATOR/ADMIN)

All endpoints below require `Authorization: Bearer <token>`.

### List All Reports

```
GET /public-reports-admin
```

Paginated, filterable list of all reports.

| Query Param | Type | Default | Description |
|---|---|---|---|
| `page` | number | 1 | Page number |
| `limit` | number | 20 | Items per page (max 100) |
| `sort` | string | `-createdAt` | Sort field (prefix `-` for descending) |
| `status` | string | — | Filter: `pending`, `approved`, `rejected` |
| `nic` | string | — | Filter by NIC (partial match) |
| `waterSource` | string | — | Filter by water source type |
| `district` | string | — | Filter by district (partial match) |
| `completed` | boolean | — | Filter: `true` or `false` |
| `dateFrom` | date | — | Filter: created after this date |
| `dateTo` | date | — | Filter: created before this date |

**Example:**
```
GET /public-reports-admin?status=pending&limit=10&sort=-createdAt
```

**Response:** `200 OK`
```json
{
  "data": {
    "reports": [...],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 42,
      "pages": 5
    }
  }
}
```

---

### Get Statistics

```
GET /public-reports-admin/stats
```

Aggregated statistics for dashboards.

**Response:**
```json
{
  "data": {
    "overview": { "total": 150, "completed": 120, "inProgress": 30 },
    "byStatus": { "pending": 45, "approved": 70, "rejected": 5 },
    "bySource": [{ "_id": "well", "count": 40 }, ...],
    "byDistrict": [{ "_id": "Colombo", "count": 25 }, ...],
    "dailySubmissions": [{ "_id": "2026-02-23", "count": 8 }, ...],
    "totalImages": 234
  }
}
```

---

### Get Report Detail

```
GET /public-reports-admin/:id
```

Full report with all fields and image metadata.

---

### Get Report Image

```
GET /public-reports-admin/:id/images/:imageId
```

Returns the actual image binary. Served with correct `Content-Type`.

Can be used directly in `<img>` tags:
```html
<img src="/api/v1/public-reports-admin/abc123/images/img456" />
```

---

### Moderate Report

```
PATCH /public-reports-admin/:id/moderate
```

Approve or reject a submitted report.

| Body Field | Type | Required | Description |
|---|---|---|---|
| `action` | string | ✅ | `approve` or `reject` |
| `reason` | string | if reject | Required when rejecting |

**Approve:**
```json
{ "action": "approve" }
```

**Reject:**
```json
{ "action": "reject", "reason": "Incomplete data" }
```

---

### Export Reports

```
GET /public-reports-admin/export
```

Download completed reports as a JSON file.

| Query Param | Type | Description |
|---|---|---|
| `status` | string | Filter by moderation status |
| `waterSource` | string | Filter by source |
| `dateFrom` | date | Start date |
| `dateTo` | date | End date |

Returns a downloadable `.json` file.

---

## Admin-Only Endpoints (Auth + ADMIN)

### Admin Update Report

```
PATCH /public-reports-admin/:id
```

Override any field on a report. Accepts the same fields as the public PATCH endpoint, plus moderation fields.

---

### Delete Report (Soft)

```
DELETE /public-reports-admin/:id
```

Soft-deletes a report (sets `deletedAt` timestamp). The record remains in the database but is excluded from all queries.

**Response:** `200 OK` — `{ id: "abc123", deletedAt: "2026-02-24T06:19:32Z" }`

---

### Delete All Reports by NIC (Soft)

```
DELETE /public-reports-admin/by-nic/:nic
```

Soft-deletes all reports associated with a NIC number.

**Response:** `200 OK` — `{ nic: "901234567V", deletedCount: 3 }`

---

### Reset All Reports (Soft)

```
POST /public-reports-admin/reset
```

⚠️ **Development only** — blocked in production.

Soft-deletes ALL public reports (sets `deletedAt` on every record).

**Response:** `200 OK` — `{ deletedCount: 150 }`

> [!NOTE]
> All delete operations are **soft deletes**. Records remain in the database with a `deletedAt` timestamp and are automatically excluded from all queries, stats, and exports. This allows data recovery if needed.

---

## Standard Response Format

All endpoints return responses in this format:

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Description of what happened",
  "data": { ... },
  "timestamp": "2026-02-23T14:13:41.803Z"
}
```

### Error Response

```json
{
  "success": false,
  "statusCode": 400,
  "message": "Error description",
  "timestamp": "2026-02-23T14:13:41.803Z"
}
```

### HTTP Status Codes

| Code | Meaning |
|---|---|
| `200` | Success |
| `201` | Created |
| `400` | Bad Request (validation error) |
| `401` | Unauthorized (no/invalid token) |
| `403` | Forbidden (insufficient role) |
| `404` | Not Found |
| `429` | Rate Limited |
| `500` | Server Error |

---

## Lab Staff Endpoints (Auth + LAB_STAFF/ADMIN)

All endpoints require `Authorization: Bearer <token>` with LAB_STAFF or ADMIN role.

### Get Dashboard Stats

```
GET /lab-staff/dashboard
```

Returns lab staff dashboard statistics and recent requests.

**Response:**
```json
{
  "data": {
    "stats": {
      "pendingAcceptance": 5,
      "accepted": 3,
      "inProgress": 2,
      "completedToday": 4,
      "totalCompleted": 150
    },
    "recentRequests": [...]
  }
}
```

---

### List Lab Test Requests

```
GET /lab-staff/requests
```

| Query Param | Type | Default | Description |
|---|---|---|---|
| `page` | number | 1 | Page number |
| `limit` | number | 20 | Items per page (max 100) |
| `status` | string | — | Filter by status |
| `priority` | string | — | Filter: `low`, `medium`, `high`, `urgent` |
| `sort` | string | `-createdAt` | Sort field |

**Status Values:**
- `pending_acceptance` - Waiting for lab to accept
- `accepted` - Lab accepted, awaiting scheduling
- `sample_scheduled` - Sample collection scheduled
- `sample_collected` - Sample collected, ready for testing
- `testing_in_progress` - Currently being tested
- `completed` - Testing complete, results available
- `rejected` - Lab rejected the request

---

### Get Single Request

```
GET /lab-staff/requests/:id
```

Returns full details of a lab test request including all test results.

---

### Get Safe Limits Reference

```
GET /lab-staff/safe-limits
```

Returns WHO water quality safe limits for all parameters.

**Response:**
```json
{
  "data": {
    "safeLimits": {
      "ph": { "min": 6.5, "max": 8.5, "unit": "pH" },
      "turbidity": { "max": 5, "unit": "NTU" },
      "lead": { "max": 0.01, "unit": "mg/L" },
      "coliformBacteria": { "max": 0, "unit": "CFU/100mL" },
      ...
    }
  }
}
```

---

### Accept Request

```
POST /lab-staff/requests/:id/accept
```

Accept a pending lab test request. Changes status to `accepted`.

---

### Reject Request

```
POST /lab-staff/requests/:id/reject
```

| Body Field | Type | Required | Description |
|---|---|---|---|
| `reason` | string | ✅ | Reason for rejection |

```json
{ "reason": "Insufficient sample information" }
```

---

### Schedule Sample Collection

```
POST /lab-staff/requests/:id/schedule
```

| Body Field | Type | Required | Description |
|---|---|---|---|
| `date` | string | ✅ | Collection date (YYYY-MM-DD) |
| `timeSlot` | string | ✅ | Time slot (e.g., "10:00 AM - 12:00 PM") |
| `assignedCollector` | string | — | User ID of assigned collector |
| `contactPhone` | string | — | Contact phone number |
| `specialInstructions` | string | — | Special instructions |

```json
{
  "date": "2026-02-26",
  "timeSlot": "10:00 AM - 12:00 PM",
  "contactPhone": "+94771234567",
  "specialInstructions": "Bring sterile containers"
}
```

---

### Record Sample Collection

```
POST /lab-staff/requests/:id/collect
```

| Body Field | Type | Required | Description |
|---|---|---|---|
| `location.coordinates` | array | — | [longitude, latitude] |
| `location.address` | string | — | Collection address |
| `waterTemperature` | number | — | Water temperature in °C |
| `weatherConditions` | string | — | Weather at collection time |
| `sampleContainerType` | string | — | Type of container used |
| `photos` | array | — | Array of photo objects |
| `notes` | string | — | Collection notes |

```json
{
  "location": {
    "coordinates": [79.8612, 6.9271],
    "address": "Colombo, Sri Lanka"
  },
  "waterTemperature": 28.5,
  "weatherConditions": "Sunny, clear sky",
  "sampleContainerType": "Sterile glass bottle",
  "notes": "Sample collected from main stream"
}
```

---

### Start Testing

```
POST /lab-staff/requests/:id/start-testing
```

Begin laboratory testing. Changes status to `testing_in_progress`.

---

### Input Test Results

```
PUT /lab-staff/requests/:id/results
```

Input test results for various water quality parameters.

```json
{
  "testResults": {
    "ph": { "value": 7.2, "notes": "Normal range" },
    "turbidity": { "value": 3.5, "notes": "Clear" },
    "totalDissolvedSolids": { "value": 320 },
    "lead": { "value": 0.005 },
    "arsenic": { "value": 0.002 },
    "coliformBacteria": { "value": 0 },
    "ecoliCount": { "value": 0 },
    "nitrate": { "value": 25 },
    "iron": { "value": 0.1 },
    "chloride": { "value": 150 }
  }
}
```

**Available Parameters:**
`ph`, `turbidity`, `totalDissolvedSolids`, `lead`, `arsenic`, `mercury`, `cadmium`, `chromium`, `copper`, `iron`, `manganese`, `zinc`, `nitrate`, `nitrite`, `fluoride`, `chloride`, `sulfate`, `coliformBacteria`, `ecoliCount`

---

### Complete Testing & Issue Verdict

```
POST /lab-staff/requests/:id/complete
```

Complete testing and auto-calculate verdict based on WHO safe limits.

| Body Field | Type | Required | Description |
|---|---|---|---|
| `labTechnicianNotes` | string | — | Technician notes |
| `recommendations` | string | — | Recommendations for the user |

```json
{
  "labTechnicianNotes": "All parameters within WHO safe limits.",
  "recommendations": "Regular monitoring recommended during monsoon season."
}
```

**Response includes:**
- Auto-calculated `verdict`: `safe`, `unsafe`, or `needs_treatment`
- `testSummary` with passed/failed parameter counts
- `failedParameters` list if any

---

## Laboratory Management Endpoints (Auth + ADMIN)

CRUD operations for laboratory management. Requires ADMIN role.

### List Laboratories

```
GET /laboratories
```

| Query Param | Type | Default | Description |
|---|---|---|---|
| `page` | number | 1 | Page number |
| `limit` | number | 20 | Items per page |
| `status` | string | — | Filter: `active`, `inactive`, `suspended` |
| `district` | string | — | Filter by district |
| `certification` | string | — | Filter by certification type |

---

### Get Laboratory

```
GET /laboratories/:id
```

Returns full laboratory details including capabilities and certifications.

---

### Create Laboratory

```
POST /laboratories
```

| Body Field | Type | Required | Description |
|---|---|---|---|
| `name` | string | ✅ | Laboratory name |
| `code` | string | ✅ | Unique lab code |
| `type` | string | ✅ | `government`, `private`, `university`, `research` |
| `address` | object | ✅ | `{ street, city, district, province, postalCode }` |
| `contact` | object | ✅ | `{ phone, email, website }` |
| `operatingHours` | object | — | `{ weekdays, weekends, holidays }` |
| `capabilities` | array | — | Array of test capabilities |
| `certifications` | array | — | Array of certification objects |
| `maxDailyCapacity` | number | — | Maximum daily test capacity |

```json
{
  "name": "Central Water Testing Lab",
  "code": "CWTL-001",
  "type": "government",
  "address": {
    "street": "123 Lab Street",
    "city": "Colombo",
    "district": "Colombo",
    "province": "Western",
    "postalCode": "00100"
  },
  "contact": {
    "phone": "+94112345678",
    "email": "info@cwtl.gov.lk",
    "website": "https://cwtl.gov.lk"
  },
  "capabilities": [
    "basic_physical",
    "chemical",
    "heavy_metals",
    "bacteriological"
  ],
  "maxDailyCapacity": 50
}
```

---

### Update Laboratory

```
PUT /laboratories/:id
```

Update laboratory information. Same fields as create.

---

### Delete Laboratory (Soft)

```
DELETE /laboratories/:id
```

Soft-deletes a laboratory (sets `deletedAt` timestamp).

---

### Update Laboratory Status

```
PATCH /laboratories/:id/status
```

| Body Field | Type | Required | Description |
|---|---|---|---|
| `status` | string | ✅ | `active`, `inactive`, `suspended` |
| `reason` | string | if suspended | Reason for suspension |

```json
{ "status": "suspended", "reason": "Pending certification renewal" }
```

---

### Get Laboratory Statistics

```
GET /laboratories/stats/overview
```

**Response:**
```json
{
  "data": {
    "overview": {
      "total": 25,
      "active": 20,
      "inactive": 3,
      "suspended": 2
    },
    "byType": [
      { "_id": "government", "count": 10 },
      { "_id": "private", "count": 15 }
    ],
    "byDistrict": [
      { "_id": "Colombo", "count": 8 },
      ...
    ],
    "totalCapacity": 500
  }
}
```

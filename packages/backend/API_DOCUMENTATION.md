# Water Quality Report API Documentation

## Base URL

```
http://localhost:3000/api/v1
```

---

## Authentication

All protected endpoints require a Bearer token in the Authorization header:

```
Authorization: Bearer <token>
```

---

## Response Format

### Success Response

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success message",
  "data": { ... },
  "timestamp": "2026-02-09T07:00:00.000Z"
}
```

### Error Response

```json
{
  "success": false,
  "statusCode": 400,
  "message": "Error message",
  "errors": [
    {
      "field": "email",
      "message": "Email is required"
    }
  ],
  "timestamp": "2026-02-09T07:00:00.000Z"
}
```

---

## Endpoints

### Health Check

#### GET `/health`

Check server status and database connectivity.

**Access**: Public

**Response**:
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Server is healthy",
  "data": {
    "status": "healthy",
    "timestamp": "2026-02-09T07:00:00.000Z",
    "uptime": 1234.56,
    "environment": "development",
    "mongodb": "connected",
    "memory": {
      "used": "50 MB",
      "total": "100 MB"
    }
  }
}
```

---

### Authentication

#### POST `/auth/register`

Register a new user account.

**Access**: Public

**Request Body**:
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "Password123"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| name | string | Yes | 2-100 characters |
| email | string | Yes | Valid email address |
| password | string | Yes | Min 8 chars, must contain uppercase, lowercase, and number |
| role | string | No | USER (default), MODERATOR, ADMIN |

**Response** (201 Created):
```json
{
  "success": true,
  "statusCode": 201,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "65f1a2b3c4d5e6f7g8h9i0j1",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "USER",
      "createdAt": "2026-02-09T07:00:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Errors**:
- `400` - Validation failed
- `409` - Email already registered

---

#### POST `/auth/login`

Login with email and password.

**Access**: Public

**Request Body**:
```json
{
  "email": "john@example.com",
  "password": "Password123"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "65f1a2b3c4d5e6f7g8h9i0j1",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "USER",
      "lastLoginAt": "2026-02-09T07:00:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Errors**:
- `400` - Validation failed
- `401` - Invalid email or password

---

#### GET `/auth/me`

Get current user profile.

**Access**: Private (Authenticated)

**Headers**:
```
Authorization: Bearer <token>
```

**Response** (200 OK):
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Profile retrieved successfully",
  "data": {
    "user": {
      "id": "65f1a2b3c4d5e6f7g8h9i0j1",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "USER",
      "isEmailVerified": false,
      "createdAt": "2026-02-09T07:00:00.000Z",
      "lastLoginAt": "2026-02-09T07:00:00.000Z"
    }
  }
}
```

**Errors**:
- `401` - Unauthorized (no token or invalid token)

---

### Users

#### GET `/users/profile`

Get current user profile.

**Access**: Private (Authenticated)

**Response**: Same as `GET /auth/me`

---

#### GET `/users`

Get all users (paginated).

**Access**: Private (ADMIN, MODERATOR)

**Query Parameters**:
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| page | number | 1 | Page number |
| limit | number | 10 | Items per page |

**Response** (200 OK):
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Users retrieved successfully",
  "data": {
    "users": [ ... ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 50,
      "pages": 5
    }
  }
}
```

**Errors**:
- `401` - Unauthorized
- `403` - Forbidden (insufficient permissions)

---

### Admin

#### GET `/admin/dashboard`

Get admin dashboard statistics.

**Access**: Private (ADMIN only)

**Response** (200 OK):
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Dashboard stats retrieved successfully",
  "data": {
    "stats": {
      "totalUsers": 100,
      "activeUsers": 95,
      "inactiveUsers": 5,
      "usersByRole": {
        "USER": 90,
        "MODERATOR": 8,
        "ADMIN": 2
      }
    }
  }
}
```

---

#### GET `/admin/users`

Get all users with advanced filtering.

**Access**: Private (ADMIN only)

**Query Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| page | number | Page number |
| limit | number | Items per page |
| role | string | Filter by role |
| isActive | boolean | Filter by status |

---

#### PATCH `/admin/users/:userId/role`

Update user role.

**Access**: Private (ADMIN only)

**Request Body**:
```json
{
  "role": "MODERATOR"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "statusCode": 200,
  "message": "User role updated successfully",
  "data": {
    "user": { ... }
  }
}
```

---

#### PATCH `/admin/users/:userId/status`

Activate or deactivate user.

**Access**: Private (ADMIN only)

**Request Body**:
```json
{
  "isActive": false
}
```

---

### Laboratory Management (Admin)

#### POST `/admin/laboratories`

Create a new laboratory.

**Access**: Private (ADMIN only)

**Request Body**:
```json
{
  "name": "Central Water Lab",
  "location": "Colombo",
  "email": "central@waterlab.com",
  "phone": "0771234567",
  "address": "123 Main Street",
  "city": "Colombo",
  "postalCode": "10100",
  "country": "Sri Lanka",
  "operatingHours": "9:00 AM - 5:00 PM",
  "capacity": 50,
  "certifications": ["ISO 9001", "NABL"],
  "equipmentList": ["pH Meter", "Spectrophotometer"],
  "description": "Main water testing facility"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| name | string | Yes | Laboratory name |
| location | string | Yes | General location |
| email | string | Yes | Valid email address |
| phone | string | Yes | Exactly 10 digits |
| address | string | Yes | Street address |
| city | string | Yes | City name |
| postalCode | string | Yes | Postal code |
| country | string | Yes | Country name |
| operatingHours | string | Yes | Operating hours |
| capacity | number | Yes | Lab capacity (min: 1) |
| certifications | array | No | List of certifications |
| equipmentList | array | No | List of equipment |
| description | string | No | Lab description |
| status | string | No | active, inactive, suspended (default: active) |

**Response** (201 Created):
```json
{
  "success": true,
  "statusCode": 201,
  "message": "Laboratory created successfully",
  "data": {
    "_id": "65f1a2b3c4d5e6f7g8h9i0j1",
    "name": "Central Water Lab",
    "location": "Colombo",
    "email": "central@waterlab.com",
    "phone": "0771234567",
    "status": "active",
    "createdAt": "2026-02-09T07:00:00.000Z"
  }
}
```

**Errors**:
- `400` - Validation failed (e.g., phone must be exactly 10 digits)
- `409` - Laboratory with this name or email already exists

---

#### GET `/admin/laboratories`

Get all laboratories with pagination and filtering.

**Access**: Private (ADMIN only)

**Query Parameters**:
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| page | number | 1 | Page number |
| limit | number | 10 | Items per page |
| status | string | active | Filter by status |
| search | string | - | Search by name, location, or city |

**Response** (200 OK):
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Laboratories retrieved successfully",
  "data": {
    "laboratories": [ ... ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 5,
      "pages": 1
    }
  }
}
```

---

#### GET `/admin/laboratories/:id`

Get a single laboratory by ID.

**Access**: Private (ADMIN only)

**Response** (200 OK):
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Laboratory retrieved successfully",
  "data": { ... }
}
```

**Errors**:
- `400` - Invalid laboratory ID format
- `404` - Laboratory not found

---

#### PUT `/admin/laboratories/:id`

Update a laboratory.

**Access**: Private (ADMIN only)

**Request Body**: Same fields as POST (all optional)

**Response** (200 OK):
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Laboratory updated successfully",
  "data": { ... }
}
```

---

#### DELETE `/admin/laboratories/:id`

Soft delete (deactivate) a laboratory.

**Access**: Private (ADMIN only)

**Response** (200 OK):
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Laboratory soft deleted successfully"
}
```

---

### Lab Staff - Test Management

#### GET `/lab-staff/dashboard`

Get lab staff dashboard statistics.

**Access**: Private (LAB_STAFF, ADMIN)

**Response** (200 OK):
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Dashboard stats retrieved successfully",
  "data": {
    "stats": {
      "pendingAcceptance": 5,
      "accepted": 3,
      "inProgress": 2,
      "completedToday": 4,
      "totalCompleted": 150
    },
    "recentRequests": [ ... ]
  }
}
```

---

#### GET `/lab-staff/requests`

List all lab test requests.

**Access**: Private (LAB_STAFF, ADMIN)

**Query Parameters**:
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| page | number | 1 | Page number |
| limit | number | 20 | Items per page (max: 100) |
| status | string | - | pending_acceptance, accepted, sample_scheduled, sample_collected, testing_in_progress, completed, rejected |
| priority | string | - | low, medium, high, urgent |
| sort | string | -createdAt | Sort field |

**Response** (200 OK):
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Lab test requests retrieved successfully",
  "data": {
    "requests": [ ... ],
    "pagination": { ... }
  }
}
```

---

#### GET `/lab-staff/requests/:id`

Get a single lab test request with full details.

**Access**: Private (LAB_STAFF, ADMIN)

**Response** (200 OK):
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Lab test request retrieved successfully",
  "data": {
    "request": {
      "_id": "...",
      "requestNumber": "LTR-2026-0001",
      "status": "pending_acceptance",
      "priority": "medium",
      "publicReport": { ... },
      "scheduledCollection": { ... },
      "sampleCollection": { ... },
      "testing": { ... },
      "results": { ... },
      "verdict": { ... }
    }
  }
}
```

---

#### POST `/lab-staff/requests/:id/accept`

Accept a lab test request.

**Access**: Private (LAB_STAFF, ADMIN)

**Request Body**: None required

**Response** (200 OK):
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Lab test request accepted successfully",
  "data": {
    "request": {
      "status": "accepted",
      "acceptedBy": "...",
      "acceptedAt": "2026-02-09T07:00:00.000Z"
    }
  }
}
```

**Errors**:
- `400` - Request has already been processed
- `404` - Lab test request not found

---

#### POST `/lab-staff/requests/:id/reject`

Reject a lab test request.

**Access**: Private (LAB_STAFF, ADMIN)

**Request Body**:
```json
{
  "reason": "Sample location is inaccessible"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| reason | string | Yes | Rejection reason |

**Response** (200 OK):
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Lab test request rejected",
  "data": {
    "request": {
      "status": "rejected",
      "rejectedBy": "...",
      "rejectedAt": "2026-02-09T07:00:00.000Z",
      "rejectionReason": "Sample location is inaccessible"
    }
  }
}
```

---

#### POST `/lab-staff/requests/:id/schedule`

Schedule sample collection.

**Access**: Private (LAB_STAFF, ADMIN)

**Request Body**:
```json
{
  "date": "2026-02-15",
  "timeSlot": "10:00 AM - 12:00 PM",
  "assignedCollector": "65f1a2b3c4d5e6f7g8h9i0j1",
  "contactPhone": "0771234567",
  "specialInstructions": "Gate code: 1234"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| date | string | Yes | Collection date (YYYY-MM-DD) |
| timeSlot | string | Yes | Time slot for collection |
| assignedCollector | string | No | User ID of collector |
| contactPhone | string | No | Contact phone number |
| specialInstructions | string | No | Special instructions |

**Response** (200 OK):
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Sample collection scheduled successfully",
  "data": { ... }
}
```

**Errors**:
- `400` - Request must be accepted before scheduling

---

#### POST `/lab-staff/requests/:id/collect`

Record sample collection details.

**Access**: Private (LAB_STAFF, ADMIN)

**Request Body**:
```json
{
  "lat": 6.9271,
  "lng": 79.8612,
  "accuracy": 10,
  "address": "123 Sample Location",
  "sampleId": "SMP-2026-0001",
  "bottleType": "glass",
  "volumeCollected": 500,
  "waterTemperature": 25.5,
  "weatherConditions": "Sunny",
  "notes": "Clear water sample",
  "photos": []
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| lat | number | No | Latitude |
| lng | number | No | Longitude |
| accuracy | number | No | GPS accuracy in meters |
| address | string | No | Collection address |
| sampleId | string | No | Auto-generated if not provided |
| bottleType | string | No | Type of collection bottle |
| volumeCollected | number | No | Volume in ml |
| waterTemperature | number | No | Temperature in Celsius |
| weatherConditions | string | No | Weather at collection |
| notes | string | No | Collection notes |
| photos | array | No | Photo URLs |

**Response** (200 OK):
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Sample collection recorded successfully",
  "data": { ... }
}
```

**Errors**:
- `400` - Sample collection must be scheduled first

---

#### POST `/lab-staff/requests/:id/start-testing`

Start testing a collected sample.

**Access**: Private (LAB_STAFF, ADMIN)

**Request Body**: None required

**Response** (200 OK):
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Testing started",
  "data": {
    "request": {
      "status": "testing_in_progress",
      "testing": {
        "startedAt": "2026-02-09T07:00:00.000Z",
        "testedBy": "..."
      }
    }
  }
}
```

**Errors**:
- `400` - Sample must be collected before testing can begin

---

#### PUT `/lab-staff/requests/:id/results`

Input test results.

**Access**: Private (LAB_STAFF, ADMIN)

**Request Body**:
```json
{
  "results": {
    "ph": { "value": 7.2 },
    "lead": { "value": 0.05, "notes": "Slightly elevated" },
    "turbidity": { "value": 2.5 },
    "coliformBacteria": { "value": 0 }
  },
  "labNotes": "Standard testing procedure followed"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Test results updated",
  "data": { ... }
}
```

**Errors**:
- `400` - Testing must be in progress to input results

---

#### POST `/lab-staff/requests/:id/complete`

Complete testing and issue verdict.

**Access**: Private (LAB_STAFF, ADMIN)

**Request Body**:
```json
{
  "recommendations": [
    "Water is safe for drinking",
    "Continue regular monitoring every 6 months"
  ]
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| recommendations | array | No | Custom recommendations (auto-generated if not provided) |

**Response** (200 OK):
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Testing completed and verdict issued",
  "data": {
    "request": {
      "status": "completed",
      "verdict": {
        "result": "safe",
        "score": 95,
        "failedParameters": [],
        "recommendations": [ ... ],
        "issuedAt": "2026-02-09T07:00:00.000Z",
        "issuedBy": "..."
      },
      "finalReport": {
        "reportNumber": "RPT-202602-0001",
        "generatedAt": "2026-02-09T07:00:00.000Z"
      }
    }
  }
}
```

**Errors**:
- `400` - Testing must be in progress to complete

---

#### GET `/lab-staff/safe-limits`

Get water quality safe limits reference.

**Access**: Private (LAB_STAFF, ADMIN)

**Response** (200 OK):
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Safe limits retrieved",
  "data": {
    "safeLimits": {
      "ph": { "min": 6.5, "max": 8.5, "unit": "pH" },
      "turbidity": { "max": 5, "unit": "NTU" },
      "lead": { "max": 0.01, "unit": "mg/L" },
      "arsenic": { "max": 0.01, "unit": "mg/L" },
      "coliformBacteria": { "max": 0, "unit": "CFU/100mL" }
    }
  }
}
```

---

## Lab Test Request Status Flow

```
pending_acceptance → accepted → sample_scheduled → sample_collected → testing_in_progress → completed
                   ↘ rejected
```

| Status | Description |
|--------|-------------|
| pending_acceptance | New request awaiting lab staff review |
| accepted | Request accepted, ready for scheduling |
| sample_scheduled | Collection date/time scheduled |
| sample_collected | Sample collected from location |
| testing_in_progress | Laboratory testing underway |
| completed | Testing complete, verdict issued |
| rejected | Request rejected with reason |

---

## Error Codes

| Code | Description |
|------|-------------|
| 400 | Bad Request - Validation failed |
| 401 | Unauthorized - Authentication required or token invalid |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource not found |
| 409 | Conflict - Resource already exists |
| 429 | Too Many Requests - Rate limit exceeded |
| 500 | Internal Server Error |

---

## Rate Limiting

API requests are rate-limited to **100 requests per 15 minutes** per IP address.

When rate limit is exceeded:
```json
{
  "success": false,
  "statusCode": 429,
  "message": "Too many requests, please try again later."
}
```

---

## User Roles

| Role | Description |
|------|-------------|
| USER | Standard user with basic access |
| MODERATOR | Can view all users and moderate content |
| ADMIN | Full access to all endpoints including user management |

---

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| NODE_ENV | No | development | Environment mode |
| PORT | No | 3000 | Server port |
| MONGODB_URI | Yes | - | MongoDB connection string |
| JWT_SECRET | Yes | - | JWT signing secret |
| JWT_EXPIRES_IN | No | 7d | JWT expiration time |
| LOG_LEVEL | No | info | Logging level |
| RATE_LIMIT_WINDOW_MS | No | 900000 | Rate limit window (ms) |
| RATE_LIMIT_MAX_REQUESTS | No | 100 | Max requests per window |

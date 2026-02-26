# Lab Testing API - Postman Guide

## Overview

This guide covers the complete lab testing workflow from accepting a test request to issuing a final verdict.

### Testing Workflow

```
1. Accept Request → 2. Schedule Collection → 3. Collect Sample → 4. Start Testing → 5. Input Results → 6. Complete & Issue Verdict
```

---

## Setup Instructions

### 1. Authentication

First, login as LAB_STAFF or ADMIN to get an authentication token.

#### Login as Lab Staff
- **Method**: POST
- **URL**: `http://localhost:3000/api/v1/auth/login`
- **Body (JSON)**:
```json
{
  "email": "labstaff@example.com",
  "password": "password123"
}
```
- **Response**: Copy the token for subsequent requests

---

## API Endpoints

### 1. GET Dashboard Statistics
- **Method**: GET
- **URL**: `http://localhost:3000/api/v1/lab-staff/dashboard`
- **Headers**:
  ```
  Authorization: Bearer {YOUR_TOKEN}
  ```

**Expected Response (200 OK)**:
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
    "recentRequests": [
      {
        "_id": "507f1f77bcf86cd799439011",
        "requestNumber": "LTR-2026-0001",
        "status": "pending_acceptance",
        "priority": "medium",
        "createdAt": "2026-02-15T10:00:00Z"
      }
    ]
  }
}
```

---

### 2. LIST All Lab Test Requests
- **Method**: GET
- **URL**: `http://localhost:3000/api/v1/lab-staff/requests?page=1&limit=20&status=pending_acceptance`
- **Headers**:
  ```
  Authorization: Bearer {YOUR_TOKEN}
  ```
- **Query Parameters**:
  - `page`: Page number (default: 1)
  - `limit`: Items per page (default: 20, max: 100)
  - `status`: Filter by status (optional)
    - `pending_acceptance`
    - `accepted`
    - `sample_scheduled`
    - `sample_collected`
    - `testing_in_progress`
    - `completed`
    - `rejected`
  - `priority`: Filter by priority (optional)
    - `low`
    - `medium`
    - `high`
    - `urgent`
  - `sort`: Sort field (default: `-createdAt`)

**Expected Response (200 OK)**:
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Lab test requests retrieved successfully",
  "data": {
    "requests": [
      {
        "_id": "507f1f77bcf86cd799439011",
        "requestNumber": "LTR-2026-0001",
        "status": "pending_acceptance",
        "priority": "medium",
        "publicReport": {
          "waterSource": "Well",
          "location": "Colombo",
          "nic": "200012345678"
        },
        "createdAt": "2026-02-15T10:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 5,
      "pages": 1
    }
  }
}
```

---

### 3. GET Single Lab Test Request
- **Method**: GET
- **URL**: `http://localhost:3000/api/v1/lab-staff/requests/{REQUEST_ID}`
- **Headers**:
  ```
  Authorization: Bearer {YOUR_TOKEN}
  ```
- **Replace `{REQUEST_ID}` with actual ID** (e.g., `507f1f77bcf86cd799439011`)

**Expected Response (200 OK)**:
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Lab test request retrieved successfully",
  "data": {
    "request": {
      "_id": "507f1f77bcf86cd799439011",
      "requestNumber": "LTR-2026-0001",
      "status": "pending_acceptance",
      "priority": "medium",
      "publicReport": {
        "_id": "...",
        "waterSource": "Well",
        "location": "Colombo",
        "nic": "200012345678"
      },
      "scheduledCollection": null,
      "sampleCollection": null,
      "testing": {},
      "results": {
        "ph": null,
        "turbidity": null,
        "lead": null
      },
      "verdict": null,
      "createdAt": "2026-02-15T10:00:00Z"
    }
  }
}
```

---

### 4. ACCEPT Lab Test Request
- **Method**: POST
- **URL**: `http://localhost:3000/api/v1/lab-staff/requests/{REQUEST_ID}/accept`
- **Headers**:
  ```
  Authorization: Bearer {YOUR_TOKEN}
  ```
- **Body**: None required (empty body or `{}`)

**Expected Response (200 OK)**:
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Lab test request accepted successfully",
  "data": {
    "request": {
      "_id": "507f1f77bcf86cd799439011",
      "requestNumber": "LTR-2026-0001",
      "status": "accepted",
      "acceptedBy": "65f1a2b3c4d5e6f7g8h9i0j1",
      "acceptedAt": "2026-02-15T10:30:00Z"
    }
  }
}
```

**Error Response (400 Bad Request)**:
```json
{
  "success": false,
  "statusCode": 400,
  "message": "Request has already been processed"
}
```

---

### 5. REJECT Lab Test Request
- **Method**: POST
- **URL**: `http://localhost:3000/api/v1/lab-staff/requests/{REQUEST_ID}/reject`
- **Headers**:
  ```
  Authorization: Bearer {YOUR_TOKEN}
  Content-Type: application/json
  ```
- **Body (JSON)**:
```json
{
  "reason": "Sample location is inaccessible due to road construction"
}
```

**Expected Response (200 OK)**:
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Lab test request rejected",
  "data": {
    "request": {
      "_id": "507f1f77bcf86cd799439011",
      "requestNumber": "LTR-2026-0001",
      "status": "rejected",
      "rejectedBy": "65f1a2b3c4d5e6f7g8h9i0j1",
      "rejectedAt": "2026-02-15T10:30:00Z",
      "rejectionReason": "Sample location is inaccessible due to road construction"
    }
  }
}
```

**Error Response (400 Bad Request)** - Missing reason:
```json
{
  "success": false,
  "statusCode": 400,
  "message": "Rejection reason is required"
}
```

---

### 6. SCHEDULE Sample Collection
- **Method**: POST
- **URL**: `http://localhost:3000/api/v1/lab-staff/requests/{REQUEST_ID}/schedule`
- **Headers**:
  ```
  Authorization: Bearer {YOUR_TOKEN}
  Content-Type: application/json
  ```
- **Body (JSON)**:
```json
{
  "date": "2026-02-20",
  "timeSlot": "10:00 AM - 12:00 PM",
  "contactPhone": "0771234567",
  "specialInstructions": "Gate code: 1234. Ask for Mr. Silva."
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| date | string | Yes | Collection date (YYYY-MM-DD) |
| timeSlot | string | Yes | Time slot for collection |
| assignedCollector | string | No | User ID of assigned collector |
| contactPhone | string | No | Contact phone for collection |
| specialInstructions | string | No | Additional instructions |

**Expected Response (200 OK)**:
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Sample collection scheduled successfully",
  "data": {
    "request": {
      "_id": "507f1f77bcf86cd799439011",
      "status": "sample_scheduled",
      "scheduledCollection": {
        "date": "2026-02-20T00:00:00Z",
        "timeSlot": "10:00 AM - 12:00 PM",
        "contactPhone": "0771234567",
        "specialInstructions": "Gate code: 1234. Ask for Mr. Silva."
      }
    }
  }
}
```

**Error Response (400 Bad Request)**:
```json
{
  "success": false,
  "statusCode": 400,
  "message": "Request must be accepted before scheduling"
}
```

---

### 7. RECORD Sample Collection
- **Method**: POST
- **URL**: `http://localhost:3000/api/v1/lab-staff/requests/{REQUEST_ID}/collect`
- **Headers**:
  ```
  Authorization: Bearer {YOUR_TOKEN}
  Content-Type: application/json
  ```
- **Body (JSON)**:
```json
{
  "lat": 6.9271,
  "lng": 79.8612,
  "accuracy": 10,
  "address": "123 Sample Location, Colombo",
  "sampleId": "SMP-2026-0001",
  "bottleType": "glass",
  "volumeCollected": 500,
  "waterTemperature": 25.5,
  "weatherConditions": "Sunny, clear day",
  "notes": "Water appears clear, no visible contamination"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| lat | number | No | GPS latitude |
| lng | number | No | GPS longitude |
| accuracy | number | No | GPS accuracy in meters |
| address | string | No | Collection address |
| sampleId | string | No | Sample ID (auto-generated if not provided) |
| bottleType | string | No | Type of collection bottle |
| volumeCollected | number | No | Volume collected in ml |
| waterTemperature | number | No | Water temperature in Celsius |
| weatherConditions | string | No | Weather at collection time |
| notes | string | No | Additional notes |
| photos | array | No | Array of photo URLs |

**Expected Response (200 OK)**:
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Sample collection recorded successfully",
  "data": {
    "request": {
      "_id": "507f1f77bcf86cd799439011",
      "status": "sample_collected",
      "sampleCollection": {
        "collectedBy": "65f1a2b3c4d5e6f7g8h9i0j1",
        "collectedAt": "2026-02-20T10:30:00Z",
        "location": {
          "lat": 6.9271,
          "lng": 79.8612,
          "accuracy": 10,
          "address": "123 Sample Location, Colombo"
        },
        "sampleId": "SMP-2026-0001",
        "bottleType": "glass",
        "volumeCollected": 500,
        "waterTemperature": 25.5,
        "weatherConditions": "Sunny, clear day",
        "notes": "Water appears clear, no visible contamination"
      }
    }
  }
}
```

**Error Response (400 Bad Request)**:
```json
{
  "success": false,
  "statusCode": 400,
  "message": "Sample collection must be scheduled first"
}
```

---

### 8. START Testing
- **Method**: POST
- **URL**: `http://localhost:3000/api/v1/lab-staff/requests/{REQUEST_ID}/start-testing`
- **Headers**:
  ```
  Authorization: Bearer {YOUR_TOKEN}
  ```
- **Body**: None required (empty body or `{}`)

**Expected Response (200 OK)**:
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Testing started",
  "data": {
    "request": {
      "_id": "507f1f77bcf86cd799439011",
      "status": "testing_in_progress",
      "testing": {
        "startedAt": "2026-02-20T14:00:00Z",
        "testedBy": "65f1a2b3c4d5e6f7g8h9i0j1"
      }
    }
  }
}
```

**Error Response (400 Bad Request)**:
```json
{
  "success": false,
  "statusCode": 400,
  "message": "Sample must be collected before testing can begin"
}
```

---

### 9. INPUT Test Results
- **Method**: PUT
- **URL**: `http://localhost:3000/api/v1/lab-staff/requests/{REQUEST_ID}/results`
- **Headers**:
  ```
  Authorization: Bearer {YOUR_TOKEN}
  Content-Type: application/json
  ```
- **Body (JSON)**:
```json
{
  "results": {
    "ph": {
      "value": 7.2
    },
    "turbidity": {
      "value": 2.5
    },
    "dissolvedOxygen": {
      "value": 8.0
    },
    "totalDissolvedSolids": {
      "value": 350
    },
    "hardness": {
      "value": 150
    },
    "chloride": {
      "value": 200
    },
    "nitrate": {
      "value": 5
    },
    "lead": {
      "value": 0.005,
      "notes": "Within safe limits"
    },
    "arsenic": {
      "value": 0.002
    },
    "fluoride": {
      "value": 0.8
    },
    "coliformBacteria": {
      "value": 0
    },
    "ecoliCount": {
      "value": 0
    }
  },
  "labNotes": "Standard testing procedure followed. All equipment calibrated."
}
```

**Available Parameters**:
| Parameter | Safe Limit | Unit |
|-----------|------------|------|
| ph | 6.5 - 8.5 | pH |
| turbidity | max 5 | NTU |
| dissolvedOxygen | min 5 | mg/L |
| totalDissolvedSolids | max 500 | mg/L |
| hardness | max 300 | mg/L |
| chloride | max 250 | mg/L |
| nitrate | max 10 | mg/L |
| sulfate | max 250 | mg/L |
| iron | max 0.3 | mg/L |
| manganese | max 0.1 | mg/L |
| lead | max 0.01 | mg/L |
| arsenic | max 0.01 | mg/L |
| mercury | max 0.001 | mg/L |
| cadmium | max 0.003 | mg/L |
| chromium | max 0.05 | mg/L |
| copper | max 1.0 | mg/L |
| zinc | max 5.0 | mg/L |
| fluoride | max 1.5 | mg/L |
| coliformBacteria | max 0 | CFU/100mL |
| ecoliCount | max 0 | CFU/100mL |

**Expected Response (200 OK)**:
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Test results updated",
  "data": {
    "request": {
      "_id": "507f1f77bcf86cd799439011",
      "status": "testing_in_progress",
      "results": {
        "ph": {
          "value": 7.2,
          "unit": "pH",
          "testedAt": "2026-02-20T15:00:00Z"
        },
        "lead": {
          "value": 0.005,
          "unit": "mg/L",
          "testedAt": "2026-02-20T15:00:00Z",
          "notes": "Within safe limits"
        }
      },
      "testing": {
        "labNotes": "Standard testing procedure followed. All equipment calibrated."
      }
    }
  }
}
```

**Error Response (400 Bad Request)**:
```json
{
  "success": false,
  "statusCode": 400,
  "message": "Testing must be in progress to input results"
}
```

---

### 10. COMPLETE Testing & Issue Verdict
- **Method**: POST
- **URL**: `http://localhost:3000/api/v1/lab-staff/requests/{REQUEST_ID}/complete`
- **Headers**:
  ```
  Authorization: Bearer {YOUR_TOKEN}
  Content-Type: application/json
  ```
- **Body (JSON)** - Optional custom recommendations:
```json
{
  "recommendations": [
    "Water is safe for drinking and domestic use",
    "Continue regular monitoring every 6 months",
    "Maintain proper well covering to prevent contamination"
  ]
}
```

Or send empty body `{}` for auto-generated recommendations.

**Expected Response (200 OK)**:
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Testing completed and verdict issued",
  "data": {
    "request": {
      "_id": "507f1f77bcf86cd799439011",
      "requestNumber": "LTR-2026-0001",
      "status": "completed",
      "verdict": {
        "result": "safe",
        "score": 95,
        "failedParameters": [],
        "recommendations": [
          "Water is safe for drinking and domestic use",
          "Continue regular monitoring every 6 months",
          "Maintain proper well covering to prevent contamination"
        ],
        "issuedAt": "2026-02-20T16:00:00Z",
        "issuedBy": "65f1a2b3c4d5e6f7g8h9i0j1"
      },
      "finalReport": {
        "reportNumber": "RPT-202602-0001",
        "generatedAt": "2026-02-20T16:00:00Z"
      },
      "testing": {
        "startedAt": "2026-02-20T14:00:00Z",
        "completedAt": "2026-02-20T16:00:00Z",
        "testedBy": "65f1a2b3c4d5e6f7g8h9i0j1"
      }
    }
  }
}
```

**Verdict Results**:
| Result | Description |
|--------|-------------|
| safe | All parameters within safe limits |
| unsafe | Critical parameters exceed limits |
| needs_treatment | Some parameters need attention |

**Error Response (400 Bad Request)**:
```json
{
  "success": false,
  "statusCode": 400,
  "message": "Testing must be in progress to complete"
}
```

---

### 11. GET Safe Limits Reference
- **Method**: GET
- **URL**: `http://localhost:3000/api/v1/lab-staff/safe-limits`
- **Headers**:
  ```
  Authorization: Bearer {YOUR_TOKEN}
  ```

**Expected Response (200 OK)**:
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Safe limits retrieved",
  "data": {
    "safeLimits": {
      "ph": { "min": 6.5, "max": 8.5, "unit": "pH", "name": "pH Level" },
      "turbidity": { "max": 5, "unit": "NTU", "name": "Turbidity" },
      "lead": { "max": 0.01, "unit": "mg/L", "name": "Lead" },
      "arsenic": { "max": 0.01, "unit": "mg/L", "name": "Arsenic" },
      "coliformBacteria": { "max": 0, "unit": "CFU/100mL", "name": "Coliform Bacteria" }
    }
  }
}
```

---

## Complete Testing Workflow Example

Here's a step-by-step example of processing a lab test request:

### Step 1: List Pending Requests
```
GET /api/v1/lab-staff/requests?status=pending_acceptance
```

### Step 2: Accept a Request
```
POST /api/v1/lab-staff/requests/507f1f77bcf86cd799439011/accept
Body: {}
```

### Step 3: Schedule Collection
```
POST /api/v1/lab-staff/requests/507f1f77bcf86cd799439011/schedule
Body: {
  "date": "2026-02-20",
  "timeSlot": "10:00 AM - 12:00 PM"
}
```

### Step 4: Record Sample Collection
```
POST /api/v1/lab-staff/requests/507f1f77bcf86cd799439011/collect
Body: {
  "sampleId": "SMP-001",
  "bottleType": "glass",
  "volumeCollected": 500
}
```

### Step 5: Start Testing
```
POST /api/v1/lab-staff/requests/507f1f77bcf86cd799439011/start-testing
Body: {}
```

### Step 6: Input Results
```
PUT /api/v1/lab-staff/requests/507f1f77bcf86cd799439011/results
Body: {
  "results": {
    "ph": { "value": 7.2 },
    "lead": { "value": 0.005 },
    "coliformBacteria": { "value": 0 }
  }
}
```

### Step 7: Complete & Issue Verdict
```
POST /api/v1/lab-staff/requests/507f1f77bcf86cd799439011/complete
Body: {}
```

---

## Status Flow Diagram

```
┌─────────────────────┐
│ pending_acceptance  │
└─────────┬───────────┘
          │
    ┌─────┴─────┐
    │           │
    ▼           ▼
┌────────┐  ┌──────────┐
│accepted│  │ rejected │
└───┬────┘  └──────────┘
    │
    ▼
┌─────────────────┐
│sample_scheduled │
└───────┬─────────┘
        │
        ▼
┌─────────────────┐
│sample_collected │
└───────┬─────────┘
        │
        ▼
┌─────────────────────┐
│testing_in_progress  │
└─────────┬───────────┘
          │
          ▼
    ┌───────────┐
    │ completed │
    └───────────┘
```

---

## Error Codes

| Code | Description |
|------|-------------|
| 400 | Bad Request - Invalid status transition or missing required fields |
| 401 | Unauthorized - No token or invalid token |
| 403 | Forbidden - User not LAB_STAFF or ADMIN |
| 404 | Not Found - Lab test request not found |

---

## Tips for Postman Testing

1. **Save your token**: After login, save the token in a Postman environment variable
2. **Use variables**: Set `{{baseUrl}}` = `http://localhost:3000/api/v1`
3. **Follow the workflow**: Each step depends on the previous status
4. **Check status**: Use GET request to verify status after each action
5. **No body for action endpoints**: Accept and Start Testing don't need a body

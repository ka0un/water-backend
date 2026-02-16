# Laboratory Management CRUD API - Postman Guide

## Setup Instructions

### 1. Authentication
First, you need to register and login to get an authentication token.

#### Register User
- **Method**: POST
- **URL**: `http://localhost:3000/api/v1/auth/register`
- **Body (JSON)**:
```json
{
  "name": "Admin User",
  "email": "admin@example.com",
  "password": "password123",
  "role": "admin"
}
```

#### Login
- **Method**: POST
- **URL**: `http://localhost:3000/api/v1/auth/login`
- **Body (JSON)**:
```json
{
  "email": "admin@example.com",
  "password": "password123"
}
```
- **Response**: You'll receive a token (copy this for other requests)

---

## API Endpoints

### 1. CREATE - Add New Laboratory
- **Method**: POST
- **URL**: `http://localhost:3000/api/v1/admin/laboratories`
- **Headers**:
  ```
  Authorization: Bearer {YOUR_TOKEN}
  Content-Type: application/json
  ```
- **Body (JSON)**:
```json
{
  "name": "Central Water Testing Lab",
  "location": "Downtown District",
  "email": "lab@waterquality.com",
  "phone": "+1-555-0123",
  "address": "123 Science Street",
  "city": "New York",
  "postalCode": "10001",
  "country": "USA",
  "operatingHours": "9 AM - 6 PM",
  "capacity": 50,
  "certifications": ["ISO 9001", "ISO 17025", "NIST"],
  "equipmentList": ["Spectrophotometer", "pH Meter", "Chromatography Equipment"],
  "description": "Leading water quality testing facility",
  "status": "active"
}
```

**Expected Response (201 Created)**:
```json
{
  "statusCode": 201,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Central Water Testing Lab",
    "location": "Downtown District",
    "email": "lab@waterquality.com",
    "phone": "+1-555-0123",
    "address": "123 Science Street",
    "city": "New York",
    "postalCode": "10001",
    "country": "USA",
    "operatingHours": "9 AM - 6 PM",
    "capacity": 50,
    "certifications": ["ISO 9001", "ISO 17025", "NIST"],
    "equipmentList": ["Spectrophotometer", "pH Meter", "Chromatography Equipment"],
    "description": "Leading water quality testing facility",
    "status": "active",
    "createdAt": "2026-02-15T12:30:00Z",
    "updatedAt": "2026-02-15T12:30:00Z"
  },
  "message": "Laboratory created successfully"
}
```

---

### 2. READ - Get All Laboratories
- **Method**: GET
- **URL**: `http://localhost:3000/api/v1/admin/laboratories?page=1&limit=10&status=active&search=`
- **Headers**:
  ```
  Authorization: Bearer {YOUR_TOKEN}
  ```
- **Query Parameters**:
  - `page`: Page number (default: 1)
  - `limit`: Records per page (default: 10)
  - `status`: Filter by status (active, inactive, suspended) - optional
  - `search`: Search by name, location, or city - optional

**Expected Response (200 OK)**:
```json
{
  "statusCode": 200,
  "data": {
    "laboratories": [
      {
        "_id": "507f1f77bcf86cd799439011",
        "name": "Central Water Testing Lab",
        "location": "Downtown District",
        "email": "lab@waterquality.com",
        "phone": "+1-555-0123",
        "address": "123 Science Street",
        "city": "New York",
        "postalCode": "10001",
        "country": "USA",
        "operatingHours": "9 AM - 6 PM",
        "capacity": 50,
        "certifications": ["ISO 9001", "ISO 17025", "NIST"],
        "equipmentList": ["Spectrophotometer", "pH Meter"],
        "description": "Leading water quality testing facility",
        "status": "active",
        "createdAt": "2026-02-15T12:30:00Z",
        "updatedAt": "2026-02-15T12:30:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 1,
      "pages": 1
    }
  },
  "message": "Laboratories retrieved successfully"
}
```

---

### 3. READ - Get Single Laboratory
- **Method**: GET
- **URL**: `http://localhost:3000/api/v1/admin/laboratories/{LAB_ID}`
- **Headers**:
  ```
  Authorization: Bearer {YOUR_TOKEN}
  ```
- **Replace `{LAB_ID}` with actual ID** (e.g., `507f1f77bcf86cd799439011`)

**Expected Response (200 OK)**:
```json
{
  "statusCode": 200,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Central Water Testing Lab",
    "location": "Downtown District",
    "email": "lab@waterquality.com",
    "phone": "+1-555-0123",
    "address": "123 Science Street",
    "city": "New York",
    "postalCode": "10001",
    "country": "USA",
    "operatingHours": "9 AM - 6 PM",
    "capacity": 50,
    "certifications": ["ISO 9001", "ISO 17025", "NIST"],
    "equipmentList": ["Spectrophotometer", "pH Meter"],
    "description": "Leading water quality testing facility",
    "status": "active",
    "createdAt": "2026-02-15T12:30:00Z",
    "updatedAt": "2026-02-15T12:30:00Z"
  },
  "message": "Laboratory retrieved successfully"
}
```

---

### 4. UPDATE - Edit Laboratory
- **Method**: PUT
- **URL**: `http://localhost:3000/api/v1/admin/laboratories/{LAB_ID}`
- **Headers**:
  ```
  Authorization: Bearer {YOUR_TOKEN}
  Content-Type: application/json
  ```
- **Body (JSON)** - Send only fields you want to update:
```json
{
  "name": "Central Water Testing Lab - Updated",
  "capacity": 75,
  "operatingHours": "9 AM - 8 PM",
  "certifications": ["ISO 9001", "ISO 17025", "NIST", "AOAC"],
  "status": "active"
}
```

**Expected Response (200 OK)**:
```json
{
  "statusCode": 200,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Central Water Testing Lab - Updated",
    "location": "Downtown District",
    "email": "lab@waterquality.com",
    "phone": "+1-555-0123",
    "address": "123 Science Street",
    "city": "New York",
    "postalCode": "10001",
    "country": "USA",
    "operatingHours": "9 AM - 8 PM",
    "capacity": 75,
    "certifications": ["ISO 9001", "ISO 17025", "NIST", "AOAC"],
    "equipmentList": ["Spectrophotometer", "pH Meter"],
    "description": "Leading water quality testing facility",
    "status": "active",
    "createdAt": "2026-02-15T12:30:00Z",
    "updatedAt": "2026-02-15T13:45:00Z"
  },
  "message": "Laboratory updated successfully"
}
```

---

### 5. DELETE - Deactivate Laboratory (Soft Delete)
- **Method**: DELETE
- **URL**: `http://localhost:3000/api/v1/admin/laboratories/{LAB_ID}`
- **Headers**:
  ```
  Authorization: Bearer {YOUR_TOKEN}
  ```

**Expected Response (200 OK)**:
```json
{
  "statusCode": 200,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Central Water Testing Lab",
    "status": "inactive",
    "updatedAt": "2026-02-15T14:00:00Z"
  },
  "message": "Laboratory deactivated successfully"
}
```

---

## Postman Collection JSON

You can import this directly into Postman:

```json
{
  "info": {
    "name": "Laboratory Management API",
    "description": "CRUD Operations for Laboratory Management",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Auth - Register Admin",
      "request": {
        "method": "POST",
        "header": [{"key": "Content-Type", "value": "application/json"}],
        "body": {
          "mode": "raw",
          "raw": "{\"name\":\"Admin User\",\"email\":\"admin@example.com\",\"password\":\"password123\",\"role\":\"admin\"}"
        },
        "url": {"raw": "http://localhost:3000/api/v1/auth/register", "protocol": "http", "host": ["localhost"], "port": ["3000"], "path": ["api", "v1", "auth", "register"]}
      }
    },
    {
      "name": "Auth - Login",
      "request": {
        "method": "POST",
        "header": [{"key": "Content-Type", "value": "application/json"}],
        "body": {
          "mode": "raw",
          "raw": "{\"email\":\"admin@example.com\",\"password\":\"password123\"}"
        },
        "url": {"raw": "http://localhost:3000/api/v1/auth/login", "protocol": "http", "host": ["localhost"], "port": ["3000"], "path": ["api", "v1", "auth", "login"]}
      }
    },
    {
      "name": "Create Laboratory",
      "request": {
        "method": "POST",
        "header": [
          {"key": "Authorization", "value": "Bearer {{token}}"},
          {"key": "Content-Type", "value": "application/json"}
        ],
        "body": {
          "mode": "raw",
          "raw": "{\"name\":\"Central Water Testing Lab\",\"location\":\"Downtown District\",\"email\":\"lab@waterquality.com\",\"phone\":\"+1-555-0123\",\"address\":\"123 Science Street\",\"city\":\"New York\",\"postalCode\":\"10001\",\"country\":\"USA\",\"operatingHours\":\"9 AM - 6 PM\",\"capacity\":50,\"certifications\":[\"ISO 9001\",\"ISO 17025\"],\"equipmentList\":[\"Spectrophotometer\",\"pH Meter\"],\"description\":\"Leading water quality testing facility\",\"status\":\"active\"}"
        },
        "url": {"raw": "http://localhost:3000/api/v1/admin/laboratories", "protocol": "http", "host": ["localhost"], "port": ["3000"], "path": ["api", "v1", "admin", "laboratories"]}
      }
    },
    {
      "name": "Get All Laboratories",
      "request": {
        "method": "GET",
        "header": [{"key": "Authorization", "value": "Bearer {{token}}"}],
        "url": {"raw": "http://localhost:3000/api/v1/admin/laboratories?page=1&limit=10&status=active", "protocol": "http", "host": ["localhost"], "port": ["3000"], "path": ["api", "v1", "admin", "laboratories"], "query": [{"key": "page", "value": "1"}, {"key": "limit", "value": "10"}, {"key": "status", "value": "active"}]}
      }
    },
    {
      "name": "Get Laboratory by ID",
      "request": {
        "method": "GET",
        "header": [{"key": "Authorization", "value": "Bearer {{token}}"}],
        "url": {"raw": "http://localhost:3000/api/v1/admin/laboratories/{{lab_id}}", "protocol": "http", "host": ["localhost"], "port": ["3000"], "path": ["api", "v1", "admin", "laboratories", "{{lab_id}}"]}
      }
    },
    {
      "name": "Update Laboratory",
      "request": {
        "method": "PUT",
        "header": [
          {"key": "Authorization", "value": "Bearer {{token}}"},
          {"key": "Content-Type", "value": "application/json"}
        ],
        "body": {
          "mode": "raw",
          "raw": "{\"name\":\"Central Lab Updated\",\"capacity\":75,\"operatingHours\":\"9 AM - 8 PM\"}"
        },
        "url": {"raw": "http://localhost:3000/api/v1/admin/laboratories/{{lab_id}}", "protocol": "http", "host": ["localhost"], "port": ["3000"], "path": ["api", "v1", "admin", "laboratories", "{{lab_id}}"]}
      }
    },
    {
      "name": "Delete Laboratory",
      "request": {
        "method": "DELETE",
        "header": [{"key": "Authorization", "value": "Bearer {{token}}"}],
        "url": {"raw": "http://localhost:3000/api/v1/admin/laboratories/{{lab_id}}", "protocol": "http", "host": ["localhost"], "port": ["3000"], "path": ["api", "v1", "admin", "laboratories", "{{lab_id}}"]}
      }
    }
  ]
}
```

---

## Variable Setup in Postman

1. Set Postman variables:
   - `token`: Paste the token received from login endpoint
   - `lab_id`: Paste a laboratory ID from the GET all response

2. Use `{{token}}` and `{{lab_id}}` in URLs and headers

---

## Error Responses

### 401 Unauthorized
```json
{
  "statusCode": 401,
  "message": "Access token is missing or invalid"
}
```

### 403 Forbidden (Not Admin)
```json
{
  "statusCode": 403,
  "message": "Access denied. Admin role required."
}
```

### 404 Not Found
```json
{
  "statusCode": 404,
  "message": "Laboratory not found"
}
```

### 409 Conflict (Duplicate)
```json
{
  "statusCode": 409,
  "message": "Laboratory with this name or email already exists"
}
```

---

## Summary

✅ **POST** `/api/admin/laboratories` - Create new laboratory
✅ **GET** `/api/admin/laboratories` - List all laboratories
✅ **GET** `/api/admin/laboratories/:id` - Get one laboratory
✅ **PUT** `/api/admin/laboratories/:id` - Update laboratory
✅ **DELETE** `/api/admin/laboratories/:id` - Delete/Deactivate laboratory

All endpoints require **admin role** and valid **JWT token**.

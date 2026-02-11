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

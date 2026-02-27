# Water Quality Report API Documentation

The complete API consists of 54 RESTful endpoints handling everything from public crowdsourcing wizards to secure internal laboratory management.

> [!NOTE]
> **Interactive Swagger UI**
> Interactive documentation and request testing is available on the running server at:
> `http://localhost:3000/api/v1/docs`

## Base URL
```
http://localhost:3000/api/v1
```

## Authentication
All protected endpoints require a Bearer token in the Authorization header:
```
Authorization: Bearer <token>
```

---

## 🧭 Endpoint Catalog

### Core API
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| `GET` | `/health` | Health check and server status | Public |
| `GET` | `/` | API root info | Public |

### Authentication (`/auth`)
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| `POST` | `/auth/register` | Register a new user | Public |
| `POST` | `/auth/login` | Login user | Public |
| `GET` | `/auth/me` | Get current authenticated user details | Required |
| `POST` | `/auth/logout` | Logout user | Required |

### Users (`/users`)
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| `GET` | `/users/profile` | Get current user profile | Required |
| `GET` | `/users` | List all registered users | MODERATOR+ |

### Admin Dashboard (`/admin`)
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| `GET` | `/admin/dashboard` | Admin dashboard statistics | ADMIN |
| `GET` | `/admin/users` | List users with advanced analytics | ADMIN |
| `PATCH` | `/admin/users/:userId/role` | Update user system role | ADMIN |
| `PATCH` | `/admin/users/:userId/status`| Activate/Deactivate user account | ADMIN |

### Moderation System (`/moderation`)
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| `GET` | `/moderation/logs`| Get moderation audit logs (paginated) | MODERATOR+ |

### Water Sources (`/water-sources`)
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| `GET` | `/water-sources/stats` | Get water source aggregations | Public |
| `GET` | `/water-sources/nearby` | Get nearby water sources (Geospatial)| Public |
| `GET` | `/water-sources` | List water sources with filters | Public |
| `POST` | `/water-sources` | Create a new water source | Required |
| `GET` | `/water-sources/:id` | Get water source by ID | Public |
| `PATCH` | `/water-sources/:id` | Update water source details | Creator/Mod+ |
| `PATCH` | `/water-sources/:id/status`| Update operational status | Admin/Verified|
| `PATCH` | `/water-sources/:id/verify`| Verify a water source | MODERATOR+ |
| `DELETE`| `/water-sources/:id` | Soft delete water source | Creator/Mod+ |

### Public Reports Wizard (`/public-reports`)
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| `POST` | `/public-reports` | Create public report (Wizard step 1) | Public |
| `GET` | `/public-reports/by-nic/:nic` | Get reports associated with an NIC | Public |
| `GET` | `/public-reports/:id/full`| Get full report detail including metadata | Public |
| `GET` | `/public-reports/:id`| Get report draft by ID | Public |
| `PATCH` | `/public-reports/:id`| Auto-save wizard payload | Public |
| `POST` | `/public-reports/:id/submit`| Submit public report to moderators | Public |
| `POST` | `/public-reports/:id/images`| Upload report image attachments | Public |

### Public Reports Admin (`/public-reports-admin`)
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| `GET` | `/public-reports-admin` | List public reports (paginated table) | MODERATOR+ |
| `GET` | `/public-reports-admin/stats` | Report statistics widget data | MODERATOR+ |
| `GET` | `/public-reports-admin/export` | Export reports as JSON blob | MODERATOR+ |
| `POST` | `/public-reports-admin/ban` | Ban an IP or NIC | MODERATOR+ |
| `POST` | `/public-reports-admin/unban` | Unban an IP or NIC | MODERATOR+ |
| `GET` | `/public-reports-admin/:id/security` | Get security stats for report's owner | MODERATOR+ |
| `GET` | `/public-reports-admin/:id`| Get full report detail wrapper | MODERATOR+ |
| `GET` | `/public-reports-admin/:id/images/:imageId`| Stream binary image payload | MODERATOR+ |
| `PATCH` | `/public-reports-admin/:id/moderate` | Approve or reject a report | MODERATOR+ |
| `PATCH` | `/public-reports-admin/:id`| Admin override update any field | ADMIN |
| `DELETE`| `/public-reports-admin/:id`| Delete public report | ADMIN |
| `DELETE`| `/public-reports-admin/by-nic/:nic`| Delete all reports by NIC | ADMIN |
| `POST` | `/public-reports-admin/reset` | Delete ALL reports | ADMIN |

### Laboratory Staff Console (`/lab-staff`)
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| `GET` | `/lab-staff/dashboard` | Lab staff dashboard stats | LAB_STAFF+ |
| `GET` | `/lab-staff/requests` | List incoming lab test requests | LAB_STAFF+ |
| `GET` | `/lab-staff/safe-limits` | Get water quality WHO safe limits | LAB_STAFF+ |
| `GET` | `/lab-staff/requests/:id` | Get single lab test request details | LAB_STAFF+ |
| `POST` | `/lab-staff/requests/:id/accept` | Accept lab test request | LAB_STAFF+ |
| `POST` | `/lab-staff/requests/:id/reject` | Reject lab test request | LAB_STAFF+ |
| `POST` | `/lab-staff/requests/:id/schedule`| Schedule collector pickup | LAB_STAFF+ |
| `POST` | `/lab-staff/requests/:id/collect` | Record physical sample collection | LAB_STAFF+ |
| `POST` | `/lab-staff/requests/:id/start-testing`| Transition sample to in-progress | LAB_STAFF+ |
| `PUT` | `/lab-staff/requests/:id/results` | Save granular test results array | LAB_STAFF+ |
| `POST` | `/lab-staff/requests/:id/complete`| Complete testing, issue final verdict| LAB_STAFF+ |

### Laboratory Management (`/laboratories`)
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| `POST` | `/laboratories` | Provision a new laboratory entity | ADMIN |
| `GET` | `/laboratories` | List all laboratories | ADMIN |
| `GET` | `/laboratories/:id` | Get single laboratory detail wrapper | ADMIN |
| `PUT` | `/laboratories/:id` | Update laboratory settings | ADMIN |
| `DELETE`| `/laboratories/:id` | Soft delete/deactivate laboratory | ADMIN |

---

## Error Response Patterns

```json
{
  "success": false,
  "statusCode": 401,
  "message": "Invalid email or password",
  "timestamp": "2026-02-09T07:00:00.000Z"
}
```

| Code | Description |
|------|-------------|
| 400 | Bad Request - Validation failed (Joi Schema Exception) |
| 401 | Unauthorized - Authentication required or token invalid |
| 403 | Forbidden - Insufficient role permissions |
| 404 | Not Found - Resource not found |
| 409 | Conflict - Unique index constraint violation |
| 429 | Too Many Requests - 100 requests / 15-minute window |
| 500 | Internal Server Error - Unhandled exception |

## Rate Limiting
API requests are rate-limited via `express-rate-limit` to **100 requests per 15 minutes** per IP address to prevent DDOS and Brute force attacks on `/auth`.

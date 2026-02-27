# 🌊 Water Quality Report API

A RESTful API backend for a **crowdsourced water quality report system** built with Node.js, Express.js, and MongoDB.

[![Node.js](https://img.shields.io/badge/Node.js-18%2B-green)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-5.x-blue)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-brightgreen)](https://mongoosejs.com/)
[![License](https://img.shields.io/badge/License-ISC-yellow)](LICENSE)

---

## 📋 Documentation & Requirements

Full project documentation and requirements are available on Trello:

🔗 **[View Project Requirements on Trello](https://trello.com/c/dxrQ1hzY)**

---

## ✨ Features

- **Authentication** - JWT-based auth with bcrypt password hashing
- **Authorization** - Role-based access control (USER, MODERATOR, LAB_STAFF, ADMIN)
- **Lab Testing Workflow** - Full lab test lifecycle management with WHO safe limits
- **Validation** - Request validation using Joi with detailed error messages
- **Error Handling** - Centralized error handling with standardized responses
- **Logging** - Winston logger with file rotation
- **Security** - Helmet, CORS, rate limiting
- **Testing** - Jest + Supertest with 80%+ code coverage

---

## 🚀 Quick Start

### Prerequisites

- Node.js >= 18.0.0
- MongoDB instance (local or remote)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd water-backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` with your settings:
   ```env
   NODE_ENV=development
   PORT=3000
   MONGODB_URI=mongodb://localhost:27017/water_quality_db
   JWT_SECRET=your-super-secret-key
   JWT_EXPIRES_IN=7d
   ```

4. **Start the server**
   ```bash
   # Development (with hot reload)
   npm run dev
   
   # Production
   npm start
   ```

5. **Verify installation**
   ```bash
   curl http://localhost:3000/api/v1/health
   ```

---

## 📖 API Documentation

Full API documentation with all endpoints, request/response examples:

📄 **[API_DOCUMENTATION.md](./API_DOCUMENTATION.md)**

📄 **[Public Reports API Reference](./PUBLIC_REPORTS_API.md)** — Full guide for the public reports wizard, moderator, and admin APIs

### Quick Reference

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| **Core API** | | | |
| GET | `/api/v1/health` | Health check endpoint | Public |
| GET | `/api/v1/` | API root info | Public |
| **Authentication** | | | |
| POST | `/api/v1/auth/register` | Register new user | Public |
| POST | `/api/v1/auth/login` | Login user | Public |
| GET | `/api/v1/auth/me` | Get current authenticated user | Required |
| POST | `/api/v1/auth/logout` | Logout user | Required |
| **Users** | | | |
| GET | `/api/v1/users/profile` | Get current user profile | Required |
| GET | `/api/v1/users` | List all users | MODERATOR+ |
| **Admin** | | | |
| GET | `/api/v1/admin/dashboard` | Admin dashboard stats | ADMIN |
| GET | `/api/v1/admin/users` | List users with filters | ADMIN |
| PATCH | `/api/v1/admin/users/:userId/role` | Update user role | ADMIN |
| PATCH | `/api/v1/admin/users/:userId/status`| Activate/Deactivate user | ADMIN |
| **Moderation Logs** | | | |
| GET | `/api/v1/moderation/logs`| Get moderation logs (paginated) | MODERATOR+ |
| **Water Sources** | | | |
| GET | `/api/v1/water-sources/stats` | Get water source stats | Public |
| GET | `/api/v1/water-sources/nearby` | Get nearby water sources (Geo location) | Public |
| GET | `/api/v1/water-sources` | List water sources with filters | Public |
| POST | `/api/v1/water-sources` | Create a water source | Required |
| GET | `/api/v1/water-sources/:id` | Get water source by ID | Public |
| PATCH| `/api/v1/water-sources/:id` | Update water source | Creator/Mod+ |
| PATCH| `/api/v1/water-sources/:id/status`| Update operational status | Admin/Verified|
| PATCH| `/api/v1/water-sources/:id/verify`| Verify a water source | MODERATOR+ |
| DELETE| `/api/v1/water-sources/:id` | Soft delete water source | Creator/Mod+ |
| **Public Reports** | | | |
| POST | `/api/v1/public-reports` | Create public report (wizard start) | Public |
| GET | `/api/v1/public-reports/by-nic/:nic` | Get reports by NIC | Public |
| GET | `/api/v1/public-reports/:id/full`| Get full report detail | Public |
| GET | `/api/v1/public-reports/:id`| Get report by ID | Public |
| PATCH | `/api/v1/public-reports/:id`| Update report (auto-save wizard step)| Public |
| POST | `/api/v1/public-reports/:id/submit`| Submit public report | Public |
| POST | `/api/v1/public-reports/:id/images`| Upload report images (base64) | Public |
| **Public Reports Admin** | | | |
| GET | `/api/v1/public-reports-admin` | List public reports (paginated) | MODERATOR+ |
| GET | `/api/v1/public-reports-admin/stats` | Report statistics | MODERATOR+ |
| GET | `/api/v1/public-reports-admin/export` | Export reports as JSON | MODERATOR+ |
| POST | `/api/v1/public-reports-admin/ban` | Ban a specific IP or NIC | MODERATOR+ |
| POST | `/api/v1/public-reports-admin/unban` | Unban a specific IP or NIC | MODERATOR+ |
| GET | `/api/v1/public-reports-admin/:id/security` | Get security stats for report's owner | MODERATOR+ |
| GET | `/api/v1/public-reports-admin/:id`| Get full report detail | MODERATOR+ |
| GET | `/api/v1/public-reports-admin/:id/images/:imageId`| Serve binary image | MODERATOR+ |
| PATCH | `/api/v1/public-reports-admin/:id/moderate` | Approve or reject a report | MODERATOR+ |
| PATCH | `/api/v1/public-reports-admin/:id`| Admin override update any field | ADMIN |
| DELETE| `/api/v1/public-reports-admin/:id`| Delete public report | ADMIN |
| DELETE| `/api/v1/public-reports-admin/by-nic/:nic`| Delete all reports by NIC | ADMIN |
| POST | `/api/v1/public-reports-admin/reset` | Delete ALL reports | ADMIN |
| **Lab Staff** | | | |
| GET | `/api/v1/lab-staff/dashboard` | Lab staff dashboard stats | LAB_STAFF+ |
| GET | `/api/v1/lab-staff/requests` | List lab test requests | LAB_STAFF+ |
| GET | `/api/v1/lab-staff/safe-limits` | Get water quality WHO safe limits | LAB_STAFF+ |
| GET | `/api/v1/lab-staff/requests/:id` | Get single lab test request | LAB_STAFF+ |
| POST | `/api/v1/lab-staff/requests/:id/accept` | Accept lab test request | LAB_STAFF+ |
| POST | `/api/v1/lab-staff/requests/:id/reject` | Reject lab test request | LAB_STAFF+ |
| POST | `/api/v1/lab-staff/requests/:id/schedule`| Schedule sample collection | LAB_STAFF+ |
| POST | `/api/v1/lab-staff/requests/:id/collect` | Record sample collection details | LAB_STAFF+ |
| POST | `/api/v1/lab-staff/requests/:id/start-testing`| Start testing sample | LAB_STAFF+ |
| PUT | `/api/v1/lab-staff/requests/:id/results` | Input test results | LAB_STAFF+ |
| POST | `/api/v1/lab-staff/requests/:id/complete`| Complete testing, issue verdict| LAB_STAFF+ |
| **Laboratories** | | | |
| POST | `/api/v1/laboratories` | Create laboratory | ADMIN |
| GET | `/api/v1/laboratories` | List laboratories | ADMIN |
| GET | `/api/v1/laboratories/:id` | Get single laboratory | ADMIN |
| PUT | `/api/v1/laboratories/:id` | Update laboratory | ADMIN |
| DELETE| `/api/v1/laboratories/:id` | Soft delete/deactivate laboratory | ADMIN |

---

## 🧪 Testing

```bash
# Run all tests1
npm test

# Watch mode
npm run test:watch

# With coverage report
npm run test:coverage
```

**Test Coverage:** 80%+ across all modules

---

## 📁 Project Structure

```
water-backend/
├── src/
│   ├── config/          # Configuration files
│   ├── controllers/     # Route controllers
│   ├── middlewares/     # Express middlewares
│   ├── models/          # Mongoose models
│   ├── routes/          # API routes
│   ├── services/        # Business logic
│   ├── tests/           # Test files
│   ├── utils/           # Utility functions
│   ├── validations/     # Joi schemas
│   └── app.js           # Express app
├── logs/                # Log files
├── .env.example         # Environment template
├── API_DOCUMENTATION.md # API docs
├── jest.config.js       # Jest config
├── package.json
└── server.js            # Entry point
```

---

## 🔐 User Roles

| Role | Description |
|------|-------------|
| `USER` | Standard user with basic access |
| `MODERATOR` | Can view all users and moderate content |
| `LAB_STAFF` | Laboratory staff - manage test requests, input results, issue verdicts |
| `ADMIN` | Full access to all endpoints |

---

## 📜 Scripts

| Script | Description |
|--------|-------------|
| `npm start` | Start production server |
| `npm run dev` | Start development server with hot reload |
| `npm test` | Run test suite |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:coverage` | Run tests with coverage report |

---

## 🛡️ Security Features

- **Helmet** - Secure HTTP headers
- **CORS** - Cross-origin resource sharing
- **Rate Limiting** - 100 requests per 15 minutes
- **Password Hashing** - bcrypt with 12 salt rounds
- **JWT Tokens** - Secure authentication tokens

---

## 📝 License

This project is licensed under the ISC License.


80% backend completed 2-27-2026 9:56 PM

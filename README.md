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
- **Authorization** - Role-based access control (USER, MODERATOR, ADMIN)
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

### Quick Reference

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/v1/health` | Health check | Public |
| POST | `/api/v1/auth/register` | Register user | Public |
| POST | `/api/v1/auth/login` | Login user | Public |
| GET | `/api/v1/auth/me` | Get profile | Required |
| GET | `/api/v1/users/profile` | Get profile | Required |
| GET | `/api/v1/users` | List users | MODERATOR+ |
| GET | `/api/v1/admin/dashboard` | Admin stats | ADMIN |
| PATCH | `/api/v1/admin/users/:id/role` | Update role | ADMIN |

---

## 🧪 Testing

```bash
# Run all tests
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

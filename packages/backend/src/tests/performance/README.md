# Water Source Performance Testing

This folder contains Artillery scenarios for load testing the water inventory APIs.

## Prerequisites

1. Start the backend API server on `http://localhost:3000`
2. Ensure MongoDB is reachable by the backend

## Run tests

- Basic run:

```bash
npm run test:performance
```

- Generate JSON + HTML report:

```bash
npm run test:performance:report
```

## Current scenario coverage

- `POST /api/v1/auth/register`
- `POST /api/v1/water-sources`
- `GET /api/v1/water-sources`
- `GET /api/v1/water-sources/mine`

# weather-api-v2

React/Vite frontend with a portfolio-style layout and an AWS serverless backend foundation.

## MVP scope

- Weather lookup and forecast views
- Route turbulence risk scoring endpoint
- Saved locations by authenticated user

## Repository layout

```text
frontend/      React + Vite client
backend/       API implementation
infra/cdk/     AWS CDK (API Gateway + Lambda + DynamoDB + Cognito)
```

## Frontend

```bash
cd frontend
npm install
npm run dev
```

## CDK infrastructure

```bash
cd infra/cdk
npm install
npm run bootstrap
npm run deploy
```

## Planned API routes

- `POST /api/routes/risk`
- `GET /api/locations`
- `POST /api/locations`
- `DELETE /api/locations/:id`

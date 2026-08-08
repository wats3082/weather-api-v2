# weather-api-v2

React/Vite frontend with an AWS CDK-managed serverless backend.

## MVP scope

- Weather lookup and forecast views
- Route turbulence risk scoring endpoint
- Saved locations by authenticated user
- DynamoDB-backed TTL cache for geocoding, current weather, and forecasts

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

Set `OPENWEATHER_API_KEY` before deploying. The stack provisions API Gateway, Lambda handlers, a DynamoDB table used for cache and saved locations, and a Cognito user pool for protected locations routes.

## API routes

- `GET /api/weather/:city`
- `GET /api/forecast/:city?days=1`
- `POST /api/turbulence/predict`
- `GET /api/locations` (Cognito auth required)
- `POST /api/locations` (Cognito auth required)
- `DELETE /api/locations/:id` (Cognito auth required)

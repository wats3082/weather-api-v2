# Weather API v2

A serverless weather and turbulence forecasting API with a React frontend.

**Live frontend**: [GitHub Pages](https://wats3082.github.io/weather-api-v2)  
**API**: AWS Lambda + API Gateway (see [DEPLOYMENT.md](./DEPLOYMENT.md) for endpoints)

## Features

- **Weather lookup**: Current conditions and 5-day forecasts via OpenWeatherMap
- **Turbulence risk scoring**: Predicts aviation turbulence based on surface weather heuristics
- **Route tracking**: Search between cities, see weather along the route
- **Saved locations**: Bookmark favorite cities (requires Cognito authentication)
- **DynamoDB cache**: Reduces OpenWeatherMap API load with TTL expiration

## Tech stack

- **Frontend**: React 18 + Vite + Tailwind CSS
- **Backend**: Express.js + TypeScript (Lambda entry points)
- **Infrastructure**: AWS CDK (API Gateway, Lambda, DynamoDB, Cognito)
- **Cache**: In-memory + DynamoDB TTL
- **Data source**: OpenWeatherMap Geocoding/Current/Forecast APIs

## Getting started

### Local development (no AWS required)

Frontend + backend server:
```bash
npm install

# Terminal 1: Frontend
npm run dev --prefix frontend

# Terminal 2: Backend (Express adapter for local testing)
npm run dev --prefix backend
```

Opens http://localhost:5173. Backend API at http://localhost:3000/api.

### Production deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for step-by-step AWS Lambda deployment and GitHub Pages setup.

## API specification

All endpoints return JSON. See request/response examples in `backend/src/handlers/`.

### Weather endpoints (unauthenticated)

| Method | Path | Query | Auth | Notes |
|--------|------|-------|------|-------|
| GET | `/api/weather/:city` | — | None | Current conditions; cached 10 min |
| GET | `/api/forecast/:city` | `days=1-5` | None | Forecast; cached 30 min |

**Example**:
```bash
curl http://localhost:3000/api/weather/Chicago
```

### Turbulence endpoint

| Method | Path | Body | Auth | Notes |
|--------|------|------|------|-------|
| POST | `/api/turbulence/predict` | `{from,to,altitude}` | None | Risk score + details; cached 1 hour |

**Request**:
```json
{
  "from": "Los Angeles",
  "to": "New York",
  "altitude": 35000
}
```

**Response**:
```json
{
  "from": "Los Angeles",
  "to": "New York",
  "altitude": 35000,
  "overallRisk": 0.45,
  "factors": {
    "clearAirTurbulence": 0.3,
    "jetStreamProximity": 0.6,
    "convectiveAvailable": 0.2,
    "gravityWaves": 0.4,
    "windShear": 0.5
  },
  "explanation": "Moderate risk due to jet stream proximity..."
}
```

### Locations endpoints (authenticated with Cognito)

| Method | Path | Auth | Notes |
|--------|------|------|-------|
| GET | `/api/locations` | Cognito | List user's saved cities |
| POST | `/api/locations` | Cognito | Save a city; body: `{city,label}` |
| DELETE | `/api/locations/:id` | Cognito | Remove saved city |

## Testing

Run backend unit tests:
```bash
npm run test --prefix backend
```

Coverage includes `TurbulencePredictionEngine` and cache TTL logic.

## Input validation

All handler inputs are validated with [Zod](https://zod.dev):

- `city` strings: 1–100 chars (alphanumeric + spaces, hyphens, commas)
- `days` forecast: 1–5 (default 1)
- `altitude` turbulence: 5,000–50,000 ft

Invalid inputs return `400 Bad Request` with error details.

## Caching strategy

| Resource | Cache | TTL | Key |
|----------|-------|-----|-----|
| Geocoding | DynamoDB + in-memory | 24 hours | Normalized city name |
| Current weather | In-memory | 10 min | Lat/lon pair |
| Forecast | In-memory | 30 min | Lat/lon + days |
| Locations (saved) | DynamoDB | — | User ID + city |

In-memory cache enables local dev without AWS credentials. Production uses DynamoDB backing.

## CI/CD

GitHub Actions workflow (`.github/workflows/deploy.yml`):
1. Runs backend tests and TypeScript typecheck
2. Validates CDK synthesis
3. Builds frontend
4. Deploys frontend to GitHub Pages

Requires:
- OpenWeatherMap API key (in GitHub Actions secrets)
- AWS credentials (for CDK deploy job, not yet CI-integrated)

## Repository layout

```
frontend/
  src/
    components/     React UI components
    App.tsx         Main app (weather lookup, turbulence, saved locations)
    vite-env.d.ts   Vite env type definitions
  
backend/
  src/
    services/       Cache, OpenWeather, auth, HTTP client
    handlers/       Lambda entry points (weather, turbulence, locations)
    lib/            Utilities (validation schemas, turbulence engine)
    index.ts        Express adapter for local dev
  __tests__/        Unit tests (Jest)
  
infra/cdk/
  lib/              AWS CDK stack definition
  bin/              CDK app entry point
  cdk.json          CDK config
```

## Turbulence prediction algorithm

The heuristic model scores 5 meteorological factors (0–1 scale):

1. **Clear-air turbulence (CAT)**: Wind shear magnitude
2. **Jet stream proximity**: Distance to / intersection with jet core
3. **Convective available potential (CAPE)**: Atmospheric instability energy
4. **Gravity waves**: Lee-side oscillations from terrain
5. **Wind shear**: Vertical + horizontal wind change

**Overall risk** = mean of all factors (0 = smooth, 1 = severe)

⚠️ **Disclaimer**: This is a demonstration heuristic. For aviation operations, use official NOAA/FAA turbulence products and PIREPs.

## Architecture decisions

### Why CDK + Lambda instead of Serverless Framework?

CDK is the single source of truth for all AWS resources (API Gateway, Lambda, DynamoDB, Cognito), eliminating split IaC and duplication. Serverless Framework was removed.

### Why GitHub Pages?

Free hosting with GitHub-native CI/CD and CORS-friendly cross-origin calls to API Gateway.

### Why DynamoDB?

Pay-per-request billing scales to zero traffic cost, TTL auto-cleanup removes stale cache entries, and it's AWS-native (no extra services).

## Known limitations

- **Flight tracking**: "Route tracking" currently requires free-text city names (e.g., "Los Angeles" to "New York"). Real flight number / scheduled-flight lookup is not implemented (would require OpenSky Network or FlightAware integration).
- **Real aviation weather**: Turbulence prediction uses surface weather heuristics only. Real aviation hazards (SIGMET, PIREP, turbulence/icing forecasts) are not integrated.
- **Cognito frontend auth**: Locations API is protected but the frontend sign-in UI is not yet implemented. Local dev uses `x-user-id` header fallback.

## Next steps (future work)

- [ ] Add Cognito sign-in UI to frontend (AWS Amplify Auth)
- [ ] Integrate real aviation weather (NOAA Aviation Weather Center API)
- [ ] Add flight number tracking (OpenSky Network or AviationStack)
- [ ] Enhanced geocoding disambiguation (state/country hints, airport codes)
- [ ] Rate limiting at API Gateway (usage plans)
- [ ] Error tracking (Sentry integration)
- [ ] Automated API load tests

## License

MIT (see LICENSE file if present)

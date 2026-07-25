# Weather API v2 - Turbulence Prediction System

A modern weather application with advanced turbulence prediction for flight routes. Features real-time weather data, route analysis, and AI-powered turbulence forecasting.

## Features

- **Route-Based Weather**: Enter departure and destination cities to get weather analysis along the flight path
- **Turbulence Prediction**: Advanced algorithm that predicts turbulence severity using:
  - Wind shear data from multiple altitudes
  - Jet stream positioning and intensity
  - Atmospheric instability indices (CAPE, wind shear)
  - Convective activity and weather patterns
- **Interactive Map Display**: Visual representation of turbulence zones along routes
- **Real-Time Updates**: Current conditions and 7-day forecasts
- **Detailed Metrics**: Temperature, humidity, pressure, wind speed/direction, visibility

## Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast builds
- **Tailwind CSS** for styling
- **Leaflet/Mapbox** for map visualization

### Backend
- **AWS Lambda** for serverless computing
- **AWS API Gateway** for REST endpoints
- **AWS DynamoDB** for caching weather data
- **Express.js** (optional for local development)
- **Node.js + TypeScript**

## Project Structure

```
weather-api-v2/
├── frontend/              # React + Vite application
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── pages/         # Page components
│   │   ├── services/      # API services
│   │   ├── utils/         # Utility functions
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── package.json
│   └── vite.config.ts
└── backend/               # AWS Lambda backend
    ├── src/
    │   ├── handlers/      # Lambda handlers
    │   ├── services/      # Business logic
    │   ├── utils/         # Helper functions
    │   └── types/         # TypeScript types
    ├── package.json
    └── serverless.yml
```

## Installation & Setup

### Prerequisites
- Node.js 16+ and npm
- AWS CLI configured with credentials
- Serverless Framework (for deployment)

### Local Development

```bash
# Install dependencies
npm install
npm install --prefix frontend
npm install --prefix backend

# Run both frontend and backend
npm run dev

# Or run separately
npm run frontend:dev  # Vite dev server
npm run backend:dev   # Express server
```

### Environment Variables

Create `.env` files:

**frontend/.env**
```
VITE_API_URL=http://localhost:3001
```

**backend/.env**
```
OPENWEATHER_API_KEY=your_key_here
AWS_REGION=us-east-1
```

### Deployment

```bash
# Deploy to AWS
npm run backend:deploy

# Update frontend URL to AWS API Gateway endpoint
# Deploy frontend to S3 + CloudFront
```

## API Endpoints

### Current Weather
```
GET /api/weather/:city
```

### Route Turbulence Prediction
```
POST /api/turbulence/predict
{
  "from": "Los Angeles",
  "to": "New York",
  "altitude": 35000,
  "time": "2024-01-15T10:00:00Z"
}
```

### Forecast
```
GET /api/forecast/:city?days=7
```

## Turbulence Prediction Algorithm

The turbulence prediction engine analyzes multiple meteorological factors:

1. **Wind Shear Analysis** - Calculates vertical wind speed changes
2. **Jet Stream Detection** - Identifies high-speed wind corridors
3. **Atmospheric Instability** - Uses CAPE and other indices
4. **Convection Detection** - Identifies thunderstorm zones
5. **Gravity Waves** - Predicts mountain wave turbulence
6. **Clear Air Turbulence (CAT)** - Models jet-related turbulence

Returns a turbulence score (0-10) and risk level (Low/Medium/High/Severe)

## Contributing

Contributions welcome! Please follow the existing code style and add tests for new features.

## License

MIT

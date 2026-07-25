# Weather API v2 - Getting Started

## Prerequisites

- Node.js 18+ and npm
- OpenWeather API key (free tier available at https://openweathermap.org/api)
- AWS account (for deployment only)

## Quick Start - Local Development

### 1. Get an OpenWeather API Key

1. Go to https://openweathermap.org/api
2. Sign up for a free account
3. Copy your API key

### 2. Setup Environment Variables

**Backend** - Create `backend/.env`:
```
OPENWEATHER_API_KEY=your_key_here
PORT=3001
NODE_ENV=development
```

**Frontend** - Create `frontend/.env`:
```
VITE_API_URL=http://localhost:3001
```

### 3. Install Dependencies

```bash
npm install
npm install --prefix frontend
npm install --prefix backend
```

### 4. Run Locally

```bash
# Run both frontend and backend (from root)
npm run dev

# Or run them separately:
npm run frontend:dev   # Terminal 1 - http://localhost:5173
npm run backend:dev    # Terminal 2 - http://localhost:3001
```

### 5. Use the Application

- Open http://localhost:5173 in your browser
- Enter departure and destination cities
- Select cruise altitude (10,000 - 43,000 ft)
- Click "Analyze Route" to get turbulence prediction

## Features in Action

### Turbulence Prediction
- **Wind Shear Analysis**: Detects rapid wind speed changes at different altitudes
- **Jet Stream Detection**: Identifies high-speed wind corridors (typical threshold: 50+ knots)
- **Convection Detection**: Analyzes cloud cover, humidity, and temperature for storm potential
- **Gravity Waves**: Predicts mountain wave turbulence
- **Clear Air Turbulence (CAT)**: Models jet-related turbulence potential

### Turbulence Risk Levels
- **LOW** (0-2): Smooth flying, minimal turbulence expected
- **MEDIUM** (2-4): Light to moderate turbulence, minor course adjustments possible
- **HIGH** (4-7): Significant turbulence, altitude changes recommended
- **SEVERE** (7-10): Strong turbulence, consider rerouting or delay

## Deployment to AWS

### 1. Install Serverless Framework

```bash
npm install -g serverless
```

### 2. Configure AWS Credentials

```bash
aws configure
# Enter your AWS Access Key ID, Secret Access Key, region (us-east-1)
```

### 3. Set Environment Variables

```bash
export OPENWEATHER_API_KEY=your_key_here
```

### 4. Deploy Backend

```bash
cd backend
npm run deploy
```

This will:
- Package your Lambda functions
- Create API Gateway endpoints
- Deploy to AWS
- Output your API URL

### 5. Update Frontend

Update `frontend/.env` with the API Gateway endpoint from step 4:
```
VITE_API_URL=https://your-api-id.execute-api.us-east-1.amazonaws.com
```

### 6. Deploy Frontend

```bash
cd frontend
npm run build

# Upload to S3 and CloudFront (manual steps):
# 1. Create S3 bucket
# 2. Upload dist/ folder contents
# 3. Create CloudFront distribution pointing to S3
```

## API Endpoints

### Turbulence Prediction
```
POST /api/turbulence/predict
Content-Type: application/json

{
  "from": "Los Angeles",
  "to": "New York",
  "altitude": 35000
}

Response:
{
  "from": "Los Angeles",
  "to": "New York",
  "altitude": 35000,
  "distance": 2451,
  "flightTime": "5.4",
  "turbulenceScore": 3.2,
  "riskLevel": "MEDIUM",
  "riskFactors": [...],
  "recommendation": "...",
  "waypoints": [...]
}
```

### Current Weather
```
GET /api/weather/Chicago

Response:
{
  "city": "Chicago",
  "temperature": 45,
  "condition": "Cloudy",
  "humidity": 65,
  "windSpeed": 12,
  "pressure": 1013,
  "visibility": 10,
  "cloudCover": 75
}
```

### Forecast
```
GET /api/forecast/New%20York?days=7

Response:
{
  "city": "New York",
  "days": 7,
  "forecast": [...]
}
```

## Troubleshooting

### No results showing
- Check API key is correct
- Ensure city names are spelled correctly
- Check browser console for errors

### CORS errors
- Make sure backend is running on port 3001
- Check `VITE_API_URL` in frontend .env

### Build errors
- Delete `node_modules` and `.next` (if exists)
- Run `npm install` again
- Check Node.js version (should be 18+)

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    React Frontend                        │
│              (Vite + Tailwind CSS)                      │
│           http://localhost:5173                         │
└────────────────────┬────────────────────────────────────┘
                     │ Fetch /api/...
                     ▼
┌─────────────────────────────────────────────────────────┐
│                   Express Backend                        │
│            (Local dev: http://localhost:3001)            │
│         (Prod: AWS Lambda + API Gateway)                │
├─────────────────────────────────────────────────────────┤
│          Turbulence Prediction Engine                    │
│  - Wind shear analysis                                   │
│  - Jet stream detection                                  │
│  - Convection modeling                                   │
│  - CAT prediction                                        │
└────────┬──────────────────────────────────────┬──────────┘
         │ Call OpenWeather API                  │ DynamoDB
         ▼                                       ▼
    [OpenWeather]                          [Cache]
```

## Support & Contributing

For issues or feature requests, open an issue on GitHub.

## License

MIT

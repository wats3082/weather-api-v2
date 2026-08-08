import { APIGatewayProxyHandler } from 'aws-lambda'
import { TurbulencePredictionEngine } from '../services/turbulencePrediction'
import { TurbulencePredictSchema } from '../lib/validation'

const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
}

export const predict: APIGatewayProxyHandler = async (event) => {
  try {
    if (!event.body) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Request body required' }),
      }
    }

    const parsed = TurbulencePredictSchema.safeParse(JSON.parse(event.body))
    if (!parsed.success) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: parsed.error.issues[0].message }),
      }
    }

    const { from, to, altitude } = parsed.data

    const apiKey = process.env.OPENWEATHER_API_KEY
    if (!apiKey) {
      throw new Error('OpenWeather API key not configured')
    }

    const engine = new TurbulencePredictionEngine(apiKey)

    // Get coordinates for both cities
    const [fromCoords, toCoords] = await Promise.all([
      engine.getCoordinates(from),
      engine.getCoordinates(to),
    ])

    // Calculate distance (Haversine formula)
    const distance = calculateDistance(fromCoords.lat, fromCoords.lon, toCoords.lat, toCoords.lon)
    const flightTime = (distance / 450).toFixed(1) // Assume average cruise speed of 450 knots

    // Get turbulence prediction
    const turbulenceData = await engine.predictTurbulence(from, to, altitude)

    // Get weather at waypoints
    const waypoints = []
    for (let i = 0; i <= 3; i++) {
      const fraction = i / 3
      const lat = fromCoords.lat + (toCoords.lat - fromCoords.lat) * fraction
      const lon = fromCoords.lon + (toCoords.lon - fromCoords.lon) * fraction

      try {
        const weather = await engine.getWeatherData(lat, lon)
        waypoints.push({
          city: fraction === 0 ? from : fraction === 1 ? to : `Waypoint ${i}`,
          lat,
          lon,
          weather: {
            temp: Math.round(weather.temp),
            condition: weather.condition,
            windSpeed: Math.round(weather.windSpeed),
            humidity: weather.humidity,
          },
          turbulence: {
            level: turbulenceData.riskLevel,
          },
        })
      } catch (e) {
        console.error('Error getting waypoint data:', e)
      }
    }

    const response = {
      from,
      to,
      altitude,
      distance: Math.round(distance),
      flightTime,
      maxWindSpeed: Math.round(Math.max(...waypoints.map((w) => w.weather.windSpeed || 0))),
      overallRisk: turbulenceData.riskLevel,
      ...turbulenceData,
      waypoints,
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify(response),
    }
  } catch (error) {
    console.error('Turbulence prediction error:', error)
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ error: (error as Error).message }),
    }
  }
}

/**
 * Calculate distance between two coordinates using Haversine formula
 */
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3959 // Earth's radius in miles
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

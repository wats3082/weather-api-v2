import { APIGatewayProxyHandler } from 'aws-lambda'
import { z } from 'zod'
import { getCurrentWeatherByCity, getForecast as fetchForecast } from '../services/openMeteo'
import { CityQuerySchema, ForecastQuerySchema } from '../lib/validation'

const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
}

export const getCurrent: APIGatewayProxyHandler = async (event) => {
  try {
    const city = event.pathParameters?.city
    const parsed = CityQuerySchema.safeParse({ city })
    if (!parsed.success) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: parsed.error.issues[0].message }),
      }
    }

    const weather = await getCurrentWeatherByCity(parsed.data.city)

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(weather),
    }
  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: (error as Error).message }),
    }
  }
}

export const getForecast: APIGatewayProxyHandler = async (event) => {
  try {
    const city = event.pathParameters?.city
    const days = event.queryStringParameters?.days

    const parsed = ForecastQuerySchema.safeParse({ city, days })
    if (!parsed.success) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: parsed.error.issues[0].message }),
      }
    }

    const forecast = await fetchForecast(parsed.data.city, parsed.data.days)

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        city: parsed.data.city,
        days: parsed.data.days,
        forecast,
      }),
    }
  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: (error as Error).message }),
    }
  }
}

import { APIGatewayProxyHandler } from 'aws-lambda'
import { getCurrentWeatherByCity, getForecast as fetchForecast } from '../services/openWeather'

export const getCurrent: APIGatewayProxyHandler = async (event) => {
  try {
    const city = event.pathParameters?.city

    if (!city) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({ error: 'City parameter required' }),
      }
    }

    const weather = await getCurrentWeatherByCity(city)

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify(weather),
    }
  } catch (error) {
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

export const getForecast: APIGatewayProxyHandler = async (event) => {
  try {
    const city = event.pathParameters?.city
    const days = event.queryStringParameters?.days || '7'

    if (!city) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({ error: 'City parameter required' }),
      }
    }

    const dayCount = Number.parseInt(days, 10)
    const forecast = await fetchForecast(city, dayCount)

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        city,
        days: dayCount,
        forecast,
      }),
    }
  } catch (error) {
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

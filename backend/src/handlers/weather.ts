import { APIGatewayProxyHandler } from 'aws-lambda'
import axios from 'axios'

interface CurrentWeatherRequest {
  city: string
}

interface WeatherResponse {
  city: string
  temperature: number
  condition: string
  humidity: number
  windSpeed: number
  pressure: number
  visibility: number
  cloudCover: number
}

const getWeatherData = async (city: string): Promise<WeatherResponse> => {
  const apiKey = process.env.OPENWEATHER_API_KEY
  if (!apiKey) throw new Error('API key not configured')

  try {
    const response = await axios.get('https://api.openweathermap.org/data/2.5/weather', {
      params: {
        q: city,
        appid: apiKey,
        units: 'imperial',
      },
    })

    const data = response.data
    return {
      city: data.name,
      temperature: data.main.temp,
      condition: data.weather[0].main,
      humidity: data.main.humidity,
      windSpeed: data.wind.speed,
      pressure: data.main.pressure,
      visibility: data.visibility / 1000,
      cloudCover: data.clouds.all,
    }
  } catch (error) {
    throw new Error(`Failed to fetch weather for ${city}`)
  }
}

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

    const weather = await getWeatherData(city)

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

    const apiKey = process.env.OPENWEATHER_API_KEY
    if (!apiKey) throw new Error('API key not configured')

    // Get coordinates first
    const geoResponse = await axios.get('https://api.openweathermap.org/data/2.5/weather', {
      params: {
        q: city,
        appid: apiKey,
      },
    })

    const { lat, lon } = geoResponse.data.coord

    // Get forecast
    const forecastResponse = await axios.get('https://api.openweathermap.org/data/2.5/forecast', {
      params: {
        lat,
        lon,
        appid: apiKey,
        units: 'imperial',
      },
    })

    const forecast = forecastResponse.data.list.slice(0, parseInt(days) * 8).map((item: any) => ({
      time: item.dt_txt,
      temperature: item.main.temp,
      condition: item.weather[0].main,
      humidity: item.main.humidity,
      windSpeed: item.wind.speed,
      cloudCover: item.clouds.all,
    }))

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        city,
        days: parseInt(days),
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

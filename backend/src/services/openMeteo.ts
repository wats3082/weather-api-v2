import { getCached, setCached } from './cache'
import { http } from './http'

export interface Coordinates {
  lat: number
  lon: number
  name: string
  country: string
  admin1?: string
}

export interface CurrentWeather {
  city: string
  temperature: number
  condition: string
  humidity: number
  windSpeed: number
  pressure: number
  visibility: number
  cloudCover: number
  lat: number
  lon: number
}

export interface ForecastItem {
  time: string
  temperature: number
  condition: string
  humidity: number
  windSpeed: number
  cloudCover: number
}

const norm = (v: string) => v.trim().toLowerCase()
const coordKey = ({ lat, lon }: { lat: number; lon: number }) => `${lat.toFixed(4)},${lon.toFixed(4)}`

function weatherCodeToCondition(code: number): string {
  if (code === 0) return 'Clear'
  if ([1, 2, 3].includes(code)) return 'Clouds'
  if ([45, 48].includes(code)) return 'Fog'
  if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return 'Rain'
  if ([71, 73, 75, 77, 85, 86].includes(code)) return 'Snow'
  if ([95, 96, 99].includes(code)) return 'Thunderstorm'
  return 'Unknown'
}

function visibilityKmFromMeters(v?: number): number {
  if (typeof v !== 'number') return 0
  return Math.round((v / 1000) * 10) / 10
}

function pressureFromWeatherCode(current: any): number {
  return typeof current?.surface_pressure === 'number' ? Math.round(current.surface_pressure) : 0
}

export async function getCoordinates(city: string): Promise<Coordinates> {
  const key = norm(city)
  const cached = await getCached<Coordinates>('geo', key)
  if (cached) return cached

  const res = await http.get('https://geocoding-api.open-meteo.com/v1/search', {
    params: {
      name: city,
      count: 1,
      language: 'en',
      format: 'json',
    },
  })

  const match = res.data?.results?.[0]
  if (!match) throw new Error(`No geocoding result for "${city}"`)

  const value = {
    lat: match.latitude,
    lon: match.longitude,
    name: match.name,
    country: match.country,
    admin1: match.admin1,
  }
  await setCached('geo', key, value, 86400)
  return value
}

export async function getCurrentWeatherByCity(city: string): Promise<CurrentWeather> {
  const coords = await getCoordinates(city)
  return getCurrentWeatherByCoords(coords, city)
}

export async function getCurrentWeatherByCoords(
  coords: { lat: number; lon: number },
  fallbackCity?: string
): Promise<CurrentWeather> {
  const key = coordKey(coords)
  const cached = await getCached<CurrentWeather>('weather', key)
  if (cached) return cached

  const res = await http.get('https://api.open-meteo.com/v1/forecast', {
    params: {
      latitude: coords.lat,
      longitude: coords.lon,
      current:
        'temperature_2m,relative_humidity_2m,weather_code,pressure_msl,surface_pressure,cloud_cover,wind_speed_10m,visibility',
      timezone: 'auto',
    },
  })

  const current = res.data?.current
  if (!current) throw new Error('Open-Meteo current weather response missing current data')

  const value: CurrentWeather = {
    city: fallbackCity || `${coords.lat.toFixed(2)},${coords.lon.toFixed(2)}`,
    temperature: current.temperature_2m,
    condition: weatherCodeToCondition(current.weather_code),
    humidity: current.relative_humidity_2m,
    windSpeed: current.wind_speed_10m,
    pressure: pressureFromWeatherCode(current),
    visibility: visibilityKmFromMeters(current.visibility),
    cloudCover: current.cloud_cover ?? 0,
    lat: coords.lat,
    lon: coords.lon,
  }

  await setCached('weather', key, value, 600)
  return value
}

export async function getForecast(city: string, days: number): Promise<ForecastItem[]> {
  const coords = await getCoordinates(city)
  const key = `${coordKey(coords)}:${days}`
  const cached = await getCached<ForecastItem[]>('forecast', key)
  if (cached) return cached

  const res = await http.get('https://api.open-meteo.com/v1/forecast', {
    params: {
      latitude: coords.lat,
      longitude: coords.lon,
      hourly:
        'temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,cloud_cover',
      forecast_days: Math.max(1, Math.min(5, days)),
      timezone: 'auto',
    },
  })

  const hourly = res.data?.hourly
  if (!hourly?.time?.length) throw new Error('Open-Meteo forecast response missing hourly data')

  const value = hourly.time.slice(0, days * 24).map((time: string, idx: number) => ({
    time,
    temperature: hourly.temperature_2m[idx],
    condition: weatherCodeToCondition(hourly.weather_code[idx]),
    humidity: hourly.relative_humidity_2m[idx],
    windSpeed: hourly.wind_speed_10m[idx],
    cloudCover: hourly.cloud_cover[idx],
  }))

  await setCached('forecast', key, value, 1800)
  return value
}

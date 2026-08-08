import { getCached, setCached } from './cache'
import { http } from './http'

export interface Coordinates {
  lat: number
  lon: number
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

const apiKey = () => {
  const key = process.env.OPENWEATHER_API_KEY
  if (!key) throw new Error('API key not configured')
  return key
}

const norm = (v: string) => v.trim().toLowerCase()
const coordKey = ({ lat, lon }: Coordinates) => `${lat.toFixed(4)},${lon.toFixed(4)}`

export async function getCoordinates(city: string): Promise<Coordinates> {
  const key = norm(city)
  const cached = await getCached<Coordinates>('geo', key)
  if (cached) return cached

  const res = await http.get('https://api.openweathermap.org/geo/1.0/direct', {
    params: {
      q: city,
      limit: 1,
      appid: apiKey(),
    },
  })

  const match = res.data?.[0]
  if (!match) throw new Error(`Failed to get coordinates for ${city}`)

  const value = { lat: match.lat, lon: match.lon }
  await setCached('geo', key, value, 86400)
  return value
}

export async function getCurrentWeatherByCity(city: string): Promise<CurrentWeather> {
  const coords = await getCoordinates(city)
  return getCurrentWeatherByCoords(coords, city)
}

export async function getCurrentWeatherByCoords(
  coords: Coordinates,
  fallbackCity?: string
): Promise<CurrentWeather> {
  const key = coordKey(coords)
  const cached = await getCached<CurrentWeather>('weather', key)
  if (cached) return cached

  const res = await http.get('https://api.openweathermap.org/data/2.5/weather', {
    params: {
      lat: coords.lat,
      lon: coords.lon,
      appid: apiKey(),
      units: 'imperial',
    },
  })

  const data = res.data
  const value: CurrentWeather = {
    city: data.name || fallbackCity || key,
    temperature: data.main.temp,
    condition: data.weather[0].main,
    humidity: data.main.humidity,
    windSpeed: data.wind.speed,
    pressure: data.main.pressure,
    visibility: data.visibility / 1000,
    cloudCover: data.clouds.all,
    lat: data.coord.lat,
    lon: data.coord.lon,
  }

  await setCached('weather', key, value, 600)
  return value
}

export async function getForecast(city: string, days: number): Promise<ForecastItem[]> {
  const coords = await getCoordinates(city)
  const key = `${coordKey(coords)}:${days}`
  const cached = await getCached<ForecastItem[]>('forecast', key)
  if (cached) return cached

  const res = await http.get('https://api.openweathermap.org/data/2.5/forecast', {
    params: {
      lat: coords.lat,
      lon: coords.lon,
      appid: apiKey(),
      units: 'imperial',
    },
  })

  const value = res.data.list.slice(0, days * 8).map((item: any) => ({
    time: item.dt_txt,
    temperature: item.main.temp,
    condition: item.weather[0].main,
    humidity: item.main.humidity,
    windSpeed: item.wind.speed,
    cloudCover: item.clouds.all,
  }))

  await setCached('forecast', key, value, 1800)
  return value
}

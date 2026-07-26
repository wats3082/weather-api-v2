import { useState } from 'react'
import RouteSearch from './components/RouteSearch'
import TurbulenceDisplay from './components/TurbulenceDisplay'
import WeatherCard from './components/WeatherCard'
import './App.css'

type AppMode = 'local-weather' | 'turbulence'

interface CityWeather {
  city: string
  temperature: number
  condition: string
  humidity: number
  windSpeed: number
  pressure: number
  visibility: number
  cloudCover: number
}

interface ForecastItem {
  time: string
  temperature: number
  condition: string
  humidity: number
  windSpeed: number
  cloudCover: number
}

interface ForecastResponse {
  city: string
  days: number
  forecast: ForecastItem[]
}

interface Waypoint {
  city: string
  weather: {
    temp: number
    condition: string
    windSpeed: number
  }
  turbulence: {
    level: string
  }
}

interface TurbulenceResponse {
  from: string
  to: string
  altitude: number
  distance: number
  flightTime: string
  maxWindSpeed: number
  overallRisk: string
  turbulenceScore: number
  recommendation: string
  riskFactors: string[]
  waypoints: Waypoint[]
}

const apiBase = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '')
const apiUrl = (path: string) => (apiBase ? `${apiBase}${path}` : path)
const mockConditions = ['Clear', 'Clouds', 'Rain', 'Mist']
const mockRisks = ['LOW', 'MEDIUM', 'HIGH', 'SEVERE'] as const

function hashSeed(input: string): number {
  return input.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0)
}

function mockCityWeather(city: string): CityWeather {
  const seed = hashSeed(city.toLowerCase())
  return {
    city,
    temperature: 58 + (seed % 35),
    condition: mockConditions[seed % mockConditions.length],
    humidity: 35 + (seed % 55),
    windSpeed: 6 + (seed % 24),
    pressure: 995 + (seed % 25),
    visibility: 6 + (seed % 8),
    cloudCover: seed % 100,
  }
}

function mockForecast(city: string): ForecastResponse {
  const base = hashSeed(city.toLowerCase())
  const now = Date.now()
  return {
    city,
    days: 1,
    forecast: Array.from({ length: 8 }, (_, idx) => ({
      time: new Date(now + idx * 3 * 60 * 60 * 1000).toISOString(),
      temperature: 56 + ((base + idx * 3) % 34),
      condition: mockConditions[(base + idx) % mockConditions.length],
      humidity: 40 + ((base + idx * 5) % 50),
      windSpeed: 8 + ((base + idx * 2) % 22),
      cloudCover: (base + idx * 11) % 100,
    })),
  }
}

function mockRouteData(from: string, to: string, altitude: number): TurbulenceResponse {
  const base = hashSeed(`${from}-${to}-${altitude}`)
  const turbulenceScore = Number(((base % 90) / 10 + 1).toFixed(1))
  const overallRisk = mockRisks[Math.min(3, Math.floor(turbulenceScore / 2.6))]
  const waypoints: Waypoint[] = [
    from,
    `${from} waypoint`,
    `${to} waypoint`,
    to,
  ].map((city, idx) => {
    const w = mockCityWeather(city)
    const risk = mockRisks[Math.min(3, Math.floor((turbulenceScore + idx) / 3))]
    return {
      city,
      weather: {
        temp: Math.round(w.temperature),
        condition: w.condition,
        windSpeed: Math.round(w.windSpeed),
      },
      turbulence: {
        level: risk,
      },
    }
  })

  return {
    from,
    to,
    altitude,
    distance: 420 + (base % 2200),
    flightTime: ((420 + (base % 2200)) / 450).toFixed(1),
    maxWindSpeed: Math.max(...waypoints.map((wp) => wp.weather.windSpeed)),
    overallRisk,
    turbulenceScore,
    recommendation:
      overallRisk === 'SEVERE'
        ? 'Demo projection suggests severe turbulence. Consider delay or reroute.'
        : overallRisk === 'HIGH'
          ? 'Demo projection suggests elevated turbulence. Review route alternatives.'
          : 'Demo projection suggests manageable route conditions.',
    riskFactors: [
      'Jet stream crosswind zone',
      'Vertical wind shear at cruise altitude',
      'Localized convective weather cells',
    ],
    waypoints,
  }
}

function App() {
  const [mode, setMode] = useState<AppMode>('local-weather')
  const [routeData, setRouteData] = useState<TurbulenceResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [routeError, setRouteError] = useState<string | null>(null)

  const [cityInput, setCityInput] = useState('San Diego')
  const [cityWeather, setCityWeather] = useState<CityWeather | null>(null)
  const [forecast, setForecast] = useState<ForecastResponse | null>(null)
  const [weatherLoading, setWeatherLoading] = useState(false)
  const [weatherError, setWeatherError] = useState<string | null>(null)
  const [weatherDemoMode, setWeatherDemoMode] = useState(false)
  const [routeDemoMode, setRouteDemoMode] = useState(false)

  const handleRouteSubmit = async (from: string, to: string, altitude: number) => {
    setLoading(true)
    setRouteError(null)
    try {
      const response = await fetch(apiUrl('/api/turbulence/predict'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from,
          to,
          altitude,
          time: new Date().toISOString(),
        }),
      })

      if (!response.ok) {
        throw new Error(`Request failed (${response.status})`)
      }

      const data = await response.json()
      setRouteData(data)
      setRouteDemoMode(false)
    } catch (error) {
      setRouteData(mockRouteData(from, to, altitude))
      setRouteDemoMode(true)
      setRouteError(`Live API unavailable. Showing demo route data (${(error as Error).message}).`)
    } finally {
      setLoading(false)
    }
  }

  const handleCityWeatherSearch = async (event: React.FormEvent) => {
    event.preventDefault()
    const city = cityInput.trim()
    if (!city) {
      return
    }

    setWeatherLoading(true)
    setWeatherError(null)
    try {
      const [weatherRes, forecastRes] = await Promise.all([
        fetch(apiUrl(`/api/weather/${encodeURIComponent(city)}`)),
        fetch(apiUrl(`/api/forecast/${encodeURIComponent(city)}?days=1`)),
      ])

      if (!weatherRes.ok) {
        throw new Error(`Weather lookup failed (${weatherRes.status})`)
      }
      if (!forecastRes.ok) {
        throw new Error(`Forecast lookup failed (${forecastRes.status})`)
      }

      const weatherData: CityWeather = await weatherRes.json()
      const forecastData: ForecastResponse = await forecastRes.json()
      setCityWeather(weatherData)
      setForecast(forecastData)
      setWeatherDemoMode(false)
    } catch (error) {
      setCityWeather(mockCityWeather(city))
      setForecast(mockForecast(city))
      setWeatherDemoMode(true)
      setWeatherError(`Live API unavailable. Showing demo weather data (${(error as Error).message}).`)
    } finally {
      setWeatherLoading(false)
    }
  }

  return (
    <div className="app-shell">
      <header className="title-bar">
        <div>
          <h1>Weather API v2</h1>
          <p>Local Weather + Turbulence Simulator</p>
        </div>
      </header>

      <aside className="menu-panel">
        <h2>Modes</h2>
        <button
          type="button"
          className={`menu-item ${mode === 'local-weather' ? 'active' : ''}`}
          onClick={() => setMode('local-weather')}
        >
          Local weather (v1)
        </button>
        <button
          type="button"
          className={`menu-item ${mode === 'turbulence' ? 'active' : ''}`}
          onClick={() => setMode('turbulence')}
        >
          Turbulence simulator
        </button>
      </aside>

      <main className="main-panel">
        {mode === 'local-weather' ? (
          <section className="panel">
            <h2>City weather lookup</h2>
            <p className="muted">
              Restored v1 local weather flow. Enter any city to view current conditions and
              short-term forecast.
            </p>
            {weatherDemoMode && (
              <p className="demo-banner">Demo mode: sample weather data is currently being shown.</p>
            )}

            <form className="weather-search-form" onSubmit={handleCityWeatherSearch}>
              <input
                type="text"
                value={cityInput}
                onChange={(event) => setCityInput(event.target.value)}
                placeholder="Enter city name"
              />
              <button type="submit" disabled={weatherLoading}>
                {weatherLoading ? 'Checking...' : 'Get weather'}
              </button>
            </form>

            {weatherError && <p className="error-message">{weatherError}</p>}

            {cityWeather && (
              <div className="weather-grid">
                <article className="metric-card">
                  <h3>{cityWeather.city}</h3>
                  <p className="big-number">{Math.round(cityWeather.temperature)}°F</p>
                  <p className="muted">{cityWeather.condition}</p>
                </article>
                <article className="metric-card">
                  <h3>Wind</h3>
                  <p className="big-number">{Math.round(cityWeather.windSpeed)}</p>
                  <p className="muted">mph</p>
                </article>
                <article className="metric-card">
                  <h3>Humidity</h3>
                  <p className="big-number">{cityWeather.humidity}%</p>
                  <p className="muted">relative</p>
                </article>
                <article className="metric-card">
                  <h3>Visibility</h3>
                  <p className="big-number">{Math.round(cityWeather.visibility)}</p>
                  <p className="muted">km</p>
                </article>
                <article className="metric-card">
                  <h3>Pressure</h3>
                  <p className="big-number">{Math.round(cityWeather.pressure)}</p>
                  <p className="muted">hPa</p>
                </article>
                <article className="metric-card">
                  <h3>Cloud cover</h3>
                  <p className="big-number">{cityWeather.cloudCover}%</p>
                  <p className="muted">sky</p>
                </article>
              </div>
            )}

            {forecast?.forecast?.length ? (
              <section className="forecast-panel">
                <h3>Next forecast points</h3>
                <div className="forecast-list">
                  {forecast.forecast.slice(0, 6).map((item) => (
                    <div key={item.time} className="forecast-item">
                      <p className="forecast-time">{new Date(item.time).toLocaleTimeString()}</p>
                      <p>{Math.round(item.temperature)}°F</p>
                      <p className="muted">{item.condition}</p>
                    </div>
                  ))}
                </div>
              </section>
            ) : null}
          </section>
        ) : (
          <section className="panel">
            <h2>Flight turbulence route projection</h2>
            <p className="muted">
              Keep v2 simulation while preserving local weather in the other tab.
            </p>
            {routeDemoMode && (
              <p className="demo-banner">Demo mode: sample turbulence route data is currently being shown.</p>
            )}

            <div className="route-layout">
              <div>
                <RouteSearch onSubmit={handleRouteSubmit} loading={loading} />
              </div>
              <div className="results-column">
                {loading && (
                  <div className="empty-panel">
                    <p>Analyzing route conditions...</p>
                  </div>
                )}

                {routeError && !loading && <p className="error-message">{routeError}</p>}

                {routeData && !loading && (
                  <>
                    <TurbulenceDisplay data={routeData} />
                    {routeData.waypoints && (
                      <div className="waypoint-grid">
                        {routeData.waypoints.slice(0, 4).map((wp, idx) => (
                          <WeatherCard
                            key={`${wp.city}-${idx}`}
                            city={wp.city}
                            weather={wp.weather}
                            turbulence={wp.turbulence}
                          />
                        ))}
                      </div>
                    )}
                  </>
                )}

                {!routeData && !loading && (
                  <div className="empty-panel">
                    <p>Enter a route to see turbulence predictions.</p>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  )
}

export default App

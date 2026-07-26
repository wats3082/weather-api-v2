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
    } catch (error) {
      setRouteError((error as Error).message)
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
    } catch (error) {
      setWeatherError((error as Error).message)
      setCityWeather(null)
      setForecast(null)
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

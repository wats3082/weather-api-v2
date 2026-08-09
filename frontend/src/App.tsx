import { useState } from 'react';
import './App.css';

type Page = 'local-weather' | 'turbulence';

interface CityWeather {
  city: string;
  temperature: number;
  condition: string;
  humidity: number;
  windSpeed: number;
  pressure: number;
  visibility: number;
  cloudCover: number;
}

interface ForecastItem {
  time: string;
  temperature: number;
  condition: string;
  humidity: number;
  windSpeed: number;
  cloudCover: number;
}

interface ForecastResponse {
  city: string;
  days: number;
  forecast: ForecastItem[];
}

interface Waypoint {
  city: string;
  weather: {
    temp: number;
    condition: string;
    windSpeed: number;
  };
  turbulence: {
    level: 'LOW' | 'MEDIUM' | 'HIGH' | 'SEVERE';
  };
}

interface TurbulenceResponse {
  from: string;
  to: string;
  altitude: number;
  distance: number;
  flightTime: string;
  maxWindSpeed: number;
  overallRisk: 'LOW' | 'MEDIUM' | 'HIGH' | 'SEVERE';
  turbulenceScore: number;
  recommendation: string;
  riskFactors: string[];
  waypoints: Waypoint[];
}

const NAV: { id: Page; label: string }[] = [
  { id: 'local-weather', label: 'Local Weather' },
  { id: 'turbulence', label: 'Turbulence Simulator' },
];

const BASE_API = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
const apiUrl = (path: string) => (BASE_API ? `${BASE_API}${path}` : path);

function riskClass(risk: TurbulenceResponse['overallRisk']): string {
  if (risk === 'LOW') return 'low';
  if (risk === 'MEDIUM') return 'medium';
  if (risk === 'HIGH') return 'high';
  return 'severe';
}

function SimulatedRouteMap({ from, to }: { from: string; to: string }) {
  return (
    <div className="map-card">
      <h3>Approximate Route Visualization</h3>
      <svg className="route-map" viewBox="0 0 640 240" role="img" aria-label="Approximate route visualization">
        <rect x="0" y="0" width="640" height="240" rx="12" />
        <line x1="80" y1="170" x2="250" y2="120" className="route-segment green" />
        <line x1="250" y1="120" x2="430" y2="95" className="route-segment yellow" />
        <line x1="430" y1="95" x2="570" y2="70" className="route-segment red" />
        <circle cx="80" cy="170" r="8" className="route-node start" />
        <circle cx="250" cy="120" r="7" className="route-node mid" />
        <circle cx="430" cy="95" r="7" className="route-node mid" />
        <circle cx="570" cy="70" r="8" className="route-node end" />
        <text x="70" y="195">{from}</text>
        <text x="550" y="95">{to}</text>
      </svg>
      <div className="map-legend">
        <span><i className="dot green" /> Low</span>
        <span><i className="dot yellow" /> Medium</span>
        <span><i className="dot red" /> High</span>
      </div>
    </div>
  );
}

export default function App() {
  const [active, setActive] = useState<Page>('local-weather');

  const [from, setFrom] = useState('Los Angeles');
  const [to, setTo] = useState('New York');
  const [altitude, setAltitude] = useState(35000);
  const [routeData, setRouteData] = useState<TurbulenceResponse | null>(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeError, setRouteError] = useState<string | null>(null);
  const [cityInput, setCityInput] = useState('San Diego');
  const [cityWeather, setCityWeather] = useState<CityWeather | null>(null);
  const [forecast, setForecast] = useState<ForecastResponse | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [weatherError, setWeatherError] = useState<string | null>(null);
  const handleRouteSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setRouteLoading(true);
    setRouteError(null);
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
      });
      if (!response.ok) {
        throw new Error(`Request failed (${response.status})`);
      }
      const data = (await response.json()) as TurbulenceResponse;
      setRouteData(data);
    } catch (error) {
      setRouteData(null);
      setRouteError(`Live API unavailable: ${(error as Error).message}`);
    } finally {
      setRouteLoading(false);
    }
  };

  const handleCityWeatherSearch = async (event: React.FormEvent) => {
    event.preventDefault();
    const city = cityInput.trim();
    if (!city) {
      return;
    }
    setWeatherLoading(true);
    setWeatherError(null);
    try {
      const [weatherRes, forecastRes] = await Promise.all([
        fetch(apiUrl(`/api/weather/${encodeURIComponent(city)}`)),
        fetch(apiUrl(`/api/forecast/${encodeURIComponent(city)}?days=1`)),
      ]);
      if (!weatherRes.ok) {
        throw new Error(`Weather lookup failed (${weatherRes.status})`);
      }
      if (!forecastRes.ok) {
        throw new Error(`Forecast lookup failed (${forecastRes.status})`);
      }
      const weatherData = (await weatherRes.json()) as CityWeather;
      const forecastData = (await forecastRes.json()) as ForecastResponse;
      setCityWeather(weatherData);
      setForecast(forecastData);
    } catch (error) {
      setCityWeather(null);
      setForecast(null);
      setWeatherError(`Live API unavailable: ${(error as Error).message}`);
    } finally {
      setWeatherLoading(false);
    }
  };

  return (
    <div className="shell">
      <header className="top-bar">
        <div>
          <p className="eyebrow">Weather API v2</p>
          <h1>Local Weather + Turbulence Simulator</h1>
          <p className="tagline">Real-time weather via Open-Meteo and turbulence analysis for flight planning.</p>
        </div>
      </header>

      <div className="body">
        <aside className="sidebar">
          {NAV.map((item) => (
            <button
              key={item.id}
              className={`nav-btn${active === item.id ? ' active' : ''}`}
              onClick={() => setActive(item.id)}
            >
              <span className="nav-dot" />
              {item.label}
            </button>
          ))}
        </aside>

        <main className="content">
          {active === 'local-weather' && (
            <section className="page">
              <div className="page-header">
                <h2>Local Weather</h2>
                <p className="lead">Search a city to view current conditions and short-range forecast data.</p>
              </div>
              <form className="inline-form" onSubmit={handleCityWeatherSearch}>
                <input
                  className="city-search-input"
                  type="text"
                  value={cityInput}
                  onChange={(event) => setCityInput(event.target.value)}
                  placeholder="Enter city name"
                />
                <button className="primary-btn" type="submit" disabled={weatherLoading}>
                  {weatherLoading ? 'Checking...' : 'Get Weather'}
                </button>
              </form>
              {weatherError && <p className="error-text">{weatherError}</p>}

              {cityWeather && (
                <div className="metric-grid">
                  <article className="metric"><p>City</p><strong>{cityWeather.city}</strong></article>
                  <article className="metric"><p>Temp</p><strong>{Math.round(cityWeather.temperature)}°F</strong></article>
                  <article className="metric"><p>Condition</p><strong>{cityWeather.condition}</strong></article>
                  <article className="metric"><p>Humidity</p><strong>{cityWeather.humidity}%</strong></article>
                  <article className="metric"><p>Wind</p><strong>{Math.round(cityWeather.windSpeed)} mph</strong></article>
                  <article className="metric"><p>Visibility</p><strong>{Math.round(cityWeather.visibility)} km</strong></article>
                </div>
              )}

              {forecast?.forecast?.length ? (
                <>
                  <h3 className="section-heading">6-Hour Outlook</h3>
                  <div className="forecast-list">
                    {forecast.forecast.slice(0, 6).map((item) => (
                      <div key={item.time} className="forecast-item">
                        <p>{new Date(item.time).toLocaleTimeString()}</p>
                        <strong>{Math.round(item.temperature)}°F</strong>
                        <span>{item.condition}</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : null}
            </section>
          )}

          {active === 'turbulence' && (
            <section className="page">
              <div className="page-header">
                <h2>Turbulence Simulator</h2>
                <p className="lead">Compare route conditions and projected turbulence for a sample flight path.</p>
              </div>
              <form className="turbulence-form" onSubmit={handleRouteSubmit}>
                <label>
                  From
                  <input className="route-input" value={from} onChange={(event) => setFrom(event.target.value)} />
                </label>
                <label>
                  To
                  <input className="route-input" value={to} onChange={(event) => setTo(event.target.value)} />
                </label>
                <label>
                  Altitude: {altitude.toLocaleString()} ft
                  <input
                    className="altitude-slider"
                    type="range"
                    min="10000"
                    max="43000"
                    step="1000"
                    value={altitude}
                    onChange={(event) => setAltitude(Number(event.target.value))}
                  />
                </label>
                <button className="primary-btn" type="submit" disabled={routeLoading}>
                  {routeLoading ? 'Analyzing...' : 'Analyze Route'}
                </button>
              </form>
              {routeError && <p className="error-text">{routeError}</p>}

              {routeData && (
                <>
                  <div className="risk-summary">
                    <div className={`risk-pill ${riskClass(routeData.overallRisk)}`}>{routeData.overallRisk}</div>
                    <p>{routeData.from} to {routeData.to}</p>
                  </div>

                  <div className="metric-grid">
                    <article className="metric"><p>Score</p><strong>{routeData.turbulenceScore.toFixed(1)} / 10</strong></article>
                    <article className="metric"><p>Distance</p><strong>{routeData.distance} mi</strong></article>
                    <article className="metric"><p>Flight Time</p><strong>{routeData.flightTime} hr</strong></article>
                    <article className="metric"><p>Max Wind</p><strong>{routeData.maxWindSpeed} knots</strong></article>
                  </div>

                  <SimulatedRouteMap from={routeData.from} to={routeData.to} />

                  <div className="waypoint-grid">
                    {routeData.waypoints.slice(0, 4).map((wp, index) => (
                      <article className="card" key={`${wp.city}-${index}`}>
                        <h3>{wp.city}</h3>
                        <p>{wp.weather.condition}, {wp.weather.temp}°F</p>
                        <p>Wind {wp.weather.windSpeed} knots</p>
                        <p>Turbulence: <strong>{wp.turbulence.level}</strong></p>
                      </article>
                    ))}
                  </div>

                  <div className="list-card">
                    <h3>Risk Factors</h3>
                    <ul className="risk-list">
                      {routeData.riskFactors.map((factor) => (
                        <li key={factor}>{factor}</li>
                      ))}
                    </ul>
                    <p><strong>Recommendation:</strong> {routeData.recommendation}</p>
                  </div>
                </>
              )}
            </section>
          )}
        </main>
      </div>
    </div>
  );
}

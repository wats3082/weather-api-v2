import { useState } from 'react';
import './App.css';

type Page = 'local-weather' | 'turbulence' | 'api-status';

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
  { id: 'api-status', label: 'Enter Flight Number' },
];

const BASE_API = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
const apiUrl = (path: string) => (BASE_API ? `${BASE_API}${path}` : path);
const mockConditions = ['Clear', 'Clouds', 'Rain', 'Mist'];
const mockRisks: TurbulenceResponse['overallRisk'][] = ['LOW', 'MEDIUM', 'HIGH', 'SEVERE'];

function hashSeed(input: string): number {
  return input.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
}

function mockCityWeather(city: string): CityWeather {
  const seed = hashSeed(city.toLowerCase());
  return {
    city,
    temperature: 58 + (seed % 35),
    condition: mockConditions[seed % mockConditions.length],
    humidity: 35 + (seed % 55),
    windSpeed: 6 + (seed % 24),
    pressure: 995 + (seed % 25),
    visibility: 6 + (seed % 8),
    cloudCover: seed % 100,
  };
}

function mockForecast(city: string): ForecastResponse {
  const base = hashSeed(city.toLowerCase());
  const now = Date.now();
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
  };
}

function mockRouteData(from: string, to: string, altitude: number): TurbulenceResponse {
  const base = hashSeed(`${from}-${to}-${altitude}`);
  const turbulenceScore = Number(((base % 90) / 10 + 1).toFixed(1));
  const overallRisk = mockRisks[Math.min(3, Math.floor(turbulenceScore / 2.6))];
  const waypoints: Waypoint[] = [from, `${from} WP`, `${to} WP`, to].map((city, idx) => {
    const w = mockCityWeather(city);
    const level = mockRisks[Math.min(3, Math.floor((turbulenceScore + idx) / 3))];
    return {
      city,
      weather: {
        temp: Math.round(w.temperature),
        condition: w.condition,
        windSpeed: Math.round(w.windSpeed),
      },
      turbulence: { level },
    };
  });

  const distance = 420 + (base % 2200);
  return {
    from,
    to,
    altitude,
    distance,
    flightTime: (distance / 450).toFixed(1),
    maxWindSpeed: Math.max(...waypoints.map((wp) => wp.weather.windSpeed)),
    overallRisk,
    turbulenceScore,
    recommendation:
      overallRisk === 'SEVERE'
        ? 'Severe projected turbulence. Consider delay or reroute.'
        : overallRisk === 'HIGH'
          ? 'Elevated turbulence likely. Review alternate paths.'
          : 'Manageable projected route conditions.',
    riskFactors: [
      'Jet stream crosswind zone',
      'Vertical wind shear at cruise altitude',
      'Localized convective weather cells',
    ],
    waypoints,
  };
}

function riskClass(risk: TurbulenceResponse['overallRisk']): string {
  if (risk === 'LOW') return 'low';
  if (risk === 'MEDIUM') return 'medium';
  if (risk === 'HIGH') return 'high';
  return 'severe';
}

function SimulatedRouteMap({ from, to }: { from: string; to: string }) {
  return (
    <div className="map-card">
      <h3>Simulated Route Map (Dummy Data)</h3>
      <svg className="route-map" viewBox="0 0 640 240" role="img" aria-label="Simulated route risk map">
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
  const [routeDemoMode, setRouteDemoMode] = useState(false);

  const [cityInput, setCityInput] = useState('San Diego');
  const [cityWeather, setCityWeather] = useState<CityWeather | null>(null);
  const [forecast, setForecast] = useState<ForecastResponse | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [weatherError, setWeatherError] = useState<string | null>(null);
  const [weatherDemoMode, setWeatherDemoMode] = useState(false);

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
      setRouteDemoMode(false);
    } catch (error) {
      setRouteData(mockRouteData(from, to, altitude));
      setRouteDemoMode(true);
      setRouteError(`Live API unavailable. Showing demo route data (${(error as Error).message}).`);
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
      setWeatherDemoMode(false);
    } catch (error) {
      setCityWeather(mockCityWeather(city));
      setForecast(mockForecast(city));
      setWeatherDemoMode(true);
      setWeatherError(`Live API unavailable. Showing demo weather data (${(error as Error).message}).`);
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
          <p className="tagline">Portfolio layout with restored v1 weather features and simulator demo mode.</p>
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
              {weatherDemoMode && <p className="banner">Demo mode is active for weather data.</p>}
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
              {routeDemoMode && <p className="banner">Demo mode is active for turbulence data.</p>}
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

          {active === 'api-status' && (
            <section className="page">
              <div className="page-header">
                <h2>Enter Flight Number</h2>
                <p className="lead">Current API endpoint configuration and fallback behavior.</p>
              </div>
              <div className="list-card">
                <p>Configured API base URL</p>
                <code>{BASE_API || 'relative path (local proxy mode)'}</code>
                <p>When endpoints are unavailable, weather and turbulence pages switch to deterministic dummy data.</p>
              </div>
            </section>
          )}
        </main>
      </div>
    </div>
  );
}

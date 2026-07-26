import { useState } from 'react';
import './App.css';

type Tab = 'summary' | 'route-risk' | 'saved-locations' | 'api-status';

const NAV: { id: Tab; label: string }[] = [
  { id: 'summary', label: 'Summary' },
  { id: 'route-risk', label: 'Route Risk' },
  { id: 'saved-locations', label: 'Saved Locations' },
  { id: 'api-status', label: 'API Status' },
];

const BASE_API = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export default function App() {
  const [active, setActive] = useState<Tab>('summary');

  return (
    <div className="shell">
      <header className="top-bar">
        <div>
          <p className="eyebrow">Weather API V2</p>
          <h1>Forecast and turbulence intelligence</h1>
          <p className="tagline">React/Vite frontend with AWS serverless backend architecture.</p>
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
          {active === 'summary' && (
            <section className="page">
              <h2>Product Summary</h2>
              <p className="lead">
                Deliver city weather, 5-day trends, and route turbulence scoring for travel planning.
              </p>
              <div className="card-grid">
                <article className="card"><h3>Current Weather</h3><p>Live city conditions and metric cards.</p></article>
                <article className="card"><h3>Forecast</h3><p>Short-term outlook for selected locations.</p></article>
                <article className="card"><h3>Turbulence Risk</h3><p>Route scoring model for safer flights.</p></article>
                <article className="card"><h3>Saved Locations</h3><p>User-specific city shortcuts with Cognito identity.</p></article>
              </div>
            </section>
          )}

          {active === 'route-risk' && (
            <section className="page">
              <h2>Route Risk MVP</h2>
              <div className="list-card">
                <p>Planned API endpoint</p>
                <code>POST /api/routes/risk</code>
                <p>Payload: from, to, altitude, departureTime</p>
              </div>
            </section>
          )}

          {active === 'saved-locations' && (
            <section className="page">
              <h2>Saved Locations MVP</h2>
              <div className="list-card">
                <p>Planned API endpoints</p>
                <code>GET /api/locations</code>
                <code>POST /api/locations</code>
                <code>DELETE /api/locations/:id</code>
              </div>
            </section>
          )}

          {active === 'api-status' && (
            <section className="page">
              <h2>Environment</h2>
              <div className="list-card">
                <p>Configured API base URL</p>
                <code>{BASE_API}</code>
              </div>
            </section>
          )}
        </main>
      </div>
    </div>
  );
}

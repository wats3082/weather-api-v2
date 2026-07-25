import { useState } from 'react'
import RouteSearch from './components/RouteSearch'
import TurbulenceDisplay from './components/TurbulenceDisplay'
import WeatherCard from './components/WeatherCard'
import './App.css'

function App() {
  const [routeData, setRouteData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [currentWeather, setCurrentWeather] = useState(null)

  const handleRouteSubmit = async (from: string, to: string, altitude: number) => {
    setLoading(true)
    try {
      const response = await fetch('/api/turbulence/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from,
          to,
          altitude,
          time: new Date().toISOString(),
        }),
      })
      const data = await response.json()
      setRouteData(data)
    } catch (error) {
      console.error('Error fetching turbulence data:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Weather API v2</h1>
          <p className="text-slate-300">Turbulence Prediction for Flight Routes</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Panel - Route Search */}
          <div className="lg:col-span-1">
            <RouteSearch onSubmit={handleRouteSubmit} loading={loading} />
          </div>

          {/* Right Panel - Results */}
          <div className="lg:col-span-2 space-y-6">
            {loading && (
              <div className="bg-slate-700 rounded-lg p-8 text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
                <p className="text-slate-300 mt-4">Analyzing route conditions...</p>
              </div>
            )}

            {routeData && !loading && (
              <>
                <TurbulenceDisplay data={routeData} />
                {routeData.waypoints && (
                  <div className="grid grid-cols-2 gap-4">
                    {routeData.waypoints.slice(0, 4).map((wp: any, idx: number) => (
                      <WeatherCard
                        key={idx}
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
              <div className="bg-slate-700 rounded-lg p-8 text-center border border-slate-600">
                <p className="text-slate-400">Enter a route to see turbulence predictions</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default App

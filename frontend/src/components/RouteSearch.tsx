import { useState } from 'react'
import './RouteSearch.css'

interface RouteSearchProps {
  onSubmit: (from: string, to: string, altitude: number) => void
  loading: boolean
}

export default function RouteSearch({ onSubmit, loading }: RouteSearchProps) {
  const [from, setFrom] = useState('Los Angeles')
  const [to, setTo] = useState('New York')
  const [altitude, setAltitude] = useState(35000)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(from, to, altitude)
  }

  const popularCities = [
    'Los Angeles', 'New York', 'Chicago', 'Houston', 'Phoenix',
    'Philadelphia', 'San Antonio', 'San Diego', 'Dallas', 'San Jose',
    'London', 'Paris', 'Tokyo', 'Sydney', 'Dubai'
  ]

  return (
    <div className="route-search bg-slate-700 rounded-lg p-6 border border-slate-600">
      <h2 className="text-xl font-semibold text-white mb-4">Flight Route</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* From City */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Departure
          </label>
          <input
            type="text"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            placeholder="Enter departure city"
            className="w-full px-4 py-2 bg-slate-600 border border-slate-500 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            list="cities"
          />
        </div>

        {/* To City */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Destination
          </label>
          <input
            type="text"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            placeholder="Enter destination city"
            className="w-full px-4 py-2 bg-slate-600 border border-slate-500 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            list="cities"
          />
        </div>

        {/* Altitude */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Cruise Altitude: {altitude.toLocaleString()} ft
          </label>
          <input
            type="range"
            min="10000"
            max="43000"
            step="1000"
            value={altitude}
            onChange={(e) => setAltitude(Number(e.target.value))}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-slate-400 mt-1">
            <span>10,000 ft</span>
            <span>43,000 ft</span>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-900 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
        >
          {loading ? 'Analyzing...' : 'Analyze Route'}
        </button>
      </form>

      {/* Popular Cities */}
      <div className="mt-6 pt-6 border-t border-slate-600">
        <p className="text-xs font-semibold text-slate-400 mb-3">POPULAR CITIES</p>
        <div className="flex flex-wrap gap-2">
          {popularCities.slice(0, 8).map((city) => (
            <button
              key={city}
              onClick={() => setFrom(city)}
              className="px-3 py-1 bg-slate-600 hover:bg-slate-500 text-slate-200 text-xs rounded transition-colors"
            >
              {city}
            </button>
          ))}
        </div>
      </div>

      <datalist id="cities">
        {popularCities.map((city) => (
          <option key={city} value={city} />
        ))}
      </datalist>
    </div>
  )
}

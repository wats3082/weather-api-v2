import './WeatherCard.css'

interface WeatherCardProps {
  city: string
  weather: any
  turbulence: any
}

export default function WeatherCard({ city, weather, turbulence }: WeatherCardProps) {
  return (
    <div className="weather-card bg-slate-700 rounded-lg p-4 border border-slate-600">
      <h3 className="font-semibold text-white mb-3">{city}</h3>
      
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-slate-400">Temperature</span>
          <span className="text-white font-medium">{weather?.temp}°F</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-400">Condition</span>
          <span className="text-white font-medium capitalize">{weather?.condition}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-400">Wind</span>
          <span className="text-white font-medium">{weather?.windSpeed} knots</span>
        </div>
        <div className="flex justify-between pt-2 border-t border-slate-600">
          <span className="text-slate-400">Turbulence</span>
          <span className={`font-medium ${
            turbulence?.level === 'LOW' ? 'text-green-400' :
            turbulence?.level === 'MEDIUM' ? 'text-yellow-400' :
            turbulence?.level === 'HIGH' ? 'text-orange-400' :
            'text-red-400'
          }`}>
            {turbulence?.level}
          </span>
        </div>
      </div>
    </div>
  )
}

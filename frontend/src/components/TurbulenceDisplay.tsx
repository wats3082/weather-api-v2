import './TurbulenceDisplay.css'

interface TurbulenceDisplayProps {
  data: any
}

export default function TurbulenceDisplay({ data }: TurbulenceDisplayProps) {
  const getRiskColor = (level: string) => {
    switch (level) {
      case 'LOW':
        return 'bg-green-900 text-green-200'
      case 'MEDIUM':
        return 'bg-yellow-900 text-yellow-200'
      case 'HIGH':
        return 'bg-orange-900 text-orange-200'
      case 'SEVERE':
        return 'bg-red-900 text-red-200'
      default:
        return 'bg-slate-700 text-slate-200'
    }
  }

  const getRiskBorder = (level: string) => {
    switch (level) {
      case 'LOW':
        return 'border-green-600'
      case 'MEDIUM':
        return 'border-yellow-600'
      case 'HIGH':
        return 'border-orange-600'
      case 'SEVERE':
        return 'border-red-600'
      default:
        return 'border-slate-600'
    }
  }

  return (
    <div className={`turbulence-display rounded-lg p-6 border-2 ${getRiskBorder(data.overallRisk)}`}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-white">
          {data.from} → {data.to}
        </h2>
        <div className={`${getRiskColor(data.overallRisk)} px-4 py-2 rounded-full font-semibold text-lg`}>
          {data.overallRisk}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {/* Turbulence Score */}
        <div className="bg-slate-600 rounded-lg p-4">
          <p className="text-slate-400 text-sm font-medium">Turbulence Score</p>
          <div className="mt-2">
            <div className="text-3xl font-bold text-blue-400">{data.turbulenceScore.toFixed(1)}</div>
            <p className="text-xs text-slate-400">out of 10</p>
          </div>
          <div className="mt-3 bg-slate-700 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-green-500 to-red-500 h-2 rounded-full"
              style={{ width: `${(data.turbulenceScore / 10) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Distance */}
        <div className="bg-slate-600 rounded-lg p-4">
          <p className="text-slate-400 text-sm font-medium">Distance</p>
          <div className="mt-2">
            <div className="text-3xl font-bold text-purple-400">{data.distance}</div>
            <p className="text-xs text-slate-400">miles</p>
          </div>
        </div>

        {/* Estimated Flight Time */}
        <div className="bg-slate-600 rounded-lg p-4">
          <p className="text-slate-400 text-sm font-medium">Flight Time</p>
          <div className="mt-2">
            <div className="text-3xl font-bold text-indigo-400">{data.flightTime}</div>
            <p className="text-xs text-slate-400">hours</p>
          </div>
        </div>

        {/* Max Wind Speed */}
        <div className="bg-slate-600 rounded-lg p-4">
          <p className="text-slate-400 text-sm font-medium">Max Wind</p>
          <div className="mt-2">
            <div className="text-3xl font-bold text-cyan-400">{data.maxWindSpeed}</div>
            <p className="text-xs text-slate-400">knots</p>
          </div>
        </div>
      </div>

      {/* Risk Factors */}
      <div className="bg-slate-600 rounded-lg p-4">
        <h3 className="font-semibold text-white mb-3">Risk Factors</h3>
        <ul className="space-y-2">
          {data.riskFactors && data.riskFactors.map((factor: any, idx: number) => (
            <li key={idx} className="flex items-start">
              <span className="text-red-400 mr-2">•</span>
              <span className="text-slate-300">{factor}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Recommendation */}
      <div className="mt-4 bg-slate-600 rounded-lg p-4">
        <h3 className="font-semibold text-white mb-2">Recommendation</h3>
        <p className="text-slate-300">{data.recommendation}</p>
      </div>
    </div>
  )
}

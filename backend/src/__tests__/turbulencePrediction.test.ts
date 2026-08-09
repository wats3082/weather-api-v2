import { TurbulencePredictionEngine } from '../services/turbulencePrediction'

describe('TurbulencePredictionEngine', () => {
  const engine = new TurbulencePredictionEngine('')

  it('calculates CAPE and CAT factors coherently', () => {
    expect(engine.calculateCAP(85, 65, 1000)).toBeGreaterThan(0)
    expect(engine.calculateCATpotential(80, 8, 5)).toBeGreaterThan(engine.calculateCATpotential(20, 1, 0))
  })
})

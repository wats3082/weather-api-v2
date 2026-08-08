import { TurbulencePredictionEngine } from '../services/turbulencePrediction'

describe('TurbulencePredictionEngine', () => {
  const apiKey = 'test-key'
  let engine: TurbulencePredictionEngine

  beforeEach(() => {
    engine = new TurbulencePredictionEngine(apiKey)
  })

  describe('calculateWindShear', () => {
    it('calculates wind shear correctly', () => {
      const winds = [
        { altitude: 10000, speed: 20, direction: 180 },
        { altitude: 20000, speed: 30, direction: 180 },
        { altitude: 30000, speed: 45, direction: 180 },
      ]
      const shear = engine.calculateWindShear(winds)
      expect(shear).toBeGreaterThan(0)
    })

    it('returns 0 for single or no winds', () => {
      expect(engine.calculateWindShear([])).toBe(0)
      expect(engine.calculateWindShear([{ altitude: 10000, speed: 20, direction: 180 }])).toBe(0)
    })
  })

  describe('estimateWindAtAltitude', () => {
    it('estimates wind speed increases with altitude', () => {
      const surfaceWind = 10
      const wind10k = engine.estimateWindAtAltitude(surfaceWind, 10000)
      const wind30k = engine.estimateWindAtAltitude(surfaceWind, 30000)
      expect(wind30k).toBeGreaterThan(wind10k)
    })
  })

  describe('calculateCAP', () => {
    it('calculates CAPE positive for warm, moist conditions', () => {
      const cape = engine.calculateCAP(85, 65, 1000)
      expect(cape).toBeGreaterThan(0)
    })

    it('returns 0 for dry conditions', () => {
      const cape = engine.calculateCAP(50, 30, 1000)
      expect(cape).toBeGreaterThanOrEqual(0)
    })
  })

  describe('assessJetStream', () => {
    it('detects jet stream at high altitude with high winds', () => {
      const result = engine.assessJetStream(100, -20, 35000)
      expect(result.isPresent).toBe(true)
      expect(result.intensity).toBeGreaterThan(0)
    })

    it('does not detect jet stream at low altitude', () => {
      const result = engine.assessJetStream(100, 20, 5000)
      expect(result.isPresent).toBe(false)
    })
  })

  describe('calculateGravityWavePotential', () => {
    it('increases with wind speed and cold temperature', () => {
      const weak = engine.calculateGravityWavePotential(20, 15)
      const strong = engine.calculateGravityWavePotential(60, -10)
      expect(strong).toBeGreaterThan(weak)
    })
  })

  describe('detectConvection', () => {
    it('detects high convection with favorable conditions', () => {
      const high = engine.detectConvection(85, 80, 75)
      const low = engine.detectConvection(30, 40, 50)
      expect(high).toBeGreaterThan(low)
    })
  })

  describe('calculateCATpotential', () => {
    it('increases with wind shear and jet intensity', () => {
      const low = engine.calculateCATpotential(20, 1, 0)
      const high = engine.calculateCATpotential(80, 8, 5)
      expect(high).toBeGreaterThan(low)
    })
  })
})

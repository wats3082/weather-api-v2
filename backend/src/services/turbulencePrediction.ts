import axios from 'axios'

interface GeoCoordinates {
  lat: number
  lon: number
}

interface WeatherData {
  temp: number
  humidity: number
  pressure: number
  windSpeed: number
  windDirection: number
  cloudCover: number
  visibility: number
  condition: string
  description: string
}

interface AltitudeWindData {
  altitude: number
  speed: number
  direction: number
}

export class TurbulencePredictionEngine {
  private apiKey: string
  private baseUrl = 'https://api.openweathermap.org/data/2.5'

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  /**
   * Get coordinates for a city
   */
  async getCoordinates(city: string): Promise<GeoCoordinates> {
    try {
      const response = await axios.get(`${this.baseUrl}/weather`, {
        params: {
          q: city,
          appid: this.apiKey,
        },
      })
      return {
        lat: response.data.coord.lat,
        lon: response.data.coord.lon,
      }
    } catch (error) {
      throw new Error(`Failed to get coordinates for ${city}`)
    }
  }

  /**
   * Get current weather data for a location
   */
  async getWeatherData(lat: number, lon: number): Promise<WeatherData> {
    try {
      const response = await axios.get(`${this.baseUrl}/weather`, {
        params: {
          lat,
          lon,
          appid: this.apiKey,
          units: 'imperial',
        },
      })

      const data = response.data
      return {
        temp: data.main.temp,
        humidity: data.main.humidity,
        pressure: data.main.pressure,
        windSpeed: data.wind.speed,
        windDirection: data.wind.deg || 0,
        cloudCover: data.clouds.all,
        visibility: data.visibility / 1000, // Convert to km
        condition: data.weather[0].main,
        description: data.weather[0].description,
      }
    } catch (error) {
      throw new Error('Failed to fetch weather data')
    }
  }

  /**
   * Calculate wind shear between two altitudes
   * Wind shear = |wind_speed_1 - wind_speed_2| / altitude_difference
   */
  calculateWindShear(winds: AltitudeWindData[]): number {
    if (winds.length < 2) return 0

    let totalShear = 0
    for (let i = 1; i < winds.length; i++) {
      const speedDiff = Math.abs(winds[i].speed - winds[i - 1].speed)
      const altDiff = (winds[i].altitude - winds[i - 1].altitude) / 1000 // Convert to thousand feet
      totalShear += speedDiff / (altDiff || 1)
    }

    return totalShear / (winds.length - 1)
  }

  /**
   * Estimate wind at altitude using logarithmic wind profile
   * This is a simplified model
   */
  estimateWindAtAltitude(surfaceWind: number, targetAltitude: number): number {
    // Typical wind increase with altitude (power law)
    const exponent = 0.2 // Default exponent for typical terrain
    const referenceAltitude = 10 // meters at surface
    const targetAltitudeMeters = targetAltitude * 0.3048 // Convert feet to meters

    return surfaceWind * Math.pow(targetAltitudeMeters / referenceAltitude, exponent)
  }

  /**
   * Calculate CAPE (Convective Available Potential Energy)
   * Simplified calculation based on surface conditions
   */
  calculateCAP(temp: number, dewPoint: number, pressure: number): number {
    // Simplified CAPE calculation
    // CAPE is related to temperature gradient and moisture
    const tempGradient = (temp - dewPoint) * 2 // Each degree difference affects CAPE
    const pressureFactor = (1013.25 / pressure) * 100
    const cape = Math.max(0, tempGradient * pressureFactor * 10)
    return cape
  }

  /**
   * Assess jet stream proximity and intensity
   */
  assessJetStream(windSpeed: number, temperature: number, altitude: number): {
    isPresent: boolean
    intensity: number
  } {
    // Jet streams typically have wind speeds > 50 knots
    // At cruising altitudes (30,000-43,000 ft)
    const jetStreamThreshold = 50
    const optimalAltitude = altitude > 25000 && altitude < 45000

    return {
      isPresent: windSpeed > jetStreamThreshold && optimalAltitude,
      intensity: Math.min(10, (windSpeed - jetStreamThreshold) / 20),
    }
  }

  /**
   * Calculate gravity wave potential
   * Mountains and terrain cause gravity waves
   */
  calculateGravityWavePotential(windSpeed: number, temperature: number): number {
    // Gravity waves are more likely with:
    // - Strong winds (>20 knots)
    // - Stable atmosphere (cold temp)
    const windFactor = Math.min(windSpeed / 50, 1)
    const tempFactor = Math.max(0, (10 - temperature) / 50) // Colder = more stable
    return (windFactor + tempFactor) / 2 * 5
  }

  /**
   * Calculate Clear Air Turbulence (CAT) potential
   */
  calculateCATpotential(windSpeed: number, windShear: number, jetIntensity: number): number {
    // CAT factors:
    // - High wind shear
    // - Jet stream proximity
    // - Rapid pressure changes
    const shearFactor = Math.min(windShear / 10, 1) * 4
    const jetFactor = jetIntensity * 3
    const windFactor = Math.min(windSpeed / 80, 1) * 2

    return shearFactor + jetFactor + windFactor
  }

  /**
   * Detect convective activity
   */
  detectConvection(cloudCover: number, humidity: number, temp: number): number {
    // Convective activity indicators:
    // - High cloud cover (>70%)
    // - High humidity (>70%)
    // - Warm temperature (>70°F)
    const cloudFactor = (cloudCover > 70 ? 1 : cloudCover / 70) * 3
    const humidityFactor = (humidity > 70 ? 1 : humidity / 70) * 2
    const tempFactor = (temp > 70 ? 1 : 0) * 2

    return cloudFactor + humidityFactor + tempFactor
  }

  /**
   * Main turbulence prediction function
   */
  async predictTurbulence(
    fromCity: string,
    toCity: string,
    altitude: number
  ): Promise<{
    turbulenceScore: number
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'SEVERE'
    riskFactors: string[]
    recommendation: string
  }> {
    try {
      // Get coordinates for both cities
      const [fromCoords, toCoords] = await Promise.all([
        this.getCoordinates(fromCity),
        this.getCoordinates(toCity),
      ])

      // Get weather data for route
      const [fromWeather, toWeather] = await Promise.all([
        this.getWeatherData(fromCoords.lat, fromCoords.lon),
        this.getWeatherData(toCoords.lat, toCoords.lon),
      ])

      // Estimate mid-point weather
      const midLat = (fromCoords.lat + toCoords.lat) / 2
      const midLon = (fromCoords.lon + toCoords.lon) / 2
      const midWeather = await this.getWeatherData(midLat, midLon)

      // Estimate wind at cruising altitude
      const altitudeWinds: AltitudeWindData[] = [
        { altitude: 10000, speed: fromWeather.windSpeed, direction: fromWeather.windDirection },
        { altitude: 20000, speed: this.estimateWindAtAltitude(fromWeather.windSpeed, 20000), direction: fromWeather.windDirection },
        { altitude: altitude, speed: this.estimateWindAtAltitude(fromWeather.windSpeed, altitude), direction: fromWeather.windDirection },
        { altitude: 40000, speed: this.estimateWindAtAltitude(fromWeather.windSpeed, 40000), direction: fromWeather.windDirection },
      ]

      // Calculate turbulence factors
      const windShear = this.calculateWindShear(altitudeWinds)
      const jetStream = this.assessJetStream(altitudeWinds[2].speed, midWeather.temp, altitude)
      const gravityWaves = this.calculateGravityWavePotential(midWeather.windSpeed, midWeather.temp)
      const cat = this.calculateCATpotential(altitudeWinds[2].speed, windShear, jetStream.intensity)
      const convection = this.detectConvection(midWeather.cloudCover, midWeather.humidity, midWeather.temp)

      // Calculate overall turbulence score (0-10)
      const turbulenceScore = (cat + convection + gravityWaves + jetStream.intensity) / 4

      // Determine risk level
      let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'SEVERE'
      if (turbulenceScore < 2) riskLevel = 'LOW'
      else if (turbulenceScore < 4) riskLevel = 'MEDIUM'
      else if (turbulenceScore < 7) riskLevel = 'HIGH'
      else riskLevel = 'SEVERE'

      // Identify risk factors
      const riskFactors: string[] = []
      if (jetStream.isPresent) riskFactors.push(`Jet stream detected with intensity ${jetStream.intensity.toFixed(1)}/10`)
      if (windShear > 5) riskFactors.push(`High wind shear: ${windShear.toFixed(1)} knots/1000ft`)
      if (convection > 4) riskFactors.push(`Convective activity detected`)
      if (gravityWaves > 3) riskFactors.push(`Mountain wave turbulence potential`)
      if (midWeather.cloudCover > 80) riskFactors.push('High cloud cover')
      if (midWeather.condition.includes('Thunder')) riskFactors.push('Thunderstorm activity')
      if (midWeather.windSpeed > 40) riskFactors.push(`Strong surface winds: ${midWeather.windSpeed.toFixed(0)} knots`)

      // Generate recommendation
      let recommendation = ''
      if (riskLevel === 'LOW') {
        recommendation = 'Route conditions are favorable. Standard flight procedures recommended.'
      } else if (riskLevel === 'MEDIUM') {
        recommendation = 'Moderate turbulence expected. Maintain increased vigilance and consider requesting alternate altitude.'
      } else if (riskLevel === 'HIGH') {
        recommendation = 'Significant turbulence likely. Consider rerouting or requesting different altitude. Ensure crew is briefed.'
      } else {
        recommendation = 'Severe turbulence expected. Strong recommendation to delay flight or reroute. Consult with dispatch.'
      }

      return {
        turbulenceScore: Math.round(turbulenceScore * 10) / 10,
        riskLevel,
        riskFactors,
        recommendation,
      }
    } catch (error) {
      throw new Error(`Turbulence prediction failed: ${error}`)
    }
  }
}

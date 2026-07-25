/**
 * Local development entry point for Express server
 * Use this for testing Lambda functions locally
 */

import express from 'express'
import { predict } from './handlers/turbulence'
import { getCurrent, getForecast } from './handlers/weather'

const app = express()
app.use(express.json())

// CORS middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Headers', 'Content-Type')
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  if (req.method === 'OPTIONS') {
    res.sendStatus(200)
  } else {
    next()
  }
})

// Routes
app.post('/api/turbulence/predict', async (req, res) => {
  const event = {
    body: JSON.stringify(req.body),
    pathParameters: null,
    queryStringParameters: null,
    headers: {},
    httpMethod: 'POST',
    path: '/api/turbulence/predict',
    resource: '',
    requestContext: {} as any,
    isBase64Encoded: false,
  }

  const result = await predict(event as any, {} as any, {} as any)
  res.status(result.statusCode).send(JSON.parse(result.body))
})

app.get('/api/weather/:city', async (req, res) => {
  const event = {
    body: null,
    pathParameters: { city: req.params.city },
    queryStringParameters: null,
    headers: {},
    httpMethod: 'GET',
    path: `/api/weather/${req.params.city}`,
    resource: '',
    requestContext: {} as any,
    isBase64Encoded: false,
  }

  const result = await getCurrent(event as any, {} as any, {} as any)
  res.status(result.statusCode).send(JSON.parse(result.body))
})

app.get('/api/forecast/:city', async (req, res) => {
  const event = {
    body: null,
    pathParameters: { city: req.params.city },
    queryStringParameters: { days: req.query.days as string },
    headers: {},
    httpMethod: 'GET',
    path: `/api/forecast/${req.params.city}`,
    resource: '',
    requestContext: {} as any,
    isBase64Encoded: false,
  }

  const result = await getForecast(event as any, {} as any, {} as any)
  res.status(result.statusCode).send(JSON.parse(result.body))
})

const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
  console.log(`Frontend should connect to http://localhost:${PORT}`)
})

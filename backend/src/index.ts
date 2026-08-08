/**
 * Local development entry point for Express server
 * Use this for testing Lambda functions locally
 */

import express from 'express'
import { APIGatewayProxyResult } from 'aws-lambda'
import { predict } from './handlers/turbulence'
import { getCurrent, getForecast } from './handlers/weather'
import { create, list, remove } from './handlers/locations'

async function run(h: (...args: any[]) => Promise<void | APIGatewayProxyResult>, event: any) {
  const res = await h(event, {} as any, {} as any)
  if (!res) throw new Error('Handler returned no response')
  return res
}

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

  const result = await run(predict as any, event)
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

  const result = await run(getCurrent as any, event)
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

  const result = await run(getForecast as any, event)
  res.status(result.statusCode).send(JSON.parse(result.body))
})

app.get('/api/locations', async (req, res) => {
  const result = await run(list as any,
    {
      body: null,
      pathParameters: null,
      queryStringParameters: null,
      headers: { 'x-user-id': String(req.headers['x-user-id'] || '') },
      httpMethod: 'GET',
      path: '/api/locations',
      resource: '',
      requestContext: { authorizer: undefined } as any,
      isBase64Encoded: false,
    } as any
  )
  res.status(result.statusCode).send(result.body ? JSON.parse(result.body) : undefined)
})

app.post('/api/locations', async (req, res) => {
  const result = await run(create as any,
    {
      body: JSON.stringify(req.body),
      pathParameters: null,
      queryStringParameters: null,
      headers: { 'x-user-id': String(req.headers['x-user-id'] || '') },
      httpMethod: 'POST',
      path: '/api/locations',
      resource: '',
      requestContext: { authorizer: undefined } as any,
      isBase64Encoded: false,
    } as any
  )
  res.status(result.statusCode).send(result.body ? JSON.parse(result.body) : undefined)
})

app.delete('/api/locations/:id', async (req, res) => {
  const result = await run(remove as any,
    {
      body: null,
      pathParameters: { id: req.params.id },
      queryStringParameters: null,
      headers: { 'x-user-id': String(req.headers['x-user-id'] || '') },
      httpMethod: 'DELETE',
      path: `/api/locations/${req.params.id}`,
      resource: '',
      requestContext: { authorizer: undefined } as any,
      isBase64Encoded: false,
    } as any
  )
  res.status(result.statusCode).send(result.body ? JSON.parse(result.body) : undefined)
})

const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
  console.log(`Frontend should connect to http://localhost:${PORT}`)
})

import { APIGatewayProxyHandler } from 'aws-lambda'
import crypto from 'crypto'
import { getUserId } from '../services/auth'
import { deleteLocation, listSavedLocations, saveLocation } from '../services/cache'
import { SaveLocationSchema } from '../lib/validation'

const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
}

export const list: APIGatewayProxyHandler = async (event) => {
  try {
    const userId = getUserId(event)
    const locations = await listSavedLocations(userId)
    return { statusCode: 200, headers, body: JSON.stringify({ locations }) }
  } catch (error) {
    const message = (error as Error).message
    return { statusCode: message === 'Unauthorized' ? 401 : 500, headers, body: JSON.stringify({ error: message }) }
  }
}

export const create: APIGatewayProxyHandler = async (event) => {
  try {
    const userId = getUserId(event)
    if (!event.body) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Request body required' }) }
    }

    const parsed = SaveLocationSchema.safeParse(JSON.parse(event.body))
    if (!parsed.success) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: parsed.error.issues[0].message }) }
    }

    const location = await saveLocation({
      id: crypto.randomUUID(),
      userId,
      city: parsed.data.city,
      label: parsed.data.label,
      createdAt: new Date().toISOString(),
    })

    return { statusCode: 201, headers, body: JSON.stringify(location) }
  } catch (error) {
    const message = (error as Error).message
    return { statusCode: message === 'Unauthorized' ? 401 : 500, headers, body: JSON.stringify({ error: message }) }
  }
}

export const remove: APIGatewayProxyHandler = async (event) => {
  try {
    const userId = getUserId(event)
    const id = event.pathParameters?.id
    if (!id) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Location id required' }) }
    }

    await deleteLocation(userId, id)
    return { statusCode: 204, headers, body: '' }
  } catch (error) {
    const message = (error as Error).message
    return { statusCode: message === 'Unauthorized' ? 401 : 500, headers, body: JSON.stringify({ error: message }) }
  }
}

import { APIGatewayProxyHandler } from 'aws-lambda'
import crypto from 'crypto'
import { getUserId } from '../services/auth'
import { deleteLocation, listSavedLocations, saveLocation } from '../services/cache'

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

    const { city, label } = JSON.parse(event.body) as { city?: string; label?: string }
    if (!city?.trim() || !label?.trim()) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'city and label are required' }) }
    }

    const location = await saveLocation({
      id: crypto.randomUUID(),
      userId,
      city: city.trim(),
      label: label.trim(),
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

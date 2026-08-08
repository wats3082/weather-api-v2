import {
  DeleteCommand,
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  QueryCommand,
} from '@aws-sdk/lib-dynamodb'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'

type CacheRecord<T> = {
  value: T
  expiresAt: number
}

export interface SavedLocation {
  id: string
  userId: string
  label: string
  city: string
  createdAt: string
}

const TABLE_NAME = process.env.DATA_TABLE_NAME

const ddb = TABLE_NAME
  ? DynamoDBDocumentClient.from(new DynamoDBClient({}))
  : null

const mem = new Map<string, CacheRecord<unknown>>()

const now = () => Math.floor(Date.now() / 1000)

const cacheKey = (ns: string, key: string) => `${ns}:${key}`

export async function getCached<T>(ns: string, key: string): Promise<T | null> {
  const k = cacheKey(ns, key)
  const item = mem.get(k)
  if (item && item.expiresAt > now()) return item.value as T
  if (item) mem.delete(k)

  if (!ddb || !TABLE_NAME) return null

  const res = await ddb.send(
    new GetCommand({
      TableName: TABLE_NAME,
      Key: { pk: `CACHE#${ns}`, sk: key },
    })
  )

  if (!res.Item) return null
  if (typeof res.Item.expiresAt === 'number' && res.Item.expiresAt <= now()) return null
  mem.set(k, { value: res.Item.value as T, expiresAt: res.Item.expiresAt as number })
  return res.Item.value as T
}

export async function setCached<T>(ns: string, key: string, value: T, ttlSeconds: number): Promise<void> {
  const expiresAt = now() + ttlSeconds
  mem.set(cacheKey(ns, key), { value, expiresAt })

  if (!ddb || !TABLE_NAME) return

  await ddb.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: {
        pk: `CACHE#${ns}`,
        sk: key,
        value,
        expiresAt,
      },
    })
  )
}

export async function listSavedLocations(userId: string): Promise<SavedLocation[]> {
  if (!ddb || !TABLE_NAME) return []

  const res = await ddb.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: 'pk = :pk AND begins_with(sk, :sk)',
      ExpressionAttributeValues: {
        ':pk': `USER#${userId}`,
        ':sk': 'LOCATION#',
      },
    })
  )

  return (res.Items ?? []).map((item) => item.value as SavedLocation)
}

export async function saveLocation(location: SavedLocation): Promise<SavedLocation> {
  if (!ddb || !TABLE_NAME) throw new Error('DATA_TABLE_NAME not configured')

  await ddb.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: {
        pk: `USER#${location.userId}`,
        sk: `LOCATION#${location.id}`,
        value: location,
      },
      ConditionExpression: 'attribute_not_exists(pk) AND attribute_not_exists(sk)',
    })
  )

  return location
}

export async function deleteLocation(userId: string, id: string): Promise<void> {
  if (!ddb || !TABLE_NAME) throw new Error('DATA_TABLE_NAME not configured')

  await ddb.send(
    new DeleteCommand({
      TableName: TABLE_NAME,
      Key: {
        pk: `USER#${userId}`,
        sk: `LOCATION#${id}`,
      },
    })
  )
}

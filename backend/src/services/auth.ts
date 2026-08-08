import { APIGatewayProxyEvent } from 'aws-lambda'

export function getUserId(event: APIGatewayProxyEvent): string {
  const sub =
    event.requestContext.authorizer?.claims?.sub ||
    event.headers['x-user-id'] ||
    event.headers['X-User-Id']

  if (!sub || typeof sub !== 'string') {
    throw new Error('Unauthorized')
  }

  return sub
}

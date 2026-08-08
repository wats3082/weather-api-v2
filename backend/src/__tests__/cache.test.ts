import { getCached, setCached } from '../services/cache'

describe('Cache Service', () => {
  const testNamespace = 'test'
  const testKey = 'test-key'
  const testValue = { temp: 72, condition: 'Clear' }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('setCached and getCached', () => {
    it('stores and retrieves values from cache', async () => {
      await setCached(testNamespace, testKey, testValue, 3600)
      const result = await getCached(testNamespace, testKey)
      expect(result).toEqual(testValue)
    })

    it('returns null for non-existent keys', async () => {
      const result = await getCached('nonexistent', 'nonexistent')
      expect(result).toBeNull()
    })

    it('respects TTL expiration', async () => {
      await setCached(testNamespace, 'expiring-key', testValue, -1)
      const result = await getCached(testNamespace, 'expiring-key')
      expect(result).toBeNull()
    })

    it('supports different data types', async () => {
      const arrayValue = [1, 2, 3]
      await setCached(testNamespace, 'array', arrayValue, 3600)
      const result = await getCached(testNamespace, 'array')
      expect(result).toEqual(arrayValue)
    })

    it('isolates caches by namespace', async () => {
      await setCached('ns1', 'key', 'value1', 3600)
      await setCached('ns2', 'key', 'value2', 3600)
      const result1 = await getCached('ns1', 'key')
      const result2 = await getCached('ns2', 'key')
      expect(result1).toBe('value1')
      expect(result2).toBe('value2')
    })
  })
})

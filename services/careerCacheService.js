/**
 * High-performance, thread-safe in-memory TTL cache for ZenScore Careers APIs.
 * Automatically invalidates on sync operations to guarantee fresh data.
 */
class CareerCacheService {
  constructor() {
    this.cache = new Map()
  }

  getKey(userId, section) {
    return `user_${userId}_${section}`
  }

  get(userId, section) {
    const key = this.getKey(userId, section)
    const item = this.cache.get(key)
    if (!item) return null

    if (Date.now() > item.expiresAt) {
      this.cache.delete(key)
      return null
    }
    return item.data
  }

  set(userId, section, data, ttlSeconds = 60) {
    const key = this.getKey(userId, section)
    this.cache.set(key, {
      data,
      expiresAt: Date.now() + ttlSeconds * 1000
    })
  }

  invalidateUser(userId) {
    for (const key of this.cache.keys()) {
      if (key.startsWith(`user_${userId}_`)) {
        this.cache.delete(key)
      }
    }
  }
}

module.exports = new CareerCacheService()

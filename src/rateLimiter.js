/**
 * Rate limiter to prevent abuse
 * Tracks requests per controller and per source (IP/account)
 * Blocks if 25 or more requests in 30 seconds
 */

class RateLimiter {
  constructor() {
    // Track requests: key -> array of timestamps
    this.requests = new Map();
    
    // Cleanup old entries periodically
    setInterval(() => {
      this.cleanup();
    }, 60 * 1000); // Every minute
  }

  /**
   * Check if a request should be allowed
   * @param {string} key - Identifier (auth:userId or ip:address)
   * @returns {boolean} True if allowed, false if rate limited
   */
  checkLimit(key) {
    const now = Date.now();
    const windowStart = now - (30 * 1000); // 30 seconds ago

    if (!this.requests.has(key)) {
      this.requests.set(key, []);
    }

    const timestamps = this.requests.get(key);
    
    // Remove timestamps older than 30 seconds
    const recentTimestamps = timestamps.filter(ts => ts > windowStart);
    this.requests.set(key, recentTimestamps);

    // Check if rate limit exceeded
    if (recentTimestamps.length >= 25) {
      console.log(`[RateLimiter] Rate limit exceeded for ${key}. Request count: ${recentTimestamps.length}`);
      return false;
    }

    // IMPORTANT: Don't add timestamp here, let caller do it with recordRequest()
    return true;
  }

  /**
   * Record a request for rate limiting
   * @param {string} key - Identifier to record
   */
  recordRequest(key) {
    const now = Date.now();
    
    if (!this.requests.has(key)) {
      this.requests.set(key, []);
    }
    
    this.requests.get(key).push(now);
  }

  /**
   * Clean up old entries
   */
  cleanup() {
    const now = Date.now();
    const windowStart = now - (30 * 1000);
    let removedCount = 0;

    for (const [key, timestamps] of this.requests.entries()) {
      const recentTimestamps = timestamps.filter(ts => ts > windowStart);
      
      if (recentTimestamps.length === 0) {
        this.requests.delete(key);
        removedCount++;
      } else {
        this.requests.set(key, recentTimestamps);
      }
    }

    if (removedCount > 0) {
      console.log(`[RateLimiter] Cleanup: Removed ${removedCount} empty rate limit entries`);
    }
  }

  /**
   * Get statistics
   */
  getStats() {
    return {
      trackedKeys: this.requests.size
    };
  }
}

module.exports = RateLimiter;

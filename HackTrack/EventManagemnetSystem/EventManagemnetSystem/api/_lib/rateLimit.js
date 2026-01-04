/**
 * Simple in-memory rate limiter for serverless functions
 * 
 * LIMITATIONS:
 * - Per-instance only (not shared across serverless function instances)
 * - Memory is cleared on cold starts
 * - Not suitable for production at scale
 * 
 * TODO: Replace with distributed store like Upstash Redis for production use
 */

// In-memory store: { ip: { count: number, resetTime: timestamp } }
const rateLimitStore = new Map();

// Configuration from environment variables
const WINDOW_MS = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10); // 1 minute default
const MAX_REQUESTS = parseInt(process.env.RATE_LIMIT_MAX || '60', 10); // 60 requests default

// Track cleanup state
let requestCount = 0;
const CLEANUP_INTERVAL = 100; // Cleanup every 100 requests

/**
 * Clean up expired entries from the rate limit store
 */
function cleanupExpiredEntries() {
  const now = Date.now();
  for (const [key, value] of rateLimitStore.entries()) {
    if (now > value.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}

/**
 * Get client IP from request
 * @param {Object} req - Request object
 * @returns {string} Client IP address
 */
function getClientIp(req) {
  // Check common headers for client IP (Vercel, proxies, etc.)
  return (
    req.headers['x-forwarded-for']?.split(',')[0].trim() ||
    req.headers['x-real-ip'] ||
    req.connection?.remoteAddress ||
    req.socket?.remoteAddress ||
    'unknown'
  );
}

/**
 * Check if request should be rate limited
 * @param {Object} req - Request object
 * @returns {Object} { limited: boolean, remaining: number, resetTime: number }
 */
function checkRateLimit(req) {
  // Periodically clean up expired entries using deterministic interval
  requestCount++;
  if (requestCount % CLEANUP_INTERVAL === 0) {
    cleanupExpiredEntries();
  }

  const clientIp = getClientIp(req);
  const now = Date.now();
  
  let record = rateLimitStore.get(clientIp);
  
  // Create new record or reset if window expired
  if (!record || now > record.resetTime) {
    record = {
      count: 1,
      resetTime: now + WINDOW_MS
    };
    rateLimitStore.set(clientIp, record);
    
    return {
      limited: false,
      remaining: MAX_REQUESTS - 1,
      resetTime: record.resetTime
    };
  }
  
  // Increment count
  record.count++;
  
  // Check if limit exceeded
  if (record.count > MAX_REQUESTS) {
    return {
      limited: true,
      remaining: 0,
      resetTime: record.resetTime
    };
  }
  
  return {
    limited: false,
    remaining: MAX_REQUESTS - record.count,
    resetTime: record.resetTime
  };
}

/**
 * Middleware to apply rate limiting
 * Returns true if rate limited (and sends 429 response), false if ok to proceed
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @returns {boolean} True if rate limited, false otherwise
 */
function applyRateLimit(req, res) {
  const { limited, remaining, resetTime } = checkRateLimit(req);
  
  // Set rate limit headers
  res.setHeader('X-RateLimit-Limit', MAX_REQUESTS.toString());
  res.setHeader('X-RateLimit-Remaining', remaining.toString());
  res.setHeader('X-RateLimit-Reset', new Date(resetTime).toISOString());
  
  if (limited) {
    const { error } = require('./respond');
    const retryAfter = Math.ceil((resetTime - Date.now()) / 1000);
    res.setHeader('Retry-After', retryAfter.toString());
    error(res, 'Too many requests, please try again later', 429);
    return true;
  }
  
  return false;
}

module.exports = {
  applyRateLimit,
  checkRateLimit,
  getClientIp
};

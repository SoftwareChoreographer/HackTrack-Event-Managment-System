/**
 * Set security headers and CORS on a response object
 * @param {Object} res - Express/Vercel response object
 */
function setSecurityHeaders(res) {
  const allowedOrigin = process.env.FRONTEND_URL || 'http://localhost:3000';
  
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  
  // Security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  res.setHeader('Cache-Control', 'no-store');
  
  // CSP for API-only responses
  res.setHeader('Content-Security-Policy', "default-src 'none'; frame-ancestors 'none'; base-uri 'none'");
}

/**
 * Handle OPTIONS preflight requests
 * @param {Object} req - Express/Vercel request object
 * @param {Object} res - Express/Vercel response object
 * @returns {boolean} True if OPTIONS was handled, false otherwise
 */
function handleOptions(req, res) {
  if (req.method === 'OPTIONS') {
    setSecurityHeaders(res);
    res.status(200).end();
    return true;
  }
  return false;
}

/**
 * Send a successful JSON response
 * @param {Object} res - Express/Vercel response object
 * @param {Object} data - Data to send in response
 * @param {number} statusCode - HTTP status code (default: 200)
 */
function success(res, data, statusCode = 200) {
  setSecurityHeaders(res);
  return res.status(statusCode).json(data);
}

/**
 * Send an error JSON response
 * @param {Object} res - Express/Vercel response object
 * @param {string} message - Error message
 * @param {number} statusCode - HTTP status code (default: 500)
 */
function error(res, message, statusCode = 500) {
  setSecurityHeaders(res);
  return res.status(statusCode).json({ error: message });
}

/**
 * Wrap an async handler to catch errors automatically
 * @param {Function} handler - Async request handler
 * @returns {Function} Wrapped handler with error catching
 */
function asyncHandler(handler) {
  return async (req, res) => {
    try {
      await handler(req, res);
    } catch (err) {
      console.error('Handler error:', err);
      error(res, 'Internal server error', 500);
    }
  };
}

module.exports = { success, error, asyncHandler, setSecurityHeaders, handleOptions };

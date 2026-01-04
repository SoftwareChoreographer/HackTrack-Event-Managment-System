const jwt = require('jsonwebtoken');

/**
 * Extract and verify JWT token from Authorization header
 * @param {Object} req - Request object
 * @returns {Object} Decoded user object { id, email, role }
 * @throws {Error} If token is missing or invalid (with status property)
 */
function getAuthUser(req) {
  const authHeader = req.headers.authorization || req.headers.Authorization;
  
  if (!authHeader) {
    const error = new Error('Authentication required');
    error.status = 401;
    throw error;
  }
  
  // Extract token from "Bearer <token>" format
  const token = authHeader.replace(/^Bearer\s+/i, '');
  
  if (!token || token === authHeader) {
    // No Bearer prefix or empty token
    const error = new Error('Invalid authorization header format');
    error.status = 401;
    throw error;
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded;
  } catch (err) {
    const error = new Error('Invalid or expired token');
    error.status = 401;
    throw error;
  }
}

/**
 * Optional: Verify user has a specific role
 * @param {Object} user - Decoded user object from getAuthUser
 * @param {string} requiredRole - Required role (e.g., 'Admin', 'Organizer')
 * @throws {Error} If user doesn't have required role
 */
function requireRole(user, requiredRole) {
  if (user.role !== requiredRole) {
    const error = new Error('Insufficient permissions');
    error.status = 403;
    throw error;
  }
}

module.exports = {
  getAuthUser,
  requireRole
};

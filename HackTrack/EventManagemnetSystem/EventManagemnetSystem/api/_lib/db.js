const mysql = require("mysql2/promise");
const fs = require("fs");
const path = require("path");

// Lazy-initialized connection pool
let pool = null;

/**
 * Get or create a MySQL connection pool optimized for serverless environments.
 * Uses lazy initialization to avoid creating connections until needed.
 * @returns {Promise<mysql.Pool>} MySQL connection pool
 */
function getPool() {
  if (pool) {
    return pool;
  }

  // Build pool configuration from environment variables
  const poolConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'event_management',
    waitForConnections: true,
    connectionLimit: 2, // Serverless: balance between memory and concurrency
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0
  };

  // Add SSL configuration if explicitly enabled and CA path is provided
  if (process.env.DB_SSL_ENABLED === 'true') {
    const caPath = process.env.DB_SSL_CA_PATH || path.resolve(__dirname, '../../ca.pem');
    if (fs.existsSync(caPath)) {
      poolConfig.ssl = {
        rejectUnauthorized: true,
        ca: fs.readFileSync(caPath)
      };
    } else {
      console.warn('WARNING: SSL enabled but CA certificate file not found');
    }
  }

  pool = mysql.createPool(poolConfig);
  
  return pool;
}

module.exports = { getPool };

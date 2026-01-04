
const mysql = require("mysql2/promise");
const fs = require("fs");
const path = require("path");

// Build pool configuration from environment variables
const poolConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'event_management',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

// Add SSL configuration if explicitly enabled and CA path is provided
if (process.env.DB_SSL_ENABLED === 'true') {
    const caPath = process.env.DB_SSL_CA_PATH || path.resolve(__dirname, 'ca.pem');
    if (fs.existsSync(caPath)) {
        poolConfig.ssl = {
            rejectUnauthorized: true,
            ca: fs.readFileSync(caPath)
        };
    } else {
        console.warn(`WARNING: SSL enabled but CA file not found at ${caPath}`);
    }
}

const pool = mysql.createPool(poolConfig);

module.exports = pool;
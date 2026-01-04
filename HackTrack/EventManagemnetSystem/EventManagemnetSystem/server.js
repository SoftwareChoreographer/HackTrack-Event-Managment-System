const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const app = require('./app');
const PORT = process.env.PORT || 5000

// Fail-fast check for JWT_SECRET
if (!process.env.JWT_SECRET) {
    console.error('FATAL: JWT_SECRET environment variable is not set');
    process.exit(1);
}

// Warning for missing DB environment variables
const requiredDbVars = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME'];
const missingDbVars = requiredDbVars.filter(varName => !process.env[varName]);

if (missingDbVars.length > 0) {
    console.warn(`WARNING: Missing database environment variables: ${missingDbVars.join(', ')}`);
    console.warn('Using default values. This may cause connection issues.');
}

process.env.NODE_EXTRA_CA_CERTS = path.resolve(__dirname, '../ca.pem');

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
})


const crypto = require('crypto');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../.env') });

let cachedSecret = process.env.JWT_SECRET;

function getJwtSecret() {
    if (cachedSecret && cachedSecret.length >= 32) {
        return cachedSecret;
    }
    
    // In production, enforce explicit secure environment configuration
    if (process.env.NODE_ENV === 'production') {
        throw new Error('FATAL SECURITY CONFIGURATION: process.env.JWT_SECRET is required (min 32 chars) in production mode.');
    }

    // In development / local testing, auto-generate a strong runtime CSPRNG secret (512-bit)
    if (!cachedSecret) {
        cachedSecret = crypto.randomBytes(64).toString('hex');
    }
    return cachedSecret;
}

module.exports = { getJwtSecret };


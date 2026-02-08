require('dotenv').config();

const config = {
    google: {
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET, // Optional if only verifying ID tokens
        redirectUri: process.env.GOOGLE_REDIRECT_URI || 'http://localhost:5173', // For verification matching
    },
    jwtSecret: process.env.JWT_SECRET || 'default_secret_please_change',
};

const validateConfig = () => {
    const errors = [];
    if (!config.google.clientId) {
        errors.push('CRITICAL: GOOGLE_CLIENT_ID is missing from environment variables.');
    }
    // if (!config.google.clientSecret) errors.push('Missing GOOGLE_CLIENT_SECRET'); // Not strictly needed for implicit/ID token verification

    if (errors.length > 0) {
        console.error('❌ Auth Configuration Errors:', errors);
        process.exit(1);
    } else {
        console.log('✅ Auth Configuration Validated');
        console.log(`   Google Client ID: ${config.google.clientId.substring(0, 10)}...`);
    }
};

module.exports = {
    config,
    validateConfig
};

/**
 * Configuration Validator
 * Validates required environment variables on server startup
 * Fails fast if critical configuration is missing
 */

const requiredEnvVars = [
    'MONGODB_URL',
    'JWT_SECRET',
    'PORT',
    'ML_SERVICE_URL'
];

const optionalEnvVars = {
    'MONGODB_DB_NAME': 'voice_health_detection',
    'JWT_ALGORITHM': 'HS256',
    'JWT_EXPIRATION_MINUTES': '1440',
    'NODE_ENV': 'development',
    'BCRYPT_ROUNDS': '12',
    'MAX_FILE_SIZE_MB': '10',
    'CORS_ORIGINS': 'http://localhost:3000,http://localhost:5000'
};

export function validateConfig() {
    const missing = [];
    const warnings = [];

    // Check required variables
    for (const varName of requiredEnvVars) {
        if (!process.env[varName]) {
            missing.push(varName);
        }
    }

    // Set defaults for optional variables
    for (const [varName, defaultValue] of Object.entries(optionalEnvVars)) {
        if (!process.env[varName]) {
            process.env[varName] = defaultValue;
            warnings.push(`${varName} not set, using default: ${defaultValue}`);
        }
    }

    // Validate JWT_SECRET strength
    if (process.env.JWT_SECRET) {
        if (process.env.JWT_SECRET.length < 32) {
            missing.push('JWT_SECRET (too short - minimum 32 characters)');
        }
        if (process.env.JWT_SECRET === 'supersecret' || process.env.JWT_SECRET.includes('YOUR_')) {
            missing.push('JWT_SECRET (using default/placeholder value - INSECURE!)');
        }
    }

    // Validate MongoDB URL
    if (process.env.MONGODB_URL) {
        if (process.env.MONGODB_URL.includes('YOUR_') || process.env.MONGODB_URL.includes('REPLACE')) {
            missing.push('MONGODB_URL (using placeholder value)');
        }
    }

    // Report findings
    if (warnings.length > 0) {
        console.warn('\n⚠️  Configuration Warnings:');
        warnings.forEach(w => console.warn(`   - ${w}`));
    }

    if (missing.length > 0) {
        console.error('\n❌ Configuration Error: Missing required environment variables:\n');
        missing.forEach(v => console.error(`   - ${v}`));
        console.error('\n💡 Copy .env.example to .env and fill in your values\n');
        throw new Error('Invalid configuration - server cannot start');
    }

    console.log('✅ Configuration validated successfully\n');
}

export function getConfig() {
    return {
        mongodb: {
            url: process.env.MONGODB_URL,
            dbName: process.env.MONGODB_DB_NAME
        },
        jwt: {
            secret: process.env.JWT_SECRET,
            algorithm: process.env.JWT_ALGORITHM,
            expirationMinutes: parseInt(process.env.JWT_EXPIRATION_MINUTES)
        },
        server: {
            port: parseInt(process.env.PORT),
            nodeEnv: process.env.NODE_ENV,
            corsOrigins: process.env.CORS_ORIGINS.split(',')
        },
        ml: {
            serviceUrl: process.env.ML_SERVICE_URL,
            modelPath: process.env.ML_MODEL_PATH,
            scalerPath: process.env.SCALER_PATH
        },
        security: {
            bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS),
            maxFileSizeMB: parseInt(process.env.MAX_FILE_SIZE_MB),
            allowedAudioTypes: process.env.ALLOWED_AUDIO_TYPES?.split(',') || ['audio/wav', 'audio/mpeg']
        },
        rateLimit: {
            windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || 900000),
            maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || 5)
        }
    };
}

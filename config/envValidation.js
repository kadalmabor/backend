/**
 * Central startup checks: no insecure in-code secret fallbacks — env must supply values.
 */

const requireEnv = (key) => {
    const v = process.env[key];
    if (!v || String(v).trim() === '') {
        throw new Error(`Missing required environment variable: ${key}`);
    }
    return String(v).trim();
};

const isProduction = () => process.env.NODE_ENV === 'production';

/**
 * Call after dotenv.config(). Exits process on failure in production; throws in dev.
 */
function validateStartupEnvironment() {
    requireEnv('JWT_SECRET');
    requireEnv('JWT_REFRESH_SECRET');
    requireEnv('ADMIN_PRIVATE_KEY');
    requireEnv('VC_ISSUER_PRIVATE_KEY');

    if (isProduction()) {
        requireEnv('VOTING_SYSTEM_ADDRESS');
        requireEnv('BLOCKCHAIN_RPC_URL');
    } else {
        if (!process.env.VOTING_SYSTEM_ADDRESS?.trim()) {
            console.warn('⚠️  VOTING_SYSTEM_ADDRESS is not set — contract listener and DID mint need it.');
        }
        if (!process.env.BLOCKCHAIN_RPC_URL?.trim()) {
            console.warn('⚠️  BLOCKCHAIN_RPC_URL is not set — using defaults in code paths may still fail.');
        }
    }
}

module.exports = {
    requireEnv,
    validateStartupEnvironment,
    isProduction,
};

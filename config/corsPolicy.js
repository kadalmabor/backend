/**
 * Shared CORS rules for Express and Socket.IO (must stay in sync).
 *
 * CORS_ORIGINS = comma-separated list, e.g. "https://app.com,https://admin.app.com"
 * FRONTEND_URL = single origin (fallback if CORS_ORIGINS not set)
 */
function buildCorsWhitelist(port) {
    const p = Number(port) || 3001;
    const baseWhitelist = process.env.CORS_ORIGINS
        ? process.env.CORS_ORIGINS.split(',').map((s) => s.trim()).filter(Boolean)
        : [process.env.FRONTEND_URL || 'http://localhost:3000'];

    return [
        ...baseWhitelist,
        `http://localhost:${p}`,
        `http://127.0.0.1:${p}`,
    ];
}

function isNonProduction() {
    return process.env.NODE_ENV !== 'production';
}

/**
 * @param {string|undefined} origin - Request Origin header (may be missing for same-origin / some clients)
 * @param {string[]} corsWhitelist - From buildCorsWhitelist
 */
function isAllowedOrigin(origin, corsWhitelist) {
    if (!origin) return true;

    if (corsWhitelist.some((url) => url === origin || url + '/' === origin || url === origin + '/')) {
        return true;
    }

    if (origin.endsWith('.up.railway.app') || origin.endsWith('.railway.app')) {
        return true;
    }

    if (isNonProduction()) {
        try {
            const u = new URL(origin);
            const hostname = u.hostname;
            if (hostname === 'localhost' || hostname === '127.0.0.1') return true;
            const parts = hostname.split('.').map(Number);
            if (parts[0] === 192 && parts[1] === 168) return true;
            if (parts[0] === 10) return true;
        } catch (_) {
            /* invalid URL */
        }
    }

    console.warn(`[CORS] Blocked request from origin: ${origin}`);
    return false;
}

/**
 * @param {number|string} port - Same as Express listen PORT (for Swagger / same-host origins)
 */
function createCorsPolicy(port) {
    const corsWhitelist = buildCorsWhitelist(port);
    const allow = (origin) => isAllowedOrigin(origin, corsWhitelist);

    return {
        corsWhitelist,
        isAllowedOrigin: allow,
        expressCorsOptions: {
            origin: (origin, callback) => {
                if (allow(origin)) {
                    callback(null, origin || corsWhitelist[0]);
                } else {
                    callback(new Error('Not allowed by CORS'));
                }
            },
            credentials: true,
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
            allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
            exposedHeaders: ['Content-Length', 'X-Foo', 'X-Bar'],
            preflightContinue: false,
            optionsSuccessStatus: 204,
        },
        /** Pass to Socket.IO Server constructor: { cors: socketIoCors } */
        socketIoCors: {
            origin: (origin, callback) => {
                if (allow(origin)) {
                    callback(null, true);
                } else {
                    callback(new Error('Not allowed by CORS'));
                }
            },
            methods: ['GET', 'POST', 'OPTIONS'],
            credentials: true,
        },
    };
}

module.exports = {
    buildCorsWhitelist,
    isAllowedOrigin,
    createCorsPolicy,
};

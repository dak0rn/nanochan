/**
 * Configuration service
 *
 * Provides access to the configuration.
 */
const { env = {} } = process;

module.exports = {
    port: env.PORT || 3000,
    host: env.HOST || '0.0.0.0',
    redis: env.REDIS_URL || ' redis://redis:6379',
    redisPrefix: 'app:',

    postgres: {
        connectionString: env.DATABASE_URL || 'postgres://nano:chan@postgres:5432/nanochan',
        ssl: !__DEV__,
    },
    pgPromiseOptions: {
        query(event) {
            if (!__DEV__) return;

            const qry = event.query.replace(/\n/g, '\n| ');
            require('./log').debug('Query executed:\n|', '\n| ' + qry + '\n|');
        },
    },
    csvPath: '/data',

    systemID: '00000000-0000-4000-a000-000000000000',

    security: {
        userSessionTTL: 60 * 60 * 9, // seconds

        // Settings for the token stored in the header
        userHeader: 'Authorization',
        authorizationScheme: 'NCTKN',

        // Settings for the token stored in a cookie
        userCookie: 'nctkn',
        cookieToken: env.COOKIE_TOKEN || '910238ADLSMA!@#_!@#dlaks//1@#_',
        userCookieOptions: {
            httpOnly: true,
            secure: !__DEV__,
            path: '/',
        },

        tokenLength: 32,

        // Prefixes for the mapping <userid>: <sessionid> in redis
        idPrefix: {
            user: 'user:',
        },

        // Prefix for the mapping <sessionid>: <user> in redis
        userSessionPrefix: 'usession:',
    },
};

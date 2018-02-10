/**
 * Session middleware
 */
const session = require('../services/session');
const { info } = require('../services/log');

const sessionMiddleware = async function(req, res, next) {
    const redis = req.app.get('redis');

    req.session = null;

    info('Loading user session from request');

    const user = await session.userSessionFromRequest(req, redis);

    if (!user) {
        info('No user found for that session');
    }
    else {
        info('Hello %s', user.name);
        req.session = user;
    }

    return next();
};

module.exports = function(server) {
    server.use(sessionMiddleware);
};

// Expose the functions for testing purpose
module.exports.sessionMiddleware = sessionMiddleware;

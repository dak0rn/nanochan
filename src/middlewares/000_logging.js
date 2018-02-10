/**
 * Logging middleware
 */
const { info } = require('../services/log');

const loggingMiddleware = function(req, res, next) {
    const { method, path } = req;
    const now = Date.now();

    res.on('finish', () => {
        const duration = Date.now() - now;

        info('%s %s [%s] took %s ms', method, path, res.statusCode, duration);
    });

    next();
};

module.exports = function(server) {
    server.use(loggingMiddleware);
};

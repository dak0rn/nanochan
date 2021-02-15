/**
 * Logging service
 */
const { createLogger, format, transports } = require('winston');

const logger = createLogger({
    level: __DEV__ ? 'debug' : 'info',
    format: format.combine(format.splat(), format.cli()),
    transports: [
        new transports.Console({
            timestamp: true,
        }),
    ],
});

// Export the logging functions but not the whole logger

['warn', 'info', 'log', 'debug'].forEach((level) => (exports[level] = logger[level].bind(logger)));

exports.error = function (message, error) {
    logger.error(message, error);
    if (error) {
        logger.error(error.stack);
    }
};

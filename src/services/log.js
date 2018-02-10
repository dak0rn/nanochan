/**
 * Logging service
 */
const winston = require('winston');

const logger = new winston.Logger({
    level: __DEV__ ? 'debug' : 'info',
    transports: [
        new winston.transports.Console({
            timestamp: true
        })
    ]
});

// Export the logging functions but not the whole logger

['error', 'warn', 'info', 'log', 'debug'].forEach(level => (exports[level] = logger[level].bind(logger)));

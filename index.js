/**
 * Server root
 *
 * Collects all routes and starts the server
 */
require('./evilGlobalVariables');

const glob = require('glob-promise');
const express = require('express');
const { partial } = require('lodash');
const bodyParser = require('body-parser');
const wrapCatch = require('express-catch');
const cookieParser = require('cookie-parser');
const minify = require('express-minify');
const compression = require('compression');

const Redis = require('ioredis');
const pgPromise = require('pg-promise');
const { info, error } = require('./src/services/log');
const config = require('./src/services/config');
const path = require('path');

const errmid = require('express-error-response');

const server = express();
const router = wrapCatch(server);

process.on('unhandledRejection', reason => {
    console.error('*** Unhandled promise rejection', reason);
});

/* Setup the application server */
server.use(bodyParser.urlencoded({ extended: true }));
server.use(cookieParser(config.security.cookieToken));

// Compress assets
server.use(compression());
server.use(minify());

// Use pug as templating engine
server.set('view engine', 'pug');
server.set('views', path.resolve(__dirname, 'src', 'views'));

// Serve static assets from public/
server.use(express.static('public'));

/* Building blocks */
const findRoutes = partial(glob, './src/routes/**/*.js', {
    ignore: './src/routes/**/*.test.js'
});
const findMiddlewares = partial(glob, './src/middlewares/**/*.js', {
    ignore: './src/middlewares/**/*.test.js'
});
const requireAndIntegrate = function(files, app) {
    files.forEach(file => {
        const fn = require(file);

        if ('function' === typeof fn) fn(app);
    });
};

const filterJsAndSort = function(files) {
    return files.filter(file => file.endsWith('.js')).sort();
};

/* Start ✨ */
info('Starting up...');
findMiddlewares()
    .then(middlewares => {
        requireAndIntegrate(filterJsAndSort(middlewares), router);
    })
    .then(() => findRoutes())
    .then(routes => {
        requireAndIntegrate(filterJsAndSort(routes), router);
    })
    .then(function() {
        /*
        * PostgreSQL connection is accessible using req.app.get('postgres')
        */
        info('Connecting to PostgreSQL...');
        const pgp = pgPromise(config.pgPromiseOptions);
        const db = pgp(config.postgres);

        server.set('postgres', db);
    })
    .then(function() {
        /*
         * Redis connection is accessible using req.app.get('redis')
         */
        info('Connecting to Redis...');
        server.set('redis', new Redis(config.redis));
    })
    .then(function() {
        // Register the error middleware
        const errorMiddleware = errmid({
            logger: error,
            json: true,
            catchAll: true,
            endRequest: true
        });

        server.use(errorMiddleware);

        /*
         * This is the last middleware and catches all 404s
         */
        server.use(function(req, res) {
            res.render('404', { session: req.session });
        });
    })
    .then(function() {
        info('Going to listen on %s:%s', config.host, config.port);
        server.listen(config.port, config.host);
    })
    .catch(reason => {
        error('Failed to start the server', reason);
    });

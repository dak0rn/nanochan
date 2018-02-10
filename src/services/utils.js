const { format, parse } = require('date-fns');
const pgp = require('pg-promise')(require('./config').pgPromiseOptions);
const fs = require('fs-extra');
const path = require('path');

const DATE_FORMAT = 'YYYY-MM-DD';

exports.DATE_FORMAT = DATE_FORMAT;

exports.pgp = pgp;

/**
 * Formats the given date using the given format.
 *
 * @param {string|Date} date Date to format
 * @param {string=} fmt Format, defaults to `YYYY-MM-DD`
 * @return {string} Formatted date
 */
exports.formatDate = function(date, fmt = DATE_FORMAT) {
    const theDate = date && Date === date.constructor ? date : new Date(date);

    return format(theDate, fmt);
};

/**
 * Parses the given date and returns a Date object.
 *
 * @param  {string} date Date to parse
 * @return {Date}      Parsed date
 */
exports.parseDate = function(date) {
    return parse(date);
};

const sqlFileRegex = /\.sql$/;
const noSqlExtRegex = /(.*)\.sql$/;
const sqlFile = name => !!name.match(sqlFileRegex);
const noSqlExt = name => name.match(noSqlExtRegex)[1];

/**
 * Loads queries from the SQL folder for the given service.
 * Returns them as an object where the filename (without .sql) is
 * the key and the pg-promise.QueryFile is the value.
 *
 * @param  {string} serviceName Name of the service.
 *                              Must have a `services/sql/${serviceName}` folder
 * @return {object}             Queries
 */
exports.loadQueries = function(serviceName) {
    const folder = path.resolve(__dirname, 'sql', serviceName);
    return fs
        .readdirSync(folder)
        .filter(sqlFile)
        .map(file => ({
            [noSqlExt(file)]: new pgp.QueryFile(path.resolve(folder, file), {
                debug: __DEV__
            })
        }))
        .reduce((acc, cur) => Object.assign(acc, cur), {});
};

/**
 * Redis abstraction service
 *
 * Implements several redis functions (see constructor for a list).
 * In non-transaction mode, the connection to redis must be passed
 * as the first argument, in transaction mode it can be omitted.
 * All other arguments are forwarded as-is to the redis server.
 */
const RedisConnection = require('ioredis');

class RedisService {
    constructor(connection) {
        this.$rds = connection;

        // Generate redis functions
        ['set', 'get', 'expire', 'del', 'ttl'].forEach(fn => {
            this[fn] = async function() {
                const { redis, args } = this._splitArgs(arguments);

                return await redis[fn].apply(redis, args);
            }.bind(this);
        });
    }

    // Transaction functions

    /**
     * Returns a new RedisService in transaction mode
     * with the given connection being set.
     * When invoking redis function, the connection does
     * not have to be given anymore.
     *
     * @param  {object} connection Redis connection
     * @return {RedisService}      RedisService in transaction mode
     */
    begin(connection) {
        return new RedisService(connection.multi());
    }

    /**
     * Commits the transaction
     *
     * @return {Promise}
     */
    async commit() {
        return this.$rds.exec();
    }

    /**
     * Given an arguments object, returns an object with an array
     * of arguments (`args`) and the redis connection (`redis`).
     * The latter is taken from either the arguments or from the
     * instance variable `this.$rds`.
     *
     * @param  {object} args `arguments` object
     * @return {object}      Object with properties `redis` and `args`
     */
    _splitArgs(args) {
        const array = [].slice.call(args);
        const redis = this._con(array[0]);

        return {
            redis,
            args: array[0] === redis ? array.slice(1) : array
        };
    }

    /**
     * Returns the redis connection for this instance.
     * Will return the given connection if it is one, and `this.$rds`
     * otherwise.
     *
     * @param  {object} possibleConnection A possible redis connection
     * @return {object}                    Redis connection
     */
    _con(possibleConnection) {
        if (possibleConnection instanceof RedisConnection) return possibleConnection;

        return this.$rds;
    }

    /**
     * Determines if the connection is in transaction mode
     *
     * @return {boolean}
     */
    _inTransaction() {
        return !!this.$rds;
    }
}

module.exports = new RedisService();

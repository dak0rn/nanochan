/**
 * User service
 */
const { loadQueries } = require('./utils');
const security = require('./security');

const queries = loadQueries('user');

/**
 * Creates a new user
 *
 * @param {string} username Name of the user
 * @param {string} password Password
 * @param {object} db Database connection
 */
exports.create = async function(username, password, db) {
    return db.tx(async trans => {
        const exists = await trans.one(queries.exists, { name: username });

        if (exists.exists) return null;

        const hash = security.hash(password).hash;

        const user = await trans.one(queries.createUser, { name: username, password: hash });

        return user;
    });
};

/**
 * Returns the user for the given username and password or
 * null if no user was found.
 *
 * @param {string} username Name of the user
 * @param {string} password Plain text password
 * @param {object} db Database connection
 */
exports.forCredentials = async function(username, password, db) {
    const user = await db.oneOrNone(queries.forCredentials, { username });

    if (!user) return null;

    if (!security.equals(password, user.password)) return null;

    delete user.password;
    return user;
};

/**
 * Service functions for the session management
 */
const rds = require('./redis');
const { sessionToken } = require('./security');
const config = require('./config');

const _userToken = token => `${config.security.idPrefix.user}${token}`;
const _sessionId = id => `${config.security.sessionPrefix}${id}`;

/**
 * Given a header and a cookie, returns the one set or null
 *
 * @param  {string} header Header
 * @param  {string} cookie Cookie value
 * @return {string}        Value to use or null
 */
const getToken = function(header, cookie) {
    const headerStart = `${config.security.authorizationScheme} `;

    if (header && header.startsWith(headerStart)) return header.substring(headerStart.length);

    if (cookie) return cookie;

    return null;
};

/**
 * Destroys the session of the given user.
 * Will fail silently if no session is present.
 *
 * @param  {object} user User
 * @param  {object} redis Redis connection
 * @return {Promise}
 */
exports.destroyUserSession = async function(user, redis) {
    const sessionToken = await rds.get(redis, _userToken(user.id_user));

    // No previous session?
    if (!sessionToken) return null;

    await rds.del(redis, _sessionId(sessionToken));
};

/**
 * Issues a new session token for the given user.
 * The token will be stored in redis, an old session
 * will be invalidated if any.
 *
 * @param  {object} user The user
 * @param  {object} redis Redis connection
 * @return {Promise}      Resolved with the token
 */
exports.issueUserToken = async function(user, redis) {
    const token = sessionToken();

    // Remove the token from the previous session
    await exports.destroyUserSession(user, redis);

    // Store the session mapping
    const trx = rds.begin(redis);
    await trx.set(_userToken(user.id_user), token);
    await trx.set(_sessionId(token), JSON.stringify(user), 'EX', config.security.userSessionTTL);
    await trx.commit();

    return token;
};

/**
 * Returns the user for the given token
 *
 * @param  {string} token Session token
 * @param  {object} redis Database connection
 * @return {object}       The user
 */
exports.userForToken = async function(token, redis) {
    const user = await rds.get(redis, _sessionId(token));

    if (!user) return null;

    return JSON.parse(user);
};

/**
 * Sets the configured token header for the given response
 * object.
 *
 * @param  {string} token Token to set
 * @param  {object} res   Response object
 * @return {object}       Returns `res.set()`
 */
exports.setUserSessionHeader = function(token, res) {
    return res.set(config.security.userHeader, `${config.security.authorizationScheme} ${token}`);
};

/**
 * Sets the session token as cookie for requests
 *
 * @param {string} token Token to set
 * @param {object} res   Response
 */
exports.setUserCookie = function(token, res) {
    return res.cookie(config.security.userCookie, token, config.security.userCookieOptions);
};

/**
 * Removes the session cookie from a given response
 *
 * @param {object} res Express response
 */
exports.removeUserCookie = function(res) {
    return res.clearCookie(config.security.userCookie);
};

/**
 * Determines the session token from the given request
 * and returns the corresponding user.
 * The session is automatically prolonged.
 *
 * @param  {object} req   Request
 * @param  {object} redis Redis connection
 * @param  {boolean=} prolong Prolong user session? Defaults to true
 * @return {object}       user
 */
exports.userSessionFromRequest = async function(req, redis, prolong = true) {
    const header = req.get(config.security.userHeader);
    const cookie = req.cookies[config.security.userCookie];
    const token = getToken(header, cookie);

    if (!token) return null;

    const user = await exports.userForToken(token, redis);

    if (!user) return null;

    if (prolong) await exports.prolongUserSession(token, redis);

    return user;
};

/**
 * Prolongs the session for the given session token
 *
 * @param  {string} token The session token
 * @param  {object} redis Database connection
 */
exports.prolongUserSession = async function(token, redis) {
    await rds.expire(redis, _sessionId(token), config.security.userSessionTTL);
};

/**
 * Updates the user object for the given user in the
 * session store.
 * Will return `false` if the user does not have a session.
 * The session is not prolonged.
 *
 * @param  {object} user New user with same primary key
 * @param  {object} redis Database connection
 * @return {boolean} Update status
 */
exports.updateUser = async function(user, redis) {
    const sessionToken = await rds.get(redis, _userToken(user.id_user));

    if (!sessionToken) return false;

    const remainingTtl = await rds.ttl(redis, _sessionId(sessionToken));

    // Only update if the user has a session at all
    if (remainingTtl > 0) await rds.set(redis, _sessionId(sessionToken), JSON.stringify(user), 'EX', remainingTtl);

    return true;
};

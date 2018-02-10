/**
 * The security service
 */
const bcrypt = require('bcrypt-nodejs');
const random = require('crypto-random-string');
const config = require('./config');

/**
 * Hashes the given plain text with a salt.
 *
 * @param {string} plaintext Plain text
 * @param {string=} salt Salt for the hashing. Generated if omitted.
 * @return {object} Hash object with properties `hash` and `salt`
 */
exports.hash = function(plaintext, salt = bcrypt.genSaltSync()) {
    return {
        salt,
        hash: bcrypt.hashSync(plaintext, salt)
    };
};

/**
 * Compares the given plain text with the hash
 *
 * @param {string} plaintext Plain text
 * @param {string} hash Password hash
 * @return {bool}
 */
exports.equals = function(plaintext, hash) {
    return bcrypt.compareSync(plaintext, hash);
};

/**
 * Middleware that ensures that only users can access the
 * corresponding route. Redirects to / if no user is present.
 */
exports.requireUser = function(req, res, next) {
    const user = req.session;

    if (!user || !user.id_user) return res.redirect('/');

    next();
};

/**
 * Middleware that ensures that requests with a session are
 * redirected to /.
 */
exports.redirectUsers = function(req, res, next) {
    if (req.session) res.redirect('/');
    else next();
};

/**
 * Returns a 256 bit unique session token
 *
 * @return {string} Session token
 */
exports.sessionToken = function() {
    return random(config.security.tokenLength);
};

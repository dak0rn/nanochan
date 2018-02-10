const { RequestError } = require('express-error-response');

const wrap = error => {
    if ('string' === typeof error) return { error };
    return error;
};

/**
 * Throws a bad request error (400)
 *
 * @param  {type} error Optional error that is sent to the client as response body.
 *                      If string, it will be wrapped into {body: content}, if undefined
 *                      an empty object is returned.
 * @return {undefined}
 */

exports.badRequest = function(error) {
    error = wrap(error || {});
    throw new RequestError('badRequest', error);
};

/**
 * Throws an unauthorized error (401)
 *
 * @param  {type} error Optional error that is sent to the client as response body.
 *                      If string, it will be wrapped into {body: content}, if undefined
 *                      an empty object is returned.
 * @return {undefined}
 */

exports.unauthorized = function(error) {
    error = wrap(error || {});
    throw new RequestError('unauthorized', error);
};

/**
 * Throws a forbidden error (403)
 *
 * @param  {type} error Optional error that is sent to the client as response body.
 *                      If string, it will be wrapped into {body: content}, if undefined
 *                      an empty object is returned.
 * @return {undefined}
 */

exports.forbidden = function(error) {
    error = wrap(error || {});
    throw new RequestError('forbidden', error);
};

/**
 * Throws a not found error (404)
 *
 * @param  {type} error Optional error that is sent to the client as response body.
 *                      If string, it will be wrapped into {body: content}, if undefined
 *                      an empty object is returned.
 * @return {undefined}
 */

exports.notFound = function(error) {
    error = wrap(error || {});
    throw new RequestError('notFound', error);
};

/**
 * Throws a method not allowed error (405)
 *
 * @param  {type} error Optional error that is sent to the client as response body.
 *                      If string, it will be wrapped into {body: content}, if undefined
 *                      an empty object is returned.
 * @return {undefined}
 */

exports.methodNotAllowed = function(error) {
    error = wrap(error || {});
    throw new RequestError('methodNotAllowed', error);
};

/**
 * Throws a precondition failed error (412)
 *
 * @param  {type} error Optional error that is sent to the client as response body.
 *                      If string, it will be wrapped into {body: content}, if undefined
 *                      an empty object is returned.
 * @return {undefined}
 */

exports.preconditionFailed = function(error) {
    error = wrap(error || {});
    throw new RequestError('preconditionFailed', error);
};

/**
 * Throws an internal server error (500)
 *
 * @param  {type} error Optional error that is sent to the client as response body.
 *                      If string, it will be wrapped into {body: content}, if undefined
 *                      an empty object is returned.
 * @return {undefined}
 */

exports.internalServerError = function(error) {
    error = wrap(error || {});
    throw new RequestError('internalServerError', error);
};

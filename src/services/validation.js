/**
 * Validation utilities
 */
const { debug } = require('./log');
const { parse, isValid } = require('date-fns');

const passwordRegex = /^.{8,64}$/;
const guidRegex = /^[0-9A-F]{8}-[0-9A-F]{4}-4[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i;
const objectIdRegex = /^[a-z0-9]{24}$/i;
const intervalRegex = /^\d{1,4} (seconds|minutes|hours|days|weeks|months|years)$/;
const hexRegex = /^[0-9A-Fa-f]*$/;
const numRegex = /^[-+]?[0-9]+$/;
const decimalRegex = /^[-+]?([0-9]+|\.[0-9]+|[0-9]+\.[0-9]+)$/;
const nameRegex = /^[a-z0-9]+$/;

/**
 * Determines if the given string matches the given regular expression.
 *
 * @param {string} what String to check
 * @param {RegExp} regex Regular expression
 * @return {boolean}
 */
const matches = (what, regex) => null !== what.match(regex);

/**
 * Creates a function that checks a given string agains the given
 * regular expression.
 *
 * @param {RegExp} regex Regular expression
 * @return {function} Function that checks
 */
const matcher = regex => what => 'undefined' !== typeof what && null !== what && matches('' + what, regex);

/**
 * Given a spec, returns a function that validates a given object.
 *
 * A spec is a mapping of the field name to
 * a) a function
 * b) a name of a built-in validation function
 * c) an array of functions or strings
 * d) an array of function invokation definitions
 *
 * Examples:
 *
 * const isValid = makeMatcher({
 *   username: 'username',                      // Built-in validator 'username'
 *   newsletter: 'boolean',                     // Built-in validator 'boolean'
 *   age: [['integer', 21, 65], 'optional'],    // Built-in validator 'integer' applied as integer(theValue, 21, 65). Field is optional
 *   surname: () => true,                       // Custom function
 *   forename: ['optional', [() => false, 5]]   // Custom function with additional argument and optional field
 * });
 *
 * isValid({username: 'john', newsletter: true}); // true
 * isValid({username: 'john', newsletter: false, age: 20 }) // false
 *
 * The key of the spec is the key of the object to be validated.
 *
 * @param {object} spec Validation spec
 * @param {object=} options Configration options
 * @param {boolean=} options.strict Strict mode? Will fail if the nubmer of keys is different.
 * @return {function} Function that expects an object
 */
exports.makeValidator = function(spec, options = {}) {
    const validatedFields = Object.keys(spec);

    // Normalize the spec
    const validators = validatedFields.reduce(function(validatorList, field) {
        const fns = (Array.isArray(spec[field]) ? spec[field] : [spec[field]]).map(function(validator) {
            const validatorDef = Array.isArray(validator) ? validator : [validator];
            const fn = validatorDef[0];

            if ('optional' === fn || 'optionalOrNull' === fn) return fn;

            if ('string' === typeof fn) return [exports[fn]].concat(validatorDef.slice(1));

            if ('function' === typeof fn) return validatorDef;

            throw new Error('Invalid function: ' + fn);
        });
        const isOptional = fns.includes('optional');
        const isOptionalOrNull = fns.includes('optionalOrNull');

        // Reduce the validators down to an array
        return validatorList.concat([
            function(body) {
                const value = body[field];

                // Check if it is optional
                if ('undefined' === typeof value && isOptional) {
                    if (__DEV__) debug('Skipping optional field %s', field);
                    return true;
                }

                if (null === value && isOptionalOrNull) {
                    if (__DEV__) console.warn('Skipping optional/null field %s', field);
                    return true;
                }

                const ctx = { body, field };

                // Execute all validators
                return fns.every(def => {
                    if ('optional' === def || 'optionalOrNull' === def) return true;

                    const fn = def[0];
                    const args = [value].concat(def.slice(1));

                    if (__DEV__) {
                        const valid = fn.apply(ctx, args);

                        if (!valid) debug('Validation failed', args, field, body);

                        return valid;
                    }

                    return fn.apply(ctx, args);
                });
            }
        ]);
    }, []);

    return function(body) {
        if (options.strict && !validatedFields.length === Object.keys(body).keys) {
            if (__DEV__)
                debug(
                    'Validation: Invalid; different number of keys in strict mode (spec: %s | body: %s)',
                    validatedFields.length,
                    Object.keys(body).length
                );
            return false;
        }

        return validators.every(validator => validator(body));
    };
};

/**
 * Creates a middleware that validates a request's body using the given
 * spec.
 *
 * @param {object} spec Validation spec
 * @param {string} redirectUrl URL to redirect to if the body is invalid
 * @return {function} Middleware function
 */
exports.validateRequest = function(spec, redirectUrl) {
    const valid = exports.makeValidator(spec);

    return function(req, res, next) {
        if (!valid(req.body)) return res.redirect(redirectUrl);

        next();
    };
};

/* Validator functions */

exports.password = matcher(passwordRegex);
exports.interval = matcher(intervalRegex);
exports.name = matcher(nameRegex);
exports.string = function(what, length = 0, max = Infinity) {
    if ('string' !== typeof what) return false;

    return what.length >= length && what.length <= max;
};
exports.object = what => 'object' === typeof what && null !== what && !Array.isArray(what);
exports.number = function(what, min = -Infinity, max = Infinity) {
    if ('number' !== typeof what || isNaN(what)) return false;

    return what >= min && what <= max;
};
exports.oneOf = function(what, list) {
    return list.includes(what);
};
exports.date = function(what) {
    return ('string' === typeof what || what instanceof Date) && isValid(parse(what));
};
exports.objectId = matcher(objectIdRegex);
exports.array = function(what) {
    return Array.isArray(what);
};
exports.guid = (function() {
    const validGuid = matcher(guidRegex);

    return function(what) {
        if (!what || 36 !== what.length) return false;

        return validGuid(what);
    };
})();
exports.boolean = what => 'boolean' === typeof what;
exports.exists = what => what && !!('' + what).length;
exports.arrayLength = function(what, length = 1) {
    return Array.isArray(what) && what.length >= length;
};
exports.guidArray = what => exports.array(what) && what.every(exports.guid);
exports.hex = matcher(hexRegex);

exports.true = what => true === what;

exports.isBetween = (what, list) => {
    const min = list[0];
    const max = list[1];

    if (!matcher(numRegex)(what) && !matcher(decimalRegex)(what)) return false;

    what = parseFloat(what);

    if (what < min) return false;

    if ('undefined' !== max && what > max) return false;

    return true;
};

exports.every = function(what, spec) {
    if (!exports.array(what)) return false;

    if ('string' === typeof spec) return what.every(w => exports[spec](w));

    if (exports.array(spec)) {
        return what.every(w => exports[spec[0]].apply(null, [w, spec.slice(1)]));
    }

    if ('object' === typeof spec) {
        const fn = exports.makeValidator(spec);
        return what.every(fn);
    }

    return false;
};

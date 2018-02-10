/**
 * Thread management
 */
const { loadQueries } = require('./utils');

const queries = loadQueries('thread');

/**
 * Creates a new thread
 *
 * @param {object} user Creating user
 * @param {string} title Post's title
 * @param {string} text Post text
 * @param {object} db Database connection
 * @return {GUID} Thread's unique ID
 */
exports.create = async function(user, title, text, db) {
    const res = await db.one(queries.create, {
        user_id: user.id_user,
        title,
        text
    });

    return res.id_thread;
};

/**
 * Returns the list of threads, ordered by time with user information
 *
 * @param {object} db Database connection
 * @return {array} List of posts
 */
exports.list = async function(db) {
    return await db.many(queries.list);
};

/**
 * Returns the thread with the given ID and its comments
 *
 * @param {UUID} id ID of the thread
 * @param {object} db Database connection
 * @return {array} Thread and posts
 */
exports.complete = async function(id, db) {
    return await db.oneOrNone(queries.complete, { id_thread: id });
};

/**
 * Creates a new comment for a thread
 *
 * @param {UUID} id Thread ID
 * @param {object} user Commenting user
 * @param {string} content Comment text
 * @param {object} db Database connection
 */
exports.comment = async function(id, user, content, db) {
    await db.none(queries.comment, {
        id_thread: id,
        id_user: user.id_user,
        content
    });
};

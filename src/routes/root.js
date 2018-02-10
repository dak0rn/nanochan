/**
 * Root route
 */
const { info, error } = require('../services/log');
const thread = require('../services/thread');

const renderRoot = async function(req, res) {
    try {
        info('Loading all threads');
        const threads = await thread.list(req.app.get('postgres'));

        res.render('index', {
            session: req.session,
            threads,

            // Because filters + express are annoying, we do it this way
            datefns: require('date-fns')
        });
    } catch (e) {
        error('Failed to list threads', e);
        res.redirect('/500');
    }
};

module.exports = function(server) {
    server.get('/', renderRoot);
};

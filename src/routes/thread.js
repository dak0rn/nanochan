/**
 * Root route
 */
const { info, error } = require('../services/log');
const thread = require('../services/thread');
const validation = require('../services/validation');
const security = require('../services/security');

const renderThread = async function(req, res) {
    const { id } = req.params;

    if (!validation.guid(id)) return res.redirect('/404');

    try {
        info('Loading thread %s', id);
        const theThread = await thread.complete(id, req.app.get('postgres'));

        if (!theThread) return res.redirect('/404');

        res.render('thread', {
            session: req.session,
            thread: theThread,
            datefns: require('date-fns')
        });
    } catch (e) {
        error('Failed to list threads', e);
        res.redirect('/500');
    }
};

const commentSpec = {
    text: [['string', 1]]
};
const comment = async function(req, res) {
    const { id } = req.params;

    if (!validation.guid(id)) return res.redirect('/404');

    try {
        info('Commenting on thread %s', id);
        await thread.comment(id, req.session, req.body.text, req.app.get('postgres'));

        res.redirect(`/thread/${id}`);
    } catch (e) {
        error('Failed to list threads', e);
        res.redirect('/500');
    }
};

module.exports = function(server) {
    server.get('/thread/:id', renderThread);
    server.post('/thread/:id', security.requireUser, validation.validateRequest(commentSpec, '/'), comment);
};

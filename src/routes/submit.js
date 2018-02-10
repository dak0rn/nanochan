/**
 * Submitting new posts
 */
const security = require('../services/security');
const thread = require('../services/thread');
const { validateRequest } = require('../services/validation');
const { info, error } = require('../services/log');

const submit = async function(req, res) {
    res.render('submit', {
        session: req.session
    });
};

const createThreadSpec = {
    title: [['string', 1, 255]],
    text: [['string', 1]]
};
const createThread = async function(req, res) {
    try {
        const { text, title } = req.body;

        info('Creating a new thread %s', text);
        const tid = await thread.create(req.session, title, text, req.app.get('postgres'));

        res.redirect(`/thread/${tid}`);
    } catch (e) {
        error('Failed to create', e);
        res.redirect('/500');
    }
};

module.exports = function(server) {
    server.get('/submit', security.requireUser, submit);
    server.post('/submit', security.requireUser, validateRequest(createThreadSpec, '/submit?invalid=y'), createThread);
};

/**
 * Session management
 */
const { validateRequest } = require('../services/validation');
const user = require('../services/user');
const session = require('../services/session');
const security = require('../services/security');
const { error, info } = require('../services/log');

const renderSignin = async function(req, res) {
    if (req.session) {
        res.redirect('/');
        return res.end();
    }

    res.render('signin', {
        userExists: !!req.query['user-exists'],
        signinDataInvalid: !!req.query['signin-invalid'],
        signinFailed: !!req.query['failed'],
        signupDataInvalid: !!req.query['signup-invalid']
    });
};

const signupSpec = {
    password: 'password',
    name: 'name'
};
const signup = async function(req, res) {
    const { name, password } = req.body;
    const pg = req.app.get('postgres');
    const redis = req.app.get('redis');

    try {
        info('Creating a new user %s', name);
        const theUser = await user.create(name, password, pg);

        if (!theUser) return res.redirect('/signin?user-exists=y');

        const sessionToken = await session.issueUserToken(theUser, redis);
        session.setUserCookie(sessionToken, res);
        res.redirect('/');
    } catch (e) {
        error('Failed to create the user', e);
        res.redirect('/500');
    }
};

const signinSpec = {
    password: 'password',
    name: 'name'
};
const signin = async function(req, res) {
    const { name, password } = req.body;
    const pg = req.app.get('postgres');
    const redis = req.app.get('redis');

    try {
        info('Creating a session for %s', name);
        const theUser = await user.forCredentials(name, password, pg);

        if (!theUser) return res.redirect('/signin?failed=y');

        const sessionToken = await session.issueUserToken(theUser, redis);
        session.setUserCookie(sessionToken, res);

        res.redirect('/');
    } catch (e) {
        error('Failed to create the user', e);
        res.redirect('/500');
    }
};

const signout = async function(req, res) {
    const { session: theUser, app } = req;

    await session.destroyUserSession(theUser, app.get('redis'));

    session.removeUserCookie(res);
    res.redirect('/');
};

module.exports = function(server) {
    server.get('/signin', security.redirectUsers, renderSignin);
    server.post('/signup', security.redirectUsers, validateRequest(signupSpec, '/signin?signup-invalid=y'), signup);
    server.post('/signin', security.redirectUsers, validateRequest(signinSpec, '/signin?signin-invalid=y'), signin);
    server.get('/signout', security.requireUser, signout);
};

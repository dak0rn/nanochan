/**
 * 500 route
 */
const { error } = require('../services/log');

const render = async function(req, res) {
    error('Something is not right!');
    res.render('500', {
        session: req.session
    });
};

module.exports = function(server) {
    server.get('/500', render);
};

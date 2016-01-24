'use strict';

const Wreck = require('wreck');

exports.login = function (request, reply) {

    const apiUrl = `${ this.apiBaseUrl }/login`;

    Wreck.post(apiUrl, {
        payload: JSON.stringify(request.payload),
        json: true
    }, (err, res, payload) => {

        if (err) {
            throw err;
        }

        if (res.statusCode !== 200) {
            reply.redirect(`${ this.webBaseUrl }/login`);
        }
        else {
            request.session.set('user', {
                loggedIn: true,
                token: payload.token
            });

            reply.redirect(this.webBaseUrl);
        }
    });
};

exports.createRecipe = function (request, reply) {

    const apiUrl = `${ this.apiBaseUrl }/recipes`;
    const token = request.session.get('user').token;

    Wreck.post(apiUrl, {
        payload: JSON.stringify(request.payload),
        headers: {
            'Authorization': `Bearer ${ token }`
        }
    }, (err, res, payload) => {

        if (err) {
            throw err;
        }

        reply.redirect(this.webBaseUrl);
    });
};

exports.logout = function (request, reply) {

    request.session.clear('user');
    reply.redirect(this.webBaseUrl);
};

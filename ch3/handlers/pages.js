'use strict';

const Wreck = require('wreck');

exports.home = function (request, reply) {

    const apiUrl = `${ this.apiBaseUrl }/recipes`;

    Wreck.get(apiUrl, { json: true }, (err, res, payload) => {

        if (err) {
            throw err;
        }

        reply.view('index', {
            recipes: payload,
            user: request.session.get('user')
        });
    });
};

exports.viewRecipe = function (request, reply) {

    const apiUrl = `${ this.apiBaseUrl }/recipes/${ encodeURIComponent(request.params.id) }`;

    Wreck.get(apiUrl, { json: true }, (err, res, payload) => {

        if (err) {
            throw err;
        }

        reply.view('single', {
            recipe: payload,
            user: request.session.get('user')
        });
    });
};

exports.login = function (request, reply) {

    reply.view('login');
};

exports.createRecipe = function (request, reply) {

    reply.view('create', {
        user: request.session.get('user')
    });
};

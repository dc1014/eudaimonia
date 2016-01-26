'use strict';

const Boom = require('boom');
const Hapi = require('hapi');
const Joi = require('joi');
const Path = require('path');

const server = new Hapi.Server();
server.connection({ port: 4000 });

server.route([{
    method: 'GET',
    path: '/error',
    handler: (request, reply) => reply(new Error('OH NO SOMETHING TERRIBLE!'))
}, {
    method: 'GET',
    path: '/newFeature',
    handler: (request, reply) => reply(Boom.notImplemented())
}, {
    config: {
        validate: {
            params: {
                name: Joi.string().min(4)
            }
        }
    },
    method: 'GET',
    path: '/name/{name}',
    handler: (request, reply) => reply('OK!')
}]);

server.ext('onPreResponse', (request, reply) => {

    if (request.response.isBoom) {

        const err = request.response;
        const errName = err.output.payload.error;
        const statusCode = err.output.payload.statusCode;

        return reply.view('error', {
            statusCode,
            errName
        })
        .code(statusCode);
    }

    reply.continue();
});

server.register(require('vision'), () => {

    server.views({
        engines: {
            hbs: require('handlebars')
        },
        path: Path.join(__dirname, 'templates')
    });

    server.start(() => console.log(`Server running at ${ server.info.uri }`));
});

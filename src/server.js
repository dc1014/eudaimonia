'use strict';

const Hapi = require('hapi');

const server = new Hapi.Server();

server.connection({
    host: 'localhost',
    port: 8088
});

server.route({
    method: 'GET',
    path: '/',
    handler: function (request, reply) {

        return reply('hi daniel');
    }
});

server.start((err) => {

    if (err) {
        throw err;
    }
    console.log(`Server running at: ${server.info.uri}`);
});

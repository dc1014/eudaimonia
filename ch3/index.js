'use strict';

const Hapi = require('hapi');

const server = new Hapi.Server();
server.connection({ port: 4000 });

server.bind({
    apiBaseUrl: 'http://localhost:4000/api',
    webBaseUrl: 'http://localhost:4000'
});

server.register([
    require('dindin-api'),
    require('inert'),
    require('vision'),
    {
        register: require('yar'),
        options: {
            cookieOptions: {
                password: 'password',
                isSecure: false
            }
        }
    }
], (err) => {

    if (err) {
        throw err;
    }

    server.views({
        engines: {
            hbs: require('handlebars')
        },
        relativeTo: __dirname,
        path: './views',
        helpersPath: './views/helpers',
        layoutPath: './views/layout',
        layout: true,
        isCached: false,
        partialsPath: './views/partials'
    });

    server.route(require('./routes'));

    server.start(() => console.log(`Started server at ${server.info.uri}`));
});

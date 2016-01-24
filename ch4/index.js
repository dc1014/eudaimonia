'use strict';

const Hapi = require('hapi');
const Path = require('path');
const AcceptLanguage = require('accept-language');

const server = new Hapi.Server();
server.connection({ port: 4000 });

server.register(require('vision'), (err) => {

    if (err) {
        throw err;
    }

    server.views({
        engines: {
            hbs: require('handlebars')
        },
        path: Path.join(__dirname, 'templates')
    });

    server.route([
        {
            method: 'GET',
            path: '/',
            handler: (request, reply) => {

                const supportedLanguages = ['en', 'fr', 'zh'];
                const defaultLanguage = 'en';
                const templateBasename = 'index';

                const acceptLangHeader = request.headers['accept-language'];
                const langs = AcceptLanguage.parse(acceptLangHeader);

                for (let i = 0; i < langs.length; ++i) {
                    if (supportedLanguages.indexOf(langs[i].language) !== -1) {
                        return reply.view(`${ templateBasename }_${ langs[i].language }`);
                    }
                }

                reply.view(`${ templateBasename }_${ defaultLanguage }`);
            }
        }
    ]);

    server.start(() => console.log('Server started!'));
});

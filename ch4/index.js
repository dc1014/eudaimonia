'use strict';

const Hapi = require('hapi');
const Path = require('path');
const AcceptLanguage = require('accept-language');

const server = new Hapi.Server({
    app: {
        il8n: {
            supportedLangs: ['en', 'fr', 'zh'],
            defaultLang: 'en'
        }
    }
});

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

    server.handler('il8n-view', (route, options) => {

        const view = options.view;

        return function (request, reply) {

            const settings = server.settings.app.il8n;

            const langs = AcceptLanguage.parse(request.headers['accept-language']);

            for (let i = 0; i < langs.length; ++i) {
                if (settings.supportedLangs.indexOf(langs[i].language) !== -1) {
                    return reply.view(`${ view }_${ langs[i].language }`, options.context);
                }
            }

            reply.view(`${ view }_${ settings.defaultLang }`, options.context);
        };
    });

    server.route([
        {
            method: 'GET',
            path: '/',
            handler: {
                'il8n-view': {
                    view: 'index'
                }
            }
        }, {
            method: 'GET',
            path: '/sayHello',
            handler: {
                'il8n-view': {
                    view: 'index',
                    context: { name: 'daniel' }
                }
            }
        }
    ]);

    server.start(() => console.log('Server started!'));
});

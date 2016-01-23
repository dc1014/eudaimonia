'use strict';

const Hapi = require('hapi');
const Glue = require('glue');

// L'internals

const internals = {
    manifest: {
        connections: [{
            port: 8088,
            labels: ['http']
        }, {
            port: 8088,
            labels: ['api']
        }],
        plugins: {
            bell: [{ 'select': 'http' }],
            blipp: [{}],
            'hapi-auth-cookie': [{ 'select': 'http' }],

            './authentication': [{ 'select': ['http', 'api'] }],

            './controllers': [{ 'select': ['http', 'api'] }],

            './models': [{ 'select': ['http', 'api'] }],

            './routes': [{ 'select': ['http'] }],

            './api': [{ 'select': ['api'] }],

            good: {
                opsInterval: 5000,
                reporters: [{
                    'reporter': 'good-console',
                    'events': { 'ops': '*', 'log': '*' }
                }]
            }
        }
    }
};

Glue.compose(internals.manifest,
    { relativeTo: __dirname }, (err, server) => {

        if (err) {
            console.log(`server.register err: ${err}`);
        }

        server.start(() => {

            console.log('hi, i\'m a hapi server!');
        });
    });

// const Async = require('async');
// const Bell = require('bell');
// const Blipp = require('blipp');
// const HapiAuthCooke = require('hapi-auth-cookie');
// const Hoek = require('hoek');
// const Api = require('./api');
// const Authentication = require('./authentication');
// const Controllers = require('./controllers');
// const Models = require('./models');
// const Routes = require('./routes');

// exports.init = function (callback) {

//     const server = new Hapi.Server();
//     server.connection(internals.servers.http);
//     server.connection(internals.servers.api);

//     server.path(internals.options.files.relativeTo);

//     server.on('request-error', (request, response) => {

//         console.log('request-error:');
//         console.dir(response);
//     });

//     const registerHttpPlugins = function (next) {

//         server.register([
//             Bell,
//             Blipp,
//             HapiAuthCooke,
//             Authentication,
//             Controllers,
//             Models,
//             Routes
//         ],
//         { select: 'http' },
//         (err) => {

//             return next(err);
//         });
//     };

//     const registerApiPlugins = function (next) {

//         server.register([
//             Blipp,
//             Controllers,
//             Models,
//             Api
//         ],
//         { select: 'api' },
//         (err) => {

//             return next(err);
//         });
//     };

//     Async.auto({
//         http: registerHttpPlugins,
//         api: registerApiPlugins
//     }, (err, data) => {

//         if (err) {
//             console.log(`server.register err: ${err}`);
//             return callback(err);
//         }

//         server.start(() => {

//             return callback(null, server);
//         });
//     });

//     exports.init(Hoek.ignore);
// };

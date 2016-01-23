'use strict';

const Async = require('async');
const Bell = require('bell');
const Blipp = require('blipp');
const Hapi = require('hapi');
const HapiAuthCooke = require('hapi-auth-cookie');
const Hoek = require('hoek');
const Api = require('./api');
const Authentication = require('./authentication');
const Controllers = require('./controllers');
const Models = require('./models');
const Routes = require('./routes');

const internals = {
    servers: {
        http: {
            port: 8088,
            host: '0.0.0.0',
            labels: ['http']
        },
        api: {
            port: 8088,
            host: '0.0.0.0',
            labels: ['api']
        }
    },
    options: {
        files: {
            relativeTo: __dirname
        }
    }
};

exports.init = function (callback) {

    const server = new Hapi.Server();
    server.connection(internals.servers.http);
    server.connection(internals.servers.api);

    server.path(internals.options.files.relativeTo);

    server.on('request-error', (request, response) => {

        console.log('request-error:');
        console.dir(response);
    });

    const registerHttpPlugins = function (next) {

        server.register([
            Bell,
            Blipp,
            HapiAuthCooke,
            Authentication,
            Controllers,
            Models,
            Routes
        ],
        { select: 'http' },
        (err) => {

            return next(err);
        });
    };

    const registerApiPlugins = function (next) {

        server.register([
            Blipp,
            Controllers,
            Models,
            Api
        ],
        { select: 'api' },
        (err) => {

            return next(err);
        });
    };

    Async.auto({
        http: registerHttpPlugins,
        api: registerApiPlugins
    }, (err, data) => {

        if (err) {
            console.log(`server.register err: ${err}`);
            return callback(err);
        }

        server.start(() => {

            return callback(null, server);
        });
    });

    exports.init(Hoek.ignore);
};

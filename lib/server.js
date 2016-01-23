'use strict';

var _hapi = require('hapi');

var _hapi2 = _interopRequireDefault(_hapi);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var server = new _hapi2.default.Server();

server.connection({
    host: 'localhost',
    port: 8088
});

server.route({
    method: 'GET',
    path: '/',
    handler: function handler(request, reply) {
        return reply('hi daniel');
    }
});

server.start(function (err) {
    if (err) {
        throw err;
    }
    console.log('Server running at: ' + server.info.uri);
});
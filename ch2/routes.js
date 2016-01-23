'use strict';

const Recipes = require('./handlers/recipes');

module.exports = [{
    method: 'GET',
    path: '/api/recipes',
    handler: Recipes.find
}, {
    method: 'GET',
    path: '/api/recipes/{id}',
    handler: Recipes.findOne
}, {
    method: 'POST',
    path: '/api/recipes',
    config: {
        auth: 'api',
        payload: {
            output: 'data'
        }
    },
    handler: Recipes.create
}, {
    method: 'POST',
    path: '/api/recipes/{id}/star',
    config: {
        auth: 'api',
        payload: {
            output: 'data'
        }
    },
    handler: Recipes.createStar
}];

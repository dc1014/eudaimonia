# ROUTING! AWW YEA.

## Seriously though, Ordering and Conflicting Routes

In lamesauce Express, order of routes matters. Unexpected behavior, ahoy!

In an IDEAL WORLD, routes should really be independent from each other, because they are separate concerns.

Hapi thus categorizes each route and constructs a data structure known as a *routing table*. No matter which order routes are added, same routing table is constructed.

Hence, **deterministic routing system** provides freedom to structure app in any system.

Also, hpai doesn't let you create conflicting routes (nice!). Conflicting routes are defined as equivalent routes in its routing algorithm. If you try it, e.g.

```
var Hapi = require('hapi');
var server = new Hapi.Server();
server.connection({ port: 4000 });
server.route([
{
        method: 'GET',
        path: '/',
        handler: function (request, reply) {}
}, {
        method: 'GET',
        path: '/',
        handler: function (request, reply) {}
}
]);

server.start(function () {
    console.log('Server started!');
});
```
You get `Error: New route / conflicts with existing /` Cool!

So, routes always contain **methods**. No surprise there. Methods include

* GET
* POST
* PUT
* DELETE

No suprise here, either. Less popular ones...

* PATCH
* OPTIONS

Anywho, routes can be supplied multiple methods, and the method can be referenced on the request object, i.e. `request.method`.

```
server.route({
    method: ['GET', 'POST'],
    path: '/',
    handler: function (request, reply) {

        var method = request.method;
        reply('Handler was called for a ' + method + ' request');
    }
});
```

## Parameterized Paths

So, paths can have parameters which get interpoloated per request. This interpolated value is called an *identifier*, e.g.

`/pastries/{id}/ingredients`

### Partial Segment Parameters

Partial path segment can be parametrized. A *path segmetn* is a single uinit of a path separated from neighbouring segments by a / character. In path /mary/had/a/little/lamb, segments are mary, had, a, little, and lamb.

Sometimes part of path we want to parameterize might not be complete segment. For example, might want to allow user to specifcy file extension for a site which serves images.

Thus, parameterization can occur multiple times within a particular segment

```
server.route({
    method: 'GET',
    path: '/nature/flowers/orchise/{image}.{ext}',
    handler: (request, reply) {

        //ignoring uri encoding

        const images = request.params.image
        const ext = request.params.ext;

        reply(`You requested ${image}.${ext}`);

    }
});
```
**HOWEVER, MULTIPLE PARAMETERS WITHIN A SINGLE SEGMENT MUST BE SEPARATED BY A VALID CHARACTER!** Reasoning is that hapi would not know hotw to break final segment into parameters without a separator

### Multiple Params

You can go crazy-go-nuts with segment parameters, e.g. generate a hierarchy! Obvious example:

```
server.route({
    method: 'GET',
    path: '/{category}/{subcat1}/{subcat2}/{image}.{ext}',
    ...
});
```
Except there's an even better shorthand for this...

`path: '/{category*3}/{image}.{ext}'`

Which would take the first three segements of a request and make:

```
{
category: '/nature/flowers/roses',
image: 'dog-rose',
ext: 'jpg'
}
```

### Optional Params

They are following by a ? to indicate they are optional. Programmer than checks for existence of optional params via `request.params.FOO` and provides a different reply, e.g.

```
server.route({
    method: 'GET',
    path: '/team/{name?}',
    handler: function (request, reply) {

    if (request.params.name) {
        return reply('Showing ' + request.params.name + '\'s page');
    }

    return reply('Showing the whole team page!');
    }
});
```

Usecases include:

* Single route to fetch a single resource or multiple resources
* An optional flag, which takes a default value when flag is not present

### Wildcards!

Throw an asterix on it, dawg. Usecases include:

* Don't know how deeply nested a path is going to be, but still want to match all possibilities within a single route
* Custom 404 pages

Example was serving static content of directory with `path: '/{path*}'`. Matches any GET request to server, and makes entire path available in `request.params.path`. Catch all! Good for 404s.

**NOTE: Catch-alls do not conflict with other routes. BUT WHY, ERAN HAMMER?**

Answer: The routing algorithm.

### Routing Algorith!

Every route added to `server.route()` gets into the *routing table*. Every connection has its own copy of the routing table.

When a route is added, router will split apart the route's path into segments and analyze each one. Each segment is then categorised. See below:

```
Path: /document Segments: document ^ literal
Path: /document/{id} Segments: document, {id} ^ literal ^ param
Path: /document/{id}.xml Segments: document, {id}.xml ^ literal ^ mixed
Path: /document/{path*} Segments: document, {path*} ^ literal ^ wildcard
```

This is a simplified version of what hapi actually does, but I get the drift.

So when a request is received, the path of incoming request is split again. Each segment is examined, and router will narrow down list of possible routes. Based on above, a request for `/document/mydoc.xml` will match all 4 routes for segment 1, then 3 latter routes for segment 2.

At this point, all segment have been initially analyzed without category data. Now, hapi will chose the most specific route by ranking different segment types.

The ranking goes from most to least specific

1. Literal segment
2. Mixed segment
3. Param segment
4. Wildcard segment

Thus, the above route with mixed segment is winrar. There's always going to be a clear winner for the route because **deterministic routing**. Bog bless it.

## Handlin' Custom Handlers

So basic handler has signature (request, reply). Also, there are built in handlers such as `directory: {path: myPath}`.

But what if you really want to get fancy (and you can't just curry everything, I suppose)? Use cases may include:

* supporting multiple languages

### Internationalization Support

Support for i18n would be cool, yo. Isn't built into hapi, so why not add?

So we create a hbs template for every main language with a suffix added to file name, i.e. `index_lang.hbs`.

In order to support this, we need to look at the **Accept-Language** hgeader value, which specifies the user's preferred langs with a weighting or priority (called a "quality factor" in HTTP spec, denoted by q). Example is:

`Accept-Language: da, en-gb;q=0.8, en;q=0.7`

Which in English - danish > british english > any english

There's a node package for dealing with this called `accept-language`. Quality score is between 0-1, 1 being best.

So process is to

1. Check for Accept-Language header
    * If no server default
2. Find a matching template for next preferred language?
    * If yes, serve template
    * If no, check more languages
3. If all languages exhausted and no match, serve default.

So translated into code:

```
server.route([
{
    method: 'GET',
    path: '/',
    handler: function (request, reply) {

        var supportedLanguages = ['en', 'fr', 'zh'];
        var defaultLanguage = 'en';
        var templateBasename = 'index';


        var acceptLangHeader = request.headers['accept-language'];
        var langs = AcceptLanguage.parse(acceptLangHeader);

        for (var i = 0; i < langs.length; i++) {

            if (supportedLanguages.indexOf(langs[i].language) !== -1) {
                return reply.view(templateBasename + '_' + langs[i].language);
            }
        }

        reply.view(templateBasename + '_' + defaultLanguage);
    }
]);
```


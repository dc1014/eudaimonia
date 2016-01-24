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

So the current method sucks because boilerplate. Look at that loop. So let's make a new, customer handler with the `server.handler()` method (wow I don't have to curry everything).

`server.handler(name, method)` is the signature. method is an object which will have signature of `(route, options)`. **View names are passed in through options.**

So, rip the logic out into the handler. In the future, coudl remove settings object from handler. Better to keep configs in a central location...declarative and all.

So when creating a hapi server, can supply the app object in new server config object, with any custom configs. Accessible via `server.settings.app`
Even better hapi let built-in view handler lets a context object, to be used as context when rendering the view.

## SERVER METHODS

**Now we're talking!**

Functions attached to hapi server object. Can be accessed and called from whenerver server object is in scope. *Intended to be called from route handlers.*

Use cases include:

* server-side caching!
* route prerequisites!
* uhhh...math?

Example:

```
server.route({
    method: 'POST',
    path: '/avg',
    handler: (request, reply) => {
        const values = request.payload.values;
        const sum = 0;

        for (let i = 0; i < values.length; ++i) {
            sum += values[i];
        }

        const mean = sum / values.length;

        reply({ mean });
    }
});
```

So let's say I want to reuse mean functionality. Enter `server.method()` ...method. Has a signature of 3 args, `server.method('name', function (...args, callback), { options })`. Where callback has a signature of `function(err, result)` and err is optional. Reply will occur within callback of the method (to keep Zalgo contained).

Allows rewrite of above func as:

```
const mean = function (values, next) {
    const sum = 0;

    for (let i = 0; i < values.length; ++i) {
        sum += values[i];
    }

    return next(null, sum / values.length);
};

server.method('mean', mean, {});

server.route({
    method: 'POST',
    path: '/avg',
    handler: (request, reply) => {

        server.methods.mean(request.payload.values, (err, mean) => {

            reply({ mean });
        });
    }
});
```

An alternative syntax would be:

```
server.method({
    name: 'mean',
    method: mean,
    options: {}
});
```

**`server.method()` also takes an array!**

```
const methods = [
    {
        name: 'potato',
        method: spud,
        options: {}
    }, {
        name: 'hot-potato',
        method: burn,
        options: {}

    }
];

server.method(methods);
```

## Route Prerequisites

So callbacks. You love them, you hate them, you love to hate them (Wonder how Hapi and promises get along?).

Hapi has a feature called *route prerequisites** which help simplify workflows involving multiple steps which must execute sequentially or in parallel.

cool!

For example, you could have a sequential workflow which is done concurrently or "in parallel" with another workflow. Natively, this is done by setting ugly boolean checks in the encompassing scope, and then the callbacks are responsible for checking these booleans.

So route prereqs. `pre` for short as key in the route's config object. `pre` takes an array of tasks which have keys of `assign: 'name', method: function(request, reply)`. The prereqs are then available on the request object as `request.pre.name` where its value is the evaluation of the assigned method.

Ideal for handling fs calls and that sort of stuff. *Now, combine this with registering`server.method()`, and supply the method to pre. Nice!*

### Multiple Serial Prereqs

Okay, so let's say you need to chain this stuff. Example: decrypt a payload:

1. Read secret key from a .txt
2. Decrypt payload
3. translate
4. execute handler

OKAY! SO HERE'S THE MAGIC.

1. **Supply the data to reply in each method.**
2. **Give `pre` an array of methods.**
3. **celebrate**

### Parallel Prereqs

Much more interesting. Let's say key is split in half.

**GUESS WHAT? Just give the `pre` array an array of things you want done in parallel. SO SIMPLE**

The methods will reply with the same process as sequential. BUT! The method which receives their replies needs to reference the results from each by name on the request object passed to the method, i.e. `const key = request.pre.readKey1 + request.pre.readKey2`

Skipping exercises as they are tedious.

## Managing File Uploads!

So, hapi by default attempts to parse payload from an upcoming request based upon the existence and value of the content-type header. Examples include:

* application/x-www-form-urlencoded (html forms)
* application/json
* multipart/form-data (for files!)

This is expressed by setting the `enctype` attribute on the form tag.

`<form enctype="multipart/form-data" action="/upload" method="post">`

**Remember, hapi needs to be told how to handle payloads in config.payload object**

Default values are `{ output: data, parse: true }`. Multipart/form-data is also parsed by default, *but the way this is consumed depends on payload.output option in the config!*

* `{ output: 'data' }`
    * reads files into memory,
    * waiting until entire payload has been received and read into memory,
    * attempting to parse each of the parts of the form into `request.payload`.
    * Any text fields are strings.
    * contents of uploaded files are:
        * strings (for files with a text mime type such as text/plain)
        * node.js Buffers (for all other types)

### File qua string

So let's say request has `request.payload.upload` and { output: 'data' } is set. You get a string, which could be used with Fs.writeFile.

* When doing this, hapi drops content-type of name of file that has been uploaded. Only useful for when contents are all that matters*

### File qua stream

If `{ output: stream }` then hapi parses all text fields into strings in request.payload. All file uploads will be node stream objects. Stream objects will have new property `hapi` which is added by framework.

* `hapi.filename` will also be equal to filename of uploaded file.
* `hapi.headers['content-type'] is also available.

So then just pipe the stream into a writeStream and you're done!

### 3rd way - The file option with `payload.output`

With `file` option hapi saves any files uploaded through multipart to FS as temp files, provides info (incluing path) inside the request.payload object. Any text fields are strings as with above options.

The files will be saved inside dir specified by `payload.uploads` route config option. The default is value of `Os.tmpDir()` which is usually `//temp` on Wandows and `/tmp` for all sane operating systems.

each saved file inside request.payload is an object with following props:

* filename - filename of original file
* path - path to temp save
* headers - headers for file including content-type
* bytes - l'size of l'file.

Example:

```
server.route({
    config: {
        payload: {
            parse: true,
            output: 'file'
        }
    },
    method: 'POST',
    path: '/upload',
    handler: function (request, reply) {

        cosnt uploadName = request.payload.upload.filename;
        cosnt uploadPath = request.payload.upload.path;
        cosnt destination = Path.join(__dirname, 'uploads', uploadName);

        Fs.rename(uploadPath, destination, (err) => {

            if (err) {
                throw err;
            }

            reply('ok');
        });
    }
});
```

**So, in short, it just temps everything and you decide what to do with it.**

### Additional Payload Settings

Aside from `parse` and `output` others include:

* `maxBytes`
    * total payload size allowable.
    * if exceeded 400 reponse.
    * defaults to 1 MB
* `timeout`
    * max time in milliseconds allowed for receiving full payload
    * if exceeded 408 response and handler terminated
    * defaults to 10 seconds

No upper limits! Be rational about this.






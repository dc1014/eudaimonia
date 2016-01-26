# Understanding Requests and Response

* Request lifecycle
* Extension points
* Reply interface
* Response object
* Handling and communicating errors

## So What's the deal with request?

The request object partially determines how the request should be handled, e.g. JSON or XML according ot `Accept` header in the request.

Requests are an object. Everything important about them is stored in the request. The request is passed around in the application to various methods.

Can access these via the request object:

* payload
* query parameters
* HTTP method
* cookies

They appear in:

* routing prerequistes
* servor methods
* validation

**BEHOLD THEIR LIFECYCLE.**

### Hapi Request Lifecycle

The birth of the request is such a noble event. Truly. And so is its death. Amen.

There are 15 steps and 6 stages.

## 6 stages -

1. Receive and parse request
2. Authenticate request
3. Validate request
4. Handle request
5. Validate reponse
6. Send response

**An unauthenticated request will only reach stages 1, 2, and 6.**

## Request Lifecycle - 15 Steps Through 6 Stages

### Stage 1 - Receive and Parse Request.

** onRequest() occurs after Step 1. **

1. Request object created - hapi receives an HTTP request on one of its connections and creates an instance of the hapi request object. It's this object that will be passed along the request lifecycle. `request.path` and `request.headers` are set here but a route is not yet matched.

2. Find a matching route - hapi looks at request path and HTTP methods, checks if there is a matching route in the routing table for the connection. If a route is found, it is placed at `request.route`.

3. Process JSONP - hapi checks the request uri for a jsonp query parameter. `config.jsonp`.

4. Parse cookies - hapi parses cookie header if present into an object and places it at `request.state`. also there is `config.state` on the router level.

** onPreAuth() occurs after step 4 **

### Stage 2 - Authenticate Request

5. Authenticate Request - defers to any present authentication strategy on the route to determine if the request is auth'd. Example: `hapi-auth-cookie` would check request object for a valid session cookie. set in `config.auth` and sets `request.auth`.

6. Read/parse payload - depending on route's payload settings, hapi will read and/or parse the request's payload into `request.payload`. set in `config.payload`.

7. Authenticate payload - if route is config'd with an auth strategy that supports payload auth, such as `hapi-auth-hawk` it will take place. `config.auth.payload`.

** onPostAuth() occurs after step 7 **

### Stage 3 - Validate Request

8. Validate path params - request's path params will be validated here according to the route's settings. `config.validate.params`.

9. Validate query params - request's query params will be validated here according to route's settings. `config.validate.query`.

10. Validate payload - payload is validated according to route's settings. `config.validate.payload`.

** onPreHandler() occurs after step 10 **

### Stage 4 - Handle Request

11. Run prereqs - If route has prereqs config'd, they are exec'd here. Will run in parallel or serial depending on config. Step won't finish until all prereqs are concluded. Results available on `request.pre`.

12. Execute handler - the route's handler will execute here. a response should have been set by this point either by programmer or internally by hapi (i.e. an error). set in `config.handler`.

** onPostHandler() occurs after step 12 **

### Stage 5 - Validate Response

13. Validate Response - if the route has response validation config'd, it will be validated here. set in `config.response`.

** onPreResponse() occurs after step 13 **

### Stage 6 - Send Response

14. Send response - http response is actually sent to client. `response` object.

15. Wait for tails - hapi waits fo rall tails to finish before emitting a tail event. `tail`.

## Extension Points

Hapi provides a rich set of config options to influence request lifecycle. But sometimes things are missing, e.g. block all requests from blacklisted IPs.

Thus, the six stages each have their own *extension points* where customer behavior can be interested into the lifecycle (in the form of an extension function).

Signature is: `server.ext(event, method, [options])`

Where method is the route handler, and event is the stage, e.g. onPreAuth, and any other options are allowed.

Extensions interrupt request cycle, so control has to be handed back to hapi when finished. This is done via the `reply` interface (wow this is so novel).

Inside every extension point, you can call

* `reply.continue()` - sends route further down path
* `reply(value)` - to set the response instantly

**Failing to use either method will cause the request to hang and eventualy time out.**

### Blacklist Example

```
const Boom = require('boom')
const Hapi = require('hapi')
const Netmask = require('netmask').Netmask;

const blacklist = [
    '12.166.96.32/27',
    // etc.
];

const server = new Hapi.Server();
server.connection({ port: 4000 });

const blockIps = (request, reply) => {

    const ip = request.info.remoteAddress;

    for (let i = 0; i < blacklist.length; ++i) {
        const block = new Netmask(blacklist[i]);

        if (block.contains(ip)) {
            console.log(`blocking request from ${ip} within blocked subnet ${blacklist[i]});

            return reply(Boom.forbidden());
        }
    }

    reply.continue();
};

server.ext('onRequest', blockIps);

server.route({
    method: 'GET',
    path: '/',
    handler: (request, reply) => {

        reply('youre in, bud');
    }
});

server.start(() => console.log('potato time'));
```

### Further Notes on Extension Points

`request` object that is passed to ext func is same object seen in route handler, but might not full set of props depending on where in lifecycle.

Always choose the extension point which fits your usecase. Duh. Also, not all extension points are garunteed to happen - only **`onRequest`** and **`onPreResponse`**

## Here Comes the Reply Interface And Response Object!

`request` right? What about `reply` interface? Dive in.

Reply has a few diff jobs:

* Setting a response to a request, i.e. `reply(val)`

* Acting as a callback to give control back to hapi in user funcs suchs as handler, prereqs, and extensions, i.e. `reply.continue()`.

Few other things to note:

* Inside of ext, reply gives control back to hapi with `reply.continue()` or immediately replies with `reply(val)`

* Inside of prereqs, `reply(value)` sets value as the result of the pre, available as `request.pre[assignName]`
    * If a response should be set in pre, must use `reply().takeover(value)`


Context:

* Handlers
    * reply() - sets a reponse to send back to client
    * reply.continue() - empty response with 200
    * reply().takeover() - same as reply()

* Prereqs
    * reply() - sets result of pre under request.pre
    * reply.continue() - null result in request.pre
    * reply.().takeover() - sets a response to send back to client, handler never called

* Ext funcs
    * reply() - sets a response to send back to client
    * reply.continue() - returns control to framework
    * reply().takeover() - same as reply()

What is the motivation here? Code reusability. Example: a route hanldler that fetches some data from an API and responds with it.

Because `getInfo` is used as `/info`'s handler (where Wreck makes the request from within), we can reuse it by adapting this to set the request info on `request.pre` (since we may not want a response).

Functions become interchangable as pres, handlers, and they will behave the same because of the request object and reply methods.

### Valid reply() Args

These include
Type/Val - Content-type - Status code - Notes
* String - text/html - 200 -
* number - application/json - 200 - responds with JSON number
* boolean - application/json - 200 - responds with JSON true or false
* Error - application/json - 500 - wraps `Error` object with `Boom` object and responds with JSON payload
* Buffer - application/octet-streaem - 200 - for arbitrary binary data
* Stream - must set manually - 200
* Promise - depends on promise resolved/rejected value - depends on values
* Boom Object - application/json - depends on Boom type
* Plain Object or Array - application/json - 200 - Stringified JSON response
* null - none - 200 - empty payload
* undefined - none - 200 - empty payload

### Response object

 Hapi response object is diff than node or express. Res represents actual response sent to a client. `res.send(value)` actually starts sending data straight off. Control is lost.

 In Hapi, reply interface is not a response object. Instead it just gives you the response object (SO CLEVER!). Thus, the response can be modified, and have anything set about it in a the handler. The response will not be returned until the end of the handler block. Method calls can be chained on it, i.e.

 ```
 server.route({
    method: 'GET',
    path: '/',
    handler: (request, reply) => {
        reply('Hello')
            .type('text/plain')
            .code(202)
            .header('x-powered-by', 'hapi');
    }
 });
 ```
Response object can also be retrieved in extenions points via `request.response`, for example during the `onPreResponse` ext func (uised to access its properties).

## Responding with Streams

Streams are first-class citizens in hapi's reply interface. when you call reply() with a Stream object, chunks are sent to client as part of response payload as soon as they can be read from stream.

Example: downloading a video file with Wreck

```
// server stuff

// Wreck request

function (err, response) {

    if (err) {
        throw err;
    }

    const resp = reply(response);

    let sent = 0;

    resp.on('peek', (chunk) => {

        sent += chunk.length;
        process.stdout.write(`${sent} bytes written to response`);
    });
}
```

Note the `response` object from the `reply` interface emits a `peek` event as each chunk is flushed to the client.

## ERROR TIME

Okay so programmer errors vs operational errors. Nothing new here. Programmer has to handle own "stupid" errors, and "unfortunate" operational errors, e.g. permissions, 404s, upstream services, OS problems

So consider status codes

**Client (4xx) Codes**

* 400 - bad request
* 403 - forbidden
* 404 - not found
* 429 - too many requests

**Server (5xx) Status Codes**

* 500 - internal error
* 501 - not implemented
* 503 - service unavailable

when you reply with something hapi likes, it gets a 200, easy. One could manually set the code like this:

`reply('Internal derp error').code(500);`

And then hapi gives the client an error. But there is...another way.

```
const err = new Error('potato!');
reply(err)
```

Gets a 500 out of the box, with a statusCode, error, and message key. JSON payload with additional info about error. hapi always supplies this for javascript errors.

But what about 501 and other things? Enter Boom.

### BOOM - Expressive HTTP Errors

Just make an error with Boom

`const err = Boom.notImplemented('still derping', {apiVersion: '12000'});`

Boom is just like normal `Error` but has some extra props. First class objects in hapi's reply interface. Hapi has special treatment of Booms - uses correct status code, JSON response body with error info and message.

### HTML Friendly Error Pages

Okay so you want an error page. Cool. Use the JSON payload for great win.

And onPreResponse is garunteed to be called no matter what, including if Hapi generates an error response for us. Seems like best point to start.

`Boom` errors have a special prop `isBoom` to check if is error. This can be accessed like `request.response.isBoom`. Implement it now.










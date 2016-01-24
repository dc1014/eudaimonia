# CH3 Building A Worbsite

Covered material:

* Serving Static content
* Serving dynamic HTML with views
* Working with external APIs
* managing user state with sessions

So the site should be like dis -

Home > recipe detail & login & create recipe (latter is for auth'd only)

Each page will have a corresponding route in hapi. Homepage matches root.

Skeleton ...
* handlers
    * groupings
* index.js
* package.json
* routes.js

## Webpages and Static Content

reply() can handle more than string or object - can respond to request with contents of file. Coudl read into buffer object, determining content type from file ext, and then responding with Buffer object and setting correct content-type header in response. TEDIOUS.

Enter inert plugin. Decorates reply object with a new method reply.file(), which takes a string (relative or absolute path to a file in FS and does all work)

Assets may also need their own handler. Also, static content can be put into a public directory, whose entire contents can be served with a directory handler

Inert provides a directory handler.

### Route to Request Matching

Hapi tries to match based on method and path. Once a route is matched, hapi executes handler.

Two conflicting routes - Hapi resolves by picking the more specific of the two, e.g. matching index.html over /index.{ext}

Thus, the /{param*} path is special - will match any path that doesnt have a more specific route defined. Could be arbitrary whether you call it params or potatos. /{params*} also provides a catch all route

When a request coms into hapi for logo image of /images/logo.png, Hapi will try to find a route that matches the path specifically. once one isn't found, it will search the public directory for a file with its path.

## Dynamic Content Rendering Time!

So you want dynamic content from data structures? LOOK NO FURTHER, CITIZEN.

So let's about templating engines. Takes two inputs

* Template
* Collection of data (referred to as context)

And out pops HTML.

So **Handlebars**. Actually, **Vision**. Nice plugin which adds view rendering capabilities on top of hapi (get it?). One of methods it adds is `server.views()` which has to be called after plugin is loaded. Options include

* Engine object
* relativeTo
* path
* isCached

**Handlebars Stuff**

Interpolation as {{#iterator array}} HTML elements with reference to current index position's props {{/iterator}}

Okay, so reply() has a `reply.view` method which tells hapi to render the view with the name given as first arg, and context given as optional second arg. e.g.

```
reply.view('person', {
    firstName: 'potato',
    surname: 'man'
})
```
So, cool. Give that to a handler and watch it fly.

### DRY And Templating - Layouts and Partials

Nothing new here, but worth repeating.

* Layouts - Provide a common wrapper around content of views. Typically includes headers, footers, with view content sandwiched between middle. Layout markup doesn't usally change between views.

* Partials - smaller, self-contained blocks. Used for repeating elements in a list, or for block that appear on many different views (such as ads or widgets)

Apply them to previous index.hbs. Layouts and partial paths are available on the `server.views()` config object provided `layout: true` and path is specified.

1. The `reply.view()` method then references the template by name nad provides context object.

2. Then template.hbs is rendered with given context and result saved in variable called `content`.

3. Then, layout.hbs is rendered with a context which includes the rendered content of template.hbs

**Layouts must include a Handlebars expression for outputting the content variable.** Either:

* {{ var }} - double-stash escapes any HTML inside the string before output for security purposes
* {{{ var }}} - triple-stash does not escape HTML, only used for trusted HTML (like the one you wrote).

So, then you compose with partials and layouts. To output a partial, the expression used is {{ > partialName }}. Gee, that made index.hbs tiny.

## Consuming External APIs

Enter the Wreck module. Wreck is a Node module and utility for making requests to HTTP services.

At its heart, wrapper around Node's builtin HTTP modules, with some complexity remove. AImed at consuming JSON APIs.

Example:

```
const Wreck = require('wreck');

Wreck.get('someurl', (err, res, payload) => {
    var foo = JSON.parse(payload.toString())
})
```

Payload is of type buffer, so it must be cast to a string and parsed to get object.

A more efficient method is to use the `Wreck.get()` method.

```
Wreck.get('someurl', {
    json: true
}, (err, res, payload) => {

    if (err) {
        throw err
    }

    var recipe = payload;
});
```

Also comes equipped with a POST method...


```
var recipe = {
    name: 'blah'
    ...
}

Wreck.post('someurl', {
    json: true,
    payload: JSON.stringify(recipe)
}, (err, res, payload) => {

    var recipe = payload; // etc
})

```

So now Wreck can be used to remove data stub for homepage and replace it with real API content (implement). Wreck is JUST LIKE REQUEST MODULE.

### View Helpers

Handlebars has a feature called helpers - reusable functions you can use inside view templates. Transforms context or data into another form for output.

View helpers are placed into a module in a common directory (similar to layouts and partials).

This directory is defined in the `server.views()` method with a config key of `helpersPath: './views/helpers'` or wherever.

Example usage: replace each newline character in a string with page break.

There is the matter of security for text manipulation. Any text passed from user to helper should not be trusted as safe string to insert into HTML. Need to escape expression / supply encoding. Handlebars has method `Handlebars.Utils.escapeExpression()`.

Must also return `new Handlebars.SafeString(text)` in order to change escaped and safe strings back into l'html.

Helpers can now be referenced first-order in the views with double stash, i.e. `{{ breaklines recipe.direction }}`


## Managing Logins and User Sessions

HTTP is stateless, yo. Every new request is independent of last.

Sessions help maintain this memory, via making requests walongside a cookie. This cookie contains an identifier, which server can lookup in memory all the info stored about the user. Then can forget about them.

Yar is hapi's session plugin. Yar's options include:

* cookieOptions
    * password - takes secret key
    * isSecure - by default, hapi accepts sessions only over TLS/SSL connection. setting to false allows not TLS/SSL

Yar can then be used to set and retrieve data for a user between requests. Inside a handler, you can use `request.session.set()` function to store data in the session.

Example:

```
server.route({
    method: 'GET',
    path: '/setName/{name}'
    handler: function (request, reply) {

        request.session.set({
            name: encodeURIComponent(request.params.name)
        });

        reply('Name set!');
    }
});
```

**And where there is a setter there is a getter!**

```
server.route({
    method: 'GET',
    path: '/getName'
    handler: function (request, reply) {

        var name = request.session.get('name');
        reply('Hello there ' + name);
    });
}
```

### Forms

Forms be pretty simple, yo. You use the form element, defined an action, and a method, then provide the nested input elements inside the form element.

Example:

```
<form action="/search" method="GET">
    <input name="search1" type="text">
    <input name="search2" type="text">
    <input type="submit" value="Submit">
</form>
```

search1 and search2 will be QS params. These can be accessed via hapi's `request.query` object, i.e.

```
server.route({
    method: 'GET',
    path: '/search',
    handler: function (request, response) {
        doSearch(request.query.search1, request.query.search2,
        function (err, results) {
            if (err) {
                throw err;
            }
            reply(results);
        }
    });
});
```

Forms could also use a post method...

```
<form action="/search" method="POST">
    <input name="search1" type="text">
    <input name="search2" type="text">
    <input type="submit" value="Submit">
</form>
```

So the input names will be part of the body/payload. Hapi has to be config'd to deal with payload

```
server.route({
    method: 'POST',
    config: {
    payload: {
        output: 'data'
        }
    },
    path: '/search',
    handler: function (request, response) {
        doSearch(request.payload.search1, request.payload.search2, function (err, results) {
            if (err) {
                throw err;
            }
        reply(results);
        });
    }
});
```

Recall that users should be logged in to create new recipes or star. Auth scheme is currently Bearer Token Authentication. API uses this strat, Authorization header will be checked for presence of a token. If present, it will be looked up in the db. If matching token is found, user will be auth'd.

Also - expiration should be set.

So route /api/login has a method of POST. A payload with username and password should be sent to login route. If matching username and password is correct, response will contain user's current token.

Once token acquired, can be stored in user's session and will be available until session  expiration. Therefore, **logged-in user is defined as user with a valid API token stored in their session**.

Okay, make a login form. Users will GET this page, obs. But the same path will also have a POST so form data can be received by l'server. After successful login, user should be redirected to homepage.

If unsuccessful, respond with non-200 status code, redirect user back to login form.

Also, the auth mechanism should be in handlers/actions. Super convenient that `reply.redirect()` is a method.

Also need to update the header to have login buttons which are replaced by CREATE and LOGOUT buttons. Can use conditional logic, i./e. {{#conditional prop}}

INTERESTING - you can check for the request's session props inside of the view config object with the proper key. Also conditional rendering of views based on user session data.

Unfortunately only Yar 4.x is supported by this tut, not current version of Yar 6.x


### Creating Recipes

Okay, same principles as logging in, except another action to dispatch the creation of the recipe. If successful, redirect to homepage, generating a 302 repsonse code

### Implementing Logout

Gotta destroy the session to log them out. Yar provides a `request.session.clear()` method that removes whole object from user session.

Clear lets you remove whole object from user's session. We want to remove object with the key user. When user has logged out, common action is to redirect user to page, often homepage.

So implement it.

**And that's a wrap!**

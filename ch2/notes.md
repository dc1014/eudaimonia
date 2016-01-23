# Ch 2 - Designing an API (You've been here before)

Recipe app! Snore. Makin' user storeis.

After requirements gathering, design API endpoints, i.e.

* Search > list recipes - GET /api/recipes
* View a recipe > single recipe data - GET /api/recipes/{id}
* Create a recipe > status ok/fail - POST /api/recipes
* Star a recipe > status ok/fail - POST /api/recipes/{id}/star

## DB

Going to use SQLite3 persistence on this one, bro.

So, require the db client, and moubnt mount the db. Schure. Easy stuff.

db.all() methods accepts two args: query (as string) and callback (you know the drill). Callback(err, data).

But user query data can't be concatenated (injection!) need to sanitize. Db.all() takes an additional, optional, middle arg with array of values to be sanitised and interpolated. A ? character is placed into query to denote when these values go into final query.

## Requests for Retrieval and search

Route config options covered here:

**Option - Type - Purpose**
* method - string/array - HTTP verb(s) to match
* path - string - URI path to match
* handler - function/object - Defines what should happen for a matching route - how to build a response
* config - object - Further optional configuration for the route
* config.auth - string - Authentication strategy to use on a matched request
* config.payload - object - Configure how hapi should treat an incoming payload (HTTP body)

Route handlers have signature of (request, reply). Have extra methods.

### Request Object

Accessible as request[key][key] etc. Some props include:

**Properies - Type - Purpose**

* server - object - the server for this request
* query - object - parsed query string params
* headers - object - key/val representation of all request headers, e.g. {'content-type': 'text/plan'}
* params - object - parsed URI path params
* auth - object - info about auth method used in request and user creds

### Reply Interface

Responds to client with data. Go fig.

Simplest form is a function which provides direct response. But is dynamic depending on data type of arg.

Examples!

* If string, response has content-type: text/plain header and sends string as body of response
* If object, response has content-type: application/javascript.
* Others not included here.

### First Endpoint

Consider optional search param to query string

GET /api/recipes?cuisine=italian

API should respond with object, riiiight? Go implement.

Unfortunate that one must do string concatenation to these SQL queries. Very ugly.

Now implement single recipe retrieval by ID

Nice to know there is a response code method on all replies. Implicitly sends 200.

Best to keep routes out of index...except how do you expose DB object to routes module?

Don't want to create the exact same connection in several modules. Instead, you can use server.bind() HOORAY FOR LEXICAL THIS WITH BINDS! binding db allows you to use this.db in l'routes.

Uh but shouldn't you ripe out the handlers, too? Duh. Name them for great win.

Styles include:

* Each handler in new module for large projects
* Group related handlers into single module, e.g. recipe hanlders.


## AUTH!

Recall that staring and creating will require use login. Time for the auth.

### Schemes versus strategies

* **Scheme** - General type of auth. Basic, digest, each would be different scheme. Template for auth - isn't used directly, but allows a strategy to be created from scheme.

* **Strategies** - A strategy is a configured isntance of a scheme with an assigned name. Strategies exist so you can use same scheme several times in a diff way.
    * Example - you want to use basic auth to check user password agaisnt value in some DB, but other routes you want to check against value in a text file. Two diff strategies can be created from same scheme.
    * Created with `server.auth.strategy()` method with signature
        * strategyName
        * schemeName
        * options - requires validateFunc, which needs to define if a user should be auth'd or not.

### Bearer token auth

Bearer token is simple auth scheme whereby a string (aka token) is included in all requests, either in header or in QS. TO include, place token in header's Authorization key/val

ALso don't send this in the clear, dawg (duh)!

Pseudocode for this strategy:

```
if (token exists in db) {
    auth user
    load creds
    continue request
} else {
    reply 401 unauth'd
}
```

*Because hapi-auth-bearer-token plugin is a hapi plugin, must be registered*

Worth noting that routes and server start were inside block of register, and after auth strat declared. not sure if significant...

In example, validate func's callback has signature (err, authBoolean, credentials object). This credentials object is now available for user within the route, stored in `request.auth.credentials` object.

### Curl Notes (aside)

* -X : specify the HTTP method, e.g. `curl -X POST URL`
* -H : specify headers `curl -H "Content-type: application/JSON"`
* -d : specify data in body `curl -d "{"name": "Potatoman"}"`

Postman is much cooler

### POST Routes, Config, and Payloads

API should respond with JSON object with a single key "status". Status should be OK if successful.

Route needs to accept payload (aka HTTP body), and handler needs to use payload data to create. Few different options...

* Config Property on Route - specificy what Hapi should do with payload/body. Options include reading full payload into memory and parse into JSON (available immediately once handler is called). This is achieved by setting output option to data. Other options covered later.

**ASIDE - DO! NOT! USE! ARROW! FUNCTIONS! IN! MODULE! EXPORTS! Do you want to destroy this? **

EXERCISE - Implement star route.

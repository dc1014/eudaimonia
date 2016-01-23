# Hapi.JS in Action Ch. 1 Notes

Use cases include:

* RESTful JSON APIs
    * JSON in/out
* HTTP Proxies
    * HTTP request in and HTML / binary out
* Server compone of SPAs / sites
    * Requests in, hop to service, response out

In context of Node, stack goes (Node > Hapi) > (Code <> Moudles <> DB )

Flow:

1. HTTP request from client app
2. Request received by Node and forwarded to Hapi
3. Hapi authenticates and routes request to appropriate function in code
4. App gets data from DB
5. Data given t reply() function, and validation / caching applied to output if config'd
6. HTTP response is sent from Node to client app

## WHat Hapi Brings to L'Table

* Highly modular (hooray)
* Simple to collab on large projects
* Plugin architecture and deterministic (!) routing algorithm
* Scalability, dawg.
* Config is declarative

Framework type is ... somewhere between monolith and microservice. Core lib provides essential features, rest is available as plugins

Module, plugin based architecture. Plug it in, dawg.

Also, writing configs > writing code. Rich config options through small set of methods.

## Building Blocks

Critical components:

1. Server - l'app itself
2. routes - durr where you goin?
3. connections - how you gettin' there?
4. handlers - wat do when arrive?
5. plugins - dark computer magic!

client request > client interface > sent to server > server receives > matches route > route handler executed > response sent to client's interface

Plugins can define anything, including routes, and should be loaded on server...perhaps with label?

## Use Cases

Good

* Static
* SPAs
* Proxies
* JSON

Bad

* straight up perf, yo.

It is slower than express or native node. realtime penalties.


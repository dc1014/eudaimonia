# Server

Typical SPA is to server FE Framework. Can be isomorphic, or separate. Consider separate.

Use case for labels. Mount plugins relative to labels.

Server methods are also available on anything passed to plugin (first arugment passed to plugin register object, duhhh).

One function can only apply plugins to one connection at a time.

Hooray for async.auto. Hapi uses a lightweight version of Async called items. https://github.com/hapijs/items

## Glue

Glue lets you compose server settings. Keep the configs out of the server (duhhh declarative), and applies to the correct labels / connections. Super nice.

## Rejoice

Want to do it all from JSON config instead? Yes plz. Rejoice! Cli tool for this.

## Confidence

What if you want different configs per env? Could filter JSON. Blech.

Could have multiple files. Multiple blech.

Keep it single source of truth with Confidence. Extensible JSON with key/val merge.

Confidence will generate the rejoice.json by applying the proper filter, merging $base with `confidence -c --filter.env="myenv" > rejoice.json`

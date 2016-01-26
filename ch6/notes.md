# Validation with Joi!

So Joi validates stuff. Already know how this works, and use it standalone. Joi gives off validation errors.

Working with Joi is done in four steps, the first of which is to define a *schema*. The schema is an object that describes the expectations and is what data is checked against.

So...example...

`const schema = Joi.string().min(6).max(10)` easy peasy.

Other methods -
* `.min()` and `.max()` on date
* `assert(data, schema)` - throws error on vlaidation failure, which will have a useful message attached.

GREAT NEWS! You can drop `Joi.object().keys()` for `const schema = {prop1: Joi.string()}` Nice!

Recalled `Joi.validate` has a callback which won't simply thow (like `Joi.assert` does). Has signature `Joi.validate(data, schema, {options}, function (err, value))`

S0ome useful options include:

* convert - for type conversion
* stripUnknown - for getting rid of those pesky unknowns
* abortEarly - default is true, stops validating on first error. maybe set to false in debugging, or when validating a form (so the user can see everything they did wrong)

### Joi's Errors

So `validate` can return that `Error` object. It has props

* `message` - string

*`details` - array of objects, each as a single validation error. for more than one, turn off abortEarly.

*One can set additional properties on the Error object from validate()*

 ## Validation in Hapi


Framework has built-in validation with Joi. Supplied to the route's optional `config` object, set at prop `validate`.
```
{
    config: {
        validate: {
            headers,
            query,
            params,
            payload

        }
        response: {
            schema
        }
    }
}
```

Allowed props include

* true - no validation is performed
* false - all inputs of type are forbidden
* function - custom validation function
* Joi validation schema

Examples include:

* validating an interpolated path param should have an integer > 0
* that a payload's contents are correct
* that a response's contents are correct (set at `config.response.schema`)


### Customizing the validation response with `failAction`

Hapi's default behavior is to send back 400 to client as soon as it knows request is invalid. But maybe more control is required.

Enter failAction option, a custom function that is called on validation failure with signature:

`function failAction(request, reply, source, error)`;

Source will be a string indicating which input source was invalid. Could be:

* headers
* params
* query
* payload

The error param is an `Error`. Shocking. Hopefully is Boom and not just what Joi throw!

This allows failAction to be set on the `config.validate` level, such as:

```
config: {
    validate: {
        ...
        failAction: (request, reply, source, error) => reply(`${souirce} contained an invalid field`).code(400)
    }
}
```
## Web Form Validation!

Here's what this should be responsible for:

* Building a client (web form)
* Identifying server inputs
* Defining validation rules
* Validating input data
* Customizing the validation output
* Receiving feedback on the client
* Acting on feedback.

Flow should be:

1. GET form
2. POST data
3. Check validation
    * invalid renders form with errors
    * valid redirects to success and success page is rendered

IMPORTANT NOTE

just as validation options should be passed into `validate` function, so must the options be set at the route config, as in:

```
validate: {
    payload: schema,
    options: {
        abortEarly: false
    },
    failAction: myFunc
}
```

Also! Joi methods have an `options` method which allows a language to be set, which provides a custom message for the `method.chain` validate type, e.g.

```
age: Joi.string().required().regex(/^[1-9][0-9]+/).options({
    language: {
        string: {
            regex: {
                base: 'should be a numeric string with no leading zeros'
            }
        }
    }
})
```

To get super fancy, can set a `has-error` class on each field, then check if the field has an error with

```
<div class="form-group {{#if errors.email}}has-error{{/if}}">
    <label class="col-sm-2 control-label">Email address</label>
    <div class="col-sm-10">
        <input class="form-control" name="email" type="text"
value="{{values.email}}">
    </div>
</div>
```

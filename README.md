# Pinky
> A straight-forward Promises/A+ 1.1 implementation
<img src="http://lazd.github.com/Pinky/images/pinky_logo_small.png" align="right" alt="Pinky logo">

Pinky is a no-nonsense [Promises/A+ 1.1][A+ spec] implementation. Pinky is written to be very readable and easy to follow, with references to the relevant sections of the spec for each operation. As such, Pinky can be used as an academic example of a promises implementation.

Pinky includes a number of fully documented examples that illustrate common use cases, explain exactly what's going on, and highlight the power of promises. Several included examples can be used as independent explanations of the functionality promises can provide without any prior introduction to the concept.


## API

Create a new Pinky instance with `var pinky = new Pinky()`.

### pinky.then( *onFulfilled* , *onRejected* )

Used to add onFulfilled and onRejected callbacks to the promise. The same method is provided as `pinky.promise.then(...)`.

### pinky.fulfill( *value* )

When passed a value, the promise will be fulfilled. All onFulfilled callbacks will receive the passed value as their first argument. `pinky.resolve` is aliased to this method.

### pinky.reject( *reason* )

When passed a reason, the promise will be rejected. All onRejected callbacks will receive the passed error as their first argument.

### pinky.promise

The `pinky.promise` property is a "thenable" object that should be returned by functions that use Pinky. Instead of returning the Pinky instance itself, which would allow callers to fulfill/reject the promise, your function should `return pinky.promise` -- an object that includes the one method a promise must have: `pinky.then(...)`.


## Usage

Pinky can be used on both the server and the client.


### Node.js

First, install the `pinkypromise` module using `npm`. Optionally use `--save` to save Pinky as a dependency in your `package.json`:

```shell
npm install pinkypromise --save
```

Next, require Pinky:

```javascript
var pinky = require('pinky');
```

Then, use promises in your code:

```javascript
function helloWorld() {
	var pinky = new Pinky();

	pinky.fulfill('world');

	return pinky.promise;
}

helloWorld().then(function(value) {
	console.log('Hello '+value);
});
```


### Browser

Just include [`Pinky.js`][Pinky JS] on your page.


### AMD module

Pinky can also be used as an AMD module.


## Examples

Examples for Node.js and the browser are available in the `examples/` folder.

Some of the examples located in `examples/browser/` fetch files with XMLHttpRequest, and most browsers prevent local files from being fetched in this way. There are a [number of different ways][Run examples locally] to run examples locally, the most straightforward of which is to run `python -m SimpleHTTPServer` or `python -m http.server` and navigate to http://127.0.0.1:8000.


# Testing

Execute the following commands to run the [Promises/A+ test suite][A+ tests]:

```shell
npm install
npm test
```


# License

[BSD license], Copyright &copy; 2014 Lawrence Davis


[Run examples locally]: https://github.com/mrdoob/three.js/wiki/How-to-run-things-locally
[A+ spec]: http://promises-aplus.github.com/promises-spec/
[A+ tests]: https://github.com/promises-aplus/promises-tests
[BSD license]: https://github.com/lazd/Pinky/blob/master/LICENSE.md
[Pinky JS]: https://raw.github.com/lazd/Pinky/master/Pinky.js

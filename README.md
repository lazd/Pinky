# Pinky

<img src="http://70.166.17.76/~lazdnet/pinky_logo_small.png" align="right" alt="Pinky logo">

Pinky is an extremely tiny [Promises/A+][A+ spec] implementation that passes the [Promises/A+ test suite][A+ tests].

Pinky is written to be very readable and easy to follow, with references to the relevant sections of the spec for each operation. As such, Pinky can be used as an academic example of a promises implementation.

Pinky includes a number of fully documented examples that illustrate common use cases, explain exactly what's going on, and highlight the power of promises. Several included examples can be used as independent explanations of the functionality promises can provide without any prior introduction to the concept.


# API

Create a new Pinky instance with `var pinky = new Pinky()`.


## Methods

**pinky.fulfill(** *value* **)**

When passed a value, the promise will be fulfilled. All onFulfilled callbacks will receive the passed value as their first argument.

**pinky.reject(** *reason* **)**

When passed a reason, the promise will be rejected. All onRejected callbacks will receive the passed error as their first argument.

**pinky.then(** *onFulfilled*, *onRejected* **)**

Used to add onFulfilled and onRejected callbacks to the promise. The same method is provided as `pinky.promise.then(...)`.


## Properties

**pinky.promise**

The `pinky.promise` property is a "thenable" object that should be returned by functions that use Pinky. Instead of returning the Pinky instance itself, which would allow callers to fulfill/reject the promise, your function should `return pinky.promise` -- an object that includes the one method a promise must have: `pinky.then(...)`.


# Usage

Pinky can be used both on the server and the client.


## NodeJS

First, install the Pinky module using `npm`. Optionally use `--save` to save Pinky as a dependency in your `package.json`:

```
npm install pinky --save
```

Require Pinky:

```javascript
const pinky = require('pinky');
```

Use promises in your code:

```javascript
var promise = pinky.promise();
```


## Browser

First, include [`pinky.js`][Pinky JS] on your page:

```html
<script src="pinky.js"></script>
```

Then, use it in your code:

```html
<script>
	var promise = pinky.promise();
</script>
```


# Examples

Examples for NodeJS and the browser are available in the examples/ folder. 

Some of the examples located in examples/browser/ fetch files with XMLHttpRequest, and most browsers prevent local files from being fetched in this way. There are a [number of different ways][Run examples locally] to run examples locally, the most straightforward of which is to run `python -m SimpleHTTPServer` or `python -m http.server` and navigate to http://127.0.0.1:8000.


### A complete example: fetching a value and handling errors
The example below simulates an asynchronous fetch of a random value with error handling and validation.

This example has the following possible outcomes:

1. **Fulfilled**: The fetched value is valid.
2. **Rejected**: The fetch timed out and the generated backup value is invalid.
3. **Fulfilled**: The fetch timed out or the fetched value is invalid, but the generated value is valid.
4. **Rejected**: The fetch timed out or the fetched value is invalid, and generated value is invalid.


### fetchRandom(): a function that returns a promise

The `fetchRandom()` function simulates an asynchronous fetch and returns a promise that:
* Will be rejected if the "request" times out
* Will be fulfilled with the "response" if it comes back in time

```javascript
/**
	Simulate fetching a random number from a remote source
	Time out if the pretend remote source responds too slowly
*/
function fetchRandom() {
	// Create a Pinky instance
	var pinky = new Pinky();

	// Let's pretend we're fetching the random number from a remote source
	// Randomly choose a "response time" between 0 and 100 milliseconds
	var responseTime = Math.random()*100;

	// We'll timeout if the source takes too long and reject the promise
	var timeoutTime = 50;
	var timeout = setTimeout(function() {
		pinky.reject(new Error('Request timed out'));
	}, timeoutTime);

	// Simulate an asynchronous fetch using setTimeout
	setTimeout(function() {
		// The response came back in time, clear our timeout
		clearTimeout(timeout);
	
		// Fulfill the promise with a random number when our pretend source responds
		pinky.fulfill(Math.random());
	}, responseTime);

	// Return the promise, which has a single method: then()
	return pinky.promise;
}
```


### How to *then()*: using the promise returned by fetchRandom()

`fetchRandom()` is called and 3 chained `then()` calls are made, each of which returns a new promise:
1. With the first call to `then()` (on the promise returned by `fetchRandom()`), we'll pass the fulfillment value on if it's "valid" (not greater than 0.5), or let the timeout exception bubble to the next promise's onRejected handler.
2. With the second `then()` call (on the promise returned by the first `then()` call), we'll let the fulfillment value bubble to the next promise's onFulfilled handler, or we'll handle invalid value exception by attempting to generate a valid value locally, returning it if we're successful, or throwing another exception if we're not.
3. With the third `then()` call (on the promise returned by the second `then()` call), we'll print the fulfillment value and its source, or we'll print an error indicating we were unable to get a valid value.

```javascript
// A value is "valid" if it is not greater than 0.5
function isValid(value) { return !(value > 0.5); }

// Call our asynchronous random number fetcher
fetchRandom().then(
	function(value) {
		// In this onFulfilled handler, if the value is valid, we'll fulfill the next promise by returning the value
		// Or, if the value isn't valid, we'll reject the next promise by throwing an error
		if (!isValid(value)) {
			// Reject the next promise by throwing because the random number is too big
			var reason = new Error('Fetched value is invalid');
			reason.value = value;
			throw reason;
		}
	
		// Fulfill the next promise by returning if the value is small enough
		return {
			method: 'fetched',
			value: value
		};
	},
	null // Let the rejection reason bubble to the next promise's onRejected handler
)
.then(
	null, // Let the fulfillment value bubble to the next promise's onFulfilled handler

	function(reason) {
		// In this onRejected handler, if we return a value, the next promise will be fulfilled
		// Or, if we throw/re-throw, the next promise will be rejected
	
		// Fall back to generating a random number locally
		var newValue = Math.random();
		if (isValid(newValue)) {
			// Fulfill the next promise if our locally generated value is valid
			return {
				method: 'generated', 
				value: newValue
			};
		}
	
		// Throw a new error, including the message from the previously thrown error
		var newReason = new Error(reason.message+' and generated value is invalid');
		newReason.value = {
			fetched: reason.value,
			generated: newValue
		};
		throw newReason;
	}
)
.then(
	function(result) {
		console.log('Fulfilled: '+result.method+' value is valid: '+result.value, '\n');
	},
	function(reason) {
		console.error('Rejected: '+reason, reason.value, '\n');
	}
);
```


# Testing

Execute the following commands to run the [Promises/A+ test suite][A+ tests]:

```
npm install
npm test
```


# License

[BSD license][], Copyright &copy; 2013 Lawrence Davis

[Run examples locally]: https://github.com/mrdoob/three.js/wiki/How-to-run-things-locally
[A+ spec]: http://promises-aplus.github.com/promises-spec/
[A+ tests]: https://github.com/promises-aplus/promises-tests
[BSD license]: https://github.com/lazd/Pinky/blob/master/LICENSE.md
[Pinky JS]: https://raw.github.com/lazd/Pinky/master/pinky.js

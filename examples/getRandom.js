const Pinky = require('../Pinky');

console.log(
	'\u001B[2J\u001B[0;0f'+
	"Overview\n----------\n"+
	"In this example, we'll simulate an asynchronous fetch with error handling and validation.\n"+
	"\nExplanation\n----------\n"+
	"The fetchRandom() function returns a promise that:\n"+
	" • Will be rejected if the \"request\" times out.\n"+
	" • Will be fulfilled with the \"response\" if it comes back in time.\n"+
	"\n3 chained then() calls are made, each of which returns a new promise:\n"+
	" 1. With the first call to then() (on the promise returned by fetchRandom()), we'll pass the fulfillment value on if it's \"valid\" (not greater than 0.5), or let the timeout exception bubble to the next promise's onRejected handler.\n"+
	" 2. With the second then() call (on the promise returned by the first then() call), we'll let the fulfillment value bubble to the next promise's onFulfilled handler, or we'll handle invalid value exception by attempting to generate a valid value locally, returning it if we're successful, or throwing another exception if we're not.\n"+
	" 3. With the third then() call (on the promise returned by the second then() call), we'll print the fulfillment value and its source, or we'll print an error indicating we were unable to get a valid value.\n\n"+
	"Run this example multiple times to see the following outcomes:\n"+
	" 1. Fulfilled: The fetched value is valid.\n"+
	" 2. Rejected: The fetch timed out and the generated backup value is invalid.\n"+
	" 3. Fulfilled: The fetch timed out or the fetched value is invalid, but the generated value is valid.\n"+
	" 3. Rejected: The fetch timed out or the fetched value is invalid, and generated value is invalid.\n"+
	"\nResult\n----------"
);

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

// A value is "valid" if it is not greater than 0.5
function isValid(value) {
	return !(value > 0.5);
}

// Call our asynchronous random number fetcher
fetchRandom() // fetchRandom() returns a promise, which we'll call then() on below

.then(function(value) {
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
) // then() returns another promise

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
) // then() returns another promise

.then(
	function(result) {
		console.log('Fulfilled: '+result.method+' value is valid: '+result.value, '\n');
	},
	function(reason) {
		console.error('Rejected: '+reason, reason.value, '\n');
	}
);

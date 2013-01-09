const Pinky = require('../Pinky');

console.log(
	'\u001B[2J\u001B[0;0f'+
	"Overview\n----------\n"+
	"\nIn this example, we'll use promises to aggregate callbacks to a function that lowercases a string after a delay. Though useful for understanding the most basic use of a promise, no errors will be handled in this example, which misses the best aspect of promises. See other examples for more real world use cases that use promises to the full extent.\n"+
	"\nExplanation\n----------\n"+
	"Our function, delayedLowercase(), returns a promise and fulfills it with the passed value in lowercase after the passed number of milliseconds.\n"+
	"2 chained then() calls are made, each of which returns a new promise:\n"+
	" 1. With the first call to then() (on the promise returned by delayedLowercase()), the onFulfilled callback will print a hello world with the fulfillment value and return it in uppercase, fulfilling the next promise.\n"+
	" 2. With the second then() call (on the promise returned by the first then() call), the onFulfilled callback will print a goodbye world with the fulfillment value.\n"+
	"\nResult\n----------"
);

/**
	Return a promise and fulfill it with the passed value in lowercase after the specified delay
*/
function delayedLowercase(ms, value) {
	// Create a Pinky instance
	var pinky = new Pinky();

	// Return the lowercased value after a delay
	setTimeout(function() {
		pinky.fulfill(value.toLowerCase());
	}, ms);

	// Return the promise, which has a single method: then()
	return pinky.promise;
}

// Call our asynchronous lowercaser
delayedLowercase(100, 'Cruel') // delayedLowercase() returns a promise, which we'll call then() on below

.then( // add callbacks to the promise returned by delayedLowercase()
	function(value) { // onFulfilled callback: called after the promise returned by delayedLowercase() is fulfilled
		console.log('Hello '+ value +' world!\n');
		return value.toUpperCase(); // fulfill the next promise with the value in uppercase
	}
) // then() returns another promise

.then( // add callbacks to the promise returned by then()
	function(value) { // onFulfilled callback: called after the promise returned by then() is fulfilled
		console.log('Goodbye '+ value +' world!\n');
	}
)

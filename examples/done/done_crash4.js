const adapter = require('../../test/pinky-adapter');

// Create a rejected promise
var promise = adapter.rejected(new Error('Crash!'));

/*
A crash should occur:
	Since the first onRejected handler throws, and there are no other onRejected handlers
*/

promise
.then(
	function(value) {
	    console.log('Fulfilled 1: '+value);
	},
	function(reason) {
		console.log('Rejected 1: '+reason);
		throw reason; // Throw again to reject the next promise
	}
)
.done();

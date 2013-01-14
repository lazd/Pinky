const adapter = require('../../test/pinky-adapter');

// Create a rejected promise
var promise = adapter.rejected(new Error('Crash!'));

/*
A crash should occur:
	There are no onRejected handlers to handle the rejection.
*/

promise
.then(
	function(value) {
	    console.log('Fulfilled 1: '+value);
	},
	null
)
.done();

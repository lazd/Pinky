const adapter = require('../../test/pinky-adapter');

// Create a fulfilled promise
var promise = adapter.fulfilled('A value');

/*
A crash should occur:
	There are no onRejected handlers to handle the rejection caused by throwing within the onFulfilled handler
*/

promise
.then(
	function(value) {
		console.log('Fulfilled with '+value);
		throw new Error('Crash!');
	},
	null
)
.done();

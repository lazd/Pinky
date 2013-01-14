const adapter = require('../../test/pinky-adapter');

// Create a rejected promise
var promise = adapter.rejected(new Error('Crash!'));

/*
A crash should occur:
	There are no onRejected handlers to handle the rejection.
*/

promise.done();

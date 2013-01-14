const adapter = require('../../test/pinky-adapter');

// Create a pending promise
var promise = adapter.pending();

/*
A crash should occur:
	There are no onRejected handlers to handle the rejection.
*/

promise.done();

promise.reject(new Error('Crash!'));

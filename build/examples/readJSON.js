const Pinky = require('../Pinky');
const fs = require('fs');

console.log(
	'\u001B[2J\u001B[0;0f'+
	"Overview\n----------\n"+
	"\nIn this example, we'll use promises to attempt to read and parse JSON content from 3 files while handling errors in the promise way: \n"+
	" • A file with valid JSON\n"+
	" • A file with invalid JSON\n"+
	" • A file that does not exist\n\n"+
	
	"Explanation\n----------\n"+
	"Our first function, readFile(), returns a promise that is fulfilled if the file is read successfully, or rejected if the file cannot be read.\n"+
	"\nOur second function, getContentFromJSON(), calls readFile() and attempts to parse the JSON in the file.\n"+
	"\ngetContentFromJSON() uses 2 chained then() calls to complete the task while handling errors in the promise way:\n"+
	" 1. With the first call to then() (on the promise returned by readFile()), the onFulfilled handler will we'll attempt to parse the fulfillment value (the file contents) using JSON.parse. JSON.parse will throw an exception if the data could not be parsed, which will be bubbled to the onRejected handler of the next promise, or the onRejected handler will inform the user that the file could not be read and why.\n"+
	" 2. With the second then() call (on the promise returned by the first then() call), the onFulfilled handler will print the content property of the the fulfillment value (the parsed JSON), or the onRejected handler will inform the user that the could not be parsed any why.\n"+
	
	"\nNote: As the file read and parse operations are done asynchronously, the output from these 3 operations will not happen in the order of the calls that created them. The onFulfilled and onRejected handlers will give output when the promises they are associated with end up in a fulfilled or rejected state.\n"+
	"\nResult\n----------"
);

/**
	A fs.readFile wrapper that returns a promise
*/
function readFile(path) {
	// Create a Pinky instance
	var pinky = new Pinky();

	// Read the file at the specific path
	fs.readFile(path, 'utf-8', function(error, data) {
		if (error) {
			// Reject the promise if there was an error reading the file
			pinky.reject(error);
		}
		else {
			// Fulfill the promise if the file was read successfully
			pinky.fulfill(data);
		}
	});

	// Return the promise, which has a single method: then()
	return pinky.promise;
}

/**
	A function that reads the file at the specific path and attempts to parse it
*/
function getContentFromJSON(path) {
	readFile(path) // readFile() returns a promise, which we'll chain function calls to below
	
	.then( // add callbacks to the promise returned by readFile()
		function(data) { // onFulfilled callback: called when the contents of the file are available
			return JSON.parse(data);
		},
		function(reason) { // onRejected callback: called if reading the file failed
			console.error('Rejected: Could not read file: '+reason);
		}
	) // then() returns another promise

	.then( // add callbacks to the promise returned by the first call to then()
		function(obj) { // onFulfilled callback: called if the file contained valid JSON
			console.log('Fulfilled: JSON content: '+obj.content);
		},
		function(reason) { // onRejected callback: called if the file contained invalid JSON
			console.error('Rejected: Failed to parse JSON: '+reason.message);
		}
	);
}

console.log('Starting...');

// Valid JSON
console.log('Reading file with valid JSON...');
getContentFromJSON(__dirname+'/data/data.valid.json');

// Invalid JSON
console.log('Reading file with invalid JSON...');
getContentFromJSON(__dirname+'/data/data.invalid.json');

// Non-existent file
console.log('Reading non-existent file...');
getContentFromJSON(__dirname+'/data/data.nonExistent.json');

console.log('');

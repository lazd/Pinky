var Pinky = require('../Pinky.js');

module.exports = {
	pending: function() {
		return new Pinky();
	},
	resolved: function(value) {
		var pinky = new Pinky();
		pinky.fulfill(value);
		return pinky;
	},
	rejected: function(reason) {
		var pinky = new Pinky();
		pinky.reject(reason);
		return pinky;
	},
	deferred: function() {
		var pinky = new Pinky();
		return pinky;
	}
};

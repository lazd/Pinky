const Pinky = require('../Pinky');

module.exports = {
	pending: function() {
		return new Pinky();
	},
	fulfilled: function(value) {
		var pinky = new Pinky();
		pinky.fulfill(value);
		return pinky.promise;
	},
	rejected: function(reason) {
		var pinky = new Pinky();
		pinky.reject(reason);
		return pinky.promise;
	}
};

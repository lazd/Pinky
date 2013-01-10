var Pinky = function() {
	this.state = this.states.PENDING;
	this.value = undefined;
	this.reason = undefined;
	this.callbacks = [];

	// Permanently bind all critical functions
	this.executeOnFulfilledCallback = this.executeOnFulfilledCallback.bind(this);
	this.executeOnRejectedCallback = this.executeOnRejectedCallback.bind(this);
	this.fulfill = this.fulfill.bind(this);
	this.reject = this.reject.bind(this);
	this.then = this.then.bind(this);
	
	// Create a thenable property that only has this.then
	// We'll return this inside of then() in place of the Pinky instance
	// This can also be used by implementations that create Pinky instances
	this.thenable = this.promise = {
		then: this.then
	};
};

Pinky.prototype.states = {
	PENDING: -1,
	REJECTED: 0,
	FULFILLED: 1
};

Pinky.prototype.doNext = (typeof process === 'object' && process.nextTick) ||
	 (typeof setImmediate === 'function' && setImmediate) ||
	 function(func) { setTimeout(func, 0); };

Pinky.prototype.storeCallbacks = function(onFulfilled, onRejected, promise2) {
	// 3.2.5.1: Push onFulfilled callbacks in the order of calls to then
	// 3.2.5.2: Push onRejected callbacks in the order of calls to then
	this.callbacks.push({
		onFulfilled: onFulfilled,
		onRejected: onRejected,
		promise2: promise2
	});
};

Pinky.prototype.executeCallback = function(callback, promise2, argument) {
	try {
		var result = callback(argument);

		// 2.1: “promise” is an object or function that defines a then method.
		if (result && typeof result.then == 'function') {
			// 3.2.6.3: If either onFulfilled or onRejected returns a promise (call it returnedPromise), promise2 must assume the state of returnedPromise
			// 3.2.6.3.1: If returnedPromise is pending, promise2 must remain pending until returnedPromise is fulfilled or rejected.
			result.then(
				function(result) {
					// 3.2.6.3.2: If/when returnedPromise is fulfilled, promise2 must be fulfilled with the same value.
					promise2.fulfill(result);
				},
				function(errorReason) {
					// 3.2.6.3.3: If/when returnedPromise is rejected, promise2 must be rejected with the same reason.
					promise2.reject(errorReason);
				}
			);
		}
		else {
			// 3.2.6.1: If either onFulfilled or onRejected returns a value that is not a promise, promise2 must be fulfilled with that value.
			promise2.fulfill(result);
		}
	}
	catch (thrownException) {
		// 3.2.6.2: If an exception is thrown, promise2 must be rejected with the thrown exception as the reason.
		promise2.reject(thrownException);
	}
};

Pinky.prototype.executeOnFulfilledCallback = function(callbackInfo) {
	if (typeof callbackInfo.onFulfilled === 'function') {
		// 3.2.3.3: Do not call onRejected callbacks if promise has been fulfilled
		this.executeCallback(callbackInfo.onFulfilled, callbackInfo.promise2, this.value);
	}
	else {
		// 3.2.6.4: If onFulfilled is not a function and promise1 is fulfilled, promise2 must be fulfilled with the same value.
		callbackInfo.promise2.fulfill(this.value);
	}
};

Pinky.prototype.executeOnRejectedCallback = function(callbackInfo) {
	if (typeof callbackInfo.onRejected === 'function') {
		// 3.2.2.3: Do not call onFulfilled callbacks if promise has been rejected
		this.executeCallback(callbackInfo.onRejected, callbackInfo.promise2, this.reason);
	}
	else {
		// 3.2.6.5: If onRejected is not a function and promise1 is rejected, promise2 must be rejected with the same reason.
		callbackInfo.promise2.reject(this.reason);
	}
};

Pinky.prototype.executeCallbacks = function(isFulfilled) {
	var callbacks = this.callbacks;

	// 3.2.3.2: Do not call onRejected callbacks more than once
	// 3.2.2.2: Do not call onFulfilled callbacks more than once
	this.callbacks = null;

	if (isFulfilled) {
		// 3.2.5.1: Execute onFulfilled callbacks in the order of calls to then
		callbacks.forEach(this.executeOnFulfilledCallback);
	}
	else {			
		// 3.2.5.2: Execute onRejected callbacks in the order of calls to then
		callbacks.forEach(this.executeOnRejectedCallback);
	}
};

Pinky.prototype.fulfill = function(fulfilledValue) {
	// 3.1.1.1: When in pending, a promise may transition to either the fulfilled state.
	// 3.1.3.1: When in rejected, a promise must not transition to any other state.
	if (this.state !== this.states.PENDING) return;

	this.state = this.states.FULFILLED;

	// 3.1.2.2: When in fulfilled, a promise must have a value, which must not change.
	this.value = fulfilledValue;

	// 3.2.2.1 Call each onFulfilled after promise is fulfilled, with promise’s fulfillment value as its first argument.
	this.executeCallbacks(true);
	
	return this;
};

Pinky.prototype.reject =function(reasonRejected) {
	// 3.1.1.1: When in pending, a promise may transition to the rejected state.
	// 3.1.2.1: When in fulfilled, a promise must not transition to any other state.
	if (this.state !== this.states.PENDING) return;

	this.state = this.states.REJECTED;

	// 3.1.3.2: When in rejected, a promise must have a reason, which must not change.
	this.reason = reasonRejected;

	// 3.2.3.1 Call each onRejected after promise is rejected, with promise’s rejection reason as its first argument.
	this.executeCallbacks(false);
	
	return this;
};

Pinky.prototype.then = function(onFulfilled, onRejected) {
	// 3.2.6: Create a new promise
	var promise2 = new Pinky();
	
	var executeCallback = this.executeCallback;
	var value = this.value;
	var reason = this.reason;
	
	switch (this.state) {
		case this.states.PENDING:
			// 3.2.1: onFulfilled and onRejected are optional arguments; include both even if undefined
			this.storeCallbacks(onFulfilled, onRejected, promise2);
			break;

		case this.states.FULFILLED:
			if (typeof onFulfilled === 'function') {
				// 3.2.4: Then must return before onFulfilled or onRejected is called
				this.doNext(function() {
					executeCallback(onFulfilled, promise2, value);
				});
			}
			else {
				// 3.2.6.4: If onFulfilled is not a function and promise1 is fulfilled, promise2 must be fulfilled with the same value.
				promise2.fulfill(this.value);
			}
			break;

		case this.states.REJECTED:
			if (typeof onRejected === 'function') {
				// 3.2.4: Then must return before onFulfilled or onRejected is called
				var that = this;
				this.doNext(function() {
					executeCallback(onRejected, promise2, reason);
				});
			}
			else {
				// 3.2.6.5: If onRejected is not a function and promise1 is rejected, promise2 must be rejected with the same reason.
				promise2.reject(this.reason);
			}
			break;
	};

	// 3.2.6: Return a promise
	return promise2.thenable;
};

if (typeof module !== 'undefined') module.exports = Pinky;

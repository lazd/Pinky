(function(global) {
	var states = {
		PENDING: -1,
		REJECTED: 0,
		FULFILLED: 1
	};

	var doNext = (typeof process === 'object' && process.nextTick) ||
		(typeof setImmediate === 'function' && setImmediate) ||
		function(func) { setTimeout(func, 0); };

	function isObject(object) {
		return object && typeof object === (typeof {});
	}

	function isFunction(object) {
		return object && typeof object === (typeof isFunction);
	}

	function doResolution(promise, x) {
		if (isObject(x) || isFunction(x)) {
			// 2.3.1: If promise and x refer to the same object, reject promise with a TypeError as the reason.
			if (x === promise.promise) {
				promise.reject(new TypeError('Cannot fulfill a promise with itself as the value'));
			}

			try {
				// 2.3.3.1: Let then be x.then. 3.5
				then = x.then;
			}
			catch(e) {
				// 2.3.3.2: If retrieving the property x.then results in a thrown exception e, reject promise with e as the reason.
				return promise.reject(e);
			}

			if (isFunction(then)) {
				var called = false;

				try {
					// 2.3.2: If x is a promise, adopt its state. 3.4
					// 2.3.2.1: If x is pending, promise must remain pending until x is fulfilled or rejected.
					// 2.3.3.3: If then is a function, call it with x as this, first argument resolvePromise, and second argument rejectPromise
					then.call(
						x,
						function(y) {
							// 2.3.3.3.3: If both resolvePromise and rejectPromise are called, or multiple calls to the same argument are made, the first call takes precedence, and any further calls are ignored.
							if (called) return;

							// 2.3.2.2: If/when x is fulfilled, fulfill promise with the same value.
							// 2.3.3.3.1: If/when resolvePromise is called with a value y, run [[Resolve]](promise, y).
							doResolution(promise, y);
							called = true;
						},
						function(r) {
							// 2.3.3.3.3: If both resolvePromise and rejectPromise are called, or multiple calls to the same argument are made, the first call takes precedence, and any further calls are ignored.
							if (called) return;

							// 2.3.2.3: If/when x is rejected, reject promise with the same reason..
							// 2.3.3.3.2: If/when rejectPromise is called with a reason r, reject promise with r.
							promise.reject(r);
							called = true;
						}
					);

				}
				catch(e) {
					// 2.3.3.3.4: If calling then throws an exception e,
					// 2.3.3.3.4.1: If resolvePromise or rejectPromise have been called, ignore it.
					if (!called) {
						// 2.3.3.3.4.2: Otherwise, reject promise with e as the reason
						promise.reject(e);
					}
				}
			}
			else {
				// 2.3.3.4: If then is not a function, fulfill promise with x.
				promise.fulfill(x);
			}
		}
		else {
			// 2.3.4: If x is not an object or function, fulfill promise with x.
			promise.fulfill(x);
		}
	}

	function Pinky() {
		this._state = states.PENDING;
		this._value = undefined;
		this._reason = undefined;
		this._callbacks = [];

		// These functions are passed to forEach, so bind them
		this._executeOnFulfilledCallback = this._executeOnFulfilledCallback.bind(this);
		this._executeOnRejectedCallback = this._executeOnRejectedCallback.bind(this);

		// Bind then as its returned as part of thenable object
		this.then = this.then.bind(this);

		// Bind fulfill/resolve and reject in case they're passed around as callbacks
		this.fulfill = this.resolve = this.fulfill.bind(this);
		this.reject = this.reject.bind(this);

		// Create a thenable property that only has this.then
		// We'll return this inside of then() in place of the Pinky instance
		// This can also be used by implementations that create Pinky instances
		this.promise = this.thenable = {
			then: this.then
		};
	}

	Pinky.prototype._storeCallbacks = function(onFulfilled, onRejected, promise) {
		// 2.2.6.1: Push onFulfilled callbacks in the order of calls to then
		// 2.2.6.2: Push onRejected callbacks in the order of calls to then
		this._callbacks.push({
			onFulfilled: onFulfilled,
			onRejected: onRejected,
			promise: promise
		});
	};

	function executeCallback(callback, promise, argument) {
		var result, then;
		try {
			result = callback(argument);
		}
		catch(e) {
			// 2.2.7.2: If either onFulfilled or onRejected throws an exception e, promise must be rejected with e as the reason.
			return promise.reject(e);
		}

		doResolution(promise, result);
	}

	Pinky.prototype._executeOnFulfilledCallback = function(callbackInfo) {
		if (isFunction(callbackInfo.onFulfilled)) {
			executeCallback(callbackInfo.onFulfilled, callbackInfo.promise, this._value);
		}
		else {
			// 2.2.7.3: If onFulfilled is not a function and promise1 is fulfilled, promise must be fulfilled with the same value.
			callbackInfo.promise.fulfill(this._value);
		}
	};

	Pinky.prototype._executeOnRejectedCallback = function(callbackInfo) {
		if (isFunction(callbackInfo.onRejected)) {
			executeCallback(callbackInfo.onRejected, callbackInfo.promise, this._reason);
		}
		else {
			// 2.2.7.4: If onRejected is not a function and promise1 is rejected, promise must be rejected with the same reason.
			callbackInfo.promise.reject(this._reason);
		}
	};

	Pinky.prototype._executeCallbacks = function(isFulfilled) {
		var callbacks = this._callbacks;

		// 2.2.2.3: Do not call onFulfilled callbacks more than once
		// 2.2.3.3: Do not call onRejected callbacks more than once
		this._callbacks = null;

		if (isFulfilled) {
			// 2.2.6.1: If/when promise is fulfilled, all respective onFulfilled callbacks must execute in the order of their originating calls to then.
			callbacks.forEach(this._executeOnFulfilledCallback);
		}
		else {
			// 2.2.6.2: If/when promise is rejected, all respective onRejected callbacks must execute in the order of their originating calls to then.
			callbacks.forEach(this._executeOnRejectedCallback);
		}
	};

	Pinky.prototype.fulfill = function(fulfilledValue) {
		// 2.1.1.1: When pending, a promise may transition to the fulfilled state.
		// 2.1.2.1: When fulfilled, a promise must not transition to any other state.
		if (this._state !== states.PENDING) return;

		this._state = states.FULFILLED;

		// 2.1.2.2: When in fulfilled, a promise must have a value, which must not change.
		this._value = fulfilledValue;

		// 2.2.2.1 Call each onFulfilled after promise is fulfilled, with promise’s fulfillment value as its first argument.
		// 2.2.4: onFulfilled or onRejected must not be called until the execution context stack contains only platform code.
		doNext(this._executeCallbacks.bind(this, true));

		return this;
	};

	Pinky.prototype.reject = function(reasonRejected) {
		// 2.1.1.1: When pending, a promise may transition to the rejected state.
		// 2.1.3.1: When fulfilled, a promise must not transition to any other state.
		if (this._state !== states.PENDING) return;

		this._state = states.REJECTED;

		// 2.1.3.2: When in rejected, a promise must have a reason, which must not change.
		this._reason = reasonRejected;

		// 2.2.3.1: Call each onRejected after promise is rejected, with promise’s rejection reason as its first argument.
		// 2.2.4: onFulfilled or onRejected must not be called until the execution context stack contains only platform code. 3.1.
		doNext(this._executeCallbacks.bind(this, false));

		return this;
	};

	Pinky.prototype.then = function(onFulfilled, onRejected) {
		var promise = new Pinky();

		var value = this._value;
		var reason = this._reason;

		switch (this._state) {
			case states.PENDING:
				// 2.2.1: Both onFulfilled and onRejected are optional arguments
				// We need to store them even if they're undefined so we can fulfill the newly created promise in the right order
				this._storeCallbacks(onFulfilled, onRejected, promise);
				break;

			case states.FULFILLED:
				if (isFunction(onFulfilled)) {
					// 2.2.4: onFulfilled or onRejected must not be called until the execution context stack contains only platform code.
					doNext(function() {
						executeCallback(onFulfilled, promise, value);
					});
				}
				else {
					// 2.2.7.3: If onFulfilled is not a function and promise1 is fulfilled, promise must be fulfilled with the same value.
					promise.fulfill(this._value);
				}
				break;

			case states.REJECTED:
				if (isFunction(onRejected)) {
					// 2.2.4: onFulfilled or onRejected must not be called until the execution context stack contains only platform code.
					var that = this;
					doNext(function() {
						executeCallback(onRejected, promise, reason);
					});
				}
				else {
					// 2.2.7.4: If onRejected is not a function and promise1 is rejected, promise must be rejected with the same reason.
					promise.reject(this._reason);
				}
				break;
		}

		// 2.2.7: then must return a promise
		return promise.thenable;
	};

	if (typeof module !== 'undefined' && module.exports) {
		// Node.js Support
		module.exports = Pinky;
	}
	else if (isFunction(global.define)) {
		(function(define) {
			// AMD Support
			define(function() { return Pinky; });
		}(global.define));
	}
	else {
		// Browser support
		global.Pinky = Pinky;
	}
}(this));


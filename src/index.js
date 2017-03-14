if (!Error.prepareStackTrace) {
	require('source-map-support/register');
}

/**
 * Creates a gawk object that wraps the specified object.
 *
 * @param {*} value - A value to gawk.
 * @param {GawkArray|GawkObject} [parent] - The parent gawk object.
 * @returns {GawkArray|GawkObject|*}
 */
export default function gawk(value, parent) {
	if (parent && !(parent instanceof GawkArray) && !(parent instanceof GawkObject)) {
		throw new TypeError('Expected parent to be a GawkArray or GawkObject');
	}

	if (!value || typeof value !== 'object') {
		return value;
	}

	let gawked;
	if (value instanceof GawkArray || value instanceof GawkObject) {
		if (value === parent) {
			throw new Error('The parent must not be the same object as the value');
		}
		gawked = value;

	} else if (Array.isArray(value)) {
		gawked = new GawkArray();
		gawked.push.apply(gawked, value);

	} else {
		gawked = new GawkObject(value);
	}

	if (parent) {
		gawked.__gawk__.parents.add(parent);
	}

	return gawked;
}

export { gawk as gawk };

/**
 * Internal function to wire up all gawk instances. Normally this would go in
 * a base class that GawkObject and GawkArray extend, however JavaScript doesn't
 * support multiple inheritance and so instead we tack the gawk functions onto
 * the specified instance.
 *
 * @param {GawkArray|GawkObject}
 */
function gawkify(instance) {
	const internal = Object.defineProperty(instance, '__gawk__', {
		value: {
			/**
			 * A list of all the gawk object's parents. These parents are
			 * notified when a change occurs.
			 * @type {Set}
			 */
			parents: new Set,

			/**
			 * A map of listener functions to call invoke when a change occurs. The
			 * associated key value is the optional filter to apply to the listener.
			 * @type {Map}
			 */
			listeners: new Map,

			/**
			 * A map of listener functions to the last known hash of the stringified
			 * value. This is used to detect if a filtered watch should be notified.
			 * @type {WeakMap}
			 */
			previous: new WeakMap,

			/**
			 * A list of child objects that are modified while paused.
			 * @type {Set}
			 */
			queue: null,

			/**
			 * Dispatches change notifications to the listeners.
			 */
			pause: () => {
				if (!internal.queue) {
					internal.queue = new Set;
				}
			},

			/**
			 * Unpauses the gawk notifications and sends out any pending
			 * notifications.
			 */
			resume: () => {
				if (internal.queue) {
					const queue = internal.queue;
					internal.queue = null;
					for (const instance of queue) {
						internal.notify(instance);
					}
				}
			},

			/**
			 * Dispatches change notifications to the listeners.
			 *
			 * @param {GawkArray|GawkObject} [source] - The gawk object that was
			 * modified.
			 */
			notify: (source = instance) => {
				if (internal.queue) {
					internal.queue.add(instance);
					return;
				}

				// notify all of this object's listeners
				for (const [ listener, filter ] of internal.listeners) {
					if (filter) {
						let obj = instance;
						let found = true;

						// find the value we're interested in
						for (let i = 0, len = filter.length; obj && typeof obj === 'object' && i < len; i++) {
							if (!obj.hasOwnProperty(filter[i])) {
								found = false;
								obj = undefined;
								break;
							}
							obj = obj[filter[i]];
						}

						// compute the hash of the stringified value
						const str = JSON.stringify(obj) || '';
						let hash = 5381;
						let i = str.length;
						while (i) {
							hash = (hash * 33) ^ str.charCodeAt(--i);
						}
						hash = hash >>> 0;

						// check if the value changed
						if ((found || internal.previous.has(listener)) && hash !== internal.previous.get(listener)) {
							listener(obj, source);
						}

						internal.previous.set(listener, hash);
					} else {
						listener(instance, source);
					}
				}

				// notify all of this object's parents
				for (const parent of internal.parents) {
					parent.__gawk__.notify(source);
				}
			}
		}
	}).__gawk__;
}

/**
 * Gawk class to wrap arrays.
 *
 * @extends {Array}
 */
export class GawkArray extends Array {
	/**
	 * Constructs the array instance.
	 *
	 * @param {Number|*} [...args] - When argument is a number, sets the initial
	 * length of the array. When there are one or more arguments or the first
	 * argument is not a number, it populates the array upon initialization.
	 */
	constructor(...args) {
		super();

		const instance = new Proxy(this, {
			set: (target, prop, value) => {
				if (prop === '__gawk__') {
					throw new Error('"__gawk__" is read-only');
				}

				// console.log('SETTING ' + prop);

				const existing = target[prop];
				const changed = existing !== value;

				if (!isNaN(parseInt(prop))) {
					if (existing instanceof GawkArray || existing instanceof GawkObject) {
						existing.__gawk__.parents.delete(instance);
					}
					target[prop] = gawk(value, instance);
				} else {
					target[prop] = value;
				}

				if (changed) {
					target.__gawk__.notify();
				}

				return true;
			},

			deleteProperty: (target, prop) => {
				if (prop === '__gawk__') {
					throw new Error('"__gawk__" is read-only');
				}

				// console.log('DELETING ' + prop);

				let exists = true;
				if (!isNaN(parseInt(prop))) {
					const value = target[prop];
					if (value instanceof GawkArray || value instanceof GawkObject) {
						value.__gawk__.parents.delete(instance);
					}
					exists = target[prop] !== undefined;
				}

				const result = delete target[prop];
				if (exists && result) {
					instance.__gawk__.notify();
				}

				return result;
			}
		});

		gawkify(instance);

		instance.push.apply(instance, args.length === 1 && typeof args[0] === 'number' ? args : args.map(arg => gawk(arg, instance)));

		return instance;
	}

	/**
	 * Removes the last element of this array.
	 *
	 * @returns {*}
	 * @access public
	 */
	pop() {
		this.__gawk__.pause();
		const item = super.pop();
		this.__gawk__.resume();
		return item;
	}

	/**
	 * Removes the first element of this array.
	 *
	 * @returns {*}
	 * @access public
	 */
	shift() {
		this.__gawk__.pause();
		const item = super.shift();
		this.__gawk__.resume();
		return item;
	}

	/**
	 * Inserts or removes items from this array.
	 *
	 * @param {Number} [start] - The starting index.
	 * @param {Number} [deleteCount] - The number of items to delete. If not
	 * specified, but `start` is, then it defaults to the length of this array.
	 * @param {*} [...items] - Zero or more items to insert at the specified
	 * `start` index.
	 * @returns {GawkArray}
	 * @access public
	 */
	splice(start, deleteCount, ...items) {
		this.__gawk__.pause();

		if (start !== undefined && deleteCount === undefined) {
			deleteCount = this.length - start;
		}

		const arr = super.splice(start, deleteCount, ...items);
		for (let i = start + items.length; i < this.length; i++) {
			if (this[i] && typeof this[i] === 'object') {
				this[i] = gawk(this[i], this);
			}
		}

		for (const item of arr) {
			if (item instanceof GawkArray || item instanceof GawkObject) {
				item.__gawk__.parents.delete(this);
			}
		}

		this.__gawk__.resume();
		return arr;
	}

	/**
	 * Adds zero or more items to the beginning of this array.
	 *
	 * @param {*} [...items] - The items to add.
	 * @returns {Number} The new length
	 * @access public
	 */
	unshift(...items) {
		this.__gawk__.pause();
		const len = super.unshift.apply(this, items.map(item => gawk(item, this)));
		this.__gawk__.resume();
		return len;
	}
}

/**
 * Gawk class to wrap objects.
 */
export class GawkObject {
	/**
	 * Constructs a new GawkObject instance.
	 *
	 * @param {Object|GawkObject} [obj] - An object to copy into this instance.
	 */
	constructor(obj) {
		if (obj === undefined || obj === null) {
			obj = null;
		} else if (typeof obj !== 'object' || Array.isArray(obj)) {
			throw new TypeError('Expected obj to be an object or GawkObject');
		}

		// we create a proxy that allows us to listen for when properties change
		const instance = new Proxy(this, {
			set: (target, prop, value) => {
				if (prop === '__gawk__') {
					throw new Error('"__gawk__" is read-only');
				}

				// console.log('SETTING ' + prop);

				const changed = !target.hasOwnProperty(prop) || target[prop] !== value;
				delete target[prop];
				target[prop] = gawk(value, instance);

				if (changed) {
					target.__gawk__.notify(target);
				}

				return true;
			},

			deleteProperty: (target, prop) => {
				if (prop === '__gawk__') {
					throw new Error('"__gawk__" is read-only');
				}

				// console.log('DELETING ' + prop);

				const value = target[prop];
				if (value instanceof GawkArray || value instanceof GawkObject) {
					value.__gawk__.parents.delete(target);
				}

				const exists = target.hasOwnProperty(prop);
				const result = delete target[prop];
				if (exists && result) {
					instance.__gawk__.notify();
				}

				return result;
			}
		});

		gawkify(instance);

		// if we have an object argument...
		if (obj) {
			// copy the props to our instance
			for (const key of Object.keys(obj)) {
				instance[key] = gawk(obj[key], instance);
			}

			// copy all listeners too
			if (obj instanceof GawkObject) {
				for (const [ listener, filter ] of obj.__gawk__.listeners) {
					this.__gawk__.listeners.set(listener, filter);
				}
			}
		}

		return instance;
	}
}

/**
 * Adds a listener to be called when the specified object or any of its
 * properties/elements are changed.
 *
 * @param {Object|GawkObject|Array|GawkArray} subject - The object to watch.
 * @param {String|Array.<String>} [filter] - A property name or array of nested
 * properties to watch.
 * @param {Function} listener - The function to call when something changes.
 * @returns {GawkObject|GawkArray} Returns a gawked object or array depending on
 * the input object.
 */
gawk.watch = function watch(subject, filter, listener) {
	if (!(subject instanceof GawkArray) && !(subject instanceof GawkObject)) {
		throw new TypeError('Expected source to be a GawkArray or GawkObject');
	}

	if (typeof filter === 'function') {
		listener = filter;
		filter = null;
	}

	if (filter) {
		if (typeof filter === 'string') {
			filter = [ filter ];
		} else if (!Array.isArray(filter)) {
			throw new TypeError('Expected filter to be a stirng or array of strings');
		}
	}

	if (typeof listener !== 'function') {
		throw new TypeError('Expected listener to be a function');
	}

	subject.__gawk__.listeners.set(listener, filter);

	return subject;
};

/**
 * Removes a listener from the specified gawked object.
 *
 * @param {Object|GawkObject|Array|GawkArray} subject - The object to unwatch.
 * @param {Function} [listener] - The function to call when something changes.
 * @returns {GawkObject|GawkArray} Returns a gawked object or array depending on
 * the input object.
 */
gawk.unwatch = function unwatch(subject, listener) {
	if (!(subject instanceof GawkArray) && !(subject instanceof GawkObject)) {
		throw new TypeError('Expected source to be a GawkArray or GawkObject');
	}

	if (listener) {
		if (typeof listener !== 'function') {
			throw new TypeError('Expected listener to be a function');
		}
		subject.__gawk__.listeners.delete(listener);
		subject.__gawk__.previous.delete(listener);
	} else {
		// remove all listeners
		for (const [ listener, filter ] of subject.__gawk__.listeners) {
			subject.__gawk__.listeners.delete(listener);
			subject.__gawk__.previous.delete(listener);
		}
	}

	return subject;
};

/**
 * Mixes an array of objects or GawkObjects into this GawkObject.
 *
 * @param {Array<Object|GawkObject>} objs - An array of objects or GawkObjects.
 * @param {Boolean} [deep=false] - When true, mixes subobjects into each other.
 * @returns {GawkObject}
 */
function mix(objs, deep) {
	const gobj = gawk(objs.shift());
	if (!(gobj instanceof GawkObject)) {
		throw new TypeError('Expected destination to be a GawkObject');
	}

	if (!objs.length) {
		return gobj;
	}

	// validate the objects are good
	for (const obj of objs) {
		if (!obj || typeof obj !== 'object' || Array.isArray(obj)) {
			throw new TypeError('Expected source to be an object or GawkObject');
		}
	}

	// we need to detach the parent and all listeners so that they will be
	// notified after everything has been merged
	gobj.__gawk__.pause();

	/**
	 * Mix an object or GawkObject into a GawkObject.
	 * @param {GawkObject} gobj
	 * @param {Object} src
	 */
	const mixer = (gobj, src) => {
		for (const key of Object.keys(src)) {
			const srcValue = src[key];

			if (deep && srcValue !== null && typeof srcValue === 'object' &&
				!Array.isArray(srcValue) && !(srcValue instanceof GawkArray)
			) {
				if (!(gobj[key] instanceof GawkObject)) {
					gobj[key] = gawk({}, gobj);
				}
				mixer(gobj[key], srcValue);
			} else if (gobj[key] instanceof GawkArray && Array.isArray(srcValue)) {
				// overwrite destination with new values
				gobj[key].splice(0, gobj[key].length, ...srcValue);
			} else {
				gobj[key] = gawk(srcValue, gobj);
			}
		}
	};

	for (const obj of objs) {
		mixer(gobj, obj);
	}

	gobj.__gawk__.resume();

	return gobj;
}

/**
 * Performs a shallow merge of one or more objects or GawkObjects into the
 * specified gawk object.
 *
 * @param {Object|GawkObject} gobj - The destination GawkObject.
 * @param {...Object|GawkObject} objs - One or more objects to merge in.
 * @returns {GawkObject}
 */
gawk.merge = function merge(...objs) {
	return mix(objs);
};

/**
 * Performs a deep merge of one or more objects or GawkObjects into the
 * specified gawk object.
 *
 * @param {Object|GawkObject} gobj - The destination GawkObject.
 * @param {...Object|GawkObject} objs - One or more objects to deeply merge in.
 * @returns {GawkObject}
 */
gawk.mergeDeep = function mergeDeep(...objs) {
	return mix(objs, true);
};

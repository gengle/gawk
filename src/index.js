if (!Error.prepareStackTrace) {
	require('source-map-support/register');
}

const WEAK_REF_KEY = {};

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
		gawked.__gawk__.addParent(parent);
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
			 * A list of all the gawk object's parents. These parents are notified
			 * when a change occurs.
			 * @type {Map<String, WeakMap>}
			 */
			parents: new Map,

			/**
			 * Adds a parent gawk object.
			 *
			 * @param {GawkArray|GawkObject} parent - The parent object to add.
			 */
			addParent: parent => {
				if (!internal.findParent(parent)) {
					internal.parents.set(Math.random(), new WeakMap().set(WEAK_REF_KEY, parent));
				}
			},

			/**
			 * Finds a parent by reference and returns its key.
			 *
			 * @param {GawkArray|GawkObject} parent - The parent object to find.
			 * @param {Number|null}
			 */
			findParent: parent => {
				let found = null;
				for (const [ key, wm ] of internal.parents) {
					if (!wm.has(WEAK_REF_KEY)) {
						internal.parents.delete(key);
					} else if (wm.get(WEAK_REF_KEY) === parent) {
						found = key;
					}
				}
				return found;
			},

			/**
			 * Determines if a parent already exists.
			 *
			 * @param {GawkArray|GawkObject} parent - The parent object to check.
			 * @returns {Boolean}
			 */
			hasParent: parent => {
				return !!internal.findParent(parent);
			},

			/**
			 * Removes a parent if exists.
			 *
			 * @param {GawkArray|GawkObject} parent - The parent object to remove.
			 */
			removeParent: parent => {
				const key = internal.findParent(parent);
				if (key) {
					internal.parents.delete(key);
				}
			},

			/**
			 * A list of listener functions call invoke when a change occurs.
			 * @type {Set}
			 */
			listeners: new Set,

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
					for (const item of queue) {
						internal.notify(item);
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
				} else {
					for (const listener of internal.listeners) {
						listener(instance, source);
					}

					for (const [ key, wm ] of internal.parents) {
						if (!wm.has(WEAK_REF_KEY)) {
							internal.parents.delete(key);
						} else {
							wm.get(WEAK_REF_KEY).__gawk__.notify(source);
						}
					}
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

				const existing = target[prop];
				const changed = existing !== value;

				if (!isNaN(parseInt(prop))) {
					if (existing instanceof GawkArray || existing instanceof GawkObject) {
						existing.__gawk__.removeParent(instance);
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
				let exists = true;
				if (!isNaN(parseInt(prop))) {
					const value = target[prop];
					if (value instanceof GawkArray || value instanceof GawkObject) {
						value.__gawk__.removeParent(instance);
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
	 * Creates a new gawk array with the contents of this gawk array and one or
	 * more additional arrays or gawk arrays.
	 *
	 * @param {*} [...items] - One or more items to append to the new array.
	 * @returns {GawkArray}
	 * @access public
	 * /
	concat(...items) {
		const ga = new GawkArray;
		ga.push.apply(ga, this);
		ga.push.apply(ga, items);
		for (const item of ga) {
			if (item instanceof GawkArray || item instanceof GawkObject) {
				item.__gawk__.addParent(ga);
			}
		}
		return ga;
	}

	/**
	 * Fills elements of the array with a single value for the given range.
	 *
	 * @param {*} value - The value to fill with.
	 * @param {Number} [start=0] - The start index.
	 * @param {Number} [end=length] - The end index.
	 * @returns {GawkArray}
	 * @access public
	 * /
	fill(value, start = 0, end = this.length) {
		for (let i = start; i < end; i++) {
			if (this[i] instanceof GawkArray || this[i] instanceof GawkObject) {
				this[i].__gawk__.removeParent(this);
			}
		}
		super.fill(gawk(value, this), start, end);
		this.__gawk__.notify();
		return this;
	}

	pop() {
		const item = super.pop();
		if (item instanceof GawkArray || item instanceof GawkObject) {
			item.__gawk__.removeParent(this);
		}
		this.__gawk__.notify();
		return item;
	}

	push(...items) {
		const len = super.push.apply(this, items.map(item => gawk(item, this)));
		this.__gawk__.notify();
		return len;
	}

	shift() {
		const item = super.shift();
		if (item instanceof GawkArray || item instanceof GawkObject) {
			item.__gawk__.removeParent(this);
		}
		this.__gawk__.notify();
		return item;
	}
*/
	splice(start, deleteCount, ...items) {
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
				item.__gawk__.removeParent(this);
			}
		}

		this.__gawk__.notify();
		return arr;
	}
/*
	unshift(...items) {
		const len = super.unshift.apply(this, items.map(item => gawk(item, this)));
		this.__gawk__.notify();
		return len;
	}
	*/
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
				const changed = !target.hasOwnProperty(prop) || target[prop] !== value;
				delete target[prop];
				target[prop] = gawk(value, instance);
				if (changed) {
					target.__gawk__.notify();
				}
				return true;
			},

			deleteProperty: (target, prop) => {
				if (prop === '__gawk__') {
					throw new Error('"__gawk__" is read-only');
				}
				const value = target[prop];
				if (value instanceof GawkArray || value instanceof GawkObject) {
					value.__gawk__.removeParent(target);
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
				for (const w of obj.__gawk__.listeners) {
					this.__gawk__.listeners.add(w);
				}
			}
		}

		return instance;
	}
}

/**
 * Internal helper to perform validation and add/remove a listener.
 *
 * @param {String} action - Must be either "add" or "delete".
 * @param {GawkArray|GawkObject} subject - The gawk object the listener is being
 * added to or removed from.
 * @param {Function} listener - The listener function to add or remove.
 * @returns {GawkObject|GawkArray} Returns a gawked object or array depending on
 * the input object.
 */
function handleWatchUnwatch(action, subject, listener) {
	if (!(subject instanceof GawkArray) && !(subject instanceof GawkObject)) {
		throw new TypeError('Expected source to be a GawkArray or GawkObject');
	}

	if (typeof listener !== 'function') {
		throw new TypeError('Expected listener to be a function');
	}

	subject.__gawk__.listeners[action](listener);

	return subject;
}

/**
 * Adds a listener to be called when the specified object or any of its
 * properties/elements are changed.
 *
 * @param {Object|GawkObject|Array|GawkArray} subject - The object to watch.
 * @param {Function} listener - The function to call when something changes.
 * @returns {GawkObject|GawkArray} Returns a gawked object or array depending on
 * the input object.
 */
gawk.watch = function watch(subject, listener) {
	return handleWatchUnwatch('add', gawk(subject), listener);
};

/**
 * Removes a listener from the specified gawked object.
 *
 * @param {Object|GawkObject|Array|GawkArray} subject - The object to unwatch.
 * @param {Function} listener - The function to call when something changes.
 * @returns {GawkObject|GawkArray} Returns a gawked object or array depending on
 * the input object.
 */
gawk.unwatch = function unwatch(subject, listener) {
	return handleWatchUnwatch('delete', subject, listener);
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

			if (deep && srcValue !== null && typeof srcValue === 'object' && !Array.isArray(srcValue) && !(srcValue instanceof GawkArray)) {
				if (!(gobj[key] instanceof GawkObject)) {
					gobj[key] = gawk({}, gobj);
				}
				mixer(gobj[key], srcValue);
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

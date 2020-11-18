// istanbul ignore if
if (!Error.prepareStackTrace) {
	require('source-map-support/register');
}

import equal from 'fast-deep-equal';
import fs from 'fs';

/**
 * The Gawk version number.
 * @type {String}
 */
export const version = JSON.parse(fs.readFileSync(`${__dirname}/../package.json`, 'utf-8')).version;

/**
 * A list of built-in objects that should not be gawked.
 * @type {Array.<Object>}
 */
const builtIns = [
	process.env,
	Math,
	JSON
];
if (typeof Intl !== 'undefined') {
	builtIns.push(Intl);
}
if (typeof Reflect !== 'undefined') {
	builtIns.push(Reflect);
}

/**
 * Creates a gawk object that wraps the specified object.
 *
 * @param {*} value - A value to gawk.
 * @param {Array|Object} [parent] - The parent gawk object.
 * @returns {Array|Object|*}
 */
export default function gawk(value, parent) {
	if (parent !== undefined && !isGawked(parent)) {
		throw new TypeError('Expected parent to be gawked');
	}

	// only objects can be gawked and can't be a built-in object
	if (!value || typeof value !== 'object' || value instanceof Date || builtIns.indexOf(value) !== -1) {
		return value;
	}

	let gawked;

	if (typeof value.__gawk__ === 'object') {
		// already gawked
		if (value === parent) {
			throw new Error('The parent must not be the same object as the value');
		}
		gawked = value;
	} else {
		// gawk it!
		const revocable = Proxy.revocable(value, {
			deleteProperty(target, prop) {
				if (prop === '__gawk__') {
					throw new Error('Cannot delete property \'__gawk__\'');
				}

				// console.log('deleting', prop, target[prop]);

				if (!Object.prototype.hasOwnProperty.call(target, prop)) {
					return true;
				}

				const parents = isGawked(target[prop]) && target[prop].__gawk__.parents;
				if (parents) {
					parents.delete(gawked);
					if (!parents.size) {
						target[prop].__gawk__.parents = null;
					}
				}

				const result = delete target[prop];
				if (result) {
					notify(gawked);
				}
				return result;
			},

			set(target, prop, newValue) {
				if (prop === '__gawk__') {
					throw new Error('Cannot override property \'__gawk__\'');
				}

				// console.log('setting', prop, newValue);

				let changed = true;
				const desc = Object.getOwnPropertyDescriptor(target, prop);

				if (desc) {
					if (desc.writable === false) {
						// if both writable and configurable are false, then returning anything
						// will cause an error because without proxies, setting a non-writable
						// property has no effect, but attempting to set a proxied non-writable
						// property is a TypeError
						return true;
					}

					changed = target[prop] !== newValue;
					const parents = isGawked(target[prop]) && target[prop].__gawk__.parents;
					if (parents) {
						parents.delete(gawked);
						if (!parents.size) {
							target[prop].__gawk__.parents = null;
						}
					}

					// if the destination property has a setter, then we can't assume we need to
					// fire a delete
					if (typeof desc.set === 'function') {
						target[prop] = gawk(newValue, gawked);

					} else {
						if (!Array.isArray(target) || prop !== 'length') {
							delete target[prop];
						}
						desc.value = gawk(newValue, gawked);
						Object.defineProperty(target, prop, desc);
					}
				} else {
					target[prop] = gawk(newValue, gawked);
				}

				if (changed) {
					notify(gawked);
				}
				return true;
			}
		});

		gawked = revocable.proxy;

		Object.defineProperty(gawked, '__gawk__', {
			value: {
				/**
				 * A map of listener functions to call invoke when a change occurs. The associated
				 * key value is the optional filter to apply to the listener.
				 * @type {Map}
				 */
				listeners: null,

				/**
				 * A list of all the gawk object's parents. These parents are notified when a change
				 * occurs.
				 * @type {Set}
				 */
				parents: null,

				/**
				 * A map of listener functions to the last known hash of the stringified value. This
				 * is used to detect if a filtered watch should be notified.
				 * @type {WeakMap}
				 */
				previous: null,

				/**
				 * A list of child objects that are modified while paused.
				 * @type {Set}
				 */
				queue: null,

				/**
				 * The Gawk version. This is helpful for identifying the revision of this internal
				 * structure.
				 * @type {String}
				 */
				version,

				/**
				 * Dispatches change notifications to the listeners.
				 * @returns {Boolean} Returns `true` if it was already paused.
				 */
				pause() {
					if (!this.queue) {
						this.queue = new Set();
						return false;
					}
					return true;
				},

				/**
				 * Unpauses the gawk notifications and sends out any pending notifications.
				 */
				resume() {
					if (this.queue) {
						const queue = this.queue;
						this.queue = null;
						for (const instance of queue) {
							notify(gawked, instance);
						}
					}
				},

				/**
				 * Makes this gawked proxy unusable.
				 */
				revoke: revocable.revoke
			}
		});

		// gawk any object properties
		for (const key of Reflect.ownKeys(gawked)) {
			if (key !== '__gawk__' && gawked[key] && typeof gawked[key] === 'object') {
				// desc should always be an object since we know the key exists
				const desc = Object.getOwnPropertyDescriptor(gawked, key);
				if (desc && desc.configurable !== false) {
					desc.value = gawk(gawked[key], gawked);
					Object.defineProperty(gawked, key, desc);
				}
			}
		}

		if (Array.isArray(value)) {
			// some array functions do not invoke the delete handler, so we need to override the
			// method and do it ourselves
			const origPop = value.pop;
			const origShift = value.shift;
			const origSplice = value.splice;
			const origUnshift = value.unshift;

			Object.defineProperties(value, {
				pop: {
					configurable: true,
					value: function pop() {
						const wasPaused = this.__gawk__.pause();
						const item = origPop.call(this);
						wasPaused || this.__gawk__.resume();
						return item;
					}
				},

				shift: {
					configurable: true,
					value: function shift() {
						const wasPaused = this.__gawk__.pause();
						const item = origShift.call(this);
						wasPaused || this.__gawk__.resume();
						return item;
					}
				},

				splice: {
					configurable: true,
					value: function splice(start, deleteCount, ...items) {
						const wasPaused = this.__gawk__.pause();

						if (start !== undefined && deleteCount === undefined) {
							deleteCount = this.length - start;
						}

						const arr = origSplice.call(this, start, deleteCount, ...items);
						for (let i = start + items.length; i < this.length; i++) {
							if (this[i] && typeof this[i] === 'object') {
								this[i] = gawk(this[i], this);
							}
						}

						for (const item of arr) {
							if (isGawked(item) && item.__gawk__.parents) {
								item.__gawk__.parents.delete(this);
							}
						}

						wasPaused || this.__gawk__.resume();
						return arr;
					}
				},

				unshift: {
					configurable: true,
					value: function unshift(...items) {
						const wasPaused = this.__gawk__.pause();
						const len = origUnshift.apply(this, items.map(item => gawk(item, this)));
						wasPaused || this.__gawk__.resume();
						return len;
					}
				}
			});
		}
	}

	if (parent) {
		if (!gawked.__gawk__.parents) {
			gawked.__gawk__.parents = new Set();
		}
		gawked.__gawk__.parents.add(parent);
	}

	return gawked;
}

gawk.isGawked  = isGawked;
gawk.merge     = merge;
gawk.set       = set;
gawk.mergeDeep = mergeDeep;
gawk.watch     = watch;
gawk.unwatch   = unwatch;

export { gawk as gawk };

/**
 * Determines if the specified variable is gawked.
 *
 * @param {*} it - The variable to check.
 * @returns {Boolean}
 */
export function isGawked(it) {
	return !!(it && typeof it === 'object' && it.__gawk__ && typeof it.__gawk__ === 'object');
}

/**
 * Filters the specified gawk object.
 *
 * @param {Object} gobj - A gawked object.
 * @param {Array.<String>} filter - The filter to apply to the gawked object.
 * @returns {Object}
 */
function filterObject(gobj, filter) {
	let found = true;
	let obj = gobj;

	// find the value we're interested in
	for (let i = 0, len = filter.length; obj && typeof obj === 'object' && i < len; i++) {
		if (!Object.prototype.hasOwnProperty.call(obj, filter[i])) {
			found = false;
			obj = undefined;
			break;
		}
		obj = obj[filter[i]];
	}

	return { found, obj };
}

/**
 * Hashes a value quick and dirty.
 *
 * @param {*} it - A value to hash.
 * @returns {Number}
 */
function hashValue(it) {
	const str = JSON.stringify(it) || '';
	let hash = 5381;
	let i = str.length;
	while (i) {
		hash = hash * 33 ^ str.charCodeAt(--i);
	}
	return hash >>> 0;
}

/**
 * Dispatches change notifications to the listeners.
 *
 * @param {Object} gobj - The gawked object.
 * @param {Object|Array} [source] - The gawk object that was modified.
 */
function notify(gobj, source) {
	const state = gobj.__gawk__;

	if (source === undefined) {
		source = gobj;
	}

	// if we're paused, add this object to the list of objects that may have changed
	if (state.queue) {
		state.queue.add(gobj);
		return;
	}

	// notify all of this object's listeners
	if (state.listeners) {
		for (const [ listener, filter ] of state.listeners) {
			if (filter) {
				const { found, obj } = filterObject(gobj, filter);

				// compute the hash of the stringified value
				const hash = hashValue(obj);

				// check if the value changed
				if ((found && !state.previous) || (state.previous && hash !== state.previous.get(listener))) {
					listener(obj, source);
				}

				if (!state.previous) {
					state.previous = new WeakMap();
				}

				state.previous.set(listener, hash);
			} else {
				listener(gobj, source);
			}
		}
	}

	// notify all of this object's parents
	if (state.parents) {
		for (const parent of state.parents) {
			notify(parent, source);
		}
	}
}

/**
 * Copies listeners from a source gawked object ot a destination gawked object. Note that the
 * arguments must both be objects and only the `dest` is required to already be gawked.
 *
 * @param {Object|Array} dest - A gawked object to copy the listeners to.
 * @param {Object|Array} src - An object to copy the listeners from.
 * @param {Function} [compareFn] - Doubles up as a deep copy flag and a function to call to compare
 * a source and destination array elements to check if they are the same.
 */
function copyListeners(dest, src, compareFn) {
	if (isGawked(src) && src.__gawk__.listeners) {
		if (dest.__gawk__.listeners) {
			for (const [ listener, filter ] of src.__gawk__.listeners) {
				dest.__gawk__.listeners.set(listener, filter);
			}
		} else {
			dest.__gawk__.listeners = new Map(src.__gawk__.listeners);
		}
	}

	if (!compareFn) {
		return;
	}

	if (Array.isArray(dest)) {
		const visited = [];
		for (let i = 0, len = dest.length; i < len; i++) {
			if (dest[i] !== null && typeof dest[i] === 'object') {
				// try to find a match in src
				for (let j = 0, len2 = src.length; j < len2; j++) {
					if (!visited[j] && src[j] !== null && typeof src[j] === 'object' && compareFn(dest[i], src[j])) {
						visited[j] = 1;
						copyListeners(dest[i], src[j], compareFn);
						break;
					}
				}
			}
		}
		return;
	}

	for (const key of [ ...Object.getOwnPropertySymbols(dest), ...Object.getOwnPropertyNames(dest) ]) {
		if (key === '__gawk__') {
			continue;
		}

		if (dest[key] && typeof dest[key] === 'object') {
			copyListeners(dest[key], src[key], compareFn);
		}
	}
}

/**
 * A helper function for replacing the contents of one gawked object with another. It takes care of
 * recursively gawking all decending objects and copying listeners over.
 *
 * @param {Object|Array} dest - The destination gawked object or array.
 * @param {Object|Array} src - The source object or array.
 * @param {Function} [compareFn] - A function to call to compare a source and destination to check
 * if they are the same.
 * @returns {Object|Array} Returns the destination gawked object.
 */
export function set(dest, src, compareFn) {
	if (!dest || typeof dest !== 'object') {
		throw new TypeError('Expected destination to be an object');
	}

	if (!src || typeof src !== 'object') {
		// source is not an object, so just return it
		return src;
	}

	if (!compareFn) {
		compareFn = (dest, src) => {
			// note: we purposely do non-strict equality
			return equal(dest, src);
		};
	} else if (typeof compareFn !== 'function') {
		throw new TypeError('Expected compare callback to be a function');
	}

	const walk = (dest, src, quiet, changed) =>  {
		// suspend notifications if the dest is a new gawk object
		let wasPaused = false;
		if (!quiet) {
			wasPaused = dest.__gawk__.pause();
		}

		if (Array.isArray(src)) {
			// istanbul ignore if
			if (!Array.isArray(dest)) {
				throw new Error('Source is an array and expected dest to also be an array');
			}

			const visisted = [];

			for (let i = 0, len = src.length; i < len; i++) {
				if (src[i] !== null && typeof src[i] === 'object') {
					src[i] = gawk(src[i]);
					// try to find a match in dest
					for (let j = 0, len2 = dest.length; j < len2; j++) {
						if (!visisted[j] && dest[j] !== null && typeof dest[j] === 'object' && compareFn(dest[j], src[i])) {
							visisted[j] = 1;
							copyListeners(src[i], dest[j], compareFn);
							break;
						}
					}
				}
			}

			dest.splice(0, dest.length, ...src);

		} else {
			// istanbul ignore if
			if (!dest || typeof dest !== 'object') {
				throw new Error('Source is an object and expected dest to also be an object');
			}

			const tmp = {};

			for (const key of [ ...Object.getOwnPropertySymbols(src), ...Object.getOwnPropertyNames(src) ]) {
				if (key === '__gawk__') {
					continue;
				}

				const srcValue = src[key];

				// if the source value is not an object, return it now
				if (srcValue === null || typeof srcValue !== 'object') {
					tmp[key] = srcValue;
					continue;
				}

				// create a new dest object to copy the source into
				const destValue = gawk(Array.isArray(srcValue) ? [] : {});
				tmp[key] = walk(destValue, srcValue, !Object.prototype.hasOwnProperty.call(dest, key));
			}

			// prune the existing object, then copy all the properties from our temp object
			for (const key of [ ...Object.getOwnPropertySymbols(dest), ...Object.getOwnPropertyNames(dest) ]) {
				if (key !== '__gawk__') {
					delete dest[key];
				}
			}
			Object.assign(dest, tmp);
		}

		// copy the listeners
		copyListeners(dest, src);

		// did dest really change? if not, remove it from the queue
		if (!changed && dest.__gawk__.queue) {
			dest.__gawk__.queue.delete(dest);
		}

		// resume and send out change notifications
		wasPaused || dest.__gawk__.resume();

		return dest;
	};

	const destIsArray = Array.isArray(dest);
	const srcIsArray = Array.isArray(src);

	if (destIsArray !== srcIsArray) {
		// the type changed and there's no clear way to compare them, so just return a gawked clone
		// of the source
		dest = srcIsArray ? [] : {};
	}

	const gawked = isGawked(dest);

	return walk(gawked ? dest : gawk(dest), src, !gawked, !equal(dest, src));
}

/**
 * Adds a listener to be called when the specified object or any of its properties/elements are
 * changed.
 *
 * @param {Object|Array} subject - The object to watch.
 * @param {String|Array.<String>} [filter] - A property name or array of nested properties to watch.
 * @param {Function} listener - The function to call when something changes.
 * @returns {Object|Array} Returns a gawked object or array depending on the input object.
 */
export function watch(subject, filter, listener) {
	if (!isGawked(subject)) {
		throw new TypeError('Expected subject to be gawked');
	}

	if (typeof filter === 'function') {
		listener = filter;
		filter = null;
	}

	if (filter) {
		if (typeof filter === 'string') {
			filter = [ filter ];
		} else if (!Array.isArray(filter)) {
			throw new TypeError('Expected filter to be a string or array of strings');
		}
	}

	if (typeof listener !== 'function') {
		throw new TypeError('Expected listener to be a function');
	}

	if (!subject.__gawk__.listeners) {
		subject.__gawk__.listeners = new Map();
	}
	subject.__gawk__.listeners.set(listener, filter);

	if (filter) {
		const { found, obj } = filterObject(subject, filter);
		if (found) {
			const hash = hashValue(obj);
			if (!subject.__gawk__.previous) {
				subject.__gawk__.previous = new WeakMap();
			}
			subject.__gawk__.previous.set(listener, hash);
		}
	}

	return subject;
}

/**
 * Removes a listener from the specified gawked object.
 *
 * @param {Object|Array} subject - The object to unwatch.
 * @param {Function} [listener] - The function to call when something changes.
 * @returns {Object|Array} Returns a gawked object or array depending on the input object.
 */
export function unwatch(subject, listener) {
	if (!isGawked(subject)) {
		throw new TypeError('Expected subject to be gawked');
	}

	if (listener && typeof listener !== 'function') {
		throw new TypeError('Expected listener to be a function');
	}

	const g = subject.__gawk__;

	if (g.listeners) {
		if (listener) {
			g.listeners.delete(listener);
			if (g.previous) {
				g.previous.delete(listener);
			}
		} else {
			// remove all listeners
			for (const [ listener, filter ] of g.listeners) {
				g.listeners.delete(listener);
				if (g.previous) {
					g.previous.delete(listener);
				}
			}
		}

		if (!g.listeners.size) {
			g.listeners = null;
			g.previous = null;
		}
	}

	return subject;
}

/**
 * Mixes an array of objects or gawked objects into the specified gawked object.
 *
 * @param {Array.<Object>} objs - An array of objects or gawked objects.
 * @param {Boolean} [deep=false] - When true, mixes subobjects into each other.
 * @returns {Object}
 */
function mix(objs, deep) {
	const gobj = gawk(objs.shift());
	if (!isGawked(gobj) || Array.isArray(gobj)) {
		throw new TypeError('Expected destination to be a gawked object');
	}

	if (!objs.length) {
		return gobj;
	}

	// validate the objects are good
	for (const obj of objs) {
		if (!obj || typeof obj !== 'object' || Array.isArray(obj)) {
			throw new TypeError('Expected merge source to be an object');
		}
	}

	// we need to detach the parent and all listeners so that they will be notified after everything
	// has been merged
	gobj.__gawk__.pause();

	/**
	 * Mix an object or gawked object into a gawked object.
	 * @param {Object} gobj - The destination gawked object.
	 * @param {Object} src - The source object to copy from.
	 */
	const mixer = (gobj, src) => {
		for (const key of [ ...Object.getOwnPropertySymbols(src), ...Object.getOwnPropertyNames(src) ]) {
			if (key === '__gawk__') {
				continue;
			}

			const srcValue = src[key];

			if (deep && srcValue !== null && typeof srcValue === 'object' && !Array.isArray(srcValue)) {
				if (!isGawked(gobj[key])) {
					gobj[key] = gawk({}, gobj);
				}
				mixer(gobj[key], srcValue);
			} else if (Array.isArray(gobj[key]) && Array.isArray(srcValue)) {
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
 * Performs a shallow merge of one or more objects into the specified gawk object.
 *
 * @param {...Object} objs - The destination object followed by one or more objects to merge in.
 * @returns {Object}
 */
export function merge(...objs) {
	return mix(objs);
}

/**
 * Performs a deep merge of one or more objects into the specified gawk object.
 *
 * @param {...Object} objs - The destination object followed by one or more objects to deeply merge in.
 * @returns {Object}
 */
export function mergeDeep(...objs) {
	return mix(objs, true);
}

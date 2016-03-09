import hash from 'object-hash';
import 'source-map-support/register';

/**
 * Creates a gawk object that wraps the input value.
 * @param {*} value - A value to wrap.
 * @param {GawkBase} [parent] - The parent gawk object to notify of changes.
 * @returns {GawkBase}
 */
export function gawk(value, parent) {
	let cls;

	if (typeof value === 'undefined') {
		value = undefined;
		cls = GawkUndefined;
	} else if (value === null) {
		cls = GawkNull;
	} else if (typeof value === 'number' || value instanceof Number) {
		cls = GawkNumber;
	} else if (typeof value === 'boolean' || value instanceof Boolean) {
		cls = GawkBoolean;
	} else if (typeof value === 'string' || value instanceof String) {
		cls = GawkString;
	} else if (Array.isArray(value)) {
		cls = GawkArray;
	} else if (value instanceof Date) {
		cls = GawkDate;
	} else if (typeof value === 'function') {
		cls = GawkFunction;
	} else if (typeof value === 'object') {
		if (value instanceof GawkBase) {
			return value;
		}
		cls = GawkObject;
	} else {
		throw new TypeError('Unsupported type');
	}

	return new cls(value, parent);
}

/**
 * The base class for all gawk data types.
 */
export class GawkBase {
	/**
	 * Constructs the base object.
	 * @param {*} value - The value being wrapped.
	 * @param {GawkBase} [parent] - The parent gawk object to notify of changes.
	 * @access public
	 */
	constructor(value, parent) {
		if (parent && !(parent instanceof GawkBase)) {
			throw new TypeError('Parent must be a gawk class');
		}

		Object.defineProperties(this, {
			hash: { enumerable: true, value: typeof value === 'undefined' ? null : hash(value), writable: true },
			value: { enumerable: true, value, writable: true },
			parent: { value: parent, writable: true },
			watchers: { value: [], writable: true }
		});
	}

	/**
	 * Returns the value.
	 * @returns {*}
	 * @access public
	 */
	get val() {
		return this.value;
	}

	/**
	 * Sets the value.
	 * @param {*} value - The value to set.
	 * @access public
	 */
	set val(value) {
		this.save(value);
	}

	/**
	 * Returns a string of the value.
	 * @returns {String}
	 * @access public
	 */
	toString() {
		if (typeof this.value === 'undefined' || this.value === null) {
			return '';
		}
		return String(this.value);
	}

	/**
	 * Returns the raw value.
	 * @returns {*}
	 * @access public
	 */
	valueOf() {
		const val = this.val;
		if (typeof val === 'undefined' || val === null) {
			return val;
		}
		return val.valueOf();
	}

	/**
	 * Internal helper that stores the value and notifies watchers.
	 * @param {*} value - The value to save.
	 * @access private
	 */
	save(newValue) {
		const oldValue = this.value;
		this.value = newValue;
		if (this.hasChanged(oldValue, newValue)) {
			this.notify();
		}
	}

	/**
	 * Determines if the value has changed.
	 * @returns {Boolean}
	 * @access private
	 */
	hasChanged(oldValue, newValue) {
		const oldHash = this.hash;
		const newHash = this.hash = this.hasher(newValue);
		return oldHash !== newHash;
	}

	/**
	 * Internal helper that hashes any value. This method can be overridden by
	 * classes.
	 * @param {*} value - The value to hash.
	 * @returns {String|null} Returns null if value is undefined, otherwise a string.
	 * @access private
	 */
	hasher(value) {
		return typeof value === 'undefined' ? null : hash(value);
	}

	/**
	 * Notifies watchers and the parent gawk object when this object changes.
	 * @access private
	 */
	notify() {
		const evt = {
			type: 'change',
			target: this
		};

		for (let w of this.watchers) {
			w(evt);
		}

		this.parent && this.parent.notify();
	}

	/**
	 * Adds a function to be invoked when this gawk object or any of its
	 * children are changed.
	 * @param {Function} fn - A callback to fire when something changes.
	 * @returns {Function} A function to stop watching.
	 * @access public
	 */
	watch(fn) {
		if (typeof fn !== 'function') {
			throw new TypeError('Listener must be a function');
		}

		this.watchers.push(fn);
		return () => {
			// remove all matches
			for (let i = 0, l = this.watchers.length; i < l; i++) {
				if (this.watchers[i] === fn) {
					this.watchers.splice(i--, 1);
				}
			}
		};
	}
}

/**
 * Gawk class to wrap undefined values.
 */
export class GawkUndefined extends GawkBase {
	/**
	 * Constructs the null object and makes sure the value is null.
	 * @param {Undefined} value - The value must be omitted or null.
	 * @param {GawkBase} [parent] - The parent gawk object to notify of changes.
	 * @access public
	 */
	constructor(value, parent) {
		super(undefined, parent);
	}

	/**
	 * Returns the value.
	 * @returns {null}
	 * @access public
	 */
	get val() {
		return this.value;
	}

	/**
	 * Stores undefined.
	 * @access public
	 */
	set val(value) {
		this.save(undefined);
	}
}

/**
 * Gawk class to wrap null values.
 */
export class GawkNull extends GawkBase {
	/**
	 * Constructs the null object and makes sure the value is null.
	 * @param {null} value - The value must be omitted or null.
	 * @param {GawkBase} [parent] - The parent gawk object to notify of changes.
	 * @access public
	 */
	constructor(value, parent) {
		super(null, parent);
	}

	/**
	 * Returns the value.
	 * @returns {null}
	 * @access public
	 */
	get val() {
		return this.value;
	}

	/**
	 * Stores null.
	 * @access public
	 */
	set val(value) {
		this.save(null);
	}
}

/**
 * Gawk class to wrap numbers.
 */
export class GawkNumber extends GawkBase {
	/**
	 * Constructs the number object and makes sure the value is a number.
	 * @param {Number} value - The value to make a bool and set.
	 * @param {GawkBase} [parent] - The parent gawk object to notify of changes.
	 * @access public
	 */
	constructor(value, parent) {
		super(typeof value === 'undefined' || value instanceof GawkUndefined ? 0 : value instanceof GawkBase ? +value.val : +value, parent);
	}

	/**
	 * Returns the value.
	 * @returns {Number}
	 * @access public
	 */
	get val() {
		return this.value;
	}

	/**
	 * Stores a new number value.
	 * @param {Number} value - The new number value to set.
	 * @access public
	 */
	set val(value) {
		this.save(typeof value === 'undefined' || value instanceof GawkUndefined ? 0 : value instanceof GawkBase ? +value.val : +value);
	}
}

/**
 * Gawk class to wrap bools.
 */
export class GawkBoolean extends GawkBase {
	/**
	 * Constructs the boolean object and makes sure the value is a bool.
	 * @param {Boolean} value - The value to make a bool and set.
	 * @param {GawkBase} [parent] - The parent gawk object to notify of changes.
	 * @access public
	 */
	constructor(value, parent) {
		super(value instanceof Boolean ? value.valueOf() : value instanceof GawkBase ? !!value.val : !!value, parent);
	}

	/**
	 * Returns the value.
	 * @returns {Boolean}
	 * @access public
	 */
	get val() {
		return this.value;
	}

	/**
	 * Stores a new boolean value.
	 * @param {Boolean} value - The new boolean value to set.
	 * @access public
	 */
	set val(value) {
		this.save(value instanceof Boolean ? value.valueOf() : value instanceof GawkBase ? !!value.val : !!value);
	}
}

/**
 * Gawk class to wrap strings.
 */
export class GawkString extends GawkBase {
	/**
	 * Constructs the string object and makes sure the value is a string.
	 * @param {String} value - The value to make a string and set.
	 * @param {GawkBase} [parent] - The parent gawk object to notify of changes.
	 * @access public
	 */
	constructor(value, parent) {
		super(String(value instanceof GawkBase ? value.val : value), parent);
	}

	/**
	 * Returns the value.
	 * @returns {String}
	 * @access public
	 */
	get val() {
		return this.value;
	}

	/**
	 * Stores a new string value.
	 * @param {String} value - The new string value to set.
	 * @access public
	 */
	set val(value) {
		this.save(String(value instanceof GawkBase ? value.val : value));
	}
}

/**
 * Gawk class to wrap functions.
 */
export class GawkFunction extends GawkBase {
	/**
	 * Constructs the function object.
	 * @param {Function} value - The function to set.
	 * @param {GawkBase} [parent] - The parent gawk object to notify of changes.
	 * @access public
	 */
	constructor(value, parent) {
		if (typeof value !== 'function' && !(value instanceof GawkFunction)) {
			throw new TypeError('Value must be a function');
		}
		super(value instanceof GawkFunction ? value.val : value, parent);
	}

	/**
	 * Returns the value.
	 * @returns {*}
	 * @access public
	 */
	get val() {
		return this.value;
	}

	/**
	 * Sets the value.
	 * @param {*} value - The value to set.
	 * @access public
	 */
	set val(value) {
		if (typeof value !== 'function' && !(value instanceof GawkFunction)) {
			throw new TypeError('Value must be a function');
		}
		this.save(value instanceof GawkFunction ? value.val : value);
	}

	/**
	 * Determines if the value has changed.
	 * @returns {Boolean}
	 * @access private
	 */
	hasChanged(oldValue, newValue) {
		this.hash = this.hasher(newValue);
		// we can't compare hashes since two different functions can have the
		// same hash, so we compare the actual values
		return oldValue !== newValue;
	}

	/**
	 * Runs the function.
	 * @param {*} [...args] - Zero or more arguments to pass in to the function.
	 * @returns {*}
	 * @access public
	 */
	exec(...args) {
		return this.value.apply(this, args);
	}
}

/**
 * Gawk class to wrap dates.
 */
export class GawkDate extends GawkBase {
	/**
	 * Constructs the date object by duplicating the input value.
	 * @param {Date} value - The date to set.
	 * @param {GawkBase} [parent] - The parent gawk object to notify of changes.
	 * @access public
	 */
	constructor(value, parent) {
		if (!(value instanceof Date) && !(value instanceof GawkDate)) {
			throw new TypeError('Value must be a date');
		}
		super(new Date((value instanceof GawkDate ? value.val : value).getTime()), parent);
	}

	/**
	 * Returns the value.
	 * @returns {Date}
	 * @access public
	 */
	get val() {
		return this.value;
	}

	/**
	 * Stores a new date value.
	 * @param {Date} value - The new date value to set.
	 * @access public
	 */
	set val(value) {
		if (!(value instanceof Date) && !(value instanceof GawkDate)) {
			throw new TypeError('Value must be a date');
		}
		this.save(value instanceof GawkDate ? value.val : value);
	}
}

/**
 * Gawk class to wrap arrays.
 */
export class GawkArray extends GawkBase {
	/**
	 * Constructs the array object by duplicating the input value.
	 * @param {Array} value - The value to set.
	 * @param {GawkBase} [parent] - The parent gawk object to notify of changes.
	 * @access public
	 */
	constructor(value, parent) {
		if (value && !Array.isArray(value) && !(value instanceof GawkArray)) {
			throw new TypeError('Value must be an array');
		}

		const isGawked = value instanceof GawkArray;
		const len = value.length;
		const arr = new Array(len);

		super(arr, parent);

		for (let i = 0; i < len; i++) {
			this.value[i] = gawk(isGawked ? value.value[i].val : value[i], this);
		}
	}

	/**
	 * Returns the a JSON value.
	 * @returns {Array}
	 * @access public
	 */
	get val() {
		return this.value.map(i => i.val);
	}

	/**
	 * Stores a new array value.
	 * @param {Array} value - The new array value to set.
	 * @access public
	 */
	set val(value) {
		if (!Array.isArray(value) && !(value instanceof GawkArray)) {
			throw new TypeError('Value must be an array');
		}

		const isGawked = value instanceof GawkArray;
		const len = value.length;
		const newValue = new Array(len);

		for (let i = 0; i < len; i++) {
			newValue[i] = gawk(isGawked ? value.value[i].val : value[i], this);
		}

		this.save(newValue);
	}

	/**
	 * Returns the array length.
	 * @returns {Number}
	 * @access public
	 */
	get length() {
		return this.value.length;
	}

	/**
	 * Adds one or more items to the end of the array.
	 * @returns {Number} The new length.
	 * @access public
	 */
	push(...items) {
		this.value.push.apply(this.value, items.map(i => gawk(i, this)));
		this.notify();
	}

	/**
	 * Removes the last item of the array and returns it.
	 * @returns {*}
	 * @access public
	 */
	pop() {
		const result = this.value.pop().val;
		this.notify();
		return result;
	}

	/**
	 * Adds one or more items to the beginning of the array.
	 * @param {*} [...items] - One or more items to add.
	 * @returns {Number} The new length.
	 */
	unshift(...items) {
		if (!items.length) {
			return 0;
		}
		const result = this.value.unshift.apply(this.value, items.map(i => gawk(i, this)));
		this.notify();
		return result;
	}

	/**
	 * Removes the first item of the array and returns it.
	 * @returns {*}
	 * @access public
	 */
	shift() {
		const result = this.value.shift().val;
		this.notify();
		return result;
	}
}

/**
 * Gawk class to wrap objects.
 */
export class GawkObject extends GawkBase {
	/**
	 * Constructs the object by duplicating the input value.
	 * @param {Object} value - The value to set.
	 * @param {GawkBase} [parent] - The parent gawk object to notify of changes.
	 * @access public
	 */
	constructor(value, parent) {
		const obj = {};
		super(obj, parent);

		if (typeof value === undefined) {
			return;
		}
		if (typeof value !== 'object') {
			throw new TypeError('Value must be an object');
		}
		if (value === null) {
			throw new TypeError('Value must be non-null');
		}

		const isGawked = value instanceof GawkObject;

		if (!isGawked && value instanceof GawkBase) {
			throw new TypeError('Value must be a GawkObject or non-gawk object');
		}

		if (isGawked) {
			value.keys().forEach(key => {
				obj[key] = gawk(value.value[key].val, this);
			});
		} else {
			Object.keys(value).forEach(key => {
				obj[key] = gawk(value[key], this);
			});
		}
	}

	/**
	 * Returns the a JSON value.
	 * @returns {Object}
	 * @access public
	 */
	get val() {
		const obj = {};
		Object.keys(this.value).forEach(key => {
			obj[key] = this.value[key].val;
		});
		return obj;
	}

	/**
	 * Stores a new object value.
	 * @param {Object} value - The new array value to set.
	 * @access public
	 */
	set val(value) {
		if (typeof value !== 'object') {
			throw new TypeError('Value must be an object');
		}
		if (value === null) {
			throw new TypeError('Value must be non-null');
		}
		const newValue = {};
		Object.keys(value).forEach(key => {
			newValue[key] = gawk(value[key], this);
		});
		this.save(newValue);
	}

	/**
	 * Sets the value for a specific key in the object. You may also pass in an
	 * array of keys to set the value for a deeply nested object value.
	 * @param {String|Array<String>} key - The key or array of key segments.
	 * @param {*} value - The value to set.
	 * @returns {*} The gawked value.
	 * @access public
	 */
	set(key, value) {
		let obj = this;
		if (Array.isArray(key)) {
			for (let i = 0, len = key.length - 1; i < len; i++) {
				let child = obj.value[key[i]];
				if (!(child instanceof GawkObject)) {
					child = obj.value[key[i]] = new GawkObject({}, this);
				}
				obj = child;
			}
			key = key.pop();
		}
		const val = obj.value[key] = gawk(value, this);
		this.notify();
		return val;
	}

	/**
	 * Gets the value for a specific key in the object. You may also pass in an
	 * array of keys to set the value for a deeply nested object value.
	 * @param {String|Array<String>} key - The key or array of key segments.
	 * @returns {*} The gawked value.
	 * @access public
	 */
	get(key) {
		let obj = this;
		if (Array.isArray(key)) {
			for (let i = 0, len = key.length - 1; i < len; i++) {
				obj = obj.value[key[i]];
				if (!(obj instanceof GawkObject)) {
					return undefined;
				}
			}
			key = key.pop();
		}
		return obj.value[key];
	}

	/**
	 * Removes a key/value from the object.
	 * @param {String} key - The key to delete.
	 * @returns {GawkObject}
	 */
	delete(key) {
		if (this.value[key]) {
			delete this.value[key];
			this.notify();
		}
		return this;
	}

	/**
	 * Removes all key/value pairs from the object.
	 * @returns {GawkObject}
	 */
	clear() {
		this.save({});
		return this;
	}

	/**
	 * Returns an array of all keys.
	 * @returns {Array}
	 */
	keys() {
		return Object.keys(this.value);
	}
}

import hash from 'object-hash';
import 'source-map-support/register';

/*
 * Golden Rules:
 *  - Internal value must always be a JS data type, not a gawked type.
 *  - All gawk types must define a `val` setter and getter.
 *  - Gawk containers (such as GawkArray and GawkObject) must recompute their
 *    hash again if mutated or if a child changes.
 *  - Gawk containers must implement their own hasher().
 *  - Gawk containers must duplicate their input values.
 *  - All methods or properties that return the value must returned the gawked
 *    value unless the `val` getter or `toJS()` method is invoked.
 *  - Gawk types may only have 1 and only 1 parent.
 *  - When setting a new value, detach the old value's parent.
 */

/**
 * Creates a gawk object that wraps the input value.
 * @param {*} value - A value to wrap.
 * @param {GawkBase} [parent] - The parent gawk object to notify of changes.
 * @returns {GawkBase}
 */
export default function gawk(value, parent) {
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
			value._parent = parent;
			return value;
		}
		cls = GawkObject;
	} else {
		throw new TypeError('Unsupported type');
	}

	return new cls(value, parent);
}

export { gawk as gawk };

/**
 * Event class.
 */
export class GawkEvent {
	constructor({ source, target, type }) {
		this.source = source;
		this.target = target;
		this.type = type;
	}
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
	constructor(value, parent = null) {
		if (parent && !(parent instanceof GawkBase)) {
			throw new TypeError('Parent must be a gawk class');
		}

		Object.defineProperties(this, {
			/**
			 * The sha1 hash of this value. If the value is undefined, then the
			 * hash will always be `null`.
			 * @type {String}
			 * @access private
			 */
			_hash: { enumerable: true, value: this.hasher(value), writable: true },

			/**
			 * The actual value. This will always be a non-gawk type.
			 * @type {Array}
			 * @access private
			 */
			_value: { enumerable: true, value, writable: true },

			/**
			 * The parent reference to notify if change occurs.
			 * @type {GawkBase}
			 * @access private
			 */
			_parent: { value: parent, writable: true },

			/**
			 * The list of all watchers to notify of changes.
			 * @type {Array}
			 * @access private
			 */
			_watchers: { value: [], writable: true }
		});
	}

	/**
	 * Returns the value's hash. If the value is `undefined`, then the hash is `null`.
	 * @returns {String}
	 * @access public
	 */
	get hash() {
		return this._hash;
	}

	/**
	 * Returns the value as a pure JavaScript data type.
	 * @returns {*}
	 * @access public
	 */
	toJS() {
		return this.val;
	}

	/**
	 * Returns the value as a stringified JSON structure. Note that functions
	 * will be omitted.
	 * @param {Boolean} pretty - When `true`, adds whitespace to stringified output.
	 * @returns {String}
	 * @access public
	 */
	toJSON(pretty) {
		return JSON.stringify(this.val, null, pretty ? '  ' : undefined);
	}

	/**
	 * Returns a string of the value.
	 * @returns {String}
	 * @access public
	 */
	toString() {
		if (typeof this._value === 'undefined' || this._value === null) {
			return '';
		}
		return String(this._value);
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
	 * Determines if the value has changed.
	 * @param {{ newHash: String, newValue: *, oldHash: String, oldValue: * }} param - New and old hashes and values.
	 * @returns {Boolean}
	 * @access private
	 */
	didChange({ newHash, oldHash }) {
		return oldHash !== newHash;
	}

	/**
	 * Internal helper that hashes any value. This method can be overridden by
	 * classes.
	 * @param {*} value - The value to hash.
	 * @returns {String}
	 * @access private
	 */
	hasher(value) {
		return typeof value === 'undefined' ? 'undefined' : hash(value);
	}

	/**
	 * Detaches any child gawk objects. This is so containers such as `GawkArray`
	 * and `GawkObject` can disassociate themselves from their children.
	 * @access private
	 */
	detachChildren() {
		// noop
	}

	/**
	 * Notifies watchers and the parent gawk object when this object changes.
	 * @param {*|GawkEvent} [newValue] - When value is a GawkEvent, that means
	 * a child gawk object was changed. Otherwise, if a value is present, then
	 * it is the new value. If there is no value passed in, then the existing
	 * value was mutated and we just need to recompute the hash and send out
	 * notifications.
	 * @access private
	 */
	notify(newValue) {
		const oldValue = this._value;
		const oldHash = this._hash;

		// newValue is a new value and not an event or undefined (mutation only)
		const newishValue = arguments.length && !(newValue instanceof GawkEvent) ? newValue : oldValue;
		const newHash = this.hasher(newishValue);

		if (!this.didChange({ newHash, newValue: newishValue, oldHash, oldValue })) {
			return;
		}

		// at this point, either this value or a child value changed

		this._hash = newHash;

		if (arguments.length && !(newValue instanceof GawkEvent)) {
			// we have a new value, detach any children and set it
			this.detachChildren();
			this._value = newValue;
		}

		const evt = new GawkEvent({
			source: this,
			target: arguments.length && newValue instanceof GawkEvent ? newValue.target : this,
			type: 'change'
		});

		for (let w of this._watchers) {
			w(evt);
		}

		this._parent && this._parent.notify(evt);
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

		this._watchers.push(fn);

		return () => {
			// remove all matches
			for (let i = 0; i < this._watchers.length; i++) {
				if (this._watchers[i] === fn) {
					this._watchers.splice(i--, 1);
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
	 * @param {Undefined} [value] - The value must be omitted or null.
	 * @param {GawkBase} [parent] - The parent gawk object to notify of changes.
	 * @access public
	 */
	constructor(value, parent) {
		if (typeof parent === 'undefined' && value instanceof GawkBase) {
			parent = value;
		}
		super(undefined, parent);
	}

	/**
	 * Returns the value.
	 * @returns {null}
	 * @access public
	 */
	get val() {
		return this._value;
	}

	/**
	 * Stores undefined.
	 * @access public
	 */
	set val(value) {
		this.notify(undefined);
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
		if (typeof parent === 'undefined' && value instanceof GawkBase) {
			parent = value;
		}
		super(null, parent);
	}

	/**
	 * Returns the value.
	 * @returns {null}
	 * @access public
	 */
	get val() {
		return this._value;
	}

	/**
	 * Stores null.
	 * @access public
	 */
	set val(value) {
		this.notify(null);
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
	constructor(value = 0, parent) {
		super(value instanceof GawkUndefined ? 0 : value instanceof GawkBase ? +value.val : +value, parent);
	}

	/**
	 * Returns the value.
	 * @returns {Number}
	 * @access public
	 */
	get val() {
		return this._value;
	}

	/**
	 * Stores a new number value.
	 * @param {Number} value - The new number value to set.
	 * @access public
	 */
	set val(value) {
		this.notify(typeof value === 'undefined' || value instanceof GawkUndefined ? 0 : value instanceof GawkBase ? +value.val : +value);
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
	constructor(value = false, parent) {
		super(value instanceof Boolean ? value.valueOf() : value instanceof GawkBase ? !!value.val : !!value, parent);
	}

	/**
	 * Returns the value.
	 * @returns {Boolean}
	 * @access public
	 */
	get val() {
		return this._value;
	}

	/**
	 * Stores a new boolean value.
	 * @param {Boolean} value - The new boolean value to set.
	 * @access public
	 */
	set val(value) {
		this.notify(value instanceof Boolean ? value.valueOf() : value instanceof GawkBase ? !!value.val : !!value);
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
		if (typeof value === 'undefined' || value instanceof GawkUndefined) {
			value = '';
		}
		super(String(value instanceof GawkBase ? value.val : value), parent);
	}

	/**
	 * Returns the value.
	 * @returns {String}
	 * @access public
	 */
	get val() {
		return this._value;
	}

	/**
	 * Stores a new string value.
	 * @param {String} value - The new string value to set.
	 * @access public
	 */
	set val(value) {
		if (typeof value === 'undefined' || value instanceof GawkUndefined) {
			value = '';
		}
		this.notify(String(value instanceof GawkBase ? value.val : value));
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
		return this._value;
	}

	/**
	 * Sets the value.
	 * @param {Function} value - The value to set.
	 * @access public
	 */
	set val(value) {
		if (typeof value !== 'function' && !(value instanceof GawkFunction)) {
			throw new TypeError('Value must be a function');
		}
		this.notify(value instanceof GawkFunction ? value.val : value);
	}

	/**
	 * Determines if the value has changed.
	 * @param {{ newValue: Function, oldValue: Function }} param - New and old hashes and values.
	 * @returns {Boolean}
	 * @access private
	 */
	didChange({ newValue, oldValue }) {
		return oldValue !== newValue;
	}

	/**
	 * Runs the function.
	 * @param {...*} [args] - Zero or more arguments to pass in to the function.
	 * @returns {*}
	 * @access public
	 */
	exec(...args) {
		return this._value.apply(this, args);
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
		if (typeof value === 'undefined' || value instanceof GawkUndefined) {
			value = new Date;
		}
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
		return this._value;
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
		this.notify(value instanceof GawkDate ? value.val : value);
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
	constructor(value = [], parent) {
		if (!Array.isArray(value) && !(value instanceof GawkArray)) {
			throw new TypeError('Value must be an array');
		}

		const arr = [];
		super(arr, parent);

		const isGawked = value instanceof GawkArray;
		const len = arr.length = value.length;

		if (len) {
			// the initial hash is for an unpopulated array, so we need compute the
			// real hash and we're going to do it as we copy each element to save
			// ourselves from having to loop again
			this._hash = '';

			for (let i = 0; i < len; i++) {
				arr[i] = gawk(isGawked ? value._value[i].val : value[i], this);
				this._hash = hash(this._hash + arr[i]._hash);
			}
		}
	}

	/**
	 * Internal helper that hashes any value.
	 * @param {Array} value - The array to hash.
	 * @returns {String}
	 * @access private
	 */
	hasher(value) {
		return value.length ? value.reduce((prev, elem) => hash(prev + elem.hash), '') : hash([]);
	}

	/**
	 * Detaches any child gawk objects.
	 * @access private
	 */
	detachChildren() {
		for (let elem of this._value) {
			elem._parent = null;
		}
	}

	/**
	 * Returns the a JSON value.
	 * @returns {Array}
	 * @access public
	 */
	get val() {
		return this._value.map(i => i.val);
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
		this.notify((value instanceof GawkArray ? value.val : value).map(elem => gawk(elem, this)));
	}

	/**
	 * Returns the gawked value at the specified index.
	 * @param {Number} index - The index to return.
	 * @returns {GawkBase}
	 * @access public
	 */
	get(index) {
		return this._value[index];
	}

	/**
	 * Returns the gawked value at the specified index.
	 * @param {Number} index - The index to return.
	 * @param {*} value - The value to
	 * @returns {GawkBase}
	 * @access public
	 */
	set(index, value) {
		if (this._value[index] instanceof GawkBase) {
			this._value[index]._parent = null;
		}
		this._value[index] = gawk(value);
		this.notify();
		return this;
	}

	/**
	 * Returns the array length.
	 * @returns {Number}
	 * @access public
	 */
	get length() {
		return this._value.length;
	}

	/**
	 * Removes an item at the specified index.
	 * @param {Number} index - The index to remove.
	 * @returns {GawkBase} The removed item or `undefined` if nothing was removed.
	 * @access public
	 */
	delete(index) {
		const value = this._value.splice(index, 1)[0];
		if (value instanceof GawkBase) {
			value._parent = null;
		}
		this.notify();
		return value;
	}

	/**
	 * Removes all items from the array.
	 * @returns {GawkArray}
	 * @access public
	 */
	clear() {
		this.notify([]);
		return this;
	}

	/**
	 * Adds one or more items to the end of the array.
	 * @returns {Number} The new length.
	 * @access public
	 */
	push(...items) {
		this._value.push.apply(this._value, items.map(i => gawk(i, this)));
		this.notify();
		return this._value.length;
	}

	/**
	 * Removes the last item of the array and returns it.
	 * @returns {GawkBase}
	 * @access public
	 */
	pop() {
		const result = this._value.pop();
		this.notify();
		return result;
	}

	/**
	 * Adds one or more items to the beginning of the array.
	 * @param {...*} [items] - One or more items to add.
	 * @returns {Number} The new length.
	 * @access public
	 */
	unshift(...items) {
		const result = this._value.unshift.apply(this._value, items.map(i => gawk(i, this)));
		this.notify();
		return result;
	}

	/**
	 * Removes the first item of the array and returns it.
	 * @returns {GawkBase}
	 * @access public
	 */
	shift() {
		const result = this._value.shift();
		this.notify();
		return result;
	}

	/**
	 * Returns a deep copy of a portion of the array as a new `GawkArray`.
	 * @param {Number} [start] - The index to start the slice.
	 * @param {Number} [end] - The index to end the slice.
	 * @returns {GawkArray}
	 * @access public
	 */
	slice(start, end) {
		return new GawkArray(this._value.slice(start, end).map(elem => elem.val));
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
	constructor(value = {}, parent) {
		if (typeof value !== 'object' || value === null || Array.isArray(value)) {
			throw new TypeError('Value must be an object');
		}

		const obj = {};
		super(obj, parent);

		const isGawked = value instanceof GawkObject;
		if (!isGawked && value instanceof GawkBase) {
			throw new TypeError('Value must be a GawkObject or non-gawk object');
		}

		const keys = Object.keys(isGawked ? value._value : value);
		if (keys.length) {
			// the initial hash is for an unpopulated object, so we need compute
			// the real hash and we're going to do it as we copy each element to
			// save ourselves from having to loop again
			this._hash = '';

			for (let key of keys) {
				const v = obj[key] = gawk(isGawked ? value._value[key].val : value[key], this);
				this._hash = hash(this._hash + v._hash);
			}
		}
	}

	/**
	 * Internal helper that hashes any value.
	 * @param {Object} value - The object to hash.
	 * @returns {String}
	 * @access private
	 */
	hasher(value) {
		const keys = Object.keys(value);
		return keys.length ? keys.reduce((prev, key) => hash(prev + value[key]._hash), '') : hash({});
	}

	/**
	 * Detaches any child gawk objects.
	 * @access private
	 */
	detachChildren() {
		for (let key of Object.keys(this._value)) {
			this._value[key]._parent = null;
		}
	}

	/**
	 * Returns the a JSON value.
	 * @returns {Object}
	 * @access public
	 */
	get val() {
		const obj = {};
		for (let key of Object.keys(this._value)) {
			obj[key] = this._value[key].val;
		}
		return obj;
	}

	/**
	 * Stores a new object value.
	 * @param {Object} value - The new array value to set.
	 * @access public
	 */
	set val(value) {
		if (typeof value !== 'object' || value === null || Array.isArray(value)) {
			throw new TypeError('Value must be an object');
		}

		const isGawked = value instanceof GawkObject;
		if (!isGawked && value instanceof GawkBase) {
			throw new TypeError('Value must be a GawkObject or non-Gawk* object');
		}

		const newValue = {};
		for (let key of Object.keys(isGawked ? value._value : value)) {
			newValue[key] = gawk(isGawked ? value._value[key].val : value[key], this);
		}
		this.notify(newValue);
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
				obj = obj._value[key[i]];
				if (!(obj instanceof GawkObject)) {
					return new GawkUndefined(this);
				}
			}
			key = key.pop();
		}
		if (typeof key === 'undefined') {
			return this;
		} else if (typeof obj._value[key] === 'undefined') {
			return new GawkUndefined(this);
		}
		return obj._value[key];
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
				let child = obj._value[key[i]];
				if (!(child instanceof GawkObject)) {
					child = obj._value[key[i]] = new GawkObject({}, this);
				}
				obj = child;
			}
			key = key.pop();
		}

		if (obj._value[key] instanceof GawkBase) {
			obj._value[key]._parent = null;
		}

		const oldValue = obj._value[key];
		let newValue = gawk(value, this);

		// if we had a previous gawk type and the new value is the same type,
		// then just set the value instead of overwriting it so that existing
		// watchers will be notified
		if (oldValue && Object.getPrototypeOf(oldValue) === Object.getPrototypeOf(newValue)) {
			oldValue.val = value;
			newValue = oldValue;
		} else {
			obj._value[key] = newValue;
		}

		this.notify();
		return newValue;
	}

	/**
	 * Removes a key/value from the object.
	 * @param {String} key - The key to delete.
	 * @returns {*} The removed item.
	 * @access public
	 */
	delete(key) {
		if (this._value.hasOwnProperty(key)) {
			const value = this._value[key];
			if (value instanceof GawkBase) {
				value._parent = null;
			}
			delete this._value[key];
			this.notify();
			return value;
		}
	}

	/**
	 * Removes all key/value pairs from the object.
	 * @returns {GawkObject}
	 * @access public
	 */
	clear() {
		this.detachChildren();
		this.notify({});
		return this;
	}

	/**
	 * Returns an array of all keys.
	 * @returns {Array}
	 * @access public
	 */
	keys() {
		return Object.keys(this._value);
	}

	/**
	 * Mixes an array of objects or GawkObjects into this GawkObject.
	 * @param {Array} objs - An array of objects or GawkObjects.
	 * @param {Boolean} [deep=false] - When true, mixes subobjects into each other.
	 * @returns {GawkObject}
	 * @access private
	 */
	mix(objs, deep) {
		if (!objs.length || objs.some(obj => {
			return typeof obj !== 'object' || obj === null || Array.isArray(obj) || (obj instanceof GawkBase && !(obj instanceof GawkObject));
		})) {
			throw new TypeError('Value must be an object or GawkObject');
		}

		let changed = false;

		/**
		 * Mix an object or GawkObject into a GawkObject.
		 * @param {GawkObject} dest
		 * @param {Object} src
		 */
		const mixer = (dest, src) => {
			for (let key of Object.keys(src)) {
				const srcValue = src[key] instanceof GawkBase ? src[key]._value : src[key];
				if (deep && ((typeof srcValue === 'object' && srcValue !== null && !Array.isArray(srcValue) && !(srcValue instanceof GawkBase)) || srcValue instanceof GawkObject)) {
					if (!(dest._value[key] instanceof GawkObject)) {
						dest._value[key] = new GawkObject({}, dest);
					}
					mixer(dest._value[key], srcValue);
				} else if (deep) {
					dest.set(key, srcValue);
				} else {
					// manually set so that we don't bubble up change notifications
					dest._value[key] = gawk(srcValue, dest);
				}
			}

			// manually recompute the hash of this dest object now that we're
			// finished adding key/values to it
			const newHash = dest.hasher(dest._value);
			if (newHash !== dest._hash) {
				changed = true;
				dest._hash = newHash;
			}
		};

		for (let obj of objs) {
			mixer(this, obj instanceof GawkObject ? obj._value : obj);
		}

		if (changed) {
			// We know a child hash changed, but because the last loop of mixer()
			// set the correct object hash, notify() won't think anything changed.
			//
			// So we just set the hash to something that rocks and notify() will
			// recompute the correct hash, detect the change, and send out the
			// event notifications.
			this._hash = 'gawk rocks';
		}

		this.notify();
		return this;
	}

	/**
	 * Performs a shallow merge of one or more objects and/or GawkObjects into
	 * this object.
	 * @param {...Object|GawkObject} objs - One or more objects to merge in.
	 * @returns {GawkObject}
	 * @access public
	 */
	merge(...objs) {
		return this.mix(objs);
	}

	/**
	 * Performs a deep merge of another object or GawkObject into this object.
	 * @param {...Object|GawkObject} objs - One or more objects to deeply merge in.
	 * @returns {GawkObject}
	 * @access public
	 */
	mergeDeep(...objs) {
		return this.mix(objs, true);
	}
}

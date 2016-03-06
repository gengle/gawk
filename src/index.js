import 'babel-polyfill';
import 'source-map-support/register';

export function gawk(it, parent) {
	let cls;

	if (typeof it === 'undefined' || typeof it === 'function') {
		it = undefined;
		cls = GawkUndefined;
	} else if (it === null) {
		cls = GawkNull;
	} else if (typeof it === 'number' || it instanceof Number) {
		cls = isNaN(it) ? GawkNaN : GawkNumber;
	} else if (typeof it === 'boolean' || it instanceof Boolean) {
		cls = GawkBoolean;
	} else if (typeof it === 'string' || it instanceof String) {
		cls = GawkString;
	} else if (Array.isArray(it)) {
		cls = GawkArray;
	} else if (it instanceof Date) {
		cls = GawkDate;
	} else if (typeof it === 'object') {
		if (it instanceof GawkBase) {
			return it;
		}
		cls = GawkObject;
	} else {
		throw new Error('Unsupported type');
	}

	return new cls(it, parent);
}

export class GawkBase {
	constructor(value, parent) {
		Object.defineProperties(this, {
			value: { value, writable: true },
			parent: { value: parent, writable: true },
			watchers: { value: [], writable: true }
		});
	}

	get val() {
		return this.value;
	}

	set val(value) {
		this.value = value;
	}

	toString() {
		if (typeof this.value === 'undefined' || this.value === null) {
			return '';
		}
		return String(this.value);
	}

	valueOf() {
		return this.val;
	}

	notify(oldValue) {
		const evt = {
			target: this,
			old: oldValue,
			new: this.val
		};
		for (let w of this.watchers) {
			w(evt);
		}
		this.parent && this.parent.notify(evt);
	}

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

export class GawkUndefined extends GawkBase {}

export class GawkNull extends GawkBase {}

export class GawkNaN extends GawkBase {}

export class GawkNumber extends GawkBase {
	constructor(value, parent) {
		super(+value, parent);
	}
}

export class GawkBoolean extends GawkBase {
	constructor(value, parent) {
		super(value instanceof Boolean ? value.valueOf() : !!value, parent);
	}
}

export class GawkString extends GawkBase {
	constructor(value, parent) {
		super(String(value), parent);
	}
}

export class GawkDate extends GawkBase {
	constructor(value, parent) {
		super(value, parent);
	}

	// set val(value) {
	// 	this.value = new Date;
	// 	this.value.setTime(value.getTime());
	// }
}

export class GawkArray extends GawkBase {
	constructor(value, parent) {
		const len = value.length;
		const arr = new Array(len);
		super(arr, parent);
		for (let i = 0; i < len; i++) {
			this.value[i] = gawk(value[i], this);
		}
	}

	get val() {
		return this.value.map(i => i.val);
	}

	set val(value) {
		const oldValue = this.value.map(i => i.val);
		const len = value.length;
		this.value = new Array(len);
		for (let i = 0; i < len; i++) {
			this.value[i] = gawk(value[i], this);
		}
		this.notify(oldValue);
	}

	get length() {
		return this.value.length;
	}

	push(...items) {
		const oldValue = this.value.map(i => i.val);
		this.value = this.value.concat.apply(this.value, items.map(i => gawk(i, this)));
		this.notify(oldValue);
	}

	// pop()
}

export class GawkObject extends GawkBase {
	constructor(value, parent) {
		super(value, parent);
	}

	get val() {
		return {};
	}

	// set()
	// delete()
	// clear()
	// update()
	// assign()
}

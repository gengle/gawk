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
		Object.defineProperty(this, 'value', { value });
		Object.defineProperty(this, 'parent', { value: parent });
		Object.defineProperty(this, 'watchers', { value: [], writable: true });
	}

	val() {
		return this.value;
	}

	notify() {
		const evt = {
			target: this
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
}

export class GawkArray extends GawkBase {
	constructor(value, parent) {
		const arr = [];
		super(arr, parent);
		for (let i = 0, l = value.length; i < l; i++) {
			arr.push(gawk(value[i], this));
		}
	}

	push(...items) {
		this.value.push.apply(this.value, items.map(i => gawk(i, this)));
		this.notify();
	}

	val() {
		return this.value.map(i => i.val());
	}
}

export class GawkObject extends GawkBase {
	constructor(value, parent) {
		super(value, parent);
	}

	val() {
		return {};
	}
}

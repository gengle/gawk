import gawk, { Gawk, isGawked } from '../dist/index';

import { EventEmitter } from 'events';

const version = require('./../package.json').version;

describe('gawk() object', () => {
	it('should gawk empty object', () => {
		const obj = {};
		const gobj = gawk(obj);
		expect(isGawked(gobj)).to.be.true;
		expect(gobj).to.deep.equal(obj);
		expect(gobj.__gawk__.version).to.equal(version);
	});

	it('should passhthrough non-object values', () => {
		const gobj = gawk('hello!');
		expect(isGawked(gobj)).to.be.false;
		expect(gobj).to.equal('hello!');
	});

	it('should gawk object with mixed values', () => {
		const obj = {
			foo: 'bar',
			num: 123,
			pi: 3.14,
			undef: undefined,
			nul: null,
			nan: NaN,
			arr: [ 'a', 123, 4.56, null, undefined ],
			fn: function () {}
		};
		const gobj = gawk(obj);
		expect(isGawked(gobj)).to.be.true;
		expect(Object.keys(gobj)).to.deep.equal(Object.keys(obj));
		expect(gobj).to.be.an('object');
		expect(gobj).to.deep.equal(obj);
		expect(isGawked(gobj.arr)).to.be.true;
		expect(gobj.arr.__gawk__.parents.has(gobj)).to.be.true;
	});

	it('should gawk object with nested objects', () => {
		const obj = { foo: { bar: 'baz' } };
		const gobj = gawk(obj);
		expect(isGawked(gobj)).to.be.true;
		expect(gobj).to.be.an('object');
		expect(gobj).to.deep.equal(obj);
		expect(isGawked(gobj.foo)).to.be.true;
		expect(gobj.foo.__gawk__.parents.has(gobj)).to.be.true;
	});

	it('should fail if parent is not a gawk object', () => {
		expect(() => {
			gawk({}, 'foo');
		}).to.throw(TypeError, 'Expected parent to be gawked');
	});

	it('should not gawk Dates', () => {
		const date = new Date;
		const gobj = gawk(date);
		expect(isGawked(gobj)).to.be.false;
		expect(gobj).to.equal(date);
		expect(gobj.getTime).to.be.a('function');
		expect(gobj.getTime()).to.be.a('number');
	});

	it('should not gawk the JSON namespace', () => {
		const gobj = gawk(JSON);
		expect(isGawked(gobj)).to.be.false;
		expect(gobj).to.equal(JSON);
	});

	it('should not gawk the Math namespace', () => {
		const gobj = gawk(Math);
		expect(isGawked(gobj)).to.be.false;
		expect(gobj).to.equal(Math);
	});

	(typeof Intl !== 'undefined' ? it : it.skip)('should not gawk the Intl namespace', () => {
		const gobj = gawk(Intl);
		expect(isGawked(gobj)).to.be.false;
		expect(gobj).to.equal(Intl);
	});

	(typeof Reflect !== 'undefined' ? it : it.skip)('should not gawk the Reflect namespace', () => {
		const gobj = gawk(Reflect);
		expect(isGawked(gobj)).to.be.false;
		expect(gobj).to.equal(Reflect);
	});

	it('should not clobber EventEmitter', () => {
		const emitter = new EventEmitter;
		const gobj = gawk(emitter);
		expect(isGawked(gobj)).to.be.true;
		expect(gobj).to.be.instanceOf(EventEmitter);
		expect(gobj.on).to.be.a('function');
		expect(gobj).to.not.equal(emitter);
	});

	it('should not gawk process.env', () => {
		const gobj = gawk(process.env);
		expect(gobj).not.to.have.property('__gawk__');
		expect(isGawked(gobj)).to.be.false;
	});

	it('should gawk clone of process.env', () => {
		const gobj = gawk(Object.assign({}, process.env));
		expect(isGawked(gobj)).to.be.true;
	});

	it('should gawk object with symbol keys', () => {
		const s = Symbol();
		const gobj = gawk({
			foo: {
				name: 'foo!'
			},
			[s]: {
				name: 'symbol!'
			}
		});
		expect(isGawked(gobj)).to.be.true;
		expect(gobj.foo).to.deep.equal({ name: 'foo!' });
		expect(gobj[s]).to.deep.equal({ name: 'symbol!' });
	});

	it('should not allow __gawk__ to be set', () => {
		const gobj = gawk({});
		expect(isGawked(gobj)).to.be.true;
		expect(() => {
			gobj.__gawk__ = 'foo';
		}).to.throw(Error, 'Cannot override property \'__gawk__\'');
	});

	it('should not allow __gawk__ to be deleted', () => {
		const gobj = gawk({});
		expect(isGawked(gobj)).to.be.true;
		expect(() => {
			delete gobj.__gawk__;
		}).to.throw(Error, 'Cannot delete property \'__gawk__\'');
	});

	it('should fail if gawking an object that is the parent', () => {
		const gobj = gawk({});
		expect(isGawked(gobj)).to.be.true;
		expect(() => {
			gawk(gobj, gobj);
		}).to.throw(Error, 'The parent must not be the same object as the value');
	});

	it('should copy another gawked object', () => {
		const obj = { foo: 'bar' };
		const gobj = gawk(obj);
		expect(isGawked(gobj)).to.be.true;
		const gobj2 = gawk(gobj);
		expect(isGawked(gobj2)).to.be.true;
		expect(gobj).to.deep.equal(obj);
		expect(gobj2).to.deep.equal(obj);
		expect(gobj2).to.equal(gobj);
	});
});

describe('built-ins', () => {
	it('should support toString()', () => {
		const obj = { foo: 'bar' };
		const gobj = gawk(obj);
		expect(gobj.toString()).to.equal('[object Object]');
	});

	it('should support valueOf()', () => {
		const obj = { foo: 'bar' };
		const gobj = gawk(obj);
		expect(gobj.valueOf()).to.deep.equal(obj);
	});
});

describe('get property', () => {
	it('should get a value by key', () => {
		const str = gawk({ foo: 'bar' }).foo;
		expect(str).to.be.an.a.string;
		expect(str).to.equal('bar');
	});

	it('should get undefined for non-existent key', () => {
		const undef = gawk({}).foo;
		expect(undef).to.be.undefined;
	});

	it('should get a deeply nested object by key', () => {
		const str = gawk({ foo: { bar: 'wiz' } }).foo.bar;
		expect(str).to.be.a('string');
		expect(str).to.equal('wiz');
	});

	it('should get a deeply nested non-object by key', () => {
		const undef = gawk({ foo: 'wiz' }).foo.bar;
		expect(undef).to.be.undefined;
	});

	it('should get undefined for non-existent deeply nested key', () => {
		const undef = gawk({ foo: { } }).foo.bar;
		expect(undef).to.be.undefined;
	});
});

describe('set property', () => {
	it('should set a value', () => {
		const gobj = gawk({});
		gobj.foo = 'bar';
		expect(gobj).to.deep.equal({ foo: 'bar' });
	});

	it('should create child object and set its value', () => {
		const gobj = gawk({});
		gobj.foo = {};
		gobj.foo.bar = 'wiz';
		expect(isGawked(gobj.foo)).to.be.true;
		expect(gobj.foo.__gawk__.parents.has(gobj)).to.be.true;
		expect(gobj).to.deep.equal({ foo: { bar: 'wiz' } });
	});

	it('should override child value', () => {
		const gobj = gawk({
			foo: {
				bar: 'baz'
			}
		});

		gobj.foo.bar = 'wiz';

		expect(gobj).to.deep.equal({ foo: { bar: 'wiz' } });
		expect(isGawked(gobj.foo)).to.be.true;
		expect(gobj.foo.__gawk__.parents.has(gobj)).to.be.true;
	});

	it('should override a different gawk type on set', () => {
		const gobj = gawk({
			foo: null
		});

		gobj.foo = 'bar';

		expect(gobj).to.deep.equal({ foo: 'bar' });
	});
});

describe('delete property', () => {
	it('should delete an existing key/value', () => {
		const gobj = gawk({ foo: 'bar' });
		const r = delete gobj.foo;
		expect(r).to.be.true;
		expect(Object.keys(gobj).length).to.equal(0);
		expect(gobj).to.deep.equal({});
	});

	it('should not error trying to delete non-existent key', () => {
		const gobj = gawk({});
		const r = delete gobj.foo;
		expect(r).to.be.true;
		expect(Object.keys(gobj).length).to.equal(0);
		expect(gobj).to.deep.equal({});
	});
});

describe('hasOwnProperty()', () => {
	it('should tell if it has a key', () => {
		const gobj = gawk({ foo: 'bar' });
		expect(gobj.hasOwnProperty('foo')).to.be.true;
		expect(gobj.hasOwnProperty('baz')).to.be.false;
	});
});

describe('Object.keys()', () => {
	it('should return an array of the keys in the object', () => {
		const gobj = gawk({
			foo: 'bar',
			pi: 3.14
		});
		const keys = Object.keys(gobj);
		expect(keys).to.be.an('array');
		expect(keys).to.have.lengthOf(2);
		expect(keys).to.deep.equal([ 'foo', 'pi' ]);
	});
});

describe('JSON.stringify()', () => {
	it('should stringify a gawked object', () => {
		expect(JSON.stringify(gawk({ foo: 'bar' }))).to.equal('{"foo":"bar"}');
		expect(JSON.stringify(gawk({ foo: 'bar' }), null, '  ')).to.equal('{\n  "foo": "bar"\n}');
	});
});

describe('gawk.merge()', () => {
	it('should merge a JS object', () => {
		let gobj = gawk({ foo: 'bar' });
		gobj = gawk.merge(gobj, { pi: 3.14 });
		expect(gobj).to.deep.equal({ foo: 'bar', pi: 3.14 });
	});

	it('should merge a gawked object', () => {
		let gobj = gawk({ foo: 'bar' });
		gobj = gawk.merge(gobj, gawk({ pi: 3.14 }));
		expect(gobj).to.deep.equal({ foo: 'bar', pi: 3.14 });
	});

	it('should do nothing if not merging anything', () => {
		let gobj = gawk({ foo: 'bar' });
		gobj = gawk.merge(gobj);
		expect(gobj).to.deep.equal({ foo: 'bar' });
	});

	it('should merge multiple JS objects and gawked objects', () => {
		let gobj = gawk({ foo: 'bar' });
		gobj = gawk.merge(gobj, { baz: 'wiz' }, gawk({ pi: 3.14 }), { num: 123 }, gawk({ arr: [ 'a', 'b' ] }));
		expect(gobj).to.deep.equal({ foo: 'bar', baz: 'wiz', pi: 3.14, num: 123, arr: [ 'a', 'b' ] });
		expect(isGawked(gobj.arr)).to.be.true;
		expect(gobj.arr.__gawk__.parents.has(gobj)).to.be.true;
	});

	it('should merge and overwrite', () => {
		let gobj = gawk({ foo: 'bar' });
		gobj = gawk.merge(gobj, { foo: 'wiz' });
		expect(gobj).to.deep.equal({ foo: 'wiz' });
	});

	it('should throw TypeError if no args', () => {
		expect(() => {
			gawk.merge();
		}).to.throw(TypeError, 'Expected destination to be a gawked object');
	});

	it('should fail to merge non-object and non-gawked objects', () => {
		const gobj = gawk({});
		expect(() => { gawk.merge(gobj, undefined); }).to.throw(TypeError, 'Expected merge source to be an object');
		expect(() => { gawk.merge(gobj, null); }).to.throw(TypeError, 'Expected merge source to be an object');
		expect(() => { gawk.merge(gobj, true); }).to.throw(TypeError, 'Expected merge source to be an object');
		expect(() => { gawk.merge(gobj, 'foo'); }).to.throw(TypeError, 'Expected merge source to be an object');
		expect(() => { gawk.merge(gobj, 123); }).to.throw(TypeError, 'Expected merge source to be an object');
		expect(() => { gawk.merge(gobj, 3.14); }).to.throw(TypeError, 'Expected merge source to be an object');
		expect(() => { gawk.merge(gobj, NaN); }).to.throw(TypeError, 'Expected merge source to be an object');
		expect(() => { gawk.merge(gobj, [ 'a', 'b' ]); }).to.throw(TypeError, 'Expected merge source to be an object');
		expect(() => { gawk.merge(gobj, function () {}); }).to.throw(TypeError, 'Expected merge source to be an object');
	});

	it('should throw TypeError when setting non-object gawk type', () => {
		const gobj = gawk({});
		expect(() => { gawk.merge(gobj, gawk()); }).to.throw(TypeError, 'Expected merge source to be an object');
		expect(() => { gawk.merge(gobj, gawk(null)); }).to.throw(TypeError, 'Expected merge source to be an object');
		expect(() => { gawk.merge(gobj, gawk(true)); }).to.throw(TypeError), 'Expected merge source to be an object';
		expect(() => { gawk.merge(gobj, gawk('foo')); }).to.throw(TypeError, 'Expected merge source to be an object');
		expect(() => { gawk.merge(gobj, gawk(123)); }).to.throw(TypeError, 'Expected merge source to be an object');
		expect(() => { gawk.merge(gobj, gawk(3.14)); }).to.throw(TypeError, 'Expected merge source to be an object');
		expect(() => { gawk.merge(gobj, gawk(NaN)); }).to.throw(TypeError, 'Expected merge source to be an object');
		expect(() => { gawk.merge(gobj, gawk([ 'a', 'b' ])); }).to.throw(TypeError, 'Expected merge source to be an object');
		expect(() => { gawk.merge(gobj, gawk(function () {})); }).to.throw(TypeError, 'Expected merge source to be an object');
	});

	it('should assign another gawk object', () => {
		const gobj = gawk({ foo: 'bar' });
		const gobj2 = gawk({ pi: 3.14 });
		gawk.merge(gobj, gobj2);
		expect(gobj).to.deep.equal({ foo: 'bar', pi: 3.14 });
	});

	it('should shallow merge', () => {
		const gobj = gawk({ foo: { bar: { baz: 'wiz' } } });
		gawk.merge(gobj, { foo: { pi: 3.14 } });
		expect(gobj).to.deep.equal({ foo: { pi: 3.14 }});
		expect(isGawked(gobj.foo)).to.be.true;
		expect(gobj.foo.__gawk__.parents.has(gobj)).to.be.true;
	});
});

describe('gawk.mergeDeep()', () => {
	it('should merge a JS object', () => {
		let gobj = gawk({ foo: 'bar' });
		gobj = gawk.mergeDeep(gobj, { pi: 3.14 });
		expect(gobj).to.deep.equal({ foo: 'bar', pi: 3.14 });
	});

	it('should merge a gawked object', () => {
		let gobj = gawk({ foo: 'bar' });
		gobj = gawk.mergeDeep(gobj, gawk({ pi: 3.14 }));
		expect(gobj).to.deep.equal({ foo: 'bar', pi: 3.14 });
	});

	it('should merge multiple JS objects and gawked objects', () => {
		let gobj = gawk({ foo: 'bar' });
		gobj = gawk.mergeDeep(gobj, { baz: 'wiz' }, gawk({ pi: 3.14 }), { num: 123 }, gawk({ arr: [ 'a', 'b' ] }));
		expect(gobj).to.deep.equal({ foo: 'bar', baz: 'wiz', pi: 3.14, num: 123, arr: [ 'a', 'b' ] });
		expect(isGawked(gobj.arr)).to.be.true;
		expect(gobj.arr.__gawk__.parents.has(gobj)).to.be.true;
	});

	it('should merge and overwrite', () => {
		let gobj = gawk({ foo: 'bar' });
		gobj = gawk.mergeDeep(gobj, { foo: 'wiz' });
		expect(gobj).to.deep.equal({ foo: 'wiz' });
	});

	it('should throw TypeError if no args', () => {
		expect(() => {
			gawk.mergeDeep();
		}).to.throw(TypeError, 'Expected destination to be a gawked object');
	});

	it('should fail to merge non-object and non-gawked objects types', () => {
		expect(() => {
			gawk.mergeDeep('foo');
		}).to.throw(TypeError, 'Expected destination to be a gawked object');

		expect(() => {
			gawk.mergeDeep({}, gawk('foo'));
		}).to.throw(TypeError, 'Expected merge source to be an object');
	});

	it('should deep merge', () => {
		let gobj = gawk({ foo: { bar: { baz: 'wiz' } } });
		gobj = gawk.mergeDeep(gobj, { foo: { pi: 3.14, biz: { wap: 'fip' } } });

		expect(gobj).to.deep.equal({
			foo: {
				bar: {
					baz: 'wiz'
				},
				pi: 3.14,
				biz: {
					wap: 'fip'
				}
			}
		});

		expect(isGawked(gobj.foo)).to.be.true;
		expect(gobj.foo.__gawk__.parents.has(gobj)).to.be.true;

		expect(isGawked(gobj.foo.bar)).to.be.true;
		expect(gobj.foo.bar.__gawk__.parents.has(gobj.foo)).to.be.true;

		expect(isGawked(gobj.foo.biz)).to.be.true;
		expect(gobj.foo.biz.__gawk__.parents.has(gobj.foo)).to.be.true;
	});
});

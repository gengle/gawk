import gawk, { GawkArray, GawkObject } from '../src/index';

describe('GawkObject', () => {
	describe('gawk()', () => {
		it('should gawk empty object', () => {
			const obj = {};
			const gobj = gawk(obj);
			expect(gobj).to.be.an.instanceof(GawkObject);
			expect(gobj).to.deep.equal(obj);
		});

		it('should gawk object with mixed values', () => {
			const obj = {
				foo: 'bar',
				num: 123,
				pi: 3.14,
				undef: undefined,
				nul: null,
				nan: NaN,
				arr: ['a', 123, 4.56, null, undefined],
				fn: function () {}
			};
			const gobj = gawk(obj);
			expect(gobj).to.be.an.instanceof(GawkObject);
			expect(Object.keys(gobj)).to.deep.equal(Object.keys(obj));
			expect(gobj).to.be.an.object;
			expect(gobj).to.deep.equal(obj);
			expect(gobj.arr).to.be.instanceof(GawkArray);
			expect(gobj.arr.__gawk__.hasParent(gobj)).to.be.true;
		});

		it('should gawk object with nested objects', () => {
			const obj = { foo: { bar: 'baz' } };
			const gobj = gawk(obj);
			expect(gobj).to.be.an.instanceof(GawkObject);
			expect(gobj).to.be.an.object;
			expect(gobj).to.deep.equal(obj);
			expect(gobj.foo).to.be.instanceof(GawkObject);
			expect(gobj.foo.__gawk__.hasParent(gobj)).to.be.true;
		});

		it('should create a gawk object without an explicit value', () => {
			const gobj = new GawkObject;
			expect(gobj).to.deep.equal({});
		});

		it('should fail if parent is not a gawk object', () => {
			expect(() => {
				gawk({}, 'foo');
			}).to.throw(TypeError, 'Expected parent to be a GawkArray or GawkObject');
		});
	});

	describe('new GawkObject()', () => {
		it('should throw TypeError for non-object value', () => {
			expect(() => new GawkObject(true)).to.throw(TypeError);
			expect(() => new GawkObject('foo')).to.throw(TypeError);
			expect(() => new GawkObject(123)).to.throw(TypeError);
			expect(() => new GawkObject(3.14)).to.throw(TypeError);
			expect(() => new GawkObject(NaN)).to.throw(TypeError);
			expect(() => new GawkObject(['a', 'b'])).to.throw(TypeError);
			expect(() => new GawkObject(function () {})).to.throw(TypeError);
		});

		it('should throw TypeError for non-object gawk type', () => {
			expect(() => new GawkObject(gawk(true))).to.throw(TypeError);
			expect(() => new GawkObject(gawk('foo'))).to.throw(TypeError);
			expect(() => new GawkObject(gawk(123))).to.throw(TypeError);
			expect(() => new GawkObject(gawk(3.14))).to.throw(TypeError);
			expect(() => new GawkObject(gawk(NaN))).to.throw(TypeError);
			expect(() => new GawkObject(gawk(['a', 'b']))).to.throw(TypeError);
			expect(() => new GawkObject(gawk(function () {}))).to.throw(TypeError);
		});

		it('should copy another gawked object', () => {
			const obj = { foo: 'bar' };
			const gobj = new GawkObject(gawk(obj));
			expect(gobj).to.deep.equal(obj);
		});
	});

	describe('toString()', () => {
		it('should support toString()', () => {
			const obj = { foo: 'bar' };
			const gobj = gawk(obj);
			expect(gobj.toString()).to.equal('[object Object]');
		});
	});

	describe('valueOf()', () => {
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
			expect(str).to.be.a.string;
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
			expect(gobj.foo).to.be.instanceof(GawkObject);
			expect(gobj.foo.__gawk__.hasParent(gobj)).to.be.true;
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
			expect(gobj.foo).to.be.instanceof(GawkObject);
			expect(gobj.foo.__gawk__.hasParent(gobj)).to.be.true;
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
			expect(r).to.be.tru;
			expect(Object.keys(gobj).length).to.equal(0);
			expect(gobj).to.deep.equal({});
		});

		it('should not error trying to delete non-existent key', () => {
			const gobj = gawk({});
			const r = delete gobj.foo;
			expect(r).to.be.tru;
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
			expect(keys).to.be.an.array;
			expect(keys).to.have.lengthOf(2);
			expect(keys).to.deep.equal(['foo', 'pi']);
		});
	});

	describe('JSON.stringify()', () => {
		it('should stringify a GawkObject', () => {
			expect(JSON.stringify(gawk({ foo: 'bar' }))).to.equal('{"foo":"bar"}');
			expect(JSON.stringify(gawk({ foo: 'bar' }), null, '  ')).to.equal('{\n  "foo": "bar"\n}');
		});
	});

	describe('merge()', () => {
		it('should merge a JS object', () => {
			let gobj = gawk({ foo: 'bar' });
			gobj = gawk.merge(gobj, { pi: 3.14 });
			expect(gobj).to.deep.equal({ foo: 'bar', pi: 3.14 });
		});

		it('should merge a GawkObject', () => {
			let gobj = gawk({ foo: 'bar' });
			gobj = gawk.merge(gobj, gawk({ pi: 3.14 }));
			expect(gobj).to.deep.equal({ foo: 'bar', pi: 3.14 });
		});

		it('should merge multiple JS objects and GawkObjects', () => {
			let gobj = gawk({ foo: 'bar' });
			gobj = gawk.merge(gobj, { baz: 'wiz' }, gawk({ pi: 3.14 }), { num: 123 }, gawk({ arr: ['a', 'b'] }));
			expect(gobj).to.deep.equal({ foo: 'bar', baz: 'wiz', pi: 3.14, num: 123, arr: ['a', 'b'] });
			expect(gobj.arr).to.be.instanceof(GawkArray);
			expect(gobj.arr.__gawk__.hasParent(gobj)).to.be.true;
		});

		it('should merge and overwrite', () => {
			let gobj = gawk({ foo: 'bar' });
			gobj = gawk.merge(gobj, { foo: 'wiz' });
			expect(gobj).to.deep.equal({ foo: 'wiz' });
		});

		it('should throw TypeError if no args', () => {
			expect(() => { gawk.merge(); }).to.throw(TypeError);
		});

		it('should fail to merge non-object and non-GawkObjects types', () => {
			const gobj = gawk({});
			expect(() => { gawk.merge(gobj, undefined); }).to.throw(TypeError);
			expect(() => { gawk.merge(gobj, null); }).to.throw(TypeError);
			expect(() => { gawk.merge(gobj, true); }).to.throw(TypeError);
			expect(() => { gawk.merge(gobj, 'foo'); }).to.throw(TypeError);
			expect(() => { gawk.merge(gobj, 123); }).to.throw(TypeError);
			expect(() => { gawk.merge(gobj, 3.14); }).to.throw(TypeError);
			expect(() => { gawk.merge(gobj, NaN); }).to.throw(TypeError);
			expect(() => { gawk.merge(gobj, ['a', 'b']); }).to.throw(TypeError);
			expect(() => { gawk.merge(gobj, function () {}); }).to.throw(TypeError);
		});

		it('should throw TypeError when setting non-object gawk type', () => {
			const gobj = gawk({});
			expect(() => { gawk.merge(gobj, gawk()); }).to.throw(TypeError);
			expect(() => { gawk.merge(gobj, gawk(null)); }).to.throw(TypeError);
			expect(() => { gawk.merge(gobj, gawk(true)); }).to.throw(TypeError);
			expect(() => { gawk.merge(gobj, gawk('foo')); }).to.throw(TypeError);
			expect(() => { gawk.merge(gobj, gawk(123)); }).to.throw(TypeError);
			expect(() => { gawk.merge(gobj, gawk(3.14)); }).to.throw(TypeError);
			expect(() => { gawk.merge(gobj, gawk(NaN)); }).to.throw(TypeError);
			expect(() => { gawk.merge(gobj, gawk(['a', 'b'])); }).to.throw(TypeError);
			expect(() => { gawk.merge(gobj, gawk(function () {})); }).to.throw(TypeError);
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
			expect(gobj.foo).to.be.instanceof(GawkObject);
			expect(gobj.foo.__gawk__.hasParent(gobj)).to.be.true;
		});
	});

	describe('mergeDeep()', () => {
		it('should merge a JS object', () => {
			let gobj = gawk({ foo: 'bar' });
			gobj = gawk.mergeDeep(gobj, { pi: 3.14 });
			expect(gobj).to.deep.equal({ foo: 'bar', pi: 3.14 });
		});

		it('should merge a GawkObject', () => {
			let gobj = gawk({ foo: 'bar' });
			gobj = gawk.mergeDeep(gobj, gawk({ pi: 3.14 }));
			expect(gobj).to.deep.equal({ foo: 'bar', pi: 3.14 });
		});

		it('should merge multiple JS objects and GawkObjects', () => {
			let gobj = gawk({ foo: 'bar' });
			gobj = gawk.mergeDeep(gobj, { baz: 'wiz' }, gawk({ pi: 3.14 }), { num: 123 }, gawk({ arr: ['a', 'b'] }));
			expect(gobj).to.deep.equal({ foo: 'bar', baz: 'wiz', pi: 3.14, num: 123, arr: ['a', 'b'] });
			expect(gobj.arr).to.be.instanceof(GawkArray);
			expect(gobj.arr.__gawk__.hasParent(gobj)).to.be.true;
		});

		it('should merge and overwrite', () => {
			let gobj = gawk({ foo: 'bar' });
			gobj = gawk.mergeDeep(gobj, { foo: 'wiz' });
			expect(gobj).to.deep.equal({ foo: 'wiz' });
		});

		it('should throw TypeError if no args', () => {
			expect(() => { gawk.mergeDeep(); }).to.throw(TypeError);
		});

		it('should fail to merge non-object and non-GawkObjects types', () => {
			expect(() => { gawk.mergeDeep('foo'); }).to.throw(TypeError);
			expect(() => { gawk.mergeDeep({}, gawk('foo')); }).to.throw(TypeError);
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
			expect(gobj.foo).to.be.instanceof(GawkObject);
			expect(gobj.foo.__gawk__.hasParent(gobj)).to.be.true;
			expect(gobj.foo.bar).to.be.instanceof(GawkObject);
			expect(gobj.foo.bar.__gawk__.hasParent(gobj.foo)).to.be.true;
			expect(gobj.foo.biz).to.be.instanceof(GawkObject);
			expect(gobj.foo.biz.__gawk__.hasParent(gobj.foo)).to.be.true;
		});
	});
});

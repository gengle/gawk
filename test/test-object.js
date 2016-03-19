import { gawk, GawkObject, GawkString, GawkArray } from '../src/index';

describe('object', () => {
	describe('gawking', () => {
		it('should gawk empty object', () => {
			const obj = {};
			const gobj = gawk(obj);
			expect(gobj).to.be.an.instanceof(GawkObject);
			const val = gobj.val;
			expect(val).to.deep.equal(obj);
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
			expect(gobj.keys()).to.deep.equal(Object.keys(obj));
			const val = gobj.val;
			expect(val).to.be.an.object;
			expect(val).to.deep.equal(obj);
		});

		it('should gawk object with nested objects', () => {
			const obj = { foo: { bar: 'baz' } };
			const gobj = gawk(obj);
			expect(gobj).to.be.an.instanceof(GawkObject);
			const val = gobj.val;
			expect(val).to.be.an.object;
			expect(val).to.deep.equal(obj);
		});

		it('should set a gawk object', () => {
			const gobj = gawk({ foo: 'bar' });
			gobj.val = gawk({ pi: 3.14 });
			expect(gobj.val).to.deep.equal({ pi: 3.14 });
		});

		it('should create a gawk object without an explicit value', () => {
			const gobj = new GawkObject;
			expect(gobj.val).to.deep.equal({});
		});
	});

	describe('constructor casting', () => {
		it('should throw TypeError for non-object value', () => {
			expect(() => new GawkObject(null)).to.throw(TypeError);
			expect(() => new GawkObject(true)).to.throw(TypeError);
			expect(() => new GawkObject('foo')).to.throw(TypeError);
			expect(() => new GawkObject(123)).to.throw(TypeError);
			expect(() => new GawkObject(3.14)).to.throw(TypeError);
			expect(() => new GawkObject(NaN)).to.throw(TypeError);
			expect(() => new GawkObject(['a', 'b'])).to.throw(TypeError);
			expect(() => new GawkObject(function () {})).to.throw(TypeError);
		});

		it('should throw TypeError for non-object gawk type', () => {
			expect(() => new GawkObject(gawk(null))).to.throw(TypeError);
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
			expect(gobj.toJS()).to.deep.equal(obj);
		});
	});

	describe('set casting', () => {
		it('should throw TypeError when setting non-object value', () => {
			const gobj = gawk({});
			expect(() => { gobj.val = undefined; }).to.throw(TypeError);
			expect(() => { gobj.val = null; }).to.throw(TypeError);
			expect(() => { gobj.val = true; }).to.throw(TypeError);
			expect(() => { gobj.val = 'foo'; }).to.throw(TypeError);
			expect(() => { gobj.val = 123; }).to.throw(TypeError);
			expect(() => { gobj.val = 3.14; }).to.throw(TypeError);
			expect(() => { gobj.val = NaN; }).to.throw(TypeError);
			expect(() => { gobj.val = ['a', 'b']; }).to.throw(TypeError);
			expect(() => { gobj.val = function () {}; }).to.throw(TypeError);
		});

		it('should throw TypeError when setting non-object gawk type', () => {
			const gobj = gawk({});
			expect(() => { gobj.val = gawk(); }).to.throw(TypeError);
			expect(() => { gobj.val = gawk(null); }).to.throw(TypeError);
			expect(() => { gobj.val = gawk(true); }).to.throw(TypeError);
			expect(() => { gobj.val = gawk('foo'); }).to.throw(TypeError);
			expect(() => { gobj.val = gawk(123); }).to.throw(TypeError);
			expect(() => { gobj.val = gawk(3.14); }).to.throw(TypeError);
			expect(() => { gobj.val = gawk(NaN); }).to.throw(TypeError);
			expect(() => { gobj.val = gawk(['a', 'b']); }).to.throw(TypeError);
			expect(() => { gobj.val = gawk(function () {}); }).to.throw(TypeError);
		});

		it('should copy another gawked object', () => {
			const arr = gawk(['a', 'b']);
			arr.val = gawk(['c', 'd']);
			expect(arr.val).to.deep.equal(['c', 'd']);
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

	describe('methods', () => {
		describe('get()', () => {
			it('should get a value by key', () => {
				const str = gawk({ foo: 'bar' }).get('foo');
				expect(str).to.be.an.instanceof(GawkString);
				expect(str.val).to.equal('bar');
			});

			it('should get undefined for non-existent key', () => {
				const undef = gawk({}).get('foo');
				expect(undef).to.be.undefined;
			});

			it('should return object when not specifying a key', () => {
				const gobj = gawk({ foo: 'bar' });
				expect(gobj.get()).to.equal(gobj);
			});

			it('should get a deeply nested object by key', () => {
				const str = gawk({ foo: { bar: 'wiz' } }).get(['foo', 'bar']);
				expect(str).to.be.an.instanceof(GawkString);
				expect(str.val).to.equal('wiz');
			});

			it('should get a deeply nested non-object by key', () => {
				const undef = gawk({ foo: 'wiz' }).get(['foo', 'bar']);
				expect(undef).to.be.undefined;
			});

			it('should get undefined for non-existent deeply nested key', () => {
				const undef = gawk({ foo: { } }).get(['foo', 'bar']);
				expect(undef).to.be.undefined;
			});
		});

		describe('set()', () => {
			it('should set a value', () => {
				const gobj = gawk({});
				gobj.set('foo', 'bar');
				expect(gobj.val).to.deep.equal({ foo: 'bar' });
			});

			it('should create child object and set its value', () => {
				const gobj = gawk({});
				gobj.set(['foo', 'bar'], 'wiz');
				expect(gobj.val).to.deep.equal({ foo: { bar: 'wiz' } });
			});

			it('should override child value', () => {
				const gobj = gawk({
					foo: {
						bar: 'baz'
					}
				});

				gobj.set(['foo', 'bar'], 'wiz');

				expect(gobj.val).to.deep.equal({ foo: { bar: 'wiz' } });
			});
		});

		describe('delete()', () => {
			it('should delete an existing key/value', () => {
				const gobj = gawk({ foo: 'bar' });
				const str = gobj.delete('foo');
				expect(str).to.be.instanceof(GawkString);
				expect(str.val).to.equal('bar');
				expect(gobj.keys().length).to.equal(0);
				expect(gobj.val).to.deep.equal({});
			});

			it('should not error trying to delete non-existent key', () => {
				const gobj = gawk({});
				const undef = gobj.delete('foo');
				expect(undef).to.be.undefined;
				expect(gobj.keys().length).to.equal(0);
				expect(gobj.val).to.deep.equal({});
			});
		});

		describe('clear()', () => {
			it('should wipe all key/values', () => {
				const gobj = gawk({
					foo: 'bar',
					pi: 3.14
				});

				expect(gobj.keys().length).to.equal(2);
				gobj.clear();
				expect(gobj.keys().length).to.equal(0);
				expect(gobj.val).to.deep.equal({});
			});
		});

		describe('keys()', () => {
			it('should return an array of the keys in the object', () => {
				const gobj = gawk({
					foo: 'bar',
					pi: 3.14
				});
				const keys = gobj.keys();
				expect(keys).to.be.an.array;
				expect(keys).to.have.lengthOf(2);
				expect(keys).to.deep.equal(['foo', 'pi']);
			});
		});

		describe('merge()', () => {
			it('should merge a JS object', () => {
				const gobj = gawk({ foo: 'bar' });
				gobj.merge({ pi: 3.14 });
				expect(gobj.val).to.deep.equal({ foo: 'bar', pi: 3.14 });
			});

			it('should merge a GawkObject', () => {
				const gobj = gawk({ foo: 'bar' });
				gobj.merge(gawk({ pi: 3.14 }));
				expect(gobj.val).to.deep.equal({ foo: 'bar', pi: 3.14 });
			});

			it('should merge multiple JS objects and GawkObjects', () => {
				const gobj = gawk({ foo: 'bar' });
				gobj.merge({ baz: 'wiz' }, gawk({ pi: 3.14 }), { num: 123 }, gawk({ arr: ['a', 'b'] }));
				expect(gobj.val).to.deep.equal({ foo: 'bar', baz: 'wiz', pi: 3.14, num: 123, arr: ['a', 'b'] });
			});

			it('should merge and overwrite', () => {
				const gobj = gawk({ foo: 'bar' });
				gobj.merge({ foo: 'wiz' });
				expect(gobj.val).to.deep.equal({ foo: 'wiz' });
			});

			it('should fail to merge if no args', () => {
				const gobj = gawk({});
				expect(() => { gobj.merge(); }).to.throw(TypeError);
			});

			it('should fail to merge non-object and non-GawkObjects types', () => {
				const gobj = gawk({});
				expect(() => { gobj.merge('foo'); }).to.throw(TypeError);
				expect(() => { gobj.merge(gawk('foo')); }).to.throw(TypeError);
			});

			it('should shallow merge', () => {
				const gobj = gawk({ foo: { bar: { baz: 'wiz' } } });
				gobj.merge({ foo: { pi: 3.14 } });
				expect(gobj.val).to.deep.equal({ foo: { pi: 3.14 }});
			});

			it('should notify parent when child has a merge', () => {
				const gobj = gawk({});
				let count = 0;

				gobj.watch(evt => {
					count++;
				});

				const child = gawk({});
				gobj.set('foo', child);
				// { foo: {} }
				expect(count).to.equal(1);

				const bar = gawk({ bar: 'wiz' });
				child.merge(bar);
				// { foo: { bar: 'wiz' } }
				expect(count).to.equal(2);

				const foo = gobj.get('foo');
				expect(foo._parent).to.equal(gobj);

				child.merge({ bar: 'wow' });
				// { foo: { bar: 'wow' } }
				expect(count).to.equal(3);
				expect(bar._parent).to.be.null;

				expect(gobj.val).to.deep.equal({ foo: { bar: 'wow' } });
			});

			it('should only notify parent one time when merging multiple objects', () => {
				const gobj = gawk({ foo: 'bar' });
				let count = 0;

				gobj.watch(evt => {
					count++;
				});

				gobj.merge({ baz: 'wiz' }, gawk({ pi: 3.14 }), { num: 123 }, gawk({ arr: ['a', 'b'] }));
				expect(gobj.val).to.deep.equal({ foo: 'bar', baz: 'wiz', pi: 3.14, num: 123, arr: ['a', 'b'] });
				expect(count).to.equal(1);
			});
		});

		describe('mergeDeep()', () => {
			it('should merge a JS object', () => {
				const gobj = gawk({ foo: 'bar' });
				gobj.mergeDeep({ pi: 3.14 });
				expect(gobj.val).to.deep.equal({ foo: 'bar', pi: 3.14 });
			});

			it('should merge a GawkObject', () => {
				const gobj = gawk({ foo: 'bar' });
				gobj.mergeDeep(gawk({ pi: 3.14 }));
				expect(gobj.val).to.deep.equal({ foo: 'bar', pi: 3.14 });
			});

			it('should merge multiple JS objects and GawkObjects', () => {
				const gobj = gawk({ foo: 'bar' });
				gobj.mergeDeep({ baz: 'wiz' }, gawk({ pi: 3.14 }), { num: 123 }, gawk({ arr: ['a', 'b'] }));
				expect(gobj.val).to.deep.equal({ foo: 'bar', baz: 'wiz', pi: 3.14, num: 123, arr: ['a', 'b'] });
			});

			it('should merge and overwrite', () => {
				const gobj = gawk({ foo: 'bar' });
				gobj.mergeDeep({ foo: 'wiz' });
				expect(gobj.val).to.deep.equal({ foo: 'wiz' });
			});

			it('should fail to merge if no args', () => {
				const gobj = gawk({});
				expect(() => { gobj.mergeDeep(); }).to.throw(TypeError);
			});

			it('should fail to merge non-object and non-GawkObjects types', () => {
				const gobj = gawk({});
				expect(() => { gobj.mergeDeep('foo'); }).to.throw(TypeError);
				expect(() => { gobj.mergeDeep(gawk('foo')); }).to.throw(TypeError);
			});

			it('should deep merge', () => {
				const gobj = gawk({ foo: { bar: { baz: 'wiz' } } });
				gobj.mergeDeep({ foo: { pi: 3.14, biz: { wap: 'fip' } } });
				expect(gobj.val).to.deep.equal({
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
			});

			it('should notify parent one time when child has a deep merge', () => {
				const gobj = gawk({});
				let count = 0;

				gobj.watch(evt => {
					count++;
				});

				const child = gawk({ bar: { pow: 123 } });
				gobj.set('foo', child);
				// { foo: { bar: { pow: 123 } } }
				expect(count).to.equal(1);

				const bar = gawk({ bar: { wiz: 456 } });
				child.mergeDeep(bar);
				// { foo: { bar: { pow: 123, wiz: 456 } } }
				expect(count).to.equal(2);

				const foo = gobj.get('foo');
				expect(foo._parent).to.equal(gobj);

				child.mergeDeep({ bar: { paz: 789 } });
				// { foo: { bar: { pow: 123, wiz: 456, paz: 789 } } }
				expect(count).to.equal(3);
				expect(bar._parent).to.be.null;

				expect(gobj.val).to.deep.equal({ foo: { bar: { pow: 123, wiz: 456, paz: 789 } } });
			});

			it('should only notify parent one time when merging multiple objects', () => {
				const gobj = gawk({ foo: { bar: { baz: 'wiz' } } });
				let count = 0;

				gobj.watch(evt => {
					count++;
				});

				gobj.mergeDeep({ foo: { bar: { baz: 'wow' } } });
				expect(gobj.val).to.deep.equal({ foo: { bar: { baz: 'wow' } } });
				expect(count).to.equal(1);
			});
		});
	});

	describe('notifications', () => {
		it('should be notified when entire object changes', () => {
			const gobj = gawk({ foo: 'bar' });
			gobj.watch(evt => {
				expect(evt.source).to.equal(gobj);
				expect(evt.target).to.equal(gobj);

				const obj = evt.target.val;
				expect(obj).to.deep.equal({ bar: 'wiz' });
			});
			gobj.val = { bar: 'wiz' };
		});

		it('should be notified when a key/value is added', () => {
			const gobj = gawk({ foo: 'bar' });
			gobj.watch(evt => {
				expect(evt.source).to.equal(gobj);
				expect(evt.target).to.equal(gobj);

				const obj = evt.target.val;
				expect(obj).to.deep.equal({ foo: 'bar', pi: 3.14 });
			});
			gobj.set('pi', 3.14);
		});

		it('should be notified when a key/value changes', () => {
			const gobj = gawk({ foo: 'bar' });
			gobj.watch(evt => {
				expect(evt.source).to.equal(gobj);
				expect(evt.target).to.equal(gobj);

				const obj = evt.target.val;
				expect(obj).to.deep.equal({ foo: 'wiz' });
			});
			gobj.set('foo', 'wiz');
		});

		it('should be notified when a key/value is deleted', () => {
			const gobj = gawk({ foo: 'bar', pi: 3.14 });
			gobj.watch(evt => {
				expect(evt.source).to.equal(gobj);
				expect(evt.target).to.equal(gobj);

				const obj = evt.target.val;
				expect(obj).to.deep.equal({ foo: 'bar' });
			});
			gobj.delete('pi');
		});

		it('should not notify when a non-existent key/value is deleted', () => {
			const gobj = gawk({});
			gobj.watch(evt => {
				throw new Error('Watcher should not have been invoked');
			});
			gobj.delete('foo');
		});

		it('should be notified when the object is cleared', () => {
			const gobj = gawk({ foo: 'bar', pi: 3.14 });
			gobj.watch(evt => {
				expect(evt.source).to.equal(gobj);
				expect(evt.target).to.equal(gobj);

				const obj = evt.target.val;
				expect(obj).to.be.an.object;
				expect(obj).to.deep.equal({});
			});
			gobj.clear();
		});

		it('should only notify if key/value is uniquely changed', () => {
			const gobj = gawk({ foo: 'bar' });
			let count = 0;

			gobj.watch(evt => {
				count++;
			});

			gobj.set('foo', 'baz');
			expect(count).to.equal(1);

			gobj.set('foo', 'baz');
			expect(count).to.equal(1);
		});

		it('should unwatch changes', () => {
			const gobj = gawk({});
			let count = 0;

			const unwatch = gobj.watch(evt => {
				count++;
			});

			gobj.set('a', 'b');
			gobj.set('c', 'd');

			unwatch();

			gobj.set('e', 'f');
			gobj.set('g', 'h');

			expect(count).to.equal(2);
		});

		it('should be notified when child changes', () => {
			const gobj = gawk({ foo: { bar: 'baz' } });
			const nested = gobj.get('foo');

			gobj.watch(evt => {
				expect(evt.source).to.equal(gobj);
				expect(evt.target).to.equal(nested);

				const obj = evt.source.val;
				expect(obj).to.be.an.object;
				expect(obj).to.deep.equal({
					foo: {
						bar: 'baz',
						pi: 3.14
					}
				});
			});

			nested.set('pi', 3.14);
		});

		it('should notify child watchers if child changes', () => {
			const gobj = gawk({ foo: { bar: 'baz' } });
			let count = 0;

			gobj.get('foo').watch(evt => {
				count++;
			});

			gobj.mergeDeep({ foo: { bar: 'baz' + Date.now() } });

			expect(count).to.equal(1);
		});

		it('should be notified when deep child changes', () => {
			const gobj = gawk({});
			const arr = gobj
				.set('foo', {})
				.set('bar', {})
				.set('baz', []);

			let count = 0;
			gobj.watch(evt => {
				count++;
			});

			arr.push('a');
			arr.push('b');
			expect(count).to.equal(2);
		});
	});
});

import { gawk, GawkObject, GawkString, GawkArray } from '../src/index';

describe('object', () => {
	describe('gawk()', () => {
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
				arr: ['a', 123, 4.56, null, undefined]
			};
			const gobj = gawk(obj);
			expect(gobj).to.be.an.instanceof(GawkObject);
			expect(gobj.keys()).to.deep.equal(Object.keys(obj));
			const val = gobj.val;
			expect(val).to.be.an.object;
			expect(val).to.deep.equal(obj);
		});

		it('should gawk object with nested objects', () => {
			const obj = {
				foo: {
					bar: 'baz'
				}
			};
			const gobj = gawk(obj);
			expect(gobj).to.be.an.instanceof(GawkObject);
			const val = gobj.val;
			expect(val).to.be.an.object;
			expect(val).to.deep.equal(obj);
		});
	});

/*	it('should fail to gawk non-object arg', () => {
		expect(() => {
			new GawkObject('foo');
		}).to.throw(TypeError);
	});

	it('should fail to gawk another non-object gawked type', () => {
		expect(() => {
			new GawkObject(gawk('hi'));
		}).to.throw(TypeError);
	});

	it('should fail to set non-object', () => {
		expect(() => {
			const gobj = gawk({});
			gobj.val = 'hi';
		}).to.throw(TypeError);
	});

	it('should copy another gawked object', () => {
		const obj = new GawkObject(gawk({ foo: 'bar' }));
		expect(obj.val).to.deep.equal({ foo: 'bar' });
	});

	it('should get deeply nested string', () => {
		const gobj = gawk({
			foo: {
				bar: 'baz'
			}
		});
		const bar = gobj.get(['foo', 'bar']);
		expect(bar).to.be.an.instanceof(GawkString);
		expect(bar.val).to.equal('baz');
	});

	it('should get deeply nested array', () => {
		const gobj = gawk({
			foo: {
				bar: ['a', 'b']
			}
		});
		const bar = gobj.get(['foo', 'bar']);
		expect(bar).to.be.an.instanceof(GawkArray);
		expect(bar.val).to.deep.equal(['a', 'b']);
	});

	it('should be notified when value changes', () => {
		const obj = {
			foo: 'bar'
		};
		const gobj = gawk(obj);

		gobj.watch(evt => {
			expect(evt.target).to.equal(gobj);

			const expected = {
				foo: 'bar',
				pi: 3.14
			};

			expect(evt.value).to.be.an.object;
			expect(evt.value).to.deep.equal(expected);

			const val = evt.target.val;
			expect(val).to.be.an.object;
			expect(val).to.deep.equal(expected);
		});

		gobj.set('pi', 3.14);
	});

	it('should only notify if value is uniquely changed', () => {
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

	it('should be notified when child changes', () => {
		const obj = {
			foo: {
				bar: 'baz'
			}
		};
		const gobj = gawk(obj);

		gobj.watch(evt => {
			expect(evt.target).to.equal(gobj);

			const expected = {
				foo: {
					bar: 'baz',
					pi: 3.14
				}
			};

			expect(evt.value).to.be.an.object;
			expect(evt.value).to.deep.equal(expected);

			const val = evt.target.val;
			expect(val).to.be.an.object;
			expect(val).to.deep.equal(expected);
		});

		gobj.get('foo').set('pi', 3.14);
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

	it('should set child value', () => {
		const gobj = gawk({});
		let count = 0;

		gobj.watch(evt => {
			const val = evt.target.val;
			expect(val).to.be.an.string;
			expect(val.foo.bar).to.equal('wiz');
			count++;
		});

		gobj.set(['foo', 'bar'], 'wiz');

		expect(count).to.equal(1);
	});

	it('should override child value', () => {
		const obj = {
			foo: {
				bar: 'baz'
			}
		};
		const gobj = gawk(obj);

		gobj.watch(evt => {
			const val = evt.target.val;
			expect(val).to.be.an.string;
			expect(val.foo.bar).to.equal('wiz');
		});

		gobj.set(['foo', 'bar'], 'wiz');
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

	it('should delete key/value', () => {
		const obj = {
			foo: 'bar',
			pi: 3.14
		};
		const gobj = gawk(obj);
		let count = 0;

		gobj.watch(evt => {
			count++;
		});

		gobj.delete('foo');

		expect(gobj.keys()).to.deep.equal(['pi']);
		expect(count).to.equal(1);

		gobj.delete('bar');

		expect(gobj.keys()).to.deep.equal(['pi']);
		expect(count).to.equal(1);
	});

	it('should clear object', () => {
		const obj = {
			foo: 'bar',
			pi: 3.14
		};
		const gobj = gawk(obj);

		expect(gobj.val).to.deep.equal(obj);
		expect(gobj.keys()).to.deep.equal(Object.keys(obj));
		gobj.clear();
		expect(gobj.val).to.deep.equal({});
		expect(gobj.keys()).to.deep.equal([]);
	});

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
	*/
});

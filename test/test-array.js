import { gawk, GawkArray, GawkString } from '../src/index';

describe('array', () => {
	describe('gawk()', () => {
		it('should gawk empty array', () => {
			const arr = [];
			const gobj = gawk(arr);
			expect(gobj).to.be.an.instanceof(GawkArray);
			expect(gobj.length).to.equal(0);
			const val = gobj.val;
			expect(val).to.be.an.array;
			expect(val).to.have.lengthOf(0);
			expect(val).to.deep.equal(arr);
		});

		it('should gawk an array of mixed values', () => {
			const arr = ['a', 1, null, undefined, NaN, ['b', 2], function () {}];
			const gobj = gawk(arr);
			expect(gobj).to.be.an.instanceof(GawkArray);
			expect(gobj.length).to.equal(7);
			const val = gobj.val;
			expect(val).to.be.an.array;
			expect(val).to.have.lengthOf(7);
			expect(val).to.deep.equal(arr);
		});

		it('should gawk an array object', () => {
			const arr = new Array('a', 1, null, undefined, NaN, ['b', 2], function () {});
			const gobj = gawk(arr);
			expect(gobj).to.be.an.instanceof(GawkArray);
			expect(gobj.length).to.equal(7);
			const val = gobj.val;
			expect(val).to.be.an.array;
			expect(val).to.have.lengthOf(7);
			expect(val).to.deep.equal(arr);
		});
	});

	describe('constructor casting', () => {
		it('should throw TypeError for non-array value', () => {
			expect(() => new GawkArray()).to.throw(TypeError);
			expect(() => new GawkArray(null)).to.throw(TypeError);
			expect(() => new GawkArray(true)).to.throw(TypeError);
			expect(() => new GawkArray('foo')).to.throw(TypeError);
			expect(() => new GawkArray(123)).to.throw(TypeError);
			expect(() => new GawkArray(3.14)).to.throw(TypeError);
			expect(() => new GawkArray(NaN)).to.throw(TypeError);
			expect(() => new GawkArray({ foo: 'bar' })).to.throw(TypeError);
			expect(() => new GawkArray(function () {})).to.throw(TypeError);
		});

		it('should throw TypeError for non-array gawk type', () => {
			expect(() => new GawkArray(gawk())).to.throw(TypeError);
			expect(() => new GawkArray(gawk(null))).to.throw(TypeError);
			expect(() => new GawkArray(gawk(true))).to.throw(TypeError);
			expect(() => new GawkArray(gawk('foo'))).to.throw(TypeError);
			expect(() => new GawkArray(gawk(123))).to.throw(TypeError);
			expect(() => new GawkArray(gawk(3.14))).to.throw(TypeError);
			expect(() => new GawkArray(gawk(NaN))).to.throw(TypeError);
			expect(() => new GawkArray(gawk({ foo: 'bar' }))).to.throw(TypeError);
			expect(() => new GawkArray(gawk(function () {}))).to.throw(TypeError);
		});

		it('should copy another gawked array', () => {
			const arr = ['a', 1, null, undefined, NaN, ['b', 2], function () {}];
			const garr = new GawkArray(gawk(arr));
			expect(garr.toJS()).to.deep.equal(arr);
		});
	});

	describe('set casting', () => {
		it('should throw TypeError when setting non-array value', () => {
			const arr = gawk(['a', 'b']);
			expect(() => { arr.val = undefined; }).to.throw(TypeError);
			expect(() => { arr.val = null; }).to.throw(TypeError);
			expect(() => { arr.val = true; }).to.throw(TypeError);
			expect(() => { arr.val = 'foo'; }).to.throw(TypeError);
			expect(() => { arr.val = 123; }).to.throw(TypeError);
			expect(() => { arr.val = 3.14; }).to.throw(TypeError);
			expect(() => { arr.val = NaN; }).to.throw(TypeError);
			expect(() => { arr.val = { foo: 'bar' }; }).to.throw(TypeError);
			expect(() => { arr.val = function () {}; }).to.throw(TypeError);
		});

		it('should throw TypeError when setting non-array gawk type', () => {
			const arr = gawk(['a', 'b']);
			expect(() => { arr.val = gawk(); }).to.throw(TypeError);
			expect(() => { arr.val = gawk(null); }).to.throw(TypeError);
			expect(() => { arr.val = gawk(true); }).to.throw(TypeError);
			expect(() => { arr.val = gawk('foo'); }).to.throw(TypeError);
			expect(() => { arr.val = gawk(123); }).to.throw(TypeError);
			expect(() => { arr.val = gawk(3.14); }).to.throw(TypeError);
			expect(() => { arr.val = gawk(NaN); }).to.throw(TypeError);
			expect(() => { arr.val = gawk({ foo: 'bar' }); }).to.throw(TypeError);
			expect(() => { arr.val = gawk(function () {}); }).to.throw(TypeError);
		});

		it('should copy another gawked array', () => {
			const arr = gawk(['a', 'b']);
			arr.val = gawk(['c', 'd']);
			expect(arr.val).to.deep.equal(['c', 'd']);
		});
	});

	describe('built-ins', () => {
		it('should support toString()', () => {
			const garr = gawk(['a', null, undefined, 123, 3.14, NaN, Infinity]);
			expect(garr.toString()).to.equal('a,,,123,3.14,NaN,Infinity');
		});

		it('should support valueOf()', () => {
			const arr = ['a', null, undefined, 123, 3.14, NaN, Infinity];
			const garr = gawk(arr);
			expect(garr.valueOf()).to.deep.equal(arr);
		});
	});

	describe('methods', () => {
		it('should get the gawked value at a valid index', () => {
			const garr = gawk(['a']);
			const str = garr.get(0);
			expect(str).to.be.an.instanceof(GawkString);
			expect(str.val).to.equal('a');
		});

		it('should get the gawked value at an invalid index', () => {
			const arr = gawk(['a']);
			expect(arr.get(1)).to.be.undefined;
		});

		it('should set a value at the specified index', () => {
			const arr = gawk(['a']);
			arr.set(0, 'b').set(1, 'c');
			expect(arr.val).to.deep.equal(['b', 'c']);
		});
	});

	describe('notifications', () => {
		it('should be notified when value changes', () => {
			const arr = ['a', null, undefined, 123, 3.14, NaN, Infinity];
			const garr = gawk(arr);

			garr.watch(evt => {
				expect(evt.target).to.equal(garr);

				const val = evt.target.val;
				expect(val).to.be.an.array;
				expect(val).to.deep.equal(arr);
			});

			garr.val = arr;
		});

		it('should only notify if value is uniquely changed', () => {
			const garr = gawk(['a']);
			let count = 0;

			garr.watch(evt => {
				count++;
			});

			garr.val = ['b'];
			expect(count).to.equal(1);

			garr.val = ['b'];
			expect(count).to.equal(1);
		});

		it('should unwatch changes', () => {
			const garr = gawk(['a']);
			let count = 0;

			const unwatch = garr.watch(evt => {
				count++;
			});

			garr.val = ['b'];
			garr.val = ['c'];

			unwatch();

			garr.val = ['d'];
			garr.val = ['e'];

			expect(count).to.equal(2);
		});

		// it('should be notified if an element is updated', () => {
		// 	const garr = gawk(['a']);
		// });
	});


/*
	it('should push a new element onto an array', () => {
		const gobj = gawk(['a', 'b']);
		expect(gobj).to.be.an.instanceof(GawkArray);
		expect(gobj.length).to.equal(2);
		gobj.push('c');

		const val = gobj.val;
		expect(val).to.be.an.array;
		expect(val).to.have.lengthOf(3);
		expect(val).to.deep.equal(['a', 'b', 'c']);
	});

	it('should be notified when array changes', () => {
		const arr = ['a', 'b'];
		const gobj = gawk(arr);
		expect(gobj).to.be.an.instanceof(GawkArray);
		expect(gobj.length).to.equal(2);

		gobj.watch(evt => {
			expect(evt.target).to.equal(gobj);

			expect(evt.value).to.be.an.array;
			expect(evt.value).to.have.lengthOf(3);
			expect(evt.value).to.deep.equal(['a', 'b', 'c']);

			const val = evt.target.val;
			expect(val).to.be.an.array;
			expect(val).to.have.lengthOf(3);
			expect(val).to.deep.equal(['a', 'b', 'c']);
		});

		gobj.push('c');
	});

	it('should be notified when child changes', () => {
		const gobj = gawk(['a', 'b', ['c']]);
		expect(gobj).to.be.an.instanceof(GawkArray);
		expect(gobj.length).to.equal(3);

		gobj.watch(evt => {
			const val = evt.target.val;
			expect(val).to.be.an.array;
			expect(val).to.have.lengthOf(3);
			expect(val).to.deep.equal(['a', 'b', ['c', 'd']]);
		});

		gobj.value[2].push('d');
	});

	it('should only notify if value is uniquely changed', () => {
		const gobj = gawk(['a', 'b']);
		let count = 0;

		gobj.watch(evt => {
			count++;
		});

		gobj.val = ['c', 'd'];
		expect(count).to.equal(1);

		gobj.val = ['c', 'd'];
		expect(count).to.equal(1);
	});

	it('should push and pop', () => {
		const gobj = gawk(['a']);
		let count = 0;

		gobj.watch(evt => {
			count++;
		});

		gobj.push('b');

		const r = gobj.pop();
		expect(r).to.equal('b');

		expect(count).to.equal(2);
	});
	*/
});

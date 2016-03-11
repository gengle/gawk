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

	describe('properties', () => {
		it('length', () => {
			it('should have correct length', () => {
				expect(gawk([]).length).to.equal(0);
				expect(gawk(['a']).length).to.equal(1);
				expect(gawk(['a', undefined]).length).to.equal(2);
				expect(gawk(['a', undefined, 'b']).length).to.equal(3);
			});
		});
	});

	describe('methods', () => {
		describe('get()', () => {
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
		});

		describe('set()', () => {
			it('should set a value at the specified indices', () => {
				const arr = gawk(['a']);
				arr.set(0, 'b').set(1, 'c');
				expect(arr.val).to.deep.equal(['b', 'c']);
			});
		});

		describe('delete()', () => {
			it('should delete an element at the valid positive index', () => {
				const arr = gawk(['a', 'b', 'c', 'd']);
				const removed = arr.delete(2);
				expect(arr.length).to.equal(3);
				expect(removed).to.be.instanceof(GawkString);
				expect(removed.val).to.equal('c');
				expect(arr.val).to.deep.equal(['a', 'b', 'd']);
			});

			it('should delete an element at the valid negative index', () => {
				const arr = gawk(['a', 'b', 'c', 'd']);
				const removed = arr.delete(-2);
				expect(arr.length).to.equal(3);
				expect(removed).to.be.instanceof(GawkString);
				expect(removed.val).to.equal('c');
				expect(arr.val).to.deep.equal(['a', 'b', 'd']);
			});

			it('should handle delete an element that does not exist', () => {
				const arr = gawk(['a', 'b', 'c', 'd']);
				const removed = arr.delete(10);
				expect(arr.length).to.equal(4);
				expect(removed).to.be.undefined;
				expect(arr.val).to.deep.equal(['a', 'b', 'c', 'd']);
			});
		});

		describe('clear()', () => {
			it('should delete an element at the valid positive index', () => {
				const arr = gawk(['a', 'b', 'c', 'd']);
				arr.clear();
				expect(arr.length).to.equal(0);
				expect(arr.val).to.deep.equal([]);
			});
		});

		describe('push()', () => {
			it('should add an element to the end of the array', () => {
				const arr = gawk(['a']);
				expect(arr.push('b')).to.equal(2);
				expect(arr.length).to.equal(2);
				expect(arr.val).to.deep.equal(['a', 'b']);
			});

			it('should add many elements to the end of the array', () => {
				const arr = gawk(['a']);
				expect(arr.push('b', 'c', 'd', 'e')).to.equal(5);
				expect(arr.length).to.equal(5);
				expect(arr.val).to.deep.equal(['a', 'b', 'c', 'd', 'e']);
			});
		});

		describe('pop()', () => {
			it('should remove an element from the end of the array', () => {
				const arr = gawk(['a', 'b']);
				const str = arr.pop();
				expect(str.val).to.equal('b');
				expect(arr.length).to.equal(1);
				expect(arr.val).to.deep.equal(['a']);
			});

			it('should return undefined when popping an empty array', () => {
				const arr = gawk([]);
				const str = arr.pop();
				expect(str).to.be.undefined;
				expect(arr.length).to.equal(0);
				expect(arr.val).to.deep.equal([]);
			});
		});

		describe('unshift()', () => {
			it('should add an element to the beginning of the array', () => {
				const arr = gawk(['a']);
				expect(arr.unshift('b')).to.equal(2);
				expect(arr.length).to.equal(2);
				expect(arr.val).to.deep.equal(['b', 'a']);
			});

			it('should add many elements to the beginning of the array', () => {
				const arr = gawk(['a']);
				expect(arr.unshift('b', 'c', 'd', 'e')).to.equal(5);
				expect(arr.length).to.equal(5);
				expect(arr.val).to.deep.equal(['b', 'c', 'd', 'e', 'a']);
			});
		});

		describe('shift()', () => {
			it('should remove an element from the beginning of the array', () => {
				const arr = gawk(['a', 'b']);
				const str = arr.shift();
				expect(str.val).to.equal('a');
				expect(arr.length).to.equal(1);
				expect(arr.val).to.deep.equal(['b']);
			});

			it('should return undefined when shifting an empty array', () => {
				const arr = gawk([]);
				const str = arr.shift();
				expect(str).to.be.undefined;
				expect(arr.length).to.equal(0);
				expect(arr.val).to.deep.equal([]);
			});
		});

		describe('slice()', () => {
			it('should slice an array with no start and no end', () => {
				const orig = gawk(['a', 'b']);
				const arr = orig.slice();
				expect(arr).to.be.instanceof(GawkArray);
				expect(arr.length).to.equal(2);
				expect(arr.hash).to.equal(orig.hash);
				expect(arr.val).to.deep.equal(['a', 'b']);
				expect(orig.val).to.deep.equal(['a', 'b']);
			});

			it('should slice an array with a start and no end', () => {
				const orig = gawk(['a', 'b', 'c', 'd']);
				const arr = orig.slice(2);
				expect(arr).to.be.instanceof(GawkArray);
				expect(arr.length).to.equal(2);
				expect(arr.hash).not.to.equal(orig.hash);
				expect(arr.val).to.deep.equal(['c', 'd']);
				expect(orig.val).to.deep.equal(['a', 'b', 'c', 'd']);
			});

			it('should slice an array with a start and an end', () => {
				const orig = gawk(['a', 'b', 'c', 'd']);
				const arr = orig.slice(2, 3);
				expect(arr).to.be.instanceof(GawkArray);
				expect(arr.length).to.equal(1);
				expect(arr.val).to.deep.equal(['c']);
				expect(orig.val).to.deep.equal(['a', 'b', 'c', 'd']);
			});

			it('should slice an array with a negative start and no end', () => {
				const orig = gawk(['a', 'b', 'c', 'd']);
				const arr = orig.slice(-1);
				expect(arr).to.be.instanceof(GawkArray);
				expect(arr.length).to.equal(1);
				expect(arr.val).to.deep.equal(['d']);
				expect(orig.val).to.deep.equal(['a', 'b', 'c', 'd']);
			});

			it('should slice an array with a negative start and a negative end', () => {
				const orig = gawk(['a', 'b', 'c', 'd']);
				const arr = orig.slice(-2, -1);
				expect(arr).to.be.instanceof(GawkArray);
				expect(arr.length).to.equal(1);
				expect(arr.val).to.deep.equal(['c']);
				expect(orig.val).to.deep.equal(['a', 'b', 'c', 'd']);
			});
		});
	});

	describe('notifications', () => {
		it('should be notified when value changes', () => {
			const arr = ['a', null, undefined, 123, 3.14, NaN, Infinity];
			const garr = gawk(arr);

			garr.watch(evt => {
				expect(evt.source).to.equal(garr);
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

		it('should be notified when array changes', () => {
			let count = 0;
			const gobj = gawk(['a', 'b']);

			gobj.watch(evt => {
				count++;
			});

			gobj.push('c');
			gobj.pop();
			gobj.unshift('d');
			gobj.shift();

			expect(count).to.equal(4);
		});

		it('should be notified when deeply nexted children change', () => {
			let count1 = 0;
			let count2 = 0;
			let count3 = 0;

			const arr1 = gawk([]);
			const arr2 = gawk([]);
			const arr3 = gawk([]);

			arr1.push(arr2);
			arr2.push(arr3);

			expect(arr1._parent).to.be.null;
			expect(arr2._parent).to.equal(arr1);
			expect(arr3._parent).to.equal(arr2);

			arr1.watch(evt => {
				count1++;
				expect(evt.source).to.equal(arr1);
				expect(evt.target).to.equal(arr3);
			});

			arr2.watch(evt => {
				count2++;
				expect(evt.source).to.equal(arr2);
				expect(evt.target).to.equal(arr3);
			});

			arr3.watch(evt => {
				count3++;
				expect(evt.source).to.equal(arr3);
				expect(evt.target).to.equal(arr3);
			});

			arr3.push('foo');

			expect(count1).to.equal(1);
			expect(count2).to.equal(1);
			expect(count3).to.equal(1);

			expect(arr3.length).to.equal(1);
			expect(arr3.val).to.deep.equal(['foo']);

			expect(arr2.length).to.equal(1);
			expect(arr2.val).to.deep.equal([['foo']]);

			expect(arr1.length).to.equal(1);
			expect(arr1.val).to.deep.equal([[['foo']]]);
		});
	});
});

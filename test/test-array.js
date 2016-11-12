import gawk, { GawkArray, GawkObject } from '../src/index';

describe('GawkArray', () => {
	describe('gawk()', () => {
		it('should gawk empty array', () => {
			const arr = [];
			const garr = gawk(arr);
			expect(garr).to.be.an.instanceof(GawkArray);
			expect(garr.length).to.equal(0);
			expect(garr).to.be.an.array;
			expect(garr).to.have.lengthOf(0);
			expect(garr).to.deep.equal(arr);
		});

		it('should gawk an array of mixed values', () => {
			const arr = ['a', 1, null, undefined, NaN, ['b', 2], function () {}];
			const garr = gawk(arr);
			expect(garr).to.be.an.instanceof(GawkArray);
			expect(garr.length).to.equal(7);
			expect(garr).to.be.an.array;
			expect(garr).to.have.lengthOf(7);
			expect(garr).to.deep.equal(arr);
		});

		it('should gawk an array object', () => {
			const arr = new Array('a', 1, null, undefined, NaN, ['b', 2], function () {});
			const garr = gawk(arr);
			expect(garr).to.be.an.instanceof(GawkArray);
			expect(garr.length).to.equal(7);
			expect(garr).to.be.an.array;
			expect(garr).to.have.lengthOf(7);
			expect(garr).to.deep.equal(arr);
		});

		it('should create a gawk object without an explicit value', () => {
			const garr = new GawkArray;
			expect(garr).to.deep.equal([]);
		});
	});

	describe('toString()', () => {
		it('should support toString()', () => {
			const garr = gawk(['a', null, undefined, 123, 3.14, NaN, Infinity]);
			expect(garr.toString()).to.equal('a,,,123,3.14,NaN,Infinity');
		});
	});

	describe('valueOf()', () => {
		it('should support valueOf()', () => {
			const arr = ['a', null, undefined, 123, 3.14, NaN, Infinity];
			const garr = gawk(arr);
			expect(garr.valueOf()).to.deep.equal(arr);
		});
	});

	describe('length', () => {
		it('should have correct length', () => {
			expect(gawk([]).length).to.equal(0);
			expect(gawk(['a']).length).to.equal(1);
			expect(gawk(['a', undefined]).length).to.equal(2);
			expect(gawk(['a', undefined, 'b']).length).to.equal(3);
		});
	});

	describe('get by index', () => {
		it('should get the gawked value at a valid index', () => {
			const garr = gawk(['a']);
			const str = garr[0];
			expect(str).to.be.an.string;
			expect(str).to.equal('a');
		});

		it('should get the gawked value at an invalid index', () => {
			const garr = gawk(['a']);
			expect(garr[1]).to.be.undefined;
		});
	});

	describe('set by index', () => {
		it('should set a value at the specified indices', () => {
			const garr = gawk(['a']);
			garr[0] = 'b';
			garr[1] = 'c';
			expect(garr).to.deep.equal(['b', 'c']);
		});
	});

	describe('concat()', () => {
		it('should concat a GawkArray and an item', () => {
			const garr = gawk(['a']);
			const garr2 = garr.concat('b');
			expect(garr2).to.deep.equal(['a', 'b']);
		});

		it('should concat a GawkArray and multiple items', () => {
			const garr = gawk(['a']);
			const garr2 = garr.concat('b', 'c');
			expect(garr2).to.deep.equal(['a', 'b', 'c']);
		});

		it('should concat a GawkArray and an array', () => {
			const garr = gawk(['a']);
			const garr2 = garr.concat(['b', 'c']);
			expect(garr2).to.deep.equal(['a', 'b', 'c']);
		});

		it('should concat two GawkArrays', () => {
			const garr = gawk(['a']);
			const garr2 = garr.concat(gawk(['b', 'c']));
			expect(garr2).to.deep.equal(['a', 'b', 'c']);
		});
	});

	describe('fill()', () => {
		it('should fill an array with objects', () => {
			const garr = gawk(['a', 'b', 'c']);
			const obj = { x: 1 };
			garr.fill(obj);
			expect(garr).to.deep.equal([obj, obj, obj]);
			expect(garr[0]).to.be.instanceof(GawkObject);
			expect(garr[0].__gawk__.hasParent(garr)).to.be.true;
			expect(garr[1]).to.be.instanceof(GawkObject);
			expect(garr[1].__gawk__.hasParent(garr)).to.be.true;
			expect(garr[2]).to.be.instanceof(GawkObject);
			expect(garr[2].__gawk__.hasParent(garr)).to.be.true;
		});

		it('should fill an array with objects with start', () => {
			const garr = gawk(['a', 'b', 'c']);
			const obj = { x: 1 };
			garr.fill(obj, 1);
			expect(garr).to.deep.equal(['a', obj, obj]);
			expect(garr[1]).to.be.instanceof(GawkObject);
			expect(garr[1].__gawk__.hasParent(garr)).to.be.true;
			expect(garr[2]).to.be.instanceof(GawkObject);
			expect(garr[2].__gawk__.hasParent(garr)).to.be.true;
		});

		it('should fill an array with objects with start and end', () => {
			const garr = gawk(['a', 'b', 'c', 'd', 'e']);
			const obj = { x: 1 };
			garr.fill(obj, 1, 4);
			expect(garr).to.deep.equal(['a', obj, obj, obj, 'e']);
			expect(garr[1]).to.be.instanceof(GawkObject);
			expect(garr[1].__gawk__.hasParent(garr)).to.be.true;
			expect(garr[2]).to.be.instanceof(GawkObject);
			expect(garr[2].__gawk__.hasParent(garr)).to.be.true;
			expect(garr[3]).to.be.instanceof(GawkObject);
			expect(garr[3].__gawk__.hasParent(garr)).to.be.true;
		});

		it('should detach existing gawk objects', () => {
			const gobj = gawk({});
			const garr = gawk([gobj, 'a', 'b']);
			expect(gobj.__gawk__.hasParent(garr)).to.be.true;
			const obj = { x: 1 };
			garr.fill(obj);
			expect(garr).to.deep.equal([obj, obj, obj]);
			expect(garr[0]).to.be.instanceof(GawkObject);
			expect(garr[0].__gawk__.hasParent(garr)).to.be.true;
			expect(garr[1]).to.be.instanceof(GawkObject);
			expect(garr[1].__gawk__.hasParent(garr)).to.be.true;
			expect(garr[2]).to.be.instanceof(GawkObject);
			expect(garr[2].__gawk__.hasParent(garr)).to.be.true;
			expect(gobj.__gawk__.hasParent(garr)).to.be.false;
		});
	});

	describe('pop()', () => {
		it('should remove an element from the end of the array', () => {
			const garr = gawk(['a', 'b']);
			const str = garr.pop();
			expect(str).to.equal('b');
			expect(garr.length).to.equal(1);
			expect(garr).to.deep.equal(['a']);
		});

		it('should return undefined when popping an empty array', () => {
			const garr = gawk([]);
			const str = garr.pop();
			expect(str).to.be.undefined;
			expect(garr.length).to.equal(0);
		});

		it('should detach popped gawk object', () => {
			const gobj = gawk({});
			const garr = gawk([gobj]);
			expect(gobj.__gawk__.hasParent(garr)).to.be.true;
			const gobj2 = garr.pop();
			expect(gobj2).to.equal(gobj);
			expect(gobj.__gawk__.hasParent(garr)).to.be.false;
		});
	});

	describe('push()', () => {
		it('should return 0 if not adding any elements', () => {
			const garr = new GawkArray;
			const n = garr.push();
			expect(n).to.equal(0);
			expect(garr).to.have.lengthOf(0);
		});

		it('should add a new element', () => {
			const garr = new GawkArray;
			let n = garr.push('a');
			expect(n).to.equal(1);
			expect(garr).to.have.lengthOf(1);
			expect(garr).to.deep.equal(['a']);

			n = garr.push('b');
			expect(n).to.equal(2);
			expect(garr).to.have.lengthOf(2);
			expect(garr).to.deep.equal(['a', 'b']);
		});

		it('should add multiple new elements', () => {
			const garr = new GawkArray;
			let n = garr.push('a', { foo: 'bar' }, 'c');
			expect(n).to.equal(3);
			expect(garr).to.have.lengthOf(3);
			expect(garr).to.deep.equal(['a', { foo: 'bar' }, 'c']);
			expect(garr[1].__gawk__.hasParent(garr)).to.be.true;
		});
	});

	describe('shift()', () => {
		it('should remove an element from the front of the array', () => {
			const garr = gawk(['a', 'b']);
			const str = garr.shift();
			expect(str).to.equal('a');
			expect(garr.length).to.equal(1);
			expect(garr).to.deep.equal(['b']);
		});

		it('should return undefined when shifting an empty array', () => {
			const garr = gawk([]);
			const str = garr.shift();
			expect(str).to.be.undefined;
			expect(garr.length).to.equal(0);
		});

		it('should detach shifted gawk object', () => {
			const gobj = gawk({});
			const garr = gawk([gobj]);
			expect(gobj.__gawk__.hasParent(garr)).to.be.true;
			const gobj2 = garr.shift();
			expect(gobj2).to.equal(gobj);
			expect(gobj.__gawk__.hasParent(garr)).to.be.false;
		});
	});

	describe('splice()', () => {
		it('should do nothing if no args', () => {
			const garr = new GawkArray('a', 'b', 'c');
			const arr = garr.splice();
			expect(arr).to.have.lengthOf(0);
			expect(garr).to.deep.equal(['a', 'b', 'c']);
		});

		it('should remove elements after the start index', () => {
			const garr = new GawkArray('a', 'b', 'c');
			const arr = garr.splice(1);
			expect(arr).to.have.lengthOf(2);
			expect(arr).to.deep.equal(['b', 'c']);
			expect(garr).to.deep.equal(['a']);
		});

		it('should detach and remove gawk objects after the start index', () => {
			const garr = new GawkArray({ a: 1 }, { b: 2 }, { c: 3 });
			expect(garr[0].__gawk__.hasParent(garr)).to.be.true;
			expect(garr[1].__gawk__.hasParent(garr)).to.be.true;
			expect(garr[2].__gawk__.hasParent(garr)).to.be.true;

			const arr = garr.splice(1);
			expect(arr).to.have.lengthOf(2);
			expect(arr).to.deep.equal([ { b: 2 }, { c: 3 } ]);
			expect(garr).to.deep.equal([ { a: 1 } ]);
			expect(garr[0].__gawk__.hasParent(garr)).to.be.true;
			expect(arr[0].__gawk__.hasParent(garr)).to.be.false;
			expect(arr[0].__gawk__.hasParent(garr)).to.be.false;
		});

		it('should remove elements and add elements', () => {
			const garr = new GawkArray({ a: 1 }, { b: 2 }, { c: 3 });
			expect(garr[0].__gawk__.hasParent(garr)).to.be.true;
			expect(garr[1].__gawk__.hasParent(garr)).to.be.true;
			expect(garr[2].__gawk__.hasParent(garr)).to.be.true;

			const arr = garr.splice(1, 1, { d: 4 }, { e: 5 });
			expect(arr).to.have.lengthOf(1);
			expect(arr).to.deep.equal([ { b: 2 } ]);
			expect(garr).to.deep.equal([ { a: 1 }, { d: 4 }, { e: 5 }, { c: 3 } ]);
			expect(garr[0].__gawk__.hasParent(garr)).to.be.true;
			expect(garr[1].__gawk__.hasParent(garr)).to.be.true;
			expect(garr[2].__gawk__.hasParent(garr)).to.be.true;
			expect(garr[3].__gawk__.hasParent(garr)).to.be.true;
			expect(arr[0].__gawk__.hasParent(garr)).to.be.false;
		});
	});

	describe('unshift()', () => {
		it('should return 0 if not adding any elements', () => {
			const garr = new GawkArray;
			const n = garr.unshift();
			expect(n).to.equal(0);
			expect(garr).to.have.lengthOf(0);
		});

		it('should add a new element', () => {
			const garr = new GawkArray;
			let n = garr.unshift('a');
			expect(n).to.equal(1);
			expect(garr).to.have.lengthOf(1);
			expect(garr).to.deep.equal(['a']);

			n = garr.unshift('b');
			expect(n).to.equal(2);
			expect(garr).to.have.lengthOf(2);
			expect(garr).to.deep.equal(['b', 'a']);
		});

		it('should add multiple new elements', () => {
			const garr = new GawkArray;
			let n = garr.unshift('a', { foo: 'bar' }, 'c');
			expect(n).to.equal(3);
			expect(garr).to.have.lengthOf(3);
			expect(garr).to.deep.equal(['a', { foo: 'bar' }, 'c']);
			expect(garr[1].__gawk__.hasParent(garr)).to.be.true;
		});
	});
});

import { gawk, GawkArray } from '../src/index';

describe('array', () => {
	it('should gawk empty array', () => {
		const data = [];
		const gobj = gawk(data);
		expect(gobj).to.be.an.instanceof(GawkArray);
		expect(gobj.length).to.equal(0);
		const val = gobj.val;
		expect(val).to.be.an.array;
		expect(val).to.have.lengthOf(0);
		expect(val).to.deep.equal(data);
	});

	it('should gawk an array of strings', () => {
		const data = ['a', 'b', 'c'];
		const gobj = gawk(data);
		expect(gobj).to.be.an.instanceof(GawkArray);
		expect(gobj.length).to.equal(3);
		const val = gobj.val;
		expect(val).to.be.an.array;
		expect(val).to.have.lengthOf(3);
		expect(val).to.deep.equal(data);
	});

	it('should gawk an array of mixed values', () => {
		const data = ['a', 1, null, undefined, NaN, ['b', 2]];
		const gobj = gawk(data);
		expect(gobj).to.be.an.instanceof(GawkArray);
		expect(gobj.length).to.equal(6);
		const val = gobj.val;
		expect(val).to.be.an.array;
		expect(val).to.have.lengthOf(6);
		expect(val).to.deep.equal(data);
	});

	it('should fail to gawk non-array arg', () => {
		expect(() => {
			new GawkArray('foo');
		}).to.throw(TypeError);
	});

	it('should fail to gawk another non-array gawked type', () => {
		expect(() => {
			new GawkArray(gawk('hi'));
		}).to.throw(TypeError);
	});

	it('should fail to set non-array', () => {
		expect(() => {
			const gobj = gawk(['a', 'b']);
			gobj.val = 'hi';
		}).to.throw(TypeError);
	});

	it('should copy another gawked array', () => {
		const arr = new GawkArray(gawk(['a', 'b']));
		expect(arr.val).to.deep.equal(['a', 'b']);
	});

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

	it('should support toString()', () => {
		const gobj = gawk(['a', null, undefined, 123, 3.14, NaN, Infinity]);
		expect(gobj.toString()).to.equal('a,,,123,3.14,NaN,Infinity');
	});

	it('should support valueOf()', () => {
		const arr = ['a', null, undefined, 123, 3.14, NaN, Infinity];
		const gobj = gawk(arr);
		expect(gobj.valueOf()).to.deep.equal(arr);
	});
});

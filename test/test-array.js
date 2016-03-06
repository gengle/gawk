import { gawk, GawkArray } from '../src/index';

describe('array', () => {
	it('should return empty array', () => {
		const data = [];
		const gobj = gawk(data);
		expect(gobj).to.be.an.instanceof(GawkArray);
		expect(gobj.length).to.equal(0);
		const val = gobj.val;
		expect(val).to.be.an.array;
		expect(val).to.have.lengthOf(0);
		expect(val).to.deep.equal(data);
	});

	it('should return a populated array of strings', () => {
		const data = ['a', 'b', 'c'];
		const gobj = gawk(data);
		expect(gobj).to.be.an.instanceof(GawkArray);
		expect(gobj.length).to.equal(3);
		const val = gobj.val;
		expect(val).to.be.an.array;
		expect(val).to.have.lengthOf(3);
		expect(val).to.deep.equal(data);
	});

	it('should return a populated array of mixed', () => {
		const data = ['a', 1, null, undefined, NaN, ['b', 2]];
		const gobj = gawk(data);
		expect(gobj).to.be.an.instanceof(GawkArray);
		expect(gobj.length).to.equal(6);
		const val = gobj.val;
		expect(val).to.be.an.array;
		expect(val).to.have.lengthOf(6);
		expect(val).to.deep.equal(data);
	});

	it('should push a new element onto an array', () => {
		it('should return a populated array of strings', () => {
			const gobj = gawk(['a', 'b']);
			expect(gobj).to.be.an.instanceof(GawkArray);
			expect(gobj.length).to.equal(2);
			gobj.push('c');

			const val = gobj.val;
			expect(val).to.be.an.array;
			expect(val).to.have.lengthOf(3);
			expect(val).to.deep.equal(['a', 'b', 'c']);
		});
	});

	it('should be notified when array changes', () => {
		const arr = ['a', 'b'];
		const gobj = gawk(arr);
		expect(gobj).to.be.an.instanceof(GawkArray);
		expect(gobj.length).to.equal(2);

		gobj.watch(evt => {
			expect(evt.target).to.equal(gobj);

			expect(evt.old).to.be.an.array;
			expect(evt.old).to.have.lengthOf(arr.length);
			expect(evt.old).to.deep.equal(arr);

			expect(evt.new).to.be.an.array;
			expect(evt.new).to.have.lengthOf(3);
			expect(evt.new).to.deep.equal(['a', 'b', 'c']);

			expect(evt.old).to.not.equal(evt.new);

			const val = evt.target.val;
			expect(val).to.be.an.array;
			expect(val).to.have.lengthOf(3);
			expect(val).to.deep.equal(['a', 'b', 'c']);
		});

		gobj.push('c');
	});

	it('should be notified when array child changes', () => {
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
